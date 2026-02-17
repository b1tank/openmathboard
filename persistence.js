// OpenMathBoard — localStorage persistence (save/load objects + camera)
import { getStrokes, setStrokes, getCamera, updateCamera } from './state.js';

const STORAGE_KEY = 'openmathboard.canvas.v2';
const DEBOUNCE_MS = 2000;

let saveTimer = null;

/**
 * Save current canvas state to localStorage (debounced)
 */
export function scheduleSave() {
	clearTimeout(saveTimer);
	saveTimer = setTimeout(saveState, DEBOUNCE_MS);
}

function saveState() {
	try {
		const data = {
			strokes: getStrokes(),
			camera: getCamera(),
			version: 2,
			savedAt: Date.now()
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// Ignore quota errors
	}
}

/**
 * Load canvas state from localStorage (called once on init)
 */
export function loadState() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return false;

		const data = JSON.parse(raw);
		if (!data || data.version !== 2) return false;

		if (Array.isArray(data.strokes) && data.strokes.length > 0) {
			setStrokes(data.strokes);
		}

		if (data.camera) {
			updateCamera(data.camera);
		}

		return true;
	} catch {
		return false;
	}
}

/**
 * Clear saved state
 */
export function clearSavedState() {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}
