import { useState } from 'react';
import { Save, Trash2, RotateCw } from 'lucide-react';
import { InputField } from '../common/index.jsx';
import { estimatePropCoefficients } from '../../utils/physics.js';
import { fmt } from '../../utils/helpers.js';
import { useUnits } from '../../hooks/useUnits.jsx';
import { addComponent, deleteComponent, getAll } from '../../services/storage.js';

export default function PropellerPanel({ config, onChange, propellers: parentPropellers }) {
    const p = config.propeller;
    const estimated = estimatePropCoefficients(p.diameterIn || 10, p.pitchIn || 4.5, p.blades || 2);
    const { toDisplay, toInternal, getAbbr } = useUnits();
    const wAbbr = getAbbr('weight');
    const dw = (grams) => +toDisplay(grams, 'weight').toFixed(wAbbr === 'g' ? 0 : 2);
    const iw = (display) => Math.round(toInternal(display, 'weight'));

    // Local state for CRUD operations
    const [localList, setLocalList] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    // Use local override if available, otherwise fall back to parent prop
    const propellers = localList ?? parentPropellers ?? [];

    const refreshFromDb = () => {
        try {
            const fresh = getAll('propellers');
            setLocalList(fresh);
        } catch (e) {
            console.error('DB read failed:', e);
        }
    };

    const toDbRow = (name) => ({
        name,
        diameter_in: p.diameterIn,
        pitch_in: p.pitchIn,
        blades: p.blades,
        weight_g: p.weightG,
        ct: p.ct,
        cp: p.cp,
    });

    /** Handle manual changes by clearing selection */
    const handleChange = (updates) => {
        setSelectedId(null);
        onChange(updates);
    };

    const handleSelect = (id) => {
        const numId = id ? Number(id) : null;
        setSelectedId(numId);
        if (!numId) return;
        const item = propellers.find(x => x.id === numId);
        if (!item) return;
        onChange({
            diameterIn: item.diameter_in,
            pitchIn: item.pitch_in,
            blades: item.blades,
            weightG: item.weight_g,
            ct: item.ct,
            cp: item.cp,
        });
    };

    const handleSave = () => {
        const name = window.prompt('Propeller name:');
        if (!name || !name.trim()) return;
        try {
            const newId = addComponent('propellers', toDbRow(name.trim()));
            refreshFromDb();
            if (newId != null) setSelectedId(newId);
        } catch (e) {
            console.error('Save failed:', e);
            alert('Save failed: ' + e.message);
        }
    };

    const handleDelete = () => {
        if (!selectedId) return;
        if (!window.confirm('Delete this propeller from the database?')) return;
        try {
            deleteComponent('propellers', selectedId);
            setSelectedId(null);
            refreshFromDb();
        } catch (e) {
            console.error('Delete failed:', e);
            alert('Delete failed: ' + e.message);
        }
    };

    return (
        <>
            <div className="form-group">
                <label className="form-label">Load from Database</label>
                <select
                    className="form-select"
                    value={selectedId ?? ''}
                    onChange={e => handleSelect(e.target.value)}
                >
                    <option value="">— Select or enter manually —</option>
                    {propellers.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            </div>
            <div className="preset-toolbar" style={{ marginTop: '-4px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleSave} title="Save current values as new propeller">
                    <Save size={13} />
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={!selectedId} title="Delete selected propeller">
                    <Trash2 size={13} />
                </button>
                <button className="btn btn-secondary btn-sm" onClick={refreshFromDb} title="Refresh list">
                    <RotateCw size={13} />
                </button>
            </div>

            <div className="form-row">
                <InputField label="Diameter" unit="in" value={p.diameterIn} min={3} max={40} step={0.1} onChange={v => handleChange({ diameterIn: v })} />
                <InputField label="Pitch" unit="in" value={p.pitchIn} min={1} max={15} step={0.1} onChange={v => handleChange({ pitchIn: v })} />
            </div>

            <div className="form-group">
                <label className="form-label">Blades</label>
                <div className="toggle-group">
                    <button className={`toggle-btn ${p.blades === 2 ? 'active' : ''}`} onClick={() => handleChange({ blades: 2 })}>2-Blade</button>
                    <button className={`toggle-btn ${p.blades === 3 ? 'active' : ''}`} onClick={() => handleChange({ blades: 3 })}>3-Blade</button>
                </div>
            </div>

            <InputField label="Weight per Prop" unit={wAbbr} value={dw(p.weightG)} min={0} onChange={v => handleChange({ weightG: iw(v) })} />

            <div className="form-row">
                <InputField label="Ct Override" tooltip="Thrust coefficient. Leave blank for auto-estimate." value={p.ct || ''} min={0} max={0.3} step={0.001} onChange={v => handleChange({ ct: v || null })} />
                <InputField label="Cp Override" tooltip="Power coefficient. Leave blank for auto-estimate." value={p.cp || ''} min={0} max={0.2} step={0.001} onChange={v => handleChange({ cp: v || null })} />
            </div>

            <div className="form-group">
                <label className="form-label">Auto-estimated Coefficients</label>
                <div className="form-computed">
                    Ct ≈ {fmt(estimated.ct, 4)} · Cp ≈ {fmt(estimated.cp, 4)}
                </div>
            </div>
        </>
    );
}
