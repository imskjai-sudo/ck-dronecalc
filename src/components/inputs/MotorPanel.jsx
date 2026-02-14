import { useState } from 'react';
import { Save, Trash2, RotateCw, Filter } from 'lucide-react';
import { InputField } from '../common/index.jsx';
import { useUnits } from '../../hooks/useUnits.jsx';
import { addComponent, deleteComponent, getAll } from '../../services/storage.js';

export default function MotorPanel({ config, onChange, motors: parentMotors }) {
    const m = config.motor;
    const { toDisplay, toInternal, getAbbr } = useUnits();
    const wAbbr = getAbbr('weight');
    const dw = (grams) => +toDisplay(grams, 'weight').toFixed(wAbbr === 'g' ? 0 : 2);
    const iw = (display) => Math.round(toInternal(display, 'weight'));

    // Local state for CRUD operations
    const [localList, setLocalList] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [filterEnabled, setFilterEnabled] = useState(true);

    // Use local override if available, otherwise fall back to parent prop
    const rawMotors = localList ?? parentMotors ?? [];

    // Filter and Sort Logic
    // Sort alphabetically first
    let displayMotors = [...rawMotors].sort((a, b) => a.name.localeCompare(b.name));

    // Filter by voltage if enabled
    const batteryCells = config.battery?.cellsS || 0;
    if (filterEnabled && batteryCells > 0) {
        displayMotors = displayMotors.filter(item => {
            const min = item.min_cells || 0;
            const max = item.max_cells || 99;
            return batteryCells >= min && batteryCells <= max;
        });
    }

    const refreshFromDb = () => {
        try {
            const fresh = getAll('motors');
            setLocalList(fresh);
        } catch (e) {
            console.error('DB read failed:', e);
        }
    };

    const toDbRow = (name) => ({
        name,
        kv: m.kv,
        resistance_ohm: m.resistance,
        no_load_current_a: m.noLoadCurrent,
        max_current_a: m.maxCurrent,
        max_power_w: m.maxPower,
        weight_g: m.weightG,
        stator_diameter_mm: m.statorDiameter,
        stator_height_mm: m.statorHeight,
        min_cells: m.minCells || 2,
        max_cells: m.maxCells || 6,
        // Default values for fields not in UI but present in Schema
        brand: 'Generic',
        poles: 14
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
        const item = rawMotors.find(x => x.id === numId); // Search in RAW list
        if (!item) return;
        onChange({
            kv: item.kv,
            resistance: item.resistance_ohm,
            noLoadCurrent: item.no_load_current_a,
            maxCurrent: item.max_current_a,
            maxPower: item.max_power_w,
            weightG: item.weight_g,
            statorDiameter: item.stator_diameter_mm,
            statorHeight: item.stator_height_mm,
            minCells: item.min_cells,
            maxCells: item.max_cells,
        });
    };

    const handleSave = () => {
        const name = window.prompt('Motor name:');
        if (!name || !name.trim()) return;
        try {
            const newId = addComponent('motors', toDbRow(name.trim()));
            refreshFromDb();
            if (newId != null) setSelectedId(newId);
        } catch (e) {
            console.error('Save failed:', e);
            alert('Save failed: ' + e.message);
        }
    };

    const handleDelete = () => {
        if (!selectedId) return;
        if (!window.confirm('Delete this motor from the database?')) return;
        try {
            deleteComponent('motors', selectedId);
            setSelectedId(null);
            refreshFromDb();
        } catch (e) {
            console.error('Delete failed:', e);
            alert('Delete failed: ' + e.message);
        }
    };

    // Check compatibility of CURRENT selection (even if filter is off)
    const isCompatible = !selectedId || (
        (!m.minCells || batteryCells >= m.minCells) &&
        (!m.maxCells || batteryCells <= m.maxCells)
    );

    return (
        <>
            <div className="form-group">
                <label className="form-label">
                    Load from Database
                    {batteryCells > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.8em', color: 'var(--text-secondary)', float: 'right' }}>
                            Battery: {batteryCells}S
                        </span>
                    )}
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <select
                        className="form-select"
                        value={selectedId ?? ''}
                        onChange={e => handleSelect(e.target.value)}
                        style={{ flex: 1 }}
                    >
                        <option value="">— Select or enter manually —</option>
                        {displayMotors.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} ({item.min_cells || '?'}-{item.max_cells || '?'}S)
                            </option>
                        ))}
                    </select>
                    <button
                        className={`btn btn-sm ${filterEnabled ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterEnabled(!filterEnabled)}
                        title={filterEnabled ? "Filter active: Showing only compatible Motors" : "Filter off: Showing all Motors"}
                    >
                        <Filter size={14} />
                    </button>
                </div>
            </div>

            <div className="preset-toolbar" style={{ marginTop: '-4px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleSave} title="Save current values as new motor">
                    <Save size={13} />
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={!selectedId} title="Delete selected motor">
                    <Trash2 size={13} />
                </button>
                <button className="btn btn-secondary btn-sm" onClick={refreshFromDb} title="Refresh list">
                    <RotateCw size={13} />
                </button>
            </div>

            {!isCompatible && batteryCells > 0 && selectedId && (
                <div className="alert alert-warning" style={{ marginTop: 'var(--space-sm)', fontSize: '0.85em' }}>
                    ⚠️ Incompatible Voltage: {batteryCells}S battery vs {m.minCells}-{m.maxCells}S Motor.
                </div>
            )}

            <InputField label="Kv Rating" unit="RPM/V" value={m.kv} min={50} onChange={v => handleChange({ kv: v })} />

            <div className="form-row">
                <InputField label="Resistance" unit="Ω" value={m.resistance} min={0} step={0.01} onChange={v => handleChange({ resistance: v })} />
                <InputField label="No-Load Current" unit="A" value={m.noLoadCurrent} min={0} step={0.1} onChange={v => handleChange({ noLoadCurrent: v })} />
            </div>

            <div className="form-row">
                <InputField label="Max Current" unit="A" value={m.maxCurrent} min={1} onChange={v => handleChange({ maxCurrent: v })} />
                <InputField label="Max Power" unit="W" value={m.maxPower} min={1} onChange={v => handleChange({ maxPower: v })} />
            </div>

            <InputField label="Weight" unit={wAbbr} value={dw(m.weightG)} min={0} onChange={v => handleChange({ weightG: iw(v) })} />

            <InputField
                label="Thermal Resistance" unit="°C/W"
                tooltip="Motor thermal resistance — lower = better cooling. Default 10 for typical BLDC."
                value={m.thermalResistance} min={1} max={30} step={0.5}
                onChange={v => handleChange({ thermalResistance: v })}
            />

            <div className="form-row">
                <InputField label="Stator Diameter" unit="mm" value={m.statorDiameter} min={10} onChange={v => handleChange({ statorDiameter: v })} />
                <InputField label="Stator Height" unit="mm" value={m.statorHeight} min={2} onChange={v => handleChange({ statorHeight: v })} />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-sm)' }}>
                <label className="form-label">Supported Cells (Voltage)</label>
                <div className="form-row">
                    <InputField label="Min Cells" unit="S" value={m.minCells || 2} min={1} max={12} step={1} onChange={v => handleChange({ minCells: v })} />
                    <InputField label="Max Cells" unit="S" value={m.maxCells || 6} min={1} max={14} step={1} onChange={v => handleChange({ maxCells: v })} />
                </div>
            </div>
        </>
    );
}
