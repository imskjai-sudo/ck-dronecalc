/**
 * Physics Engine — Test Suite
 */
import { describe, it, expect } from 'vitest';
import {
    calcAirDensity,
    calcMotorRPM,
    calcThrust,
    calcPropPower,
    calcMotorElecPower,
    calcMotorEfficiency,
    estimatePropCoefficients,
    calcBatteryVoltageUnderLoad,
    calcHoverThrottle,
    calcFlightTime,
    calcMotorTemp,
    calcThrustToWeightRatio,
    calcSystemEfficiency,
    calcWireLoss,
    calcCoaxialFactor,
    runFullSimulation,
} from './physics.js';

describe('calcAirDensity', () => {
    it('returns ~1.225 kg/m³ at sea level, 15°C', () => {
        const rho = calcAirDensity(0, 15);
        expect(rho).toBeCloseTo(1.225, 2);
    });

    it('returns lower density at 1600m (Denver)', () => {
        const rho = calcAirDensity(1600, 15);
        expect(rho).toBeGreaterThan(0.9);
        expect(rho).toBeLessThan(1.1);
    });

    it('returns significantly lower density at 4000m, 0°C', () => {
        const rho = calcAirDensity(4000, 0);
        expect(rho).toBeLessThan(0.82);
        expect(rho).toBeGreaterThan(0.5);
    });
});

describe('calcMotorRPM', () => {
    it('calculates RPM for 920Kv on 4S (14.8V) at 10A, 0.1Ω', () => {
        const rpm = calcMotorRPM(920, 14.8, 10, 0.1);
        // RPM = 920 × (14.8 - 10 × 0.1) = 920 × 13.8 = 12696
        expect(rpm).toBeCloseTo(12696, 0);
    });

    it('returns Kv × V when current is 0', () => {
        const rpm = calcMotorRPM(920, 14.8, 0, 0.1);
        expect(rpm).toBeCloseTo(920 * 14.8, 0);
    });

    it('never returns negative RPM', () => {
        const rpm = calcMotorRPM(920, 5, 100, 0.5);
        expect(rpm).toBeGreaterThanOrEqual(0);
    });
});

describe('calcThrust', () => {
    it('calculates thrust for 10×4.5 prop at 8000 RPM', () => {
        const rps = 8000 / 60;
        const D = 10 * 0.0254; // 10 inches in meters
        const thrust = calcThrust(0.11, 1.225, rps, D);
        expect(thrust).toBeGreaterThan(3);
        expect(thrust).toBeLessThan(10);
    });

    it('returns 0 thrust at 0 RPS', () => {
        expect(calcThrust(0.11, 1.225, 0, 0.254)).toBe(0);
    });
});

describe('calcPropPower', () => {
    it('calculates power for a prop under load', () => {
        const rps = 8000 / 60;
        const D = 10 * 0.0254;
        const power = calcPropPower(0.047, 1.225, rps, D);
        expect(power).toBeGreaterThan(10);
        expect(power).toBeLessThan(200);
    });
});

describe('calcMotorElecPower', () => {
    it('computes P = V × I', () => {
        expect(calcMotorElecPower(14.8, 10)).toBeCloseTo(148, 0);
    });
});

describe('calcMotorEfficiency', () => {
    it('returns correct efficiency ratio', () => {
        expect(calcMotorEfficiency(80, 100)).toBeCloseTo(0.8, 2);
    });

    it('returns 0 for zero input power', () => {
        expect(calcMotorEfficiency(80, 0)).toBe(0);
    });

    it('clamps to max 1.0', () => {
        expect(calcMotorEfficiency(110, 100)).toBe(1);
    });
});

describe('estimatePropCoefficients', () => {
    it('returns ct in 0.08–0.15 for 10×4.5 2-blade', () => {
        const { ct, cp } = estimatePropCoefficients(10, 4.5, 2);
        expect(ct).toBeGreaterThan(0.08);
        expect(ct).toBeLessThan(0.15);
        expect(cp).toBeGreaterThan(0.02);
        expect(cp).toBeLessThan(0.08);
    });

    it('3-blade has higher ct but also higher cp', () => {
        const two = estimatePropCoefficients(5, 4, 2);
        const three = estimatePropCoefficients(5, 4, 3);
        expect(three.ct).toBeGreaterThan(two.ct);
        expect(three.cp).toBeGreaterThan(two.cp);
    });
});

describe('calcBatteryVoltageUnderLoad', () => {
    it('calculates sag for 4S 5000mAh 20C at 40A', () => {
        const { voltage, sagVolts } = calcBatteryVoltageUnderLoad(4, 'LiPo', 40, 5000, 20, 5);
        expect(voltage).toBeGreaterThan(13);
        expect(voltage).toBeLessThan(15.5);
        expect(sagVolts).toBeGreaterThan(0);
    });

    it('no sag at 0 current', () => {
        const { voltage, sagVolts } = calcBatteryVoltageUnderLoad(4, 'LiPo', 0, 5000, 20, 5);
        expect(sagVolts).toBe(0);
        expect(voltage).toBeCloseTo(3.7 * 4, 1);
    });
});

describe('calcHoverThrottle', () => {
    it('returns 30–50% for typical quad at 1.5kg, 10N/motor max', () => {
        const throttle = calcHoverThrottle(1.5, 4, 10, 1.0);
        expect(throttle).toBeGreaterThan(25);
        expect(throttle).toBeLessThan(70);
    });

    it('returns 100 when max thrust is 0', () => {
        expect(calcHoverThrottle(1.5, 4, 0, 1.0)).toBe(100);
    });
});

describe('calcFlightTime', () => {
    it('returns ~12 min for 5000mAh 80% DoD at 20A', () => {
        const time = calcFlightTime(5000, 0.8, 20);
        expect(time).toBeCloseTo(12, 0);
    });

    it('returns Infinity for 0 current', () => {
        expect(calcFlightTime(5000, 0.8, 0)).toBe(Infinity);
    });
});

describe('calcMotorTemp', () => {
    it('estimates reasonable temp for 5W copper loss at 10°C/W after 300s', () => {
        const temp = calcMotorTemp(25, 5, 10, 300);
        expect(temp).toBeGreaterThan(25);
        expect(temp).toBeLessThan(100);
    });

    it('returns ambient temp at t=0', () => {
        const temp = calcMotorTemp(25, 5, 10, 0);
        expect(temp).toBeCloseTo(25, 0);
    });
});

describe('calcThrustToWeightRatio', () => {
    it('calculates TWR for 40N total thrust, 1.5kg drone', () => {
        const twr = calcThrustToWeightRatio(40, 1.5);
        expect(twr).toBeCloseTo(2.72, 1);
    });

    it('returns 0 for 0 weight', () => {
        expect(calcThrustToWeightRatio(40, 0)).toBe(0);
    });
});

describe('calcWireLoss', () => {
    it('calculates loss for 14AWG, 30cm, 20A', () => {
        const { resistance, powerLoss } = calcWireLoss(14, 30, 20);
        expect(resistance).toBeGreaterThan(0);
        expect(powerLoss).toBeGreaterThan(0);
        expect(powerLoss).toBeLessThan(5);
    });
});

describe('calcCoaxialFactor', () => {
    it('returns 0.85 for coaxial', () => {
        expect(calcCoaxialFactor(true)).toBe(0.85);
    });

    it('returns 1.0 for flat', () => {
        expect(calcCoaxialFactor(false)).toBe(1.0);
    });
});

describe('runFullSimulation', () => {
    it('returns plausible results for a typical quad config', () => {
        const result = runFullSimulation({
            environment: { altitude: 0, temperature: 25 },
            frame: { motorCount: 4, layout: 'flat', frameWeight: 300, payloadWeight: 0, payloadCurrent: 0 },
            battery: { chemistry: 'LiPo', cellsS: 4, cellsP: 1, capacityMah: 5000, cRating: 20, burstC: 40, weightG: 480, internalResistanceMohm: 5, dischargeDepth: 80 },
            esc: { continuousA: 30, burstA: 40, resistanceMohm: 1.5, weightG: 8, wireAwg: 14, wireLengthCm: 20 },
            motor: { kv: 920, resistance: 0.12, noLoadCurrent: 0.4, maxCurrent: 20, maxPower: 280, weightG: 56, thermalResistance: 10 },
            propeller: { diameterIn: 10, pitchIn: 4.5, blades: 2 },
        });

        expect(result.flightTimeMin).toBeGreaterThan(3);
        expect(result.flightTimeMin).toBeLessThan(40);
        expect(result.twr).toBeGreaterThan(1);
        expect(result.hoverThrottle).toBeGreaterThan(10);
        expect(result.hoverThrottle).toBeLessThan(90);
        expect(result.totalWeightKg).toBeGreaterThan(0.5);
        expect(result.airDensity).toBeGreaterThan(1.0);
        expect(result.validations).toBeDefined();
    });
});
