/**
 * Drone Performance Calculator — Helpers
 * Formatting, validation, and unit conversion utilities.
 */

/**
 * Format a number to fixed decimal places.
 */
export function fmt(value, decimals = 1) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    return Number(value).toFixed(decimals);
}

/**
 * Format a number with comma separators.
 */
export function fmtInt(value) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    return Math.round(value).toLocaleString();
}

/**
 * Format time in minutes to "Xm Ys" or "X min".
 */
export function fmtTime(minutes) {
    if (!isFinite(minutes) || minutes <= 0) return '—';
    if (minutes >= 60) {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return `${h}h ${m}m`;
    }
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

/**
 * Get status level based on value and thresholds.
 * @returns {'safe' | 'caution' | 'danger'}
 */
export function getStatus(value, cautionThreshold, dangerThreshold, invertDirection = false) {
    if (invertDirection) {
        // Lower is worse (e.g., TWR — lower is bad)
        if (value < dangerThreshold) return 'danger';
        if (value < cautionThreshold) return 'caution';
        return 'safe';
    } else {
        // Higher is worse (e.g., temperature, current)
        if (value > dangerThreshold) return 'danger';
        if (value > cautionThreshold) return 'caution';
        return 'safe';
    }
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Convert inches to meters.
 */
export function inToM(inches) {
    return inches * 0.0254;
}

/**
 * Convert grams to kilograms.
 */
export function gToKg(grams) {
    return grams / 1000;
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Generate a unique ID.
 */
export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Validate a numeric input value.
 */
export function validateNumber(value, min = -Infinity, max = Infinity) {
    const num = Number(value);
    if (isNaN(num)) return { valid: false, error: 'Must be a number' };
    if (num < min) return { valid: false, error: `Min: ${min}` };
    if (num > max) return { valid: false, error: `Max: ${max}` };
    return { valid: true, error: null };
}

/**
 * Deep clone an object (simple JSON-safe objects only).
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Download a string as a file.
 */
export function downloadFile(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Read a file upload and return its text content.
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}
