import { useState, useEffect } from 'react';
import { Save, Upload, Download, RefreshCw, Server, Database, Image as ImageIcon, Settings as SettingsIcon } from 'lucide-react';
import { useAppSettings } from '../hooks/useAppSettings.jsx';
import { useUnits } from '../hooks/useUnits.jsx';
// Ensure InputField is properly imported
import { InputField } from '../components/common/index.jsx';
import './SettingsPage.css';

export default function SettingsPage() {
    // 1. Safe context consumption
    const appSettingsContext = useAppSettings();
    const { settings, updateSettings, updateLogo, exportBackup, importBackup } = appSettingsContext || {};

    const unitsContext = useUnits();
    const { units, setUnit, CONVERSIONS } = unitsContext || {};

    // 2. Safe State Initialization
    // We prefer local state for the form inputs to allow a "Save" action, 
    // rather than updating global state on every keystroke (except for Units/Logo which we decided are instant/handled differently).
    const [formData, setFormData] = useState({
        version: '',
        footerText: '',
        smtp: { host: '', port: 587, user: '', pass: '', secure: false },
        db: { type: 'sql', host: '', port: 3306, name: '', user: '', pass: '' }
    });

    // Sync state when settings are loaded/available
    useEffect(() => {
        if (settings) {
            setFormData({
                version: settings.version || '1.0.0',
                footerText: settings.footerText || '© Copyright Cavin Infotech 2026',
                smtp: { host: '', port: 587, user: '', pass: '', secure: false, ...(settings.smtp || {}) },
                db: { type: 'sql', host: 'localhost', port: 3306, name: 'dronecalc', user: '', pass: '', ...(settings.db || {}) }
            });
        }
    }, [settings]);

    // Handle missing context gracefully (e.g. if provider is missing)
    if (!settings || !units) {
        return <div className="p-4 text-red-500">Error: Settings or Units context not loaded.</div>;
    }

    const handleSmtpChange = (field, value) => {
        setFormData(prev => ({ ...prev, smtp: { ...prev.smtp, [field]: value } }));
    };

    const handleDbChange = (field, value) => {
        setFormData(prev => ({ ...prev, db: { ...prev.db, [field]: value } }));
    };

    const saveChanges = () => {
        if (updateSettings) {
            updateSettings({
                version: formData.version,
                footerText: formData.footerText,
                smtp: formData.smtp,
                db: formData.db
            });
            alert('Settings saved!');
        }
    };

    return (
        <div className="page-container settings-page">
            <h1><SettingsIcon className="inline-icon" /> Application Settings</h1>

            <div className="settings-grid">

                {/* 1. General & Logo */}
                <section className="settings-card">
                    <h2><ImageIcon size={20} /> General & Branding</h2>

                    <div className="form-group">
                        <label className="form-label">App Version</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.version}
                            onChange={e => setFormData({ ...formData, version: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Footer Text</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.footerText}
                            onChange={e => setFormData({ ...formData, footerText: e.target.value })}
                            placeholder="© Copyright 2026..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Custom Logo</label>
                        <div className="logo-upload-container">
                            {settings.logoUrl && (
                                <img src={settings.logoUrl} alt="Logo Preview" className="logo-preview" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => updateLogo && updateLogo(e.target.files[0])}
                                className="form-input"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Unit Preferences (Directly updates context) */}
                <section className="settings-card">
                    <h2><RefreshCw size={20} /> Unit Preferences</h2>

                    <div className="form-group">
                        <label className="form-label">Distance / Altitude</label>
                        <select
                            className="form-select"
                            value={units.distance || 'm'}
                            onChange={e => setUnit && setUnit('distance', e.target.value)}
                        >
                            {CONVERSIONS?.distance && Object.entries(CONVERSIONS.distance).map(([key, val]) => (
                                <option key={key} value={key}>{val.label} ({val.abbr})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Weight</label>
                        <select
                            className="form-select"
                            value={units.weight || 'g'}
                            onChange={e => setUnit && setUnit('weight', e.target.value)}
                        >
                            {CONVERSIONS?.weight && Object.entries(CONVERSIONS.weight).map(([key, val]) => (
                                <option key={key} value={key}>{val.label} ({val.abbr})</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* 3. SMTP Settings */}
                <section className="settings-card">
                    <h2><Server size={20} /> SMTP Configuration</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Host</label>
                            <input type="text" className="form-input" value={formData.smtp.host} onChange={e => handleSmtpChange('host', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Port</label>
                            <input type="number" className="form-input" value={formData.smtp.port} onChange={e => handleSmtpChange('port', Number(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">User</label>
                            <input type="text" className="form-input" value={formData.smtp.user} onChange={e => handleSmtpChange('user', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" value={formData.smtp.pass} onChange={e => handleSmtpChange('pass', e.target.value)} />
                        </div>
                        <div className="form-group checkbox-group">
                            <label>
                                <input type="checkbox" checked={formData.smtp.secure} onChange={e => handleSmtpChange('secure', e.target.checked)} />
                                Secure (TLS/SSL)
                            </label>
                        </div>
                    </div>
                </section>

                {/* 4. Database Settings */}
                <section className="settings-card">
                    <h2><Database size={20} /> Database Setup</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select className="form-select" value={formData.db.type} onChange={e => handleDbChange('type', e.target.value)}>
                                <option value="sql">SQL (MySQL/Postgres)</option>
                                <option value="nosql">NoSQL (MongoDB)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Host</label>
                            <input type="text" className="form-input" value={formData.db.host} onChange={e => handleDbChange('host', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Port</label>
                            <input type="number" className="form-input" value={formData.db.port} onChange={e => handleDbChange('port', Number(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Database Name</label>
                            <input type="text" className="form-input" value={formData.db.name} onChange={e => handleDbChange('name', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">User</label>
                            <input type="text" className="form-input" value={formData.db.user} onChange={e => handleDbChange('user', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" value={formData.db.pass} onChange={e => handleDbChange('pass', e.target.value)} />
                        </div>
                    </div>
                </section>
            </div>

            <div className="settings-actions">
                <button className="btn btn-primary" onClick={saveChanges}>
                    <Save size={18} /> Save Settings
                </button>
            </div>

            <hr className="divider" />

            {/* 5. System Backup/Restore */}
            <section className="settings-card danger-zone">
                <h2>System Backup & Restore</h2>
                <p className="text-muted">Export all application data (configurations, presets, custom components, settings) or restore from a file.</p>

                <div className="backup-controls">
                    <button className="btn btn-secondary" onClick={exportBackup}>
                        <Download size={18} /> Download System Backup
                    </button>

                    <div className="restore-control">
                        <label className="btn btn-outline">
                            <Upload size={18} /> Restore from File
                            <input
                                type="file"
                                accept=".json"
                                onChange={e => importBackup && importBackup(e.target.files[0])}
                                hidden
                            />
                        </label>
                    </div>
                </div>
            </section>
        </div>
    );
}
