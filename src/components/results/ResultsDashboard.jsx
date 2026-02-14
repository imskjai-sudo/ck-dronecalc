import { fmt, fmtTime, fmtInt, getStatus } from '../../utils/helpers.js';
import { StatusIndicator } from '../common/index.jsx';
import { Clock, Gauge, Zap, Thermometer, ShieldCheck } from 'lucide-react';

export default function ResultsDashboard({ results }) {
    if (!results) {
        return <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>Configure your drone to see results</div>;
    }

    return (
        <div className="card-grid">
            <HoverCard results={results} />
            <ThrustCard results={results} />
            <ElectricalCard results={results} />
            <ThermalCard results={results} />
            <ValidationCard results={results} />
        </div>
    );
}

function HoverCard({ results }) {
    const timeStatus = getStatus(results.hoverThrottle, 50, 70);
    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title"><Clock size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Hover Performance</span>
                <StatusIndicator status={timeStatus} />
            </div>
            <div className="card-value">{fmtTime(results.flightTimeMin)}</div>
            <div className="card-subtitle">Estimated hover time</div>
            <div style={{ marginTop: 'var(--space-2xl)', display: 'grid', gap: 'var(--space-md)' }}>
                <MetricRow label="Throttle" value={`${fmt(results.hoverThrottle)}%`} />
                <MetricRow label="Current/Motor" value={`${fmt(results.hoverCurrentPerMotor)}A`} />
                <MetricRow label="Total Current" value={`${fmt(results.hoverTotalCurrent)}A`} />
                <MetricRow label="Efficiency" value={`${fmt(results.hoverEfficiency)} g/W`} />
            </div>
        </div>
    );
}

function ThrustCard({ results }) {
    const twrStatus = getStatus(results.twr, 2.5, 2.0, true);
    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title"><Gauge size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Thrust</span>
                <StatusIndicator status={twrStatus} />
            </div>
            <div className="card-value">{fmt(results.twr, 2)}:1</div>
            <div className="card-subtitle">Thrust-to-weight ratio</div>
            <div style={{ marginTop: 'var(--space-2xl)', display: 'grid', gap: 'var(--space-md)' }}>
                <MetricRow label="Max Thrust" value={`${fmtInt(results.maxTotalThrustG)}g`} />
                <MetricRow label="Total Weight" value={`${fmtInt(results.totalWeightG)}g`} />
                <MetricRow label="Max RPM" value={fmtInt(results.maxRPM)} />
                <MetricRow label="Hover RPM" value={fmtInt(results.hoverRPM)} />
            </div>
        </div>
    );
}

function ElectricalCard({ results }) {
    const currentStatus = getStatus(results.hoverTotalCurrent, results.maxContinuousCurrent * 0.7, results.maxContinuousCurrent * 0.9);
    const minC = Math.ceil(results.maxTotalCurrentDraw / (results.totalCapacityMah / 1000));

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title"><Zap size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Electrical</span>
                <StatusIndicator status={currentStatus} />
            </div>
            <div className="card-value">{minC}C+</div>
            <div className="card-subtitle">Min C-Rating</div>
            <div style={{ marginTop: 'var(--space-2xl)', display: 'grid', gap: 'var(--space-md)' }}>
                <MetricRow label="Batt Voltage" value={`${fmt(results.hoverBatteryVoltage)}V`} />
                <MetricRow label="Voltage Sag" value={`${fmt(results.hoverBatterySag)}V`} />
                <MetricRow label="Max Current" value={`${fmt(results.maxTotalCurrentDraw)}A`} />
                <MetricRow label="ESC Loss" value={`${fmt(results.escPowerLoss)}W`} />
                <MetricRow label="Hover Power" value={`${fmt(results.hoverTotalPower, 0)}W`} />
            </div>
        </div>
    );
}

function ThermalCard({ results }) {
    const tempStatus = getStatus(results.motorTemp5min, 80, 120);
    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title"><Thermometer size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Thermal</span>
                <StatusIndicator status={tempStatus} />
            </div>
            <div className="card-value">{fmt(results.motorTemp5min, 0)}°C</div>
            <div className="card-subtitle">Est. motor temp @ 5 min</div>
            <div style={{ marginTop: 'var(--space-2xl)', display: 'grid', gap: 'var(--space-md)' }}>
                <MetricRow label="Copper Loss" value={`${fmt(results.copperLossPerMotor)}W`} />
                <MetricRow label="Motor Eff." value={`${fmt(results.motorEfficiency * 100)}%`} />
            </div>
        </div>
    );
}

function ValidationCard({ results }) {
    const v = results.validations;
    const checks = [
        { ok: v.motorCurrentOk, label: `Motor current ${fmt(results.hoverCurrentPerMotor)}A < max` },
        { ok: v.escCurrentOk, label: `ESC current within rating` },
        { ok: v.batteryDischargeOk, label: `Battery discharge < C-rating` },
        { ok: v.batteryBurstOk, label: `Max Current < Burst (${fmt(results.maxBurstCurrent)}A)` },
        { ok: v.escVoltageOk, label: `ESC Voltage: ${results.batteryCells}S vs ${results.escMinCells}-${results.escMaxCells}S` },
        { ok: v.motorVoltageOk, label: `Motor Voltage: ${results.batteryCells}S vs ${results.motorMinCells}-${results.motorMaxCells}S` },
        { ok: v.twrOk, label: `TWR ≥ 2.0 (${fmt(results.twr, 2)})` },
        { ok: v.propSizeOk, label: `Propeller size < max (${fmtInt(results.maxPropDiameterMm)}mm)` },
        { ok: v.motorTempOk, label: `Motor temp < 80°C (${fmt(results.motorTemp5min, 0)}°C)` },
        { ok: v.hoverThrottleOk, label: `Hover throttle < 60% (${fmt(results.hoverThrottle)}%)` },
    ];

    const cardStyle = {
        gridColumn: 'span 2',
        ...(results.allValid ? {
            borderColor: 'var(--green)',
            background: 'rgba(52, 211, 153, 0.15)'
        } : {})
    };

    return (
        <div className="card" style={cardStyle}>
            <div className="card-header">
                <span className="card-title"><ShieldCheck size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> System Validation</span>
                <span className={`status-badge ${results.allValid ? 'safe' : 'danger'}`}>
                    {results.allValid ? 'ALL PASS' : 'ISSUES FOUND'}
                </span>
            </div>
            <ul className="validation-list">
                {checks.map((c, i) => (
                    <li key={i} className="validation-item">
                        <span className={`validation-icon ${c.ok ? 'pass' : 'fail'}`}>
                            {c.ok ? '✓' : '✗'}
                        </span>
                        {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function MetricRow({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-xs)' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
        </div>
    );
}
