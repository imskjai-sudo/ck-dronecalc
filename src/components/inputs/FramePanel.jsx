import { useState, useEffect, useCallback } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { InputField } from '../common/index.jsx';
import { useUnits } from '../../hooks/useUnits.jsx';

const CONFIGS = [
    { count: 3, label: 'Tri', icon: '△' },
    { count: 4, label: 'Quad', icon: '✦' },
    { count: 6, label: 'Hex', icon: '⬡' },
    { count: 8, label: 'Octo', icon: '✸' },
];

const STORAGE_KEY = 'dronecalc_frame_presets';

const DEFAULT_PRESETS = [
    { id: 'f1', name: '5" Freestyle', motorCount: 4, layout: 'flat', wheelbaseMm: 225, frameWeight: 120, payloadWeight: 180, payloadCurrent: 0 },
    { id: 'f2', name: '7" Long Range', motorCount: 4, layout: 'flat', wheelbaseMm: 300, frameWeight: 200, payloadWeight: 300, payloadCurrent: 0 },
    { id: 'f3', name: 'Cinewhoop', motorCount: 4, layout: 'flat', wheelbaseMm: 150, frameWeight: 100, payloadWeight: 200, payloadCurrent: 0 },
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

export default function FramePanel({ config, onChange }) {
    const f = config.frame;
    const { toDisplay, toInternal, getAbbr } = useUnits();
    const wAbbr = getAbbr('weight');

    /** Weight helpers — internal is always grams */
    const dw = (grams) => +toDisplay(grams, 'weight').toFixed(wAbbr === 'g' ? 0 : 2);
    const iw = (display) => Math.round(toInternal(display, 'weight'));

    // ── Preset state ──
    const [presets, setPresets] = useState(loadPresets);
    const [selectedId, setSelectedId] = useState('');

    useEffect(() => { savePresetsToStorage(presets); }, [presets]);

    const handleChange = useCallback((updates) => {
        setSelectedId('');
        onChange(updates);
    }, [onChange]);

    const handleSelect = useCallback((id) => {
        setSelectedId(id);
        if (!id) return;
        const preset = presets.find(p => p.id === id);
        if (preset) {
            onChange({
                motorCount: Number(preset.motorCount),
                layout: preset.layout,
                wheelbaseMm: Number(preset.wheelbaseMm),
                frameWeight: Number(preset.frameWeight),
                payloadWeight: Number(preset.payloadWeight),
                payloadCurrent: Number(preset.payloadCurrent),
            });
        }
    }, [presets, onChange]);

    const handleSave = useCallback(() => {
        const name = window.prompt('Preset name:');
        if (!name || !name.trim()) return;
        const newPreset = {
            id: String(Date.now()),
            name: name.trim(),
            motorCount: Number(f.motorCount),
            layout: f.layout,
            wheelbaseMm: Number(f.wheelbaseMm),
            frameWeight: Number(f.frameWeight),
            payloadWeight: Number(f.payloadWeight),
            payloadCurrent: Number(f.payloadCurrent),
        };
        setPresets(prev => [...prev, newPreset]);
        setSelectedId(newPreset.id);
    }, [f]);

    const handleDelete = useCallback(() => {
        if (!selectedId) return;
        setPresets(prev => prev.filter(p => p.id !== selectedId));
        setSelectedId('');
    }, [selectedId]);

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

            <div className="form-group">
                <label className="form-label">Configuration</label>
                <div className="config-selector">
                    {CONFIGS.map(c => (
                        <button
                            key={c.count}
                            className={`config-option ${f.motorCount === c.count ? 'selected' : ''}`}
                            onClick={() => handleChange({ motorCount: c.count })}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{c.icon}</span>
                            <span>{c.label} ({c.count})</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Layout</label>
                <div className="toggle-group">
                    <button className={`toggle-btn ${f.layout === 'flat' ? 'active' : ''}`} onClick={() => handleChange({ layout: 'flat' })}>Flat</button>
                    <button className={`toggle-btn ${f.layout === 'coaxial' ? 'active' : ''}`} onClick={() => handleChange({ layout: 'coaxial' })}>Coaxial</button>
                </div>
            </div>

            <InputField label="Wheelbase" unit="mm" tooltip="Diagonal distance from motor to motor" value={f.wheelbaseMm} min={50} onChange={v => handleChange({ wheelbaseMm: v })} />

            <InputField label="Frame Weight" unit={wAbbr} tooltip="Frame weight excluding motors, battery, ESCs" value={dw(f.frameWeight)} min={0} onChange={v => handleChange({ frameWeight: iw(v) })} />
            <InputField label="Payload Weight" unit={wAbbr} tooltip="Cameras, gimbals, accessories" value={dw(f.payloadWeight)} min={0} onChange={v => handleChange({ payloadWeight: iw(v) })} />
            <InputField label="Payload Current" unit="A" tooltip="Current drawn by payload devices" value={f.payloadCurrent} min={0} step={0.1} onChange={v => handleChange({ payloadCurrent: v })} />
        </>
    );
}
