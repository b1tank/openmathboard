// OpenMathBoard — Input handling (pointer/touch/keyboard events)
import {
	TOOLS, getCurrentTool, getCurrentColor, getCurrentStrokeWidth, getCurrentDash,
	getIsDrawing, setIsDrawing,
	getCurrentStroke, setCurrentStroke,
	getStrokes, setStrokes,
	getSelectedStrokes, setSelectedStrokes,
	getSelectionRect, setSelectionRect,
	getIsSelecting, setIsSelecting,
	getIsDraggingSelection, setIsDraggingSelection,
	getDragStartPos, setDragStartPos,
	getClipboardStrokes,
	getCanvas, getCamera
} from './state.js';
import { redrawCanvas, drawStroke, isPointNearStroke } from './renderer.js';
import {
	findStrokeAtPoint, findStrokesInRect,
	moveSelectedStrokes, clearSelection, updateSelectionCursor,
	deleteSelectedStrokes, copySelectedStrokes, pasteStrokes
} from './selection.js';
import { saveToHistory, undo, redo } from './history.js';
import { setTool } from './tools.js';
import {
	pointToSegmentDistance, pointToPolylineDistance
} from './detection.js';
import { t } from './lib/i18n.js';
import { showToast } from './toast.js';
import { saveImage } from './export.js';
import { hideHeroSection } from './hero.js';
import { isSpacebarPanning } from './camera.js';
import { updatePropertyPanel } from './property-panel.js';
import { showConversionPopup } from './conversion.js';

// ============ Canvas event setup ============

export function setupCanvasListeners() {
	const canvas = getCanvas();
	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerup', onPointerUp);
	canvas.addEventListener('pointerleave', onPointerUp);
}

function getPointerPos(e) {
	const canvas = getCanvas();
	const rect = canvas.getBoundingClientRect();
	const camera = getCamera();
	const sx = e.clientX - rect.left;
	const sy = e.clientY - rect.top;
	return {
		x: sx / camera.zoom + camera.x,
		y: sy / camera.zoom + camera.y,
		screenX: sx,
		screenY: sy,
		pressure: e.pressure || 0.5
	};
}

function onPointerDown(e) {
	e.preventDefault();

	// Don't start drawing when spacebar-panning
	if (isSpacebarPanning()) return;

	const canvas = getCanvas();
	canvas.setPointerCapture(e.pointerId);

	// Pencil/finger detection: pen draws, touch pans
	const isPencil = e.pointerType === 'pen';
	const isFinger = e.pointerType === 'touch';
	const isMouse = e.pointerType === 'mouse';

	// Finger always pans (handled by pinch zoom in camera.js)
	if (isFinger && getCurrentTool() !== TOOLS.SELECT) {
		return; // Let camera.js handle touch pan/zoom
	}

	const pos = getPointerPos(e);

	if (getCurrentTool() === TOOLS.SELECT) {
		const selected = getSelectedStrokes();
		const strokes = getStrokes();

		if (selected.length > 0) {
			const clickedOnSelected = selected.some(idx => isPointNearStroke(pos, strokes[idx]));
			if (clickedOnSelected) {
				setIsDraggingSelection(true);
				setDragStartPos(pos);
				return;
			}
		}

		const clickedStrokeIdx = findStrokeAtPoint(pos);
		if (clickedStrokeIdx !== -1) {
			setSelectedStrokes([clickedStrokeIdx]);
			setDragStartPos(pos);
			setIsDraggingSelection(true);
			updateSelectionCursor();
			redrawCanvas();
			return;
		}

		setSelectedStrokes([]);
		setIsSelecting(true);
		setSelectionRect({ x1: pos.screenX, y1: pos.screenY, x2: pos.screenX, y2: pos.screenY });
		updateSelectionCursor();
		redrawCanvas();
		return;
	}

	hideHeroSection();

	if (getCurrentTool() === TOOLS.ERASER) {
		eraseAtPoint(pos);
		setIsDrawing(true);
	} else if (getCurrentTool() === TOOLS.PEN) {
		setIsDrawing(true);
		setCurrentStroke({
			color: getCurrentColor(),
			width: getCurrentStrokeWidth(),
			dash: getCurrentDash(),
			points: [pos]
		});
	}
}

function onPointerMove(e) {
	const pos = getPointerPos(e);

	if (getCurrentTool() === TOOLS.SELECT) {
		if (getIsDraggingSelection() && getDragStartPos()) {
			const start = getDragStartPos();
			const dx = pos.x - start.x;
			const dy = pos.y - start.y;
			moveSelectedStrokes(dx, dy);
			setDragStartPos(pos);
			redrawCanvas();
			return;
		}

		if (getIsSelecting() && getSelectionRect()) {
			const rect = getSelectionRect();
			setSelectionRect({ ...rect, x2: pos.screenX, y2: pos.screenY });
			redrawCanvas();
			return;
		}
		return;
	}

	if (!getIsDrawing()) return;

	if (getCurrentTool() === TOOLS.ERASER) {
		eraseAtPoint(pos);
	} else if (getCurrentTool() === TOOLS.PEN && getCurrentStroke()) {
		const stroke = getCurrentStroke();
		stroke.points.push(pos);

		redrawCanvas();
		const ctx = getCanvas().getContext('2d');
		const camera = getCamera();
		ctx.save();
		ctx.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
		ctx.scale(camera.zoom, camera.zoom);
		drawStroke(ctx, stroke, camera);
		ctx.restore();
	}
}

function onPointerUp() {
	if (getCurrentTool() === TOOLS.SELECT) {
		if (getIsDraggingSelection()) {
			setIsDraggingSelection(false);
			setDragStartPos(null);
			if (getSelectedStrokes().length > 0) {
				saveToHistory();
			}
			return;
		}

		if (getIsSelecting() && getSelectionRect()) {
			const rect = getSelectionRect();
			const camera = getCamera();
			const worldRect = {
				x1: rect.x1 / camera.zoom + camera.x,
				y1: rect.y1 / camera.zoom + camera.y,
				x2: rect.x2 / camera.zoom + camera.x,
				y2: rect.y2 / camera.zoom + camera.y
			};
			setSelectedStrokes(findStrokesInRect(worldRect));
			setIsSelecting(false);
			setSelectionRect(null);
			updateSelectionCursor();
			updatePropertyPanel();
			redrawCanvas();
			return;
		}
		return;
	}

	if (!getIsDrawing()) return;
	setIsDrawing(false);

	const currentStroke = getCurrentStroke();
	if (getCurrentTool() === TOOLS.PEN && currentStroke && currentStroke.points.length > 1) {
		getStrokes().push(currentStroke);
		saveToHistory();

		// Show conversion popup if shapes detected
		const lastPt = currentStroke.points[currentStroke.points.length - 1];
		const camera = getCamera();
		const screenX = (lastPt.x - camera.x) * camera.zoom;
		const screenY = (lastPt.y - camera.y) * camera.zoom + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-height')) || 56);
		showConversionPopup(currentStroke, screenX, screenY);
	}

	setCurrentStroke(null);
	redrawCanvas();
}

function eraseAtPoint(pos) {
	const eraseRadius = 20;
	const strokes = getStrokes();

	const remainingStrokes = strokes.filter(stroke => {
		if (!stroke) return true;

		if (stroke.shape && stroke.shape.type === 'circle') {
			const dx = pos.x - stroke.shape.cx;
			const dy = pos.y - stroke.shape.cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const band = eraseRadius + (stroke.width / 2) + 2;
			return Math.abs(dist - stroke.shape.r) > band;
		}

		if (stroke.shape && stroke.shape.type === 'line') {
			const band = eraseRadius + (stroke.width / 2) + 2;
			return pointToSegmentDistance(pos,
				{ x: stroke.shape.x1, y: stroke.shape.y1 },
				{ x: stroke.shape.x2, y: stroke.shape.y2 }
			) > band;
		}

		if (stroke.shape && stroke.shape.type === 'parabola') {
			const band = eraseRadius + (stroke.width / 2) + 2;
			return pointToPolylineDistance(pos, stroke.points) > band;
		}

		return !stroke.points.some(point => {
			const dx = point.x - pos.x;
			const dy = point.y - pos.y;
			return Math.sqrt(dx * dx + dy * dy) < eraseRadius;
		});
	});

	if (remainingStrokes.length !== strokes.length) {
		setStrokes(remainingStrokes);
		redrawCanvas();
	}
}

// ============ Keyboard shortcuts ============

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
