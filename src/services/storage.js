/**
 * LocalStorage Service for Drone Calculator
 * Replaces the previous sql.js database layer.
 * Persists data to localStorage with keys: dronecalc_batteries, dronecalc_motors, etc.
 */

const KEYS = {
    batteries: 'dronecalc_batteries',
    motors: 'dronecalc_motors',
    propellers: 'dronecalc_propellers',
    escs: 'dronecalc_escs',
    version: 'dronecalc_storage_version'
};

const CURRENT_VERSION = 'v3'; // Bumped for Motor schema update

/** Check version and reset if needed */
const checkVersion = () => {
    const stored = localStorage.getItem(KEYS.version);
    if (stored !== CURRENT_VERSION) {
        console.warn(`Storage version mismatch (${stored} vs ${CURRENT_VERSION}). Resetting to defaults.`);
        localStorage.clear(); // Simple clear for now, or use resetStorage()
        localStorage.setItem(KEYS.version, CURRENT_VERSION);
    }
};

// Auto-run version check on first import/load
try { checkVersion(); } catch (e) { console.error('Storage version check failed', e); }

/* ═══════════════════════════════════════════
   SEED DATA (Migrated from seed.sql)
   Using snake_case keys to match existing UI component expectations.
   ═══════════════════════════════════════════ */

const DEFAULTS = {
    batteries: [
        { id: 1, name: '3S 1300mAh 95C', chemistry: 'LiPo', cells_s: 3, capacity_mah: 1300, c_rating: 95, burst_c: 190, weight_g: 155, internal_resistance_mohm: 3 },
        { id: 2, name: '4S 1300mAh 95C', chemistry: 'LiPo', cells_s: 4, capacity_mah: 1300, c_rating: 95, burst_c: 190, weight_g: 205, internal_resistance_mohm: 3 },
        { id: 3, name: '4S 1550mAh 100C', chemistry: 'LiPo', cells_s: 4, capacity_mah: 1550, c_rating: 100, burst_c: 200, weight_g: 220, internal_resistance_mohm: 2.5 },
        { id: 4, name: '4S 5000mAh 20C', chemistry: 'LiPo', cells_s: 4, capacity_mah: 5000, c_rating: 20, burst_c: 40, weight_g: 480, internal_resistance_mohm: 5 },
        { id: 5, name: '4S 5200mAh 50C', chemistry: 'LiPo', cells_s: 4, capacity_mah: 5200, c_rating: 50, burst_c: 100, weight_g: 580, internal_resistance_mohm: 3 },
        { id: 6, name: '6S 1100mAh 95C', chemistry: 'LiPo', cells_s: 6, capacity_mah: 1100, c_rating: 95, burst_c: 190, weight_g: 190, internal_resistance_mohm: 3 },
        { id: 7, name: '6S 1300mAh 95C', chemistry: 'LiPo', cells_s: 6, capacity_mah: 1300, c_rating: 95, burst_c: 190, weight_g: 235, internal_resistance_mohm: 3 },
        { id: 8, name: '6S 5000mAh 25C', chemistry: 'LiPo', cells_s: 6, capacity_mah: 5000, c_rating: 25, burst_c: 50, weight_g: 720, internal_resistance_mohm: 4 },
        { id: 9, name: '6S 10000mAh 25C', chemistry: 'LiPo', cells_s: 6, capacity_mah: 10000, c_rating: 25, burst_c: 50, weight_g: 1300, internal_resistance_mohm: 3 },
        { id: 10, name: '6S 16000mAh Li-ion', chemistry: 'Li-ion', cells_s: 6, capacity_mah: 16000, c_rating: 5, burst_c: 10, weight_g: 1400, internal_resistance_mohm: 15 }
    ],
    motors: [
        { id: 1, name: '2206 2300KV', brand: 'Generic', kv: 2300, resistance_ohm: 0.072, no_load_current_a: 0.8, max_current_a: 36, max_power_w: 580, weight_g: 32, poles: 14, stator_diameter_mm: 22, stator_height_mm: 6, min_cells: 3, max_cells: 4 },
        { id: 2, name: '2207 1750KV', brand: 'Generic', kv: 1750, resistance_ohm: 0.065, no_load_current_a: 0.6, max_current_a: 38, max_power_w: 620, weight_g: 34, poles: 14, stator_diameter_mm: 22, stator_height_mm: 7, min_cells: 4, max_cells: 6 },
        { id: 3, name: '2207 2550KV', brand: 'Generic', kv: 2550, resistance_ohm: 0.055, no_load_current_a: 1.0, max_current_a: 42, max_power_w: 720, weight_g: 36, poles: 14, stator_diameter_mm: 22, stator_height_mm: 7, min_cells: 3, max_cells: 4 },
        { id: 4, name: '2306 1700KV', brand: 'Generic', kv: 1700, resistance_ohm: 0.080, no_load_current_a: 0.5, max_current_a: 32, max_power_w: 500, weight_g: 31, poles: 14, stator_diameter_mm: 23, stator_height_mm: 6, min_cells: 4, max_cells: 6 },
        { id: 5, name: '2212 920KV', brand: 'Generic', kv: 920, resistance_ohm: 0.120, no_load_current_a: 0.4, max_current_a: 20, max_power_w: 280, weight_g: 56, poles: 14, stator_diameter_mm: 22, stator_height_mm: 12, min_cells: 2, max_cells: 4 },
        { id: 6, name: '2212 1000KV', brand: 'Generic', kv: 1000, resistance_ohm: 0.110, no_load_current_a: 0.5, max_current_a: 22, max_power_w: 300, weight_g: 55, poles: 14, stator_diameter_mm: 22, stator_height_mm: 12, min_cells: 2, max_cells: 4 },
        { id: 7, name: '2814 700KV', brand: 'Generic', kv: 700, resistance_ohm: 0.085, no_load_current_a: 0.3, max_current_a: 25, max_power_w: 420, weight_g: 98, poles: 14, stator_diameter_mm: 28, stator_height_mm: 14, min_cells: 3, max_cells: 6 },
        { id: 8, name: '3508 380KV', brand: 'Generic', kv: 380, resistance_ohm: 0.155, no_load_current_a: 0.3, max_current_a: 18, max_power_w: 350, weight_g: 135, poles: 14, stator_diameter_mm: 35, stator_height_mm: 8, min_cells: 3, max_cells: 6 },
        { id: 9, name: '3510 700KV', brand: 'Generic', kv: 700, resistance_ohm: 0.070, no_load_current_a: 0.4, max_current_a: 30, max_power_w: 550, weight_g: 128, poles: 14, stator_diameter_mm: 35, stator_height_mm: 10, min_cells: 4, max_cells: 8 },
        { id: 10, name: '4006 380KV', brand: 'Generic', kv: 380, resistance_ohm: 0.200, no_load_current_a: 0.2, max_current_a: 15, max_power_w: 280, weight_g: 120, poles: 22, stator_diameter_mm: 40, stator_height_mm: 6, min_cells: 4, max_cells: 8 },
        { id: 11, name: '4010 370KV', brand: 'Generic', kv: 370, resistance_ohm: 0.130, no_load_current_a: 0.3, max_current_a: 20, max_power_w: 400, weight_g: 178, poles: 14, stator_diameter_mm: 40, stator_height_mm: 10, min_cells: 4, max_cells: 8 },
        { id: 12, name: '5008 340KV', brand: 'Generic', kv: 340, resistance_ohm: 0.120, no_load_current_a: 0.3, max_current_a: 22, max_power_w: 450, weight_g: 230, poles: 18, stator_diameter_mm: 50, stator_height_mm: 8, min_cells: 6, max_cells: 12 },
        { id: 13, name: '2204 2300KV', brand: 'Generic', kv: 2300, resistance_ohm: 0.095, no_load_current_a: 0.7, max_current_a: 28, max_power_w: 380, weight_g: 25, poles: 14, stator_diameter_mm: 22, stator_height_mm: 4, min_cells: 2, max_cells: 4 },
        { id: 14, name: '1806 2300KV', brand: 'Generic', kv: 2300, resistance_ohm: 0.120, no_load_current_a: 0.6, max_current_a: 20, max_power_w: 250, weight_g: 20, poles: 14, stator_diameter_mm: 18, stator_height_mm: 6, min_cells: 2, max_cells: 3 },
        { id: 15, name: 'U8 Lite 100KV', brand: 'Generic', kv: 100, resistance_ohm: 0.320, no_load_current_a: 0.2, max_current_a: 40, max_power_w: 2400, weight_g: 450, poles: 36, stator_diameter_mm: 85, stator_height_mm: 15, min_cells: 6, max_cells: 12 }
    ],
    propellers: [
        { id: 1, name: '5030', diameter_in: 5.0, pitch_in: 3.0, blades: 2, weight_g: 4, ct: 0.11, cp: 0.045 },
        { id: 2, name: '5040', diameter_in: 5.0, pitch_in: 4.0, blades: 2, weight_g: 5, ct: 0.12, cp: 0.055 },
        { id: 3, name: '5045 Tri', diameter_in: 5.0, pitch_in: 4.5, blades: 3, weight_g: 7, ct: 0.14, cp: 0.070 },
        { id: 4, name: '5050', diameter_in: 5.0, pitch_in: 5.0, blades: 2, weight_g: 5, ct: 0.13, cp: 0.065 },
        { id: 5, name: '6030', diameter_in: 6.0, pitch_in: 3.0, blades: 2, weight_g: 7, ct: 0.10, cp: 0.040 },
        { id: 6, name: '6045', diameter_in: 6.0, pitch_in: 4.5, blades: 2, weight_g: 9, ct: 0.12, cp: 0.055 },
        { id: 7, name: '7035', diameter_in: 7.0, pitch_in: 3.5, blades: 2, weight_g: 10, ct: 0.11, cp: 0.045 },
        { id: 8, name: '8045', diameter_in: 8.0, pitch_in: 4.5, blades: 2, weight_g: 12, ct: 0.11, cp: 0.050 },
        { id: 9, name: '9450', diameter_in: 9.4, pitch_in: 5.0, blades: 2, weight_g: 14, ct: 0.11, cp: 0.048 },
        { id: 10, name: '1045', diameter_in: 10.0, pitch_in: 4.5, blades: 2, weight_g: 16, ct: 0.11, cp: 0.047 },
        { id: 11, name: '1047', diameter_in: 10.0, pitch_in: 4.7, blades: 2, weight_g: 17, ct: 0.12, cp: 0.050 },
        { id: 12, name: '1147', diameter_in: 11.0, pitch_in: 4.7, blades: 2, weight_g: 19, ct: 0.11, cp: 0.046 },
        { id: 13, name: '1238', diameter_in: 12.0, pitch_in: 3.8, blades: 2, weight_g: 20, ct: 0.10, cp: 0.040 },
        { id: 14, name: '1345', diameter_in: 13.0, pitch_in: 4.5, blades: 2, weight_g: 22, ct: 0.11, cp: 0.044 },
        { id: 15, name: '1555', diameter_in: 15.0, pitch_in: 5.5, blades: 2, weight_g: 30, ct: 0.11, cp: 0.046 },
        { id: 16, name: '28x9.2', diameter_in: 28.0, pitch_in: 9.2, blades: 2, weight_g: 90, ct: 0.10, cp: 0.042 }
    ],
    escs: [
        { id: 1, name: '20A BLHeli_S', continuous_a: 20, burst_a: 25, resistance_mohm: 2.5, weight_g: 5, bec_voltage: 5, bec_current: 1, min_cells: 2, max_cells: 4 },
        { id: 2, name: '30A BLHeli_S', continuous_a: 30, burst_a: 40, resistance_mohm: 1.5, weight_g: 7, bec_voltage: 5, bec_current: 1.5, min_cells: 2, max_cells: 4 },
        { id: 3, name: '35A BLHeli_32', continuous_a: 35, burst_a: 45, resistance_mohm: 1.2, weight_g: 8, bec_voltage: 5, bec_current: 1.5, min_cells: 3, max_cells: 6 },
        { id: 4, name: '45A BLHeli_32', continuous_a: 45, burst_a: 55, resistance_mohm: 1.0, weight_g: 10, bec_voltage: 5, bec_current: 2, min_cells: 3, max_cells: 6 },
        { id: 5, name: '50A ESC', continuous_a: 50, burst_a: 65, resistance_mohm: 0.8, weight_g: 12, bec_voltage: 5, bec_current: 2, min_cells: 3, max_cells: 6 },
        { id: 6, name: '60A ESC', continuous_a: 60, burst_a: 80, resistance_mohm: 0.7, weight_g: 18, bec_voltage: 5, bec_current: 3, min_cells: 3, max_cells: 8 },
        { id: 7, name: '80A ESC', continuous_a: 80, burst_a: 100, resistance_mohm: 0.5, weight_g: 30, bec_voltage: 5, bec_current: 3, min_cells: 3, max_cells: 8 },
        { id: 8, name: '4-in-1 45A', continuous_a: 45, burst_a: 55, resistance_mohm: 1.0, weight_g: 32, bec_voltage: 5, bec_current: 2, min_cells: 3, max_cells: 6 }
    ]
};

/* ═══════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════ */

/** Get key for collection */
const getKey = (collection) => {
    const key = KEYS[collection];
    if (!key) throw new Error(`Invalid collection: ${collection}`);
    return key;
};

/** Load data from localStorage or seed defaults */
const loadData = (collection) => {
    const key = getKey(collection);
    const json = localStorage.getItem(key);
    if (!json) {
        // Seed defaults if empty
        const defaults = DEFAULTS[collection] || [];
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
    }
    try {
        return JSON.parse(json);
    } catch (e) {
        console.error(`Failed to parse ${collection} from localStorage`, e);
        return [];
    }
};

/** Save data to localStorage */
const saveData = (collection, data) => {
    const key = getKey(collection);
    localStorage.setItem(key, JSON.stringify(data));
};

/* ═══════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════ */

/** Get all items in a collection */
export function getAll(collection) {
    return loadData(collection);
}

/** Get item by ID */
export function getById(collection, id) {
    const items = loadData(collection);
    return items.find(i => i.id === Number(id)) || null;
}

/** Add new item (auto-generates integer ID) */
export function addComponent(collection, item) {
    const items = loadData(collection);
    const maxId = items.reduce((max, i) => Math.max(max, i.id || 0), 0);
    const newItem = { ...item, id: maxId + 1 };
    items.push(newItem);
    saveData(collection, items);
    return newItem.id;
}

/** Update existing item by ID */
export function updateComponent(collection, id, updates) {
    const items = loadData(collection);
    const index = items.findIndex(i => i.id === Number(id));
    if (index === -1) return false;

    // Merge updates, but preserve ID
    items[index] = { ...items[index], ...updates, id: Number(id) };
    saveData(collection, items);
    return true;
}

/** Delete item by ID */
export function deleteComponent(collection, id) {
    let items = loadData(collection);
    const initialLen = items.length;
    items = items.filter(i => i.id !== Number(id));

    if (items.length !== initialLen) {
        saveData(collection, items);
        return true;
    }
    return false;
}

/** Reset a collection (or all) to defaults */
export function resetStorage(collection = null) {
    if (collection) {
        localStorage.removeItem(getKey(collection));
    } else {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    }
}
