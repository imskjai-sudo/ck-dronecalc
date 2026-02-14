import { useState } from 'react';
import { Scale, X } from 'lucide-react';
import { useUnits } from '../../hooks/useUnits.jsx';

export default function UnitSettings() {
    const [open, setOpen] = useState(false);
    const { units, setUnit, CONVERSIONS } = useUnits();

    return (
        <>
            <button className="btn btn-secondary" onClick={() => setOpen(true)} title="Unit settings" style={{ padding: '0 var(--space-sm)' }}>
                <Scale size={16} />
            </button>

            {open && (
                <div className="modal-overlay" onClick={() => setOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Unit Settings</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Distance / Altitude</label>
                                <div className="toggle-group">
                                    {Object.entries(CONVERSIONS.distance).map(([key, def]) => (
                                        <button
                                            key={key}
                                            className={`toggle-btn ${units.distance === key ? 'active' : ''}`}
                                            onClick={() => setUnit('distance', key)}
                                        >
                                            {def.label} ({def.abbr})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Weight</label>
                                <div className="toggle-group">
                                    {Object.entries(CONVERSIONS.weight).map(([key, def]) => (
                                        <button
                                            key={key}
                                            className={`toggle-btn ${units.weight === key ? 'active' : ''}`}
                                            onClick={() => setUnit('weight', key)}
                                        >
                                            {def.label} ({def.abbr})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-helper" style={{ marginTop: 'var(--space-md)' }}>
                                Calculations are always performed in metric internally. Display values are converted for your convenience.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
