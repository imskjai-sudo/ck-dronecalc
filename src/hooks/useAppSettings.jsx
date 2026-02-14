import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const STORAGE_KEY = 'dronecalc_app_settings';

// All keys that should be included in the system backup
const BACKUP_KEYS = [
    'dronecalc_app_settings',
    'dronecalc_config',
    'dronecalc_units',
    'dronecalc_theme',
    'dronecalc_env_presets',
    'dronecalc_frame_presets',
    'dronecalc_batteries',
    'dronecalc_motors',
    'dronecalc_propellers',
    'dronecalc_escs',
    'dronecalc_storage_version'
];

const DEFAULT_SETTINGS = {
    version: '1.0.0',
    logoUrl: null,
    footerText: '© Copyright Cavin Infotech 2026',
    smtp: {
        host: '',
        port: 587,
        user: '',
        pass: '',
        secure: false
    },
    db: {
        type: 'sql',
        host: 'localhost',
        port: 3306,
        name: 'dronecalc',
        user: '',
        pass: ''
    }
};

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
    const [settings, setSettingsState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    // Persist settings on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const updateSettings = useCallback((updates) => {
        setSettingsState(prev => ({ ...prev, ...updates }));
    }, []);

    const updateLogo = useCallback((file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            updateSettings({ logoUrl: e.target.result });
        };
        reader.readAsDataURL(file);
    }, [updateSettings]);

    const exportBackup = useCallback(() => {
        const backupData = {};
        BACKUP_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) backupData[key] = val;
        });

        // Add timestamp to metadata if needed, for now just raw keys
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dronecalc_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    const importBackup = useCallback((file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Validate if it looks like a backup (check for at least one known key)
                const hasKnownKey = Object.keys(data).some(k => BACKUP_KEYS.includes(k));

                if (!hasKnownKey) {
                    alert('Invalid backup file: No recognized data found.');
                    return;
                }

                if (window.confirm('This will overwrite all current application data and reload the page. Are you sure?')) {
                    // Clear current storage to be safe (optional, or just overwrite)
                    // We'll just overwrite keys present in the backup
                    Object.entries(data).forEach(([key, value]) => {
                        if (BACKUP_KEYS.includes(key)) {
                            localStorage.setItem(key, value);
                        }
                    });

                    // Force reload to apply all changes
                    window.location.reload();
                }
            } catch (err) {
                console.error('Import failed', err);
                alert('Failed to parse backup file.');
            }
        };
        reader.readAsText(file);
    }, []);

    return (
        <AppSettingsContext.Provider value={{
            settings,
            updateSettings,
            updateLogo,
            exportBackup,
            importBackup
        }}>
            {children}
        </AppSettingsContext.Provider>
    );
}

export function useAppSettings() {
    const ctx = useContext(AppSettingsContext);
    if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
    return ctx;
}
