import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Plane, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import useDroneConfig from './hooks/useDroneConfig.js';
import useTheme from './hooks/useTheme.js';
import { UnitsProvider } from './hooks/useUnits.jsx';
import { AppSettingsProvider, useAppSettings } from './hooks/useAppSettings.jsx';
import CalculatorPage from './pages/CalculatorPage.jsx';
import CouncilPage from './pages/CouncilPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function AppContent() {
  const { config, results, updateSection, setFullConfig, resetConfig, saveDefaultConfig } = useDroneConfig();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useAppSettings();

  return (
    <BrowserRouter>
      <UnitsProvider>
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="brand-logo" style={{ maxHeight: '32px', marginRight: '8px' }} />
            ) : (
              <Plane size={22} />
            )}
            <span>DroneCalc</span>
            {settings.version && <span className="app-version">v{settings.version}</span>}
          </div>
          <nav className="header-nav">
            <NavLink to="/" end>Calculator</NavLink>
            <NavLink to="/council">LLM Council</NavLink>
            <NavLink to="/settings" title="Settings"><SettingsIcon size={18} /></NavLink>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>
        </header>

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <CalculatorPage
                config={config}
                results={results}
                updateSection={updateSection}
                setFullConfig={setFullConfig}
                resetConfig={resetConfig}
                saveDefaultConfig={saveDefaultConfig}
              />
            }
          />
          <Route
            path="/council"
            element={<CouncilPage config={config} results={results} />}
          />
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Routes>

        {/* Footer */}
        <footer className="disclaimer">
          <div>⚠ All values are estimates based on simplified aerodynamic models. Verify actual performance before flight. DroneCalc is not liable for any damage.</div>
          <div className="copyright">{settings.footerText || '© Copyright Cavin Infotech 2026'}</div>
        </footer>
      </UnitsProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppSettingsProvider>
      <AppContent />
    </AppSettingsProvider>
  );
}

