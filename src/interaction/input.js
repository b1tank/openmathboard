// OpenMathBoard — Keyboard shortcuts
// Pointer events are owned by input-manager.js.
// This module only handles keyboard shortcuts.

import {
	TOOLS,
	getSelectedStrokes, getIsSelecting,
	getClipboardStrokes
} from '../core/state.js';
import {
	clearSelection, deleteSelectedStrokes,
	copySelectedStrokes, pasteStrokes
} from './selection.js';
import { saveToHistory, undo, redo } from '../core/history.js';
import { setTool } from './tools.js';
import { saveImage } from '../ui/export.js';

export function setupKeyboardShortcuts() {
	document.addEventListener('keydown', (e) => {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

		if (e.key === 'Escape') {
			if (getSelectedStrokes().length > 0 || getIsSelecting()) {
				clearSelection();
				return;
			}
		}

		if (e.key === 'Delete' || e.key === 'Backspace') {
			if (getSelectedStrokes().length > 0) {
				e.preventDefault();
				deleteSelectedStrokes();
				return;
			}
		}

		if (e.ctrlKey && e.key === 'c') {
			if (getSelectedStrokes().length > 0) {
				e.preventDefault();
				copySelectedStrokes();
				return;
			}
		}

		if (e.ctrlKey && e.key === 'v') {
			if (getClipboardStrokes().length > 0) {
				e.preventDefault();
				pasteStrokes();
				return;
			}
		}

		if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			undo();
		}

		if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
			e.preventDefault();
			redo();
		}

		if (e.key === 'p' || e.key === 'P') setTool(TOOLS.PEN);
		if (e.key === 'e' || e.key === 'E') setTool(TOOLS.ERASER);
		if ((e.key === 's' || e.key === 'S') && !e.ctrlKey) setTool(TOOLS.SELECT);

		if (e.ctrlKey && e.key === 's') {
			e.preventDefault();
			saveImage();
		}
	});
}
