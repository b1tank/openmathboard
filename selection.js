// OpenMathBoard — Selection logic
import {
	TOOLS,
	getStrokes, setStrokes,
	getSelectedStrokes, setSelectedStrokes,
	setSelectionRect, setIsSelecting, setIsDraggingSelection,
	setDragStartPos, getClipboardStrokes, setClipboardStrokes,
	getCurrentTool, getDomRefs
} from './state.js';
import { redrawCanvas, getStrokeBounds, isPointNearStroke } from './renderer.js';
import { saveToHistory } from './history.js';
import { t } from './lib/i18n.js';
import { showToast } from './toast.js';
import { updatePropertyPanel, hidePropertyPanel } from './property-panel.js';

export function clearSelection() {
	setSelectedStrokes([]);
	setSelectionRect(null);
	setIsSelecting(false);
	setIsDraggingSelection(false);
	setDragStartPos(null);
	updateSelectionCursor();
	hidePropertyPanel();
	redrawCanvas();
}

export function updateSelectionCursor() {
	const refs = getDomRefs();
	if (getCurrentTool() === TOOLS.SELECT) {
		if (refs.canvasContainer) {
			refs.canvasContainer.classList.toggle('has-selection', getSelectedStrokes().length > 0);
		}
	} else {
		if (refs.canvasContainer) {
			refs.canvasContainer.classList.remove('has-selection');
		}
	}
}

export function findStrokeAtPoint(pos) {
	const strokes = getStrokes();
	for (let i = strokes.length - 1; i >= 0; i--) {
		if (isPointNearStroke(pos, strokes[i])) {
			return i;
		}
	}
	return -1;
}

export function findStrokesInRect(rect) {
	const minX = Math.min(rect.x1, rect.x2);
	const maxX = Math.max(rect.x1, rect.x2);
	const minY = Math.min(rect.y1, rect.y2);
	const maxY = Math.max(rect.y1, rect.y2);

	const strokes = getStrokes();
	const result = [];
	for (let i = 0; i < strokes.length; i++) {
		const bounds = getStrokeBounds(strokes[i]);
		if (!bounds) continue;

		if (bounds.maxX >= minX && bounds.minX <= maxX &&
			bounds.maxY >= minY && bounds.minY <= maxY) {
			result.push(i);
		}
	}
	return result;
}

export function moveSelectedStrokes(dx, dy) {
	const strokes = getStrokes();
	const selected = getSelectedStrokes();
	for (const idx of selected) {
		const stroke = strokes[idx];
		if (!stroke) continue;

		if (stroke.shape) {
			if (stroke.shape.type === 'circle') {
				stroke.shape.cx += dx;
				stroke.shape.cy += dy;
			}
			if (stroke.shape.type === 'line') {
				stroke.shape.x1 += dx; stroke.shape.y1 += dy;
				stroke.shape.x2 += dx; stroke.shape.y2 += dy;
			}
			if (stroke.shape.type === 'parabola') {
				stroke.shape.origin += dx;
				stroke.shape.c += dy;
			}
		}

		if (stroke.points) {
			for (const pt of stroke.points) {
				pt.x += dx;
				pt.y += dy;
			}
		}
	}
}

export function deleteSelectedStrokes() {
	const selected = getSelectedStrokes();
	if (selected.length === 0) return;

	const strokes = getStrokes();
	const sorted = [...selected].sort((a, b) => b - a);
	for (const idx of sorted) {
		strokes.splice(idx, 1);
	}
	setSelectedStrokes([]);
	redrawCanvas();
	saveToHistory();
}

export function copySelectedStrokes() {
	const selected = getSelectedStrokes();
	if (selected.length === 0) return;

	const strokes = getStrokes();
	const copied = selected.map(idx => JSON.parse(JSON.stringify(strokes[idx])));
	setClipboardStrokes(copied);
	showToast(copied.length === 1 ? t('toastCopiedStroke') : t('toastCopiedStrokes', copied.length), 'success');
}

export function pasteStrokes() {
	const clipboard = getClipboardStrokes();
	if (clipboard.length === 0) return;

	const offset = 20;
	const strokes = getStrokes();

	const newStrokes = clipboard.map(stroke => {
		const copy = JSON.parse(JSON.stringify(stroke));

		if (copy.shape) {
			if (copy.shape.type === 'circle') {
				copy.shape.cx += offset;
				copy.shape.cy += offset;
			}
			if (copy.shape.type === 'line') {
				copy.shape.x1 += offset; copy.shape.y1 += offset;
				copy.shape.x2 += offset; copy.shape.y2 += offset;
			}
			if (copy.shape.type === 'parabola') {
				copy.shape.origin += offset;
				copy.shape.c += offset;
			}
		}

		if (copy.points) {
			for (const pt of copy.points) {
				pt.x += offset;
				pt.y += offset;
			}
		}

		return copy;
	});

	const startIdx = strokes.length;
	strokes.push(...newStrokes);
	setSelectedStrokes(newStrokes.map((_, i) => startIdx + i));

	updateSelectionCursor();
	redrawCanvas();
	saveToHistory();
	showToast(t('toastPasted'), 'success');
}
