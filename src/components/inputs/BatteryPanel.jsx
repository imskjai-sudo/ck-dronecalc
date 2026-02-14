import { useState } from 'react';
import { Save, Trash2, RotateCw } from 'lucide-react';
import { InputField, SliderInput } from '../common/index.jsx';
import { CHEMISTRY } from '../../utils/physics.js';
import { fmt } from '../../utils/helpers.js';
import { useUnits } from '../../hooks/useUnits.jsx';
import { addComponent, deleteComponent, getAll } from '../../services/storage.js';

export default function BatteryPanel({ config, onChange, batteries: parentBatteries }) {
    const b = config.battery;
    const chem = CHEMISTRY[b.chemistry] || CHEMISTRY.LiPo;
    const totalVoltage = chem.nominal * b.cellsS;
    const totalCapacity = b.capacityMah * (b.cellsP || 1);
    const maxCurrent = (totalCapacity / 1000) * b.cRating;
    const { toDisplay, toInternal, getAbbr } = useUnits();
    const wAbbr = getAbbr('weight');
    const dw = (grams) => +toDisplay(grams, 'weight').toFixed(wAbbr === 'g' ? 0 : 2);
    const iw = (display) => Math.round(toInternal(display, 'weight'));

    // null = use parent prop; after any CRUD we store fresh DB data here
    const [localList, setLocalList] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    // Use local override if available, otherwise fall back to parent prop
    const batteries = localList ?? parentBatteries ?? [];

    /** Refresh from DB and store locally */
    const refreshFromDb = () => {
        try {
            const fresh = getAll('batteries');
            setLocalList(fresh);
        } catch (e) {
            console.error('DB read failed:', e);
        }
    };

    /** Build DB row from current config */
    const toDbRow = (name) => ({
        name,
        chemistry: b.chemistry,
        cells_s: b.cellsS,
        capacity_mah: b.capacityMah,
        c_rating: b.cRating,
        burst_c: b.burstC,
        weight_g: b.weightG,
        internal_resistance_mohm: b.internalResistanceMohm,
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
        const item = batteries.find(x => x.id === numId);
        if (!item) return;
        onChange({
            chemistry: item.chemistry,
            cellsS: item.cells_s,
            capacityMah: item.capacity_mah,
            cRating: item.c_rating,
            burstC: item.burst_c,
            weightG: item.weight_g,
            internalResistanceMohm: item.internal_resistance_mohm,
        });
    };

    const handleSave = () => {
        const name = window.prompt('Battery name:');
        if (!name || !name.trim()) return;
        try {
            const rowData = toDbRow(name.trim());
            const newId = addComponent('batteries', rowData);
            refreshFromDb();
            if (newId != null) setSelectedId(newId);
        } catch (e) {
            console.error('Save failed:', e);
            alert('Save failed: ' + e.message);
        }
    };

    const handleDelete = () => {
        if (!selectedId) return;
        if (!window.confirm('Delete this battery from the database?')) return;
        try {
            deleteComponent('batteries', selectedId);
            setSelectedId(null);
            refreshFromDb();
        } catch (e) {
            console.error('Delete failed:', e);
            alert('Delete failed: ' + e.message);
        }
    };

    return (
        <>
            {/* DB selector + CRUD */}
            <div className="form-group">
                <label className="form-label">Load from Database</label>
                <select
                    className="form-select"
                    value={selectedId ?? ''}
                    onChange={e => handleSelect(e.target.value)}
                >
                    <option value="">— Select or enter manually —</option>
                    {batteries.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            </div>
            <div className="preset-toolbar" style={{ marginTop: '-4px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleSave} title="Save current values as new battery">
                    <Save size={13} />
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={!selectedId} title="Delete selected battery">
                    <Trash2 size={13} />
                </button>
                <button className="btn btn-secondary btn-sm" onClick={refreshFromDb} title="Refresh list from database">
                    <RotateCw size={13} />
                </button>
            </div>

            <div className="form-group">
                <label className="form-label">Chemistry</label>
                <div className="toggle-group">
                    {Object.keys(CHEMISTRY).map(ch => (
                        <button key={ch} className={`toggle-btn ${b.chemistry === ch ? 'active' : ''}`} onClick={() => handleChange({ chemistry: ch })}>
                            {ch}
                        </button>
                    ))}
                </div>
                <div className="form-helper">
                    Nominal: {chem.nominal}V · Max: {chem.max}V · Min: {chem.min}V
                </div>
            </div>

            <div className="form-row">
                <InputField label="Series (S)" value={b.cellsS} min={1} max={12} step={1} onChange={v => handleChange({ cellsS: v })} />
                <InputField label="Parallel (P)" value={b.cellsP} min={1} max={4} step={1} onChange={v => handleChange({ cellsP: v })} />
            </div>

            <InputField label="Capacity" unit="mAh" value={b.capacityMah} min={100} onChange={v => handleChange({ capacityMah: v })} />

            <div className="form-row">
                <InputField label="C-Rating" tooltip="Continuous discharge rate" value={b.cRating} min={1} onChange={v => handleChange({ cRating: v })} />
                <InputField label="Burst C" value={b.burstC} min={1} onChange={v => handleChange({ burstC: v })} />
            </div>

            <InputField label="Internal Resistance" unit="mΩ/cell" value={b.internalResistanceMohm} min={0} step={0.5} onChange={v => handleChange({ internalResistanceMohm: v })} />
            <InputField label="Battery Weight" unit={wAbbr} value={dw(b.weightG)} min={0} onChange={v => handleChange({ weightG: iw(v) })} />

            <SliderInput label="Discharge Depth" unit="%" tooltip="Usable battery capacity percentage" value={b.dischargeDepth} min={50} max={95} step={5} onChange={v => handleChange({ dischargeDepth: v })} />

            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                <label className="form-label">Calculated</label>
                <div className="form-computed">
                    {fmt(totalVoltage, 1)}V total · {Math.round(totalCapacity).toLocaleString()} mAh · {fmt(maxCurrent, 0)}A max
                </div>
            </div>
        </>
    );
}
