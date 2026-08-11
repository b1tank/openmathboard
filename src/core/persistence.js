// OpenMathBoard — localStorage persistence (save/load objects + camera)
import { getStrokes, setStrokes, getCamera, updateCamera } from './state.js';

const STORAGE_KEY = 'openmathboard.canvas.v2';
const DEBOUNCE_MS = 2000;

let saveTimer = null;
let dirty = false;
let lifecycleSetup = false;

/**
 * Save current canvas state to localStorage (debounced)
 */
export function scheduleSave() {
	dirty = true;
	clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveTimer = null;
		saveState();
	}, DEBOUNCE_MS);
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
		dirty = false;
		return true;
	} catch {
		// Preserve dirty state so a later lifecycle flush can retry.
		return false;
	}
}

/** Flush a pending debounced write before Safari backgrounds or unloads. */
export function flushSave() {
	if (saveTimer !== null) {
		clearTimeout(saveTimer);
		saveTimer = null;
	}
	return dirty ? saveState() : true;
}

export function setupPersistenceLifecycle() {
	if (lifecycleSetup) return;
	lifecycleSetup = true;
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') flushSave();
	});
	window.addEventListener('pagehide', flushSave);
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
