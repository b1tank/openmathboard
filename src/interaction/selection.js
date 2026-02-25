// OpenMathBoard — Selection logic
import {
	TOOLS,
	getStrokes, setStrokes,
	getSelectedStrokes, setSelectedStrokes,
	setSelectionRect, setIsSelecting, setIsDraggingSelection,
	setDragStartPos, getClipboardStrokes, setClipboardStrokes,
	getCurrentTool, getDomRefs
} from '../core/state.js';
import { redrawCanvas, getStrokeBounds, isPointNearStroke } from '../canvas/renderer.js';
import { saveToHistory } from '../core/history.js';
import { t } from '../i18n/i18n.js';
import { showToast } from '../ui/toast.js';
import { updatePropertyPanel, hidePropertyPanel } from '../ui/property-panel.js';

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

		// Move shape-specific params
		if (stroke.shape) {
			const s = stroke.shape;
			switch (s.type) {
				case 'circle':
					s.cx += dx; s.cy += dy;
					break;
				case 'ellipse':
					s.cx += dx; s.cy += dy;
					break;
				case 'line':
				case 'arrow':
					s.x1 += dx; s.y1 += dy;
					s.x2 += dx; s.y2 += dy;
					break;
				case 'parabola':
					s.h += dx; s.k += dy;
					s.xMin += dx; s.xMax += dx;
					// Legacy fields
					if (s.origin !== undefined) s.origin += dx;
					if (s.c !== undefined) s.c += dy;
					break;
				case 'hyperbola':
					s.h += dx; s.k += dy;
					s.xMin += dx; s.xMax += dx;
					break;
				case 'sine':
				case 'cosine':
					s.C += dx; s.D += dy;
					s.xMin += dx; s.xMax += dx;
					break;
				case 'axes':
					s.ox += dx; s.oy += dy;
					break;
				case 'square':
					s.cx += dx; s.cy += dy;
					break;
				case 'rectangle':
					s.cx += dx; s.cy += dy;
					break;
				case 'triangle':
					s.x1 += dx; s.y1 += dy;
					s.x2 += dx; s.y2 += dy;
					s.x3 += dx; s.y3 += dy;
					break;

			}
		}

		// Move all points
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
			const s = copy.shape;
			switch (s.type) {
				case 'circle': s.cx += offset; s.cy += offset; break;
				case 'ellipse': s.cx += offset; s.cy += offset; break;
				case 'line': case 'arrow':
					s.x1 += offset; s.y1 += offset; s.x2 += offset; s.y2 += offset; break;
				case 'parabola':
					s.h += offset; s.k += offset; s.xMin += offset; s.xMax += offset;
					if (s.origin !== undefined) s.origin += offset;
					if (s.c !== undefined) s.c += offset;
					break;
				case 'hyperbola':
					s.h += offset; s.k += offset; s.xMin += offset; s.xMax += offset;
					break;
				case 'sine': case 'cosine':
					s.C += offset; s.D += offset; s.xMin += offset; s.xMax += offset; break;
				case 'axes': s.ox += offset; s.oy += offset; break;
				case 'square': s.cx += offset; s.cy += offset; break;
				case 'rectangle': s.cx += offset; s.cy += offset; break;
				case 'triangle':
					s.x1 += offset; s.y1 += offset;
					s.x2 += offset; s.y2 += offset;
					s.x3 += offset; s.y3 += offset;
					break;
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
