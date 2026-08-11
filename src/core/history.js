// OpenMathBoard — History (Undo/Redo)
import {
	getStrokes, setStrokes,
	getHistoryStack, setHistoryStack,
	getHistoryIndex, setHistoryIndex,
	setSelectedStrokes,
	getDomRefs
} from './state.js';
import { redrawCanvas } from '../canvas/renderer.js';
import { scheduleSave } from './persistence.js';

export function saveToHistory() {
	const stack = getHistoryStack();
	const idx = getHistoryIndex();

	// Remove any redo states
	const trimmed = stack.slice(0, idx + 1);

	// Ignore no-op commits. Duplicate snapshots made Undo appear broken because
	// the first undo restored geometry identical to what was already visible.
	// Geometry is JSON data. Explicitly strip any legacy/transient native event
	// references so one bad point cannot break every subsequent Undo snapshot.
	const snapshot = JSON.parse(JSON.stringify(getStrokes(), (key, value) =>
		key === 'rawEvent' ? undefined : value
	));
	const current = trimmed[trimmed.length - 1]?.strokes;
	if (current && JSON.stringify(current) === JSON.stringify(snapshot)) {
		updateHistoryButtons();
		return false;
	}

	trimmed.push({ strokes: snapshot });

	setHistoryStack(trimmed);
	setHistoryIndex(trimmed.length - 1);
	updateHistoryButtons();
	scheduleSave();
	return true;
}

export function undo() {
	if (getHistoryIndex() > 0) {
		setHistoryIndex(getHistoryIndex() - 1);
		restoreFromHistory();
	}
}

export function redo() {
	if (getHistoryIndex() < getHistoryStack().length - 1) {
		setHistoryIndex(getHistoryIndex() + 1);
		restoreFromHistory();
	}
}

function restoreFromHistory() {
	const state = getHistoryStack()[getHistoryIndex()];
	setStrokes(structuredClone(state.strokes));
	setSelectedStrokes([]);
	redrawCanvas();
	updateHistoryButtons();
}

export function updateHistoryButtons() {
	const refs = getDomRefs();
	const idx = getHistoryIndex();
	const len = getHistoryStack().length;

	if (refs.undoBtn) refs.undoBtn.disabled = idx <= 0;
	if (refs.redoBtn) refs.redoBtn.disabled = idx >= len - 1;
	if (refs.undoBtnMobile) refs.undoBtnMobile.disabled = idx <= 0;
	if (refs.redoBtnMobile) refs.redoBtnMobile.disabled = idx >= len - 1;
}
