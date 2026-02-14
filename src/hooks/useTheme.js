import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dronecalc_theme';

export default function useTheme() {
    const [theme, setThemeState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') return saved;
        } catch { }
        // Respect OS preference
        if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
        return 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    return { theme, toggleTheme };
}
