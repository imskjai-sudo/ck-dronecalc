import { useState } from 'react';
import { uid, deepClone, downloadFile, readFileAsText } from '../../utils/helpers.js';
import { Save, Upload, RotateCcw, Trash2, GitCompare } from 'lucide-react';

/**
 * Comparison Mode — snapshot and compare up to 3 configs.
 */
export function ComparisonMode({ config, results }) {
    const [snapshots, setSnapshots] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dronecalc_snapshots') || '[]'); } catch { return []; }
    });

    const saveSnapshot = () => {
        const label = prompt('Snapshot label:', `Config ${snapshots.length + 1}`);
        if (!label) return;
        const snap = { id: uid(), label, config: deepClone(config), results: deepClone(results), timestamp: new Date().toISOString() };
        const updated = [...snapshots, snap].slice(-3);
        setSnapshots(updated);
        localStorage.setItem('dronecalc_snapshots', JSON.stringify(updated));
    };

    const removeSnapshot = (id) => {
        const updated = snapshots.filter(s => s.id !== id);
        setSnapshots(updated);
        localStorage.setItem('dronecalc_snapshots', JSON.stringify(updated));
    };

    if (snapshots.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <GitCompare size={32} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }} />
                <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>Save snapshots to compare configurations side-by-side.</p>
                <button className="btn btn-primary" onClick={saveSnapshot}>
                    <Save size={14} /> Save Current as Snapshot
                </button>
            </div>
        );
    }

    const metrics = [
        { key: 'totalWeightG', label: 'Total Weight (g)', fmt: v => Math.round(v) },
        { key: 'flightTimeMin', label: 'Flight Time (min)', fmt: v => v?.toFixed(1) },
        { key: 'hoverThrottle', label: 'Hover Throttle (%)', fmt: v => v?.toFixed(1) },
        { key: 'twr', label: 'TWR', fmt: v => v?.toFixed(2) },
        { key: 'maxTotalThrustG', label: 'Max Thrust (g)', fmt: v => Math.round(v) },
        { key: 'hoverTotalPower', label: 'Hover Power (W)', fmt: v => Math.round(v) },
        { key: 'hoverEfficiency', label: 'Efficiency (g/W)', fmt: v => v?.toFixed(2) },
        { key: 'motorTemp5min', label: 'Motor Temp 5min (°C)', fmt: v => Math.round(v) },
    ];

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title"><GitCompare size={14} style={{ marginRight: 4 }} /> Comparison</span>
                <button className="btn btn-sm btn-primary" onClick={saveSnapshot} disabled={snapshots.length >= 3}>
                    <Save size={12} /> Save Snapshot
                </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="comparison-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            {snapshots.map(s => (
                                <th key={s.id}>
                                    <span>{s.label}</span>
                                    <button className="btn btn-ghost btn-sm" onClick={() => removeSnapshot(s.id)} style={{ marginLeft: 4 }}>
                                        <Trash2 size={10} />
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map(m => (
                            <tr key={m.key}>
                                <td style={{ color: 'var(--text-secondary)' }}>{m.label}</td>
                                {snapshots.map(s => (
                                    <td key={s.id}>{m.fmt(s.results?.[m.key]) ?? '—'}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Config Manager — save/load JSON configs.
 */
export function ConfigManager({ config, onLoad, onReset }) {
    const handleSave = () => {
        downloadFile(JSON.stringify(config, null, 2), `dronecalc-config-${Date.now()}.json`);
    };

    const handleLoad = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await readFileAsText(file);
                const loaded = JSON.parse(text);
                onLoad(loaded);
            } catch (err) {
                alert('Invalid config file: ' + err.message);
            }
        };
        input.click();
    };

    return (
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleSave}>
                <Save size={14} /> Save Config
            </button>
            <button className="btn btn-secondary" onClick={handleLoad}>
                <Upload size={14} /> Load Config
            </button>
            <button className="btn btn-ghost" onClick={onReset}>
                <RotateCcw size={14} /> Reset
            </button>
        </div>
    );
}
