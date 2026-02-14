import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { calcThrust, calcPropPower, calcAirDensity, estimatePropCoefficients, calcMotorRPM, calcFlightTime, calcHoverThrottle, GRAVITY } from '../../utils/physics.js';

export function ThrustVsThrottle({ config, results }) {
    if (!results) return null;

    const data = [];
    const rho = results.airDensity;
    const propDiameterM = (config.propeller.diameterIn || 10) * 0.0254;
    const ct = results.ct;
    const maxRPM = results.maxRPM;

    for (let t = 0; t <= 100; t += 5) {
        const rps = (maxRPM * (t / 100)) / 60;
        const thrust = calcThrust(ct, rho, rps, propDiameterM);
        const thrustG = (thrust / GRAVITY) * 1000;
        data.push({ throttle: t, thrust: Math.round(thrustG) });
    }

    const hoverIdx = Math.round(results.hoverThrottle / 5);

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Thrust vs Throttle</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="throttle" stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Throttle %', position: 'bottom', offset: -5, style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Thrust (g)', angle: -90, position: 'insideLeft', offset: 10, style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12 }} />
                    <Line type="monotone" dataKey="thrust" stroke="var(--accent)" strokeWidth={2} dot={false} />
                    {hoverIdx >= 0 && hoverIdx < data.length && (
                        <ReferenceDot x={data[hoverIdx]?.throttle} y={data[hoverIdx]?.thrust} r={5} fill="var(--green)" stroke="var(--green)" />
                    )}
                </LineChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--green)' }}>●</span> Hover point
            </div>
        </div>
    );
}

export function FlightTimeVsPayload({ config, results }) {
    if (!results) return null;

    const data = [];
    const baseWeightKg = results.totalWeightKg;
    const numMotors = config.frame.motorCount || 4;
    const maxThrustPerMotorN = (results.maxTotalThrustG / 1000 * GRAVITY) / numMotors;
    const coaxFactor = config.frame.layout === 'coaxial' ? 0.85 : 1.0;
    const capacityMah = results.totalCapacityMah;
    const dischargeDepth = (config.battery.dischargeDepth || 80) / 100;

    for (let payload = 0; payload <= 2000; payload += 100) {
        const totalKg = baseWeightKg + payload / 1000;
        const throttle = calcHoverThrottle(totalKg, numMotors, maxThrustPerMotorN, coaxFactor) / 100;
        // Very rough: current scales with throttle^1.5 (power scaling)
        const currentFactor = Math.pow(throttle / (results.hoverThrottle / 100), 1.5);
        const totalCurrent = results.hoverTotalCurrent * currentFactor;
        const ft = calcFlightTime(capacityMah, dischargeDepth, totalCurrent);
        if (ft > 0 && ft < 120) {
            data.push({ payload, time: Math.round(ft * 10) / 10 });
        }
    }

    const currentPayload = Math.round((config.frame.payloadWeight || 0));

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Flight Time vs Payload</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="payload" stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Added Payload (g)', position: 'bottom', offset: -5, style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Time (min)', angle: -90, position: 'insideLeft', offset: 10, style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12 }} />
                    <Line type="monotone" dataKey="time" stroke="var(--yellow)" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function EfficiencyCurve({ config, results }) {
    if (!results) return null;

    const data = [];
    const rho = results.airDensity;
    const propDiameterM = (config.propeller.diameterIn || 10) * 0.0254;
    const ct = results.ct;
    const cp = results.cp;
    const maxRPM = results.maxRPM;

    for (let t = 10; t <= 100; t += 5) {
        const rps = (maxRPM * (t / 100)) / 60;
        const thrust = calcThrust(ct, rho, rps, propDiameterM);
        const power = calcPropPower(cp, rho, rps, propDiameterM);
        const thrustG = (thrust / GRAVITY) * 1000;
        const efficiency = power > 0 ? thrustG / power : 0;
        data.push({ throttle: t, efficiency: Math.round(efficiency * 100) / 100 });
    }

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Efficiency Curve</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="throttle" stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Throttle %', position: 'bottom', offset: -5, style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} label={{ value: 'Efficiency (g/W)', angle: -90, position: 'insideLeft', offset: 10, style: { fill: 'var(--text-muted)', fontSize: 11 } }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 12 }} />
                    <Line type="monotone" dataKey="efficiency" stroke="var(--green)" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
