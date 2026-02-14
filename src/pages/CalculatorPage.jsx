import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mountain, Box, Battery, Cpu, Settings2, Fan, BrainCircuit, Save, Upload, RotateCcw, FileInput, Download } from 'lucide-react';
import { downloadFile, readFileAsText } from '../utils/helpers.js';

import { AccordionPanel } from '../components/common/index.jsx';
import EnvironmentPanel from '../components/inputs/EnvironmentPanel.jsx';
import FramePanel from '../components/inputs/FramePanel.jsx';
import BatteryPanel from '../components/inputs/BatteryPanel.jsx';
import EscPanel from '../components/inputs/EscPanel.jsx';
import MotorPanel from '../components/inputs/MotorPanel.jsx';
import PropellerPanel from '../components/inputs/PropellerPanel.jsx';
import ResultsDashboard from '../components/results/ResultsDashboard.jsx';
import { ThrustVsThrottle, FlightTimeVsPayload, EfficiencyCurve } from '../components/charts/Charts.jsx';
import { ComparisonMode } from '../components/features/Features.jsx';
import UnitSettings from '../components/features/UnitSettings.jsx';
import PdfExport from '../components/features/PdfExport.jsx';
import { getAll } from '../services/storage.js';

export default function CalculatorPage({ config, results, updateSection, setFullConfig, resetConfig, saveDefaultConfig }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dbData, setDbData] = useState({ motors: [], propellers: [], batteries: [], escs: [] });
    const [dbReady, setDbReady] = useState(false);

    // Load Data from LocalStorage
    useEffect(() => {
        const data = {
            motors: getAll('motors'),
            propellers: getAll('propellers'),
            batteries: getAll('batteries'),
            escs: getAll('escs'),
        };
        setDbData(data);
        setDbReady(true);
    }, []);

    // Config Actions
    const handleSaveFile = () => {
        downloadFile(JSON.stringify(config, null, 2), `dronecalc-config-${Date.now()}.json`);
    };

    const handleLoadFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await readFileAsText(file);
                const loaded = JSON.parse(text);
                setFullConfig(loaded);
            } catch (err) {
                alert('Invalid config file: ' + err.message);
            }
        };
        input.click();
    };



    return (
        <div className="app-layout">
            {/* Sidebar — Input Panels */}
            <aside className="sidebar">
                <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {/* Row 1 */}
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleSaveFile}>
                            <Download size={14} /> Save Config
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleLoadFile}>
                            <Upload size={14} /> Load Config
                        </button>
                        <UnitSettings />
                    </div>
                    {/* Row 2 */}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={saveDefaultConfig}>
                            <Save size={14} /> Save Default
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetConfig}>
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>

                <AccordionPanel title="Environment" icon={Mountain} defaultOpen={false}>
                    <EnvironmentPanel config={config} onChange={updates => updateSection('environment', updates)} />
                </AccordionPanel>

                <AccordionPanel title="Frame" icon={Box} defaultOpen={false}>
                    <FramePanel config={config} onChange={updates => updateSection('frame', updates)} />
                </AccordionPanel>

                <AccordionPanel title="Battery" icon={Battery} defaultOpen={false}>
                    <BatteryPanel config={config} onChange={updates => updateSection('battery', updates)} batteries={dbData.batteries} />
                </AccordionPanel>

                <AccordionPanel title="ESC" icon={Cpu} defaultOpen={false}>
                    <EscPanel config={config} onChange={updates => updateSection('esc', updates)} escs={dbData.escs} />
                </AccordionPanel>

                <AccordionPanel title="Motor" icon={Settings2} defaultOpen={false}>
                    <MotorPanel config={config} onChange={updates => updateSection('motor', updates)} motors={dbData.motors} />
                </AccordionPanel>

                <AccordionPanel title="Propeller" icon={Fan} defaultOpen={false}>
                    <PropellerPanel config={config} onChange={updates => updateSection('propeller', updates)} propellers={dbData.propellers} />
                </AccordionPanel>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Tabs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                    <div className="tabs" style={{ marginBottom: 0 }}>
                        <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                        <button className={`tab ${activeTab === 'charts' ? 'active' : ''}`} onClick={() => setActiveTab('charts')}>Charts</button>
                        <button className={`tab ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}>Compare</button>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                        <PdfExport config={config} results={results} />
                        <button className="btn btn-primary" onClick={() => navigate('/council')}>
                            <BrainCircuit size={14} /> LLM Council
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'dashboard' && <ResultsDashboard results={results} />}

                {activeTab === 'charts' && (
                    <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                        <ThrustVsThrottle config={config} results={results} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                            <FlightTimeVsPayload config={config} results={results} />
                            <EfficiencyCurve config={config} results={results} />
                        </div>
                    </div>
                )}

                {activeTab === 'compare' && <ComparisonMode config={config} results={results} />}
            </main>
        </div>
    );
}
