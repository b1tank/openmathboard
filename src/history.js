// OpenMathBoard — History (Undo/Redo)
import {
	getStrokes, setStrokes,
	getHistoryStack, setHistoryStack,
	getHistoryIndex, setHistoryIndex,
	setSelectedStrokes,
	getDomRefs
} from './state.js';
import { redrawCanvas } from './renderer.js';
import { scheduleSave } from './persistence.js';

export function saveToHistory() {
	const stack = getHistoryStack();
	const idx = getHistoryIndex();

	// Remove any redo states
	const trimmed = stack.slice(0, idx + 1);

	// Save current state
	trimmed.push({
		strokes: JSON.parse(JSON.stringify(getStrokes())),
	});

	setHistoryStack(trimmed);
	setHistoryIndex(trimmed.length - 1);
	updateHistoryButtons();
	scheduleSave();
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
	setStrokes(JSON.parse(JSON.stringify(state.strokes)));
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
