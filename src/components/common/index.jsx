import { useState, useRef } from 'react';
import { Info } from 'lucide-react';

/**
 * Reusable labeled input with optional tooltip and validation.
 */
export function InputField({ label, tooltip, unit, value, onChange, type = 'number', min, max, step, readOnly, className = '' }) {
    return (
        <div className={`form-group ${className}`}>
            <label className="form-label">
                {label}
                {unit && <span style={{ opacity: 0.5, fontWeight: 400 }}> ({unit})</span>}
                {tooltip && <Tooltip text={tooltip} />}
            </label>
            <input
                className="form-input"
                type={type}
                value={value ?? ''}
                onChange={e => {
                    const val = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                    onChange?.(val);
                }}
                min={min}
                max={max}
                step={step || 'any'}
                readOnly={readOnly}
            />
        </div>
    );
}

/**
 * Slider + numeric input combo.
 */
export function SliderInput({ label, tooltip, unit, value, onChange, min, max, step = 1 }) {
    return (
        <div className="form-group">
            <label className="form-label">
                {label}
                {unit && <span style={{ opacity: 0.5, fontWeight: 400 }}> ({unit})</span>}
                {tooltip && <Tooltip text={tooltip} />}
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                <input
                    className="form-slider"
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value ?? min}
                    onChange={e => onChange?.(Number(e.target.value))}
                    style={{ flex: 1 }}
                />
                <input
                    className="form-input"
                    type="number"
                    value={value ?? ''}
                    onChange={e => onChange?.(e.target.value === '' ? min : Number(e.target.value))}
                    min={min}
                    max={max}
                    step={step}
                    style={{ width: '72px', textAlign: 'right' }}
                />
            </div>
        </div>
    );
}

/**
 * Dropdown populated from a list of items.
 */
export function DbDropdown({ label, items, value, onChange, displayField = 'name' }) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <select
                className="form-select"
                value={value ?? ''}
                onChange={e => onChange?.(e.target.value ? Number(e.target.value) : null)}
            >
                <option value="">— Select or enter manually —</option>
                {items.map(item => (
                    <option key={item.id} value={item.id}>{item[displayField]}</option>
                ))}
            </select>
        </div>
    );
}

/**
 * Green/Yellow/Red status indicator dot.
 */
export function StatusIndicator({ status }) {
    return <span className={`status-dot ${status}`} />;
}

/**
 * Status badge with label.
 */
export function StatusBadge({ status, label }) {
    return <span className={`status-badge ${status}`}>{label}</span>;
}

/**
 * Info tooltip using hover.
 */
export function Tooltip({ text }) {
    const [show, setShow] = useState(false);
    const ref = useRef(null);

    return (
        <span
            className="tooltip-trigger"
            ref={ref}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            style={{ position: 'relative', marginLeft: '4px' }}
        >
            <Info size={12} />
            {show && (
                <span className="tooltip-content" style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px' }}>
                    {text}
                </span>
            )}
        </span>
    );
}

/**
 * Accordion panel component for sidebar.
 */
export function AccordionPanel({ title, icon: Icon, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="accordion">
            <button
                className={`accordion-trigger ${open ? 'open' : ''}`}
                onClick={() => setOpen(!open)}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    {Icon && <Icon size={16} />}
                    {title}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            <div className={`accordion-content ${open ? 'open' : ''}`}>
                {children}
            </div>
        </div>
    );
}
