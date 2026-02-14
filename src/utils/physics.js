/**
 * Drone Performance Calculator — Physics Engine
 *
 * Pure functions for multirotor flight performance calculations.
 * All inputs/outputs use SI units unless stated otherwise.
 */

// ─── Constants ───
const SEA_LEVEL_PRESSURE = 101325; // Pa
const SEA_LEVEL_TEMP = 288.15; // K (15°C)
const LAPSE_RATE = 0.0065; // K/m
const AIR_GAS_CONSTANT = 287.058; // J/(kg·K)
const GRAVITY = 9.80665; // m/s²
const MOLAR_MASS_AIR = 0.0289644; // kg/mol
const UNIVERSAL_GAS_CONSTANT = 8.31447; // J/(mol·K)

// AWG wire resistance per meter (Ω/m) at 20°C — copper
const AWG_RESISTANCE = {
  10: 0.003277,
  12: 0.005211,
  14: 0.008286,
  16: 0.01317,
  18: 0.02095,
  20: 0.03331,
  22: 0.05296,
  26: 0.0668,
};

// Battery chemistry voltage tables
const CHEMISTRY = {
  LiPo: { nominal: 3.7, max: 4.2, min: 3.3 },
  'Li-ion': { nominal: 3.6, max: 4.2, min: 2.8 },
  LiHV: { nominal: 3.85, max: 4.35, min: 3.3 },
};

/**
 * Calculate air density using ISA standard atmosphere model.
 * @param {number} altitudeM - Altitude in meters (0–11000)
 * @param {number} tempC - Ambient temperature in °C
 * @returns {number} Air density in kg/m³
 */
export function calcAirDensity(altitudeM, tempC) {
  const alt = Math.max(0, Math.min(altitudeM, 11000));
  // Temperature at altitude using lapse rate
  const T = (tempC + 273.15) - LAPSE_RATE * alt + LAPSE_RATE * alt; // user temp override
  // Pressure at altitude
  const exponent = (GRAVITY * MOLAR_MASS_AIR) / (UNIVERSAL_GAS_CONSTANT * LAPSE_RATE);
  const P = SEA_LEVEL_PRESSURE * Math.pow(1 - (LAPSE_RATE * alt) / SEA_LEVEL_TEMP, exponent);
  // Density from ideal gas law: ρ = P / (R_specific × T)
  const T_kelvin = tempC + 273.15;
  return P / (AIR_GAS_CONSTANT * T_kelvin);
}

/**
 * Calculate motor RPM accounting for back-EMF.
 * RPM = Kv × (V - I × Rm)
 * @param {number} kv - Motor Kv rating (RPM/V)
 * @param {number} voltage - Supply voltage (V)
 * @param {number} current - Motor current draw (A)
 * @param {number} resistance - Motor winding resistance (Ω)
 * @returns {number} RPM
 */
export function calcMotorRPM(kv, voltage, current, resistance) {
  const backEMF = voltage - current * resistance;
  return kv * Math.max(0, backEMF);
}

/**
 * Calculate propeller thrust using the standard thrust equation.
 * T = Ct × ρ × n² × D⁴
 * @param {number} ct - Thrust coefficient (dimensionless, ~0.08-0.15)
 * @param {number} rho - Air density (kg/m³)
 * @param {number} rps - Revolutions per second
 * @param {number} diameterM - Propeller diameter in meters
 * @returns {number} Thrust in Newtons
 */
export function calcThrust(ct, rho, rps, diameterM) {
  return ct * rho * rps * rps * Math.pow(diameterM, 4);
}

/**
 * Calculate propeller mechanical power required.
 * P = Cp × ρ × n³ × D⁵
 * @param {number} cp - Power coefficient (dimensionless)
 * @param {number} rho - Air density (kg/m³)
 * @param {number} rps - Revolutions per second
 * @param {number} diameterM - Propeller diameter in meters
 * @returns {number} Mechanical power in Watts
 */
export function calcPropPower(cp, rho, rps, diameterM) {
  return cp * rho * Math.pow(rps, 3) * Math.pow(diameterM, 5);
}

/**
 * Calculate motor electrical power.
 * @param {number} voltage - Voltage (V)
 * @param {number} current - Current (A)
 * @returns {number} Power in Watts
 */
export function calcMotorElecPower(voltage, current) {
  return voltage * current;
}

/**
 * Calculate motor efficiency.
 * @param {number} mechPower - Mechanical output power (W)
 * @param {number} elecPower - Electrical input power (W)
 * @returns {number} Efficiency ratio (0–1)
 */
export function calcMotorEfficiency(mechPower, elecPower) {
  if (elecPower <= 0) return 0;
  return Math.min(1, Math.max(0, mechPower / elecPower));
}

/**
 * Estimate propeller thrust and power coefficients from geometry.
 * Uses empirical approximations for hobby propellers.
 * @param {number} diameterIn - Prop diameter in inches
 * @param {number} pitchIn - Prop pitch in inches
 * @param {number} blades - Number of blades (2 or 3)
 * @returns {{ ct: number, cp: number }}
 */
export function estimatePropCoefficients(diameterIn, pitchIn, blades) {
  // Empirical model based on typical hobby prop data
  const pitchRatio = pitchIn / diameterIn;

  // Ct base ~ 0.09–0.13 for typical props, scales with pitch ratio
  let ct = 0.075 + 0.045 * pitchRatio;

  // Cp base ~ 0.03–0.06, increases more steeply with pitch
  let cp = 0.025 + 0.035 * pitchRatio;

  // Blade correction: 3-blade props have ~15% more Ct but ~25% more Cp
  if (blades === 3) {
    ct *= 1.15;
    cp *= 1.25;
  }

  // Clamp to reasonable ranges
  ct = Math.max(0.04, Math.min(0.22, ct));
  cp = Math.max(0.015, Math.min(0.12, cp));

  return { ct, cp };
}

/**
 * Calculate battery voltage under load with sag model.
 * @param {number} cells - Series cell count
 * @param {string} chemistry - 'LiPo', 'Li-ion', or 'LiHV'
 * @param {number} currentA - Total current draw (A)
 * @param {number} capacityMah - Total pack capacity (mAh)
 * @param {number} cRating - Continuous C-rating
 * @param {number} internalResistanceMohm - Internal resistance per cell (mΩ)
 * @returns {{ voltage: number, sagVolts: number }}
 */
export function calcBatteryVoltageUnderLoad(cells, chemistry, currentA, capacityMah, cRating, internalResistanceMohm) {
  const chem = CHEMISTRY[chemistry] || CHEMISTRY.LiPo;
  const nominalVoltage = chem.nominal * cells;
  const minVoltage = chem.min * cells;

  // Voltage drop from internal resistance: V_sag = I × R_total
  const totalResistance = (internalResistanceMohm / 1000) * cells; // series resistance
  const sagVolts = currentA * totalResistance;

  const voltage = Math.max(minVoltage, nominalVoltage - sagVolts);

  return { voltage, sagVolts };
}

/**
 * Calculate hover throttle percentage.
 * @param {number} totalWeightKg - All-up weight in kg
 * @param {number} numMotors - Number of motors
 * @param {number} maxThrustPerMotorN - Max thrust per motor in Newtons
 * @param {number} coaxialFactor - 1.0 for flat, ~0.85 for coaxial
 * @returns {number} Hover throttle percentage (0–100)
 */
export function calcHoverThrottle(totalWeightKg, numMotors, maxThrustPerMotorN, coaxialFactor) {
  const requiredThrust = totalWeightKg * GRAVITY;
  const effectiveMotors = numMotors * coaxialFactor;
  const thrustPerMotor = requiredThrust / effectiveMotors;

  if (maxThrustPerMotorN <= 0) return 100;

  // Thrust is approximately proportional to throttle² for props
  // throttle = sqrt(requiredThrust / maxThrust)
  const throttleRatio = Math.sqrt(thrustPerMotor / maxThrustPerMotorN);
  return Math.min(100, Math.max(0, throttleRatio * 100));
}

/**
 * Calculate estimated flight time.
 * @param {number} capacityMah - Battery capacity in mAh
 * @param {number} dischargePercent - Usable discharge percentage (0–1), e.g. 0.8
 * @param {number} totalCurrentA - Total current draw at hover (A)
 * @returns {number} Flight time in minutes
 */
export function calcFlightTime(capacityMah, dischargePercent, totalCurrentA) {
  if (totalCurrentA <= 0) return Infinity;
  const usableCapacity = capacityMah * dischargePercent;
  return (usableCapacity / (totalCurrentA * 1000)) * 60;
}

/**
 * Estimate motor temperature using simplified 1st-order thermal model.
 * T = T_ambient + P_loss × R_th × (1 - e^(-t/τ))
 * @param {number} ambientC - Ambient temperature (°C)
 * @param {number} copperLossW - I²R copper loss in watts
 * @param {number} thermalResistanceCW - Thermal resistance (°C/W), typ 8–15
 * @param {number} durationS - Duration in seconds
 * @returns {number} Estimated motor temperature (°C)
 */
export function calcMotorTemp(ambientC, copperLossW, thermalResistanceCW, durationS) {
  // Thermal time constant τ ≈ 120s for small BLDC motors (simplified)
  const tau = 120;
  const steadyState = copperLossW * thermalResistanceCW;
  return ambientC + steadyState * (1 - Math.exp(-durationS / tau));
}

/**
 * Calculate thrust-to-weight ratio.
 * @param {number} totalThrustN - Total system thrust in Newtons
 * @param {number} totalWeightKg - All-up weight in kg
 * @returns {number} TWR ratio
 */
export function calcThrustToWeightRatio(totalThrustN, totalWeightKg) {
  if (totalWeightKg <= 0) return 0;
  return totalThrustN / (totalWeightKg * GRAVITY);
}

/**
 * Calculate system efficiency in grams per watt.
 * @param {number} thrustN - Thrust in Newtons
 * @param {number} powerW - Power in Watts
 * @returns {number} Efficiency in g/W
 */
export function calcSystemEfficiency(thrustN, powerW) {
  if (powerW <= 0) return 0;
  return (thrustN * 1000 / GRAVITY) / powerW;
}

/**
 * Calculate wire power loss.
 * @param {number} awg - Wire gauge (10–22)
 * @param {number} lengthCm - Wire length in cm
 * @param {number} currentA - Current in amps
 * @returns {{ resistance: number, powerLoss: number }}
 */
export function calcWireLoss(awg, lengthCm, currentA) {
  const resistancePerM = AWG_RESISTANCE[awg] || AWG_RESISTANCE[14];
  const resistance = resistancePerM * (lengthCm / 100);
  const powerLoss = currentA * currentA * resistance;
  return { resistance, powerLoss };
}

/**
 * Get coaxial thrust factor.
 * Lower rotors in coaxial config lose ~15% efficiency.
 * @param {boolean} isCoaxial - Whether the config is coaxial
 * @returns {number} Factor (0.85 or 1.0)
 */
export function calcCoaxialFactor(isCoaxial) {
  return isCoaxial ? 0.85 : 1.0;
}

/**
 * Run a full performance simulation from a complete drone config.
 * @param {Object} config - Complete drone configuration
 * @returns {Object} All calculated performance metrics
 */
export function runFullSimulation(config) {
  const {
    environment = {},
    frame = {},
    battery = {},
    esc = {},
    motor = {},
    propeller = {},
  } = config;

  // ─── Environment ───
  const altitude = environment.altitude || 0;
  const tempC = environment.temperature ?? 25;
  const rho = calcAirDensity(altitude, tempC);

  // ─── Frame ───
  const numMotors = frame.motorCount || 4;
  const isCoaxial = frame.layout === 'coaxial';
  const coaxFactor = calcCoaxialFactor(isCoaxial);
  const frameWeight = (frame.frameWeight || 0) / 1000; // g → kg
  const payloadWeight = (frame.payloadWeight || 0) / 1000;
  const payloadCurrent = frame.payloadCurrent || 0;

  // ─── Battery ───
  const chem = battery.chemistry || 'LiPo';
  const cells = battery.cellsS || 4;
  const parallel = battery.cellsP || 1;
  const capacityMah = (battery.capacityMah || 5000) * parallel;
  const cRating = battery.cRating || 20;
  const burstC = battery.burstC || 40;
  const internalR = battery.internalResistanceMohm || 5;
  const batteryWeight = (battery.weightG || 0) / 1000;
  const dischargeDepth = (battery.dischargeDepth || 80) / 100;
  const chemData = CHEMISTRY[chem] || CHEMISTRY.LiPo;
  const nominalVoltage = chemData.nominal * cells;
  const maxVoltage = chemData.max * cells;
  const maxContinuousCurrent = (capacityMah / 1000) * cRating;

  // ─── Motor ───
  const kv = motor.kv || 920;
  const motorResistance = motor.resistance || 0.1;
  const noLoadCurrent = motor.noLoadCurrent || 0.5;
  const maxMotorCurrent = motor.maxCurrent || 30;
  const maxMotorPower = motor.maxPower || 400;
  const motorWeightG = motor.weightG || 60;
  const thermalResistance = motor.thermalResistance || 10;
  const motorMinCells = motor.minCells || 2;
  const motorMaxCells = motor.maxCells || 6;

  // ─── ESC ───
  const escMaxCurrent = esc.continuousA || 30;
  const escResistance = (esc.resistanceMohm || 1) / 1000;
  const escWeightG = esc.weightG || 10;
  const wireAWG = esc.wireAwg || 14;
  const wireLengthCm = esc.wireLengthCm || 20;
  const escMinCells = esc.minCells || 2;
  const escMaxCells = esc.maxCells || 6;

  // ─── Propeller ───
  const propDiameterIn = propeller.diameterIn || 10;
  const propPitchIn = propeller.pitchIn || 4.5;
  const propBlades = propeller.blades || 2;
  const propWeightG = propeller.weightG || 15;
  let ct = propeller.ct;
  let cp = propeller.cp;

  if (!ct || !cp) {
    const coeffs = estimatePropCoefficients(propDiameterIn, propPitchIn, propBlades);
    ct = ct || coeffs.ct;
    cp = cp || coeffs.cp;
  }

  const propDiameterM = propDiameterIn * 0.0254;

  // ─── Total Weight ───
  const totalWeightKg = frameWeight + payloadWeight + batteryWeight +
    (motorWeightG * numMotors + escWeightG * numMotors + propWeightG * numMotors) / 1000;
  const totalWeightG = totalWeightKg * 1000;

  // ─── Max Throttle Calculations ───
  const maxRPM = calcMotorRPM(kv, maxVoltage, noLoadCurrent, motorResistance);
  const maxRPS = maxRPM / 60;
  const maxThrustPerMotor = calcThrust(ct, rho, maxRPS, propDiameterM);
  const maxTotalThrust = maxThrustPerMotor * numMotors * coaxFactor;
  const maxTotalThrustG = (maxTotalThrust / GRAVITY) * 1000;

  // ─── Hover Calculations ───
  const hoverThrottle = calcHoverThrottle(totalWeightKg, numMotors, maxThrustPerMotor, coaxFactor);
  const hoverRPS = maxRPS * (hoverThrottle / 100);
  const hoverRPM = hoverRPS * 60;

  // Hover thrust per motor
  const hoverThrustPerMotor = calcThrust(ct, rho, hoverRPS, propDiameterM);

  // Hover mechanical power per motor
  const hoverMechPower = calcPropPower(cp, rho, hoverRPS, propDiameterM);

  // Hover current per motor (P = V × I → I = P / V, roughly)
  // More accurately: P_mech = (V - I×R) × (I - I0) × motor_efficiency
  // Simplified: I ≈ P_mech / (V × η) + I0
  const motorEff = 0.85; // typical BLDC efficiency
  const hoverCurrentPerMotor = hoverMechPower / (nominalVoltage * motorEff) + noLoadCurrent;
  const hoverTotalCurrent = hoverCurrentPerMotor * numMotors + payloadCurrent;

  // Battery voltage under load at hover
  const hoverBattery = calcBatteryVoltageUnderLoad(
    cells, chem, hoverTotalCurrent, capacityMah, cRating, internalR
  );

  // Hover electrical power
  const hoverElecPowerPerMotor = calcMotorElecPower(hoverBattery.voltage / cells * cells, hoverCurrentPerMotor);
  const hoverTotalPower = hoverElecPowerPerMotor * numMotors + payloadCurrent * hoverBattery.voltage;

  // Hover efficiency
  const hoverEfficiency = calcSystemEfficiency(hoverThrustPerMotor * numMotors * coaxFactor, hoverTotalPower);

  // ─── Flight Time ───
  const flightTime = calcFlightTime(capacityMah, dischargeDepth, hoverTotalCurrent);

  // ─── Max Current Per Motor ───
  const maxMechPower = calcPropPower(cp, rho, maxRPS, propDiameterM);
  const maxCurrentPerMotor = maxMechPower / (nominalVoltage * motorEff) + noLoadCurrent;
  const maxTotalCurrentDraw = maxCurrentPerMotor * numMotors + payloadCurrent;

  // Max battery under load
  const maxBattery = calcBatteryVoltageUnderLoad(
    cells, chem, maxTotalCurrentDraw, capacityMah, cRating, internalR
  );

  // ─── Wire Losses ───
  const wireLoss = calcWireLoss(wireAWG, wireLengthCm, hoverCurrentPerMotor);
  const totalWireLoss = wireLoss.powerLoss * numMotors;

  // ─── ESC Losses ───
  const escPowerLoss = hoverCurrentPerMotor * hoverCurrentPerMotor * escResistance * numMotors;

  // ─── Motor Thermal ───
  const copperLoss = hoverCurrentPerMotor * hoverCurrentPerMotor * motorResistance;
  const motorTemp5min = calcMotorTemp(tempC, copperLoss, thermalResistance, 300);

  // ─── TWR ───
  const twr = calcThrustToWeightRatio(maxTotalThrust, totalWeightKg);

  // ─── Motor Efficiency ───
  const motorEffCalc = calcMotorEfficiency(hoverMechPower, hoverElecPowerPerMotor);


  // ─── Validations ───
  const maxBurstCurrent = (capacityMah / 1000) * burstC;

  const wheelbaseMm = frame.wheelbaseMm || 350;
  const wbFactors = { 3: 0.866, 4: 0.707, 6: 0.5, 8: 0.38 };
  const wbFactor = wbFactors[numMotors] || 0.5;
  const maxPropDiameterMm = wheelbaseMm * wbFactor;
  const propDiameterMm = propDiameterIn * 25.4;

  const validations = {
    motorCurrentOk: hoverCurrentPerMotor < maxMotorCurrent,
    escCurrentOk: hoverCurrentPerMotor < escMaxCurrent,
    batteryDischargeOk: hoverTotalCurrent < maxContinuousCurrent,
    batteryBurstOk: maxTotalCurrentDraw < maxBurstCurrent,
    propSizeOk: propDiameterMm <= maxPropDiameterMm,
    twrOk: twr >= 2.0,
    motorTempOk: motorTemp5min < 80,
    hoverThrottleOk: hoverThrottle < 60,
    escVoltageOk: cells >= escMinCells && cells <= escMaxCells,
    motorVoltageOk: cells >= motorMinCells && cells <= motorMaxCells,
  };

  const allValid = Object.values(validations).every(Boolean);

  return {
    // Environment
    airDensity: rho,

    // Weight
    totalWeightKg,
    totalWeightG,

    // Hover Performance
    hoverThrottle,
    hoverRPM,
    hoverCurrentPerMotor,
    hoverTotalCurrent,
    hoverTotalPower,
    hoverEfficiency,
    hoverThrustPerMotor: (hoverThrustPerMotor / GRAVITY) * 1000, // in grams
    hoverBatteryVoltage: hoverBattery.voltage,
    hoverBatterySag: hoverBattery.sagVolts,
    flightTimeMin: flightTime,

    // Max Performance
    maxThrustPerMotorG: (maxThrustPerMotor / GRAVITY) * 1000,
    maxTotalThrustG,
    maxRPM,
    maxCurrentPerMotor,
    maxTotalCurrentDraw,
    maxBatteryVoltage: maxBattery.voltage,
    maxBatterySag: maxBattery.sagVolts,
    twr,

    // Losses
    wireLossPerMotor: wireLoss.powerLoss,
    totalWireLoss,
    escPowerLoss,
    copperLossPerMotor: copperLoss,

    // Thermal
    motorTemp5min,

    // Efficiency
    motorEfficiency: motorEffCalc,

    // Battery
    nominalVoltage,
    maxVoltage,
    maxContinuousCurrent,
    totalCapacityMah: capacityMah,

    // Limits (for UI feedback)
    motorMinCells,
    motorMaxCells,
    escMinCells,
    escMaxCells,
    batteryCells: cells,

    // Prop coefficients used
    ct,
    cp,

    // Validations
    validations,
    allValid,
    maxBurstCurrent,
    maxPropDiameterMm,
    propDiameterMm,
  };
}


export { CHEMISTRY, AWG_RESISTANCE, GRAVITY };
