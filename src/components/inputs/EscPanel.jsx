import { useState } from 'react';
import { Save, Trash2, RotateCw, Filter } from 'lucide-react';
import { InputField } from '../common/index.jsx';
import { useUnits } from '../../hooks/useUnits.jsx';
import { addComponent, deleteComponent, getAll } from '../../services/storage.js';

export default function EscPanel({ config, onChange, escs: parentEscs }) {
    const e = config.esc;
    const { toDisplay, toInternal, getAbbr } = useUnits();
    const wAbbr = getAbbr('weight');
    const dw = (grams) => +toDisplay(grams, 'weight').toFixed(wAbbr === 'g' ? 0 : 2);
    const iw = (display) => Math.round(toInternal(display, 'weight'));

    // Local state for CRUD operations
    const [localList, setLocalList] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [filterEnabled, setFilterEnabled] = useState(true);

    // Use local override if available, otherwise fall back to parent prop
    const rawEscs = localList ?? parentEscs ?? [];

    // Filter and Sort Logic
    // Sort alphabetically first
    let displayEscs = [...rawEscs].sort((a, b) => a.name.localeCompare(b.name));

    // Filter by voltage if enabled
    const batteryCells = config.battery?.cellsS || 0;
    if (filterEnabled && batteryCells > 0) {
        displayEscs = displayEscs.filter(item => {
            const min = item.min_cells || 0;
            const max = item.max_cells || 99;
            return batteryCells >= min && batteryCells <= max;
        });
    }

    const refreshFromDb = () => {
        try {
            const fresh = getAll('escs');
            setLocalList(fresh);
        } catch (e) {
            console.error('DB read failed:', e);
        }
    };

    const toDbRow = (name) => ({
        name,
        continuous_a: e.continuousA,
        burst_a: e.burstA,
        resistance_mohm: e.resistanceMohm,
        weight_g: e.weightG,
        min_cells: e.minCells || 2,
        max_cells: e.maxCells || 6,
        // Default values for fields not in UI but present in Schema
        bec_voltage: 5,
        bec_current: 2
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
        const item = rawEscs.find(x => x.id === numId); // Search in RAW list as it might be hidden by filter
        if (!item) return;
        onChange({
            continuousA: item.continuous_a,
            burstA: item.burst_a,
            resistanceMohm: item.resistance_mohm,
            weightG: item.weight_g,
            minCells: item.min_cells,
            maxCells: item.max_cells,
        });
    };

    const handleSave = () => {
        const name = window.prompt('ESC name:');
        if (!name || !name.trim()) return;
        try {
            const newId = addComponent('escs', toDbRow(name.trim()));
            refreshFromDb();
            if (newId != null) setSelectedId(newId);
        } catch (e) {
            console.error('Save failed:', e);
            alert('Save failed: ' + e.message);
        }
    };

    const handleDelete = () => {
        if (!selectedId) return;
        if (!window.confirm('Delete this ESC from the database?')) return;
        try {
            deleteComponent('escs', selectedId);
            setSelectedId(null);
            refreshFromDb();
        } catch (e) {
            console.error('Delete failed:', e);
            alert('Delete failed: ' + e.message);
        }
    };

    // Check compatibility of CURRENT selection (even if filter is off)
    const isCompatible = !selectedId || (
        (!e.minCells || batteryCells >= e.minCells) &&
        (!e.maxCells || batteryCells <= e.maxCells)
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
                        {displayEscs.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} ({item.min_cells || '?'}-{item.max_cells || '?'}S)
                            </option>
                        ))}
                    </select>
                    <button
                        className={`btn btn-sm ${filterEnabled ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterEnabled(!filterEnabled)}
                        title={filterEnabled ? "Filter active: Showing only compatible ESCs" : "Filter off: Showing all ESCs"}
                    >
                        <Filter size={14} />
                    </button>
                </div>
            </div>

            <div className="preset-toolbar" style={{ marginTop: '-4px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleSave} title="Save current values as new ESC">
                    <Save size={13} />
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={!selectedId} title="Delete selected ESC">
                    <Trash2 size={13} />
                </button>
                <button className="btn btn-secondary btn-sm" onClick={refreshFromDb} title="Refresh list">
                    <RotateCw size={13} />
                </button>
            </div>

            {!isCompatible && batteryCells > 0 && selectedId && (
                <div className="alert alert-warning" style={{ marginTop: 'var(--space-sm)', fontSize: '0.85em' }}>
                    ⚠️ Incompatible Voltage: {batteryCells}S battery vs {e.minCells}-{e.maxCells}S ESC.
                </div>
            )}

            <div className="form-row">
                <InputField label="Continuous Current" unit="A" value={e.continuousA} min={1} onChange={v => handleChange({ continuousA: v })} />
                <InputField label="Burst Current" unit="A" value={e.burstA} min={1} onChange={v => handleChange({ burstA: v })} />
            </div>

            <div className="form-row">
                <InputField label="ESC Resistance" unit="mΩ" value={e.resistanceMohm} min={0} step={0.1} onChange={v => handleChange({ resistanceMohm: v })} />
                <InputField label="Weight per ESC" unit={wAbbr} value={dw(e.weightG)} min={0} onChange={v => handleChange({ weightG: iw(v) })} />
            </div>

            <div className="form-row">
                <InputField label="Wire AWG" value={e.wireAwg} min={10} max={22} step={2} onChange={v => handleChange({ wireAwg: v })} />
                <InputField label="Wire Length" unit="cm" tooltip="Motor-to-ESC wire length" value={e.wireLengthCm} min={1} onChange={v => handleChange({ wireLengthCm: v })} />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-sm)' }}>
                <label className="form-label">Supported Cells (Voltage)</label>
                <div className="form-row">
                    <InputField label="Min Cells" unit="S" value={e.minCells || 2} min={1} max={12} step={1} onChange={v => handleChange({ minCells: v })} />
                    <InputField label="Max Cells" unit="S" value={e.maxCells || 6} min={1} max={14} step={1} onChange={v => handleChange({ maxCells: v })} />
                </div>
            </div>
        </>
    );
}
