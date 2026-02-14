/**
 * useDroneConfig — Central state hook for all drone configuration + computed results.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { runFullSimulation } from '../utils/physics.js';
import { deepClone } from '../utils/helpers.js';

const DEFAULT_CONFIG = {
    environment: {
        altitude: 46,
        temperature: 30,
    },
    frame: {
        motorCount: 4,
        layout: 'flat',
        frameWeight: 300,
        payloadWeight: 0,
        payloadCurrent: 0,
        wheelbaseMm: 350,
    },
    battery: {
        chemistry: 'LiPo',
        cellsS: 4,
        cellsP: 1,
        capacityMah: 5000,
        cRating: 20,
        burstC: 40,
        weightG: 480,
        internalResistanceMohm: 5,
        dischargeDepth: 80,
    },
    esc: {
        continuousA: 30,
        burstA: 40,
        resistanceMohm: 1.5,
        weightG: 8,
        wireAwg: 14,
        wireLengthCm: 20,
    },
    motor: {
        kv: 920,
        resistance: 0.12,
        noLoadCurrent: 0.4,
        maxCurrent: 20,
        maxPower: 280,
        weightG: 56,
        thermalResistance: 10,
        statorDiameter: 22,
        statorHeight: 12,
    },
    propeller: {
        diameterIn: 10,
        pitchIn: 4.5,
        blades: 2,
        weightG: 15,
        ct: null,
        cp: null,
    },
};

export default function useDroneConfig() {
    const [config, setConfig] = useState(() => {
        // 1. Try last active session
        try {
            const saved = localStorage.getItem('dronecalc_config');
            if (saved) return JSON.parse(saved);
        } catch (e) { /* ignore */ }

        // 2. Try user default
        try {
            const userDefault = localStorage.getItem('dronecalc_user_default');
            if (userDefault) return JSON.parse(userDefault);
        } catch (e) { /* ignore */ }

        // 3. Fallback
        return deepClone(DEFAULT_CONFIG);
    });

    // Debounced save to localStorage
    const saveTimer = useRef(null);
    useEffect(() => {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            localStorage.setItem('dronecalc_config', JSON.stringify(config));
        }, 500);
        return () => clearTimeout(saveTimer.current);
    }, [config]);

    // Update a section of the config
    const updateSection = useCallback((section, updates) => {
        setConfig(prev => ({
            ...prev,
            [section]: { ...prev[section], ...updates },
        }));
    }, []);

    // Set full config (for load)
    const setFullConfig = useCallback((newConfig) => {
        setConfig({ ...deepClone(DEFAULT_CONFIG), ...newConfig });
    }, []);

    // Reset to defaults (User Default -> Factory Default)
    const resetConfig = useCallback(() => {
        try {
            const userDefault = localStorage.getItem('dronecalc_user_default');
            if (userDefault) {
                setConfig(JSON.parse(userDefault));
                return;
            }
        } catch (e) { /* ignore */ }

        setConfig(deepClone(DEFAULT_CONFIG));
        localStorage.removeItem('dronecalc_config');
    }, []);

    const saveDefaultConfig = useCallback(() => {
        localStorage.setItem('dronecalc_user_default', JSON.stringify(config));
        alert('Current configuration saved as default for new sessions.');
    }, [config]);

    // Computed results (re-run on every config change)
    const results = useMemo(() => {
        try {
            return runFullSimulation(config);
        } catch (e) {
            console.error('Simulation error:', e);
            return null;
        }
    }, [config]);

    return {
        config,
        results,
        updateSection,
        setFullConfig,
        setFullConfig,
        resetConfig,
        saveDefaultConfig,
        DEFAULT_CONFIG,
    };
}
