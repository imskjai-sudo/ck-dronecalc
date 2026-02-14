import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Send, Copy, Clock, Trash2, Plus, Minus } from 'lucide-react';

const STORAGE_KEY = 'dronecalc_council';

function loadState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function CouncilPage({ config, results }) {
    const navigate = useNavigate();
    const [endpoint, setEndpoint] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [modelName, setModelName] = useState('');
    const [customHeaders, setCustomHeaders] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load saved state
    useEffect(() => {
        const s = loadState();
        setEndpoint(s.endpoint || '');
        setApiKey(s.apiKey || '');
        setModelName(s.modelName || '');
        setCustomHeaders(s.customHeaders || []);
        setResponses(s.responses || []);
    }, []);

    // Save config on change
    useEffect(() => {
        saveState({ endpoint, apiKey, modelName, customHeaders, responses });
    }, [endpoint, apiKey, modelName, customHeaders, responses]);

    const payload = JSON.stringify({ config, results }, null, 2);

    const copyPayload = () => {
        navigator.clipboard.writeText(payload);
    };

    const addHeader = () => {
        setCustomHeaders([...customHeaders, { key: '', value: '' }]);
    };

    const removeHeader = (idx) => {
        setCustomHeaders(customHeaders.filter((_, i) => i !== idx));
    };

    const updateHeader = (idx, field, val) => {
        const updated = [...customHeaders];
        updated[idx] = { ...updated[idx], [field]: val };
        setCustomHeaders(updated);
    };

    const testConnection = async () => {
        if (!endpoint) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(endpoint, { method: 'HEAD', mode: 'no-cors' });
            setError(null);
            alert('Connection OK (no-cors mode — endpoint is reachable)');
        } catch (e) {
            setError('Could not reach endpoint: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const sendToEndpoint = async () => {
        if (!endpoint) { setError('No endpoint configured'); return; }
        setLoading(true);
        setError(null);

        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            customHeaders.forEach(h => {
                if (h.key && h.value) headers[h.key] = h.value;
            });

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: payload,
            });

            const text = await res.text();
            let body;
            try { body = JSON.parse(text); } catch { body = text; }

            const response = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                model: modelName || 'unknown',
                status: res.status,
                body: typeof body === 'object' ? JSON.stringify(body, null, 2) : body,
            };

            setResponses(prev => [response, ...prev].slice(0, 5));
        } catch (e) {
            setError('Request failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const clearResponses = () => {
        setResponses([]);
    };

    return (
        <div className="council-layout">
            <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 'var(--space-lg)' }}>
                <ArrowLeft size={16} /> Back to Calculator
            </button>

            {/* Endpoint Configuration */}
            <div className="council-section">
                <h2><Settings size={20} /> Endpoint Configuration</h2>
                <div className="card">
                    <div className="form-group">
                        <label className="form-label">API Endpoint URL</label>
                        <input className="form-input" type="url" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.example.com/v1/chat/completions" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">API Key</label>
                            <input className="form-input" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Model Name</label>
                            <input className="form-input" type="text" value={modelName} onChange={e => setModelName(e.target.value)} placeholder="gpt-4, claude-3, etc." />
                        </div>
                    </div>

                    {/* Custom Headers */}
                    <div className="form-group">
                        <label className="form-label">
                            Custom Headers
                            <button className="btn btn-ghost btn-sm" onClick={addHeader} style={{ marginLeft: 'auto' }}>
                                <Plus size={12} /> Add
                            </button>
                        </label>
                        {customHeaders.map((h, i) => (
                            <div className="header-pair" key={i}>
                                <input className="form-input" placeholder="Header name" value={h.key} onChange={e => updateHeader(i, 'key', e.target.value)} />
                                <input className="form-input" placeholder="Value" value={h.value} onChange={e => updateHeader(i, 'value', e.target.value)} />
                                <button className="btn btn-ghost btn-sm" onClick={() => removeHeader(i)}><Minus size={12} /></button>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                        <button className="btn btn-secondary" onClick={testConnection} disabled={loading || !endpoint}>
                            Test Connection
                        </button>
                    </div>

                    {error && <p style={{ color: 'var(--red)', fontSize: 'var(--fs-sm)', marginTop: 'var(--space-sm)' }}>{error}</p>}
                </div>
            </div>

            {/* Payload Preview */}
            <div className="council-section">
                <h2><Copy size={20} /> Payload Preview</h2>
                <div className="card">
                    <div className="json-preview">{payload}</div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                        <button className="btn btn-secondary" onClick={copyPayload}>
                            <Copy size={14} /> Copy to Clipboard
                        </button>
                        <button className="btn btn-primary" onClick={sendToEndpoint} disabled={loading || !endpoint}>
                            <Send size={14} /> {loading ? 'Sending...' : 'Send to Endpoint'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Responses */}
            <div className="council-section">
                <h2 style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Clock size={20} /> Response History ({responses.length})
                    </span>
                    {responses.length > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={clearResponses}>
                            <Trash2 size={12} /> Clear
                        </button>
                    )}
                </h2>

                {responses.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
                        No responses yet. Send a request to see results here.
                    </div>
                ) : (
                    responses.map(r => (
                        <div className="response-card" key={r.id}>
                            <div className="response-meta">
                                <span>Model: {r.model}</span>
                                <span>Status: {r.status}</span>
                                <span>{new Date(r.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="response-body">{r.body}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
