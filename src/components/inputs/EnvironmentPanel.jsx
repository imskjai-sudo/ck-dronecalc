import { useState, useEffect, useCallback } from 'react';
import { Save, Trash2, AlertTriangle } from 'lucide-react';
import { SliderInput } from '../common/index.jsx';
import { calcAirDensity } from '../../utils/physics.js';
import { fmt } from '../../utils/helpers.js';
import { useUnits } from '../../hooks/useUnits.jsx';

const STORAGE_KEY = 'dronecalc_env_presets';

const DEFAULT_PRESETS = [
    { id: 'p1', name: 'Sea Level / Std Day', altitude: 0, temperature: 15 },
    { id: 'p2', name: 'Hot Day (35°C)', altitude: 0, temperature: 35 },
    { id: 'p3', name: 'High Altitude (2000m)', altitude: 2000, temperature: 10 },
];

function loadPresets() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_PRESETS;
    } catch { return DEFAULT_PRESETS; }
}

function savePresetsToStorage(presets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export default function EnvironmentPanel({ config, onChange }) {
    const env = config.environment;
    const rho = calcAirDensity(env.altitude, env.temperature);
    const { toDisplay, toInternal, getAbbr } = useUnits();

    const distAbbr = getAbbr('distance');
    const displayAlt = Math.round(toDisplay(env.altitude, 'distance'));
    const minAlt = -100;
    const maxAlt = Math.round(toDisplay(5000, 'distance')); // ~16,400ft

    // ── Preset state ──
    const [presets, setPresets] = useState(loadPresets);
    const [selectedId, setSelectedId] = useState('');

    // Persist whenever presets change
    useEffect(() => { savePresetsToStorage(presets); }, [presets]);

    // When user manually changes values, clear the selection
    const handleChange = useCallback((updates) => {
        setSelectedId('');
        onChange(updates);
    }, [onChange]);

    // Select a preset
    const handleSelect = useCallback((id) => {
        setSelectedId(id);
        if (!id) return;
        const preset = presets.find(p => p.id === id);
        if (preset) {
            onChange({ altitude: Number(preset.altitude), temperature: Number(preset.temperature) });
        }
    }, [presets, onChange]);

    // Save current values as a new preset
    const handleSave = useCallback(() => {
        const name = window.prompt('Preset name:');
        if (!name || !name.trim()) return;
        const newPreset = {
            id: String(Date.now()),
            name: name.trim(),
            altitude: Number(env.altitude),
            temperature: Number(env.temperature),
        };
        setPresets(prev => [...prev, newPreset]);
        setSelectedId(newPreset.id);
    }, [env.altitude, env.temperature]);

    // Delete selected preset
    const handleDelete = useCallback(() => {
        if (!selectedId) return;
        setPresets(prev => prev.filter(p => p.id !== selectedId));
        setSelectedId('');
    }, [selectedId]);

    const warnAlt = Math.round(toDisplay(120, 'distance')); // 120m legal limit

    return (
        <>
            {/* Preset toolbar */}
            <div className="preset-toolbar">
                <select
                    className="form-select"
                    value={selectedId}
                    onChange={e => handleSelect(e.target.value)}
                >
                    <option value="">— Custom —</option>
                    {presets.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleSave}
                    title="Save current settings as preset"
                >
                    <Save size={13} />
                </button>
                <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDelete}
                    disabled={!selectedId}
                    title="Delete selected preset"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            <SliderInput
                label="Altitude" unit={distAbbr}
                tooltip="Field elevation above sea level"
                value={displayAlt} min={minAlt} max={maxAlt} step={distAbbr === 'ft' ? 50 : 10}
                onChange={v => handleChange({ altitude: Math.round(toInternal(v, 'distance')) })}
            />
            {displayAlt > warnAlt && (
                <div className="altitude-warning">
                    <AlertTriangle size={13} />
                    <span>As of 2026, the maximum legal altitude for drones in India is 120 meters</span>
                </div>
            )}
            <SliderInput
                label="Temperature" unit="°C"
                tooltip="Ambient air temperature"
                value={env.temperature} min={-20} max={50} step={1}
                onChange={v => handleChange({ temperature: v })}
            />
            <div className="form-group">
                <label className="form-label">Computed Air Density</label>
                <div className="form-computed">{fmt(rho, 4)} kg/m³</div>
            </div>
        </>
    );
}
