import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const STORAGE_KEY = 'dronecalc_units';

/**
 * Unit conversion factors (internal → display).
 * Internal units: meters for distance, grams for weight.
 */
const CONVERSIONS = {
    distance: {
        m: { label: 'Meters', abbr: 'm', factor: 1 },
        ft: { label: 'Feet', abbr: 'ft', factor: 3.28084 },
    },
    weight: {
        g: { label: 'Grams', abbr: 'g', factor: 1 },
        kg: { label: 'Kilograms', abbr: 'kg', factor: 0.001 },
        lbs: { label: 'Pounds', abbr: 'lbs', factor: 0.00220462 },
    },
};

const DEFAULTS = { distance: 'm', weight: 'g' };

const UnitsContext = createContext(null);

export function UnitsProvider({ children }) {
    const [units, setUnitsState] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved?.distance && saved?.weight) return saved;
        } catch { }
        return { ...DEFAULTS };
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
    }, [units]);

    const setUnit = useCallback((type, value) => {
        setUnitsState(prev => ({ ...prev, [type]: value }));
    }, []);

    // Convert internal value → display value
    const toDisplay = useCallback((value, type) => {
        if (value === null || value === undefined || !isFinite(value)) return value;
        const conv = CONVERSIONS[type]?.[units[type]];
        return conv ? value * conv.factor : value;
    }, [units]);

    // Convert display value → internal value
    const toInternal = useCallback((value, type) => {
        if (value === null || value === undefined || !isFinite(value)) return value;
        const conv = CONVERSIONS[type]?.[units[type]];
        return conv ? value / conv.factor : value;
    }, [units]);

    // Get current unit abbreviation
    const getAbbr = useCallback((type) => {
        return CONVERSIONS[type]?.[units[type]]?.abbr || '';
    }, [units]);

    return (
        <UnitsContext.Provider value={{ units, setUnit, toDisplay, toInternal, getAbbr, CONVERSIONS }}>
            {children}
        </UnitsContext.Provider>
    );
}

export function useUnits() {
    const ctx = useContext(UnitsContext);
    if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
    return ctx;
}

export { CONVERSIONS };
