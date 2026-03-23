// OpenMathBoard — Select Tool
// Owns selection rect, click-to-select, drag-move, and anchor editing.
// Delegates math to selection.js and anchors.js — only owns the pointer routing.

import {
	getStrokes,
	getSelectedStrokes, setSelectedStrokes,
	getSelectionRect, setSelectionRect,
	getIsSelecting, setIsSelecting,
	getIsDraggingSelection, setIsDraggingSelection,
	getDragStartPos, setDragStartPos,
	getIsDraggingAnchor, setIsDraggingAnchor,
	getDraggingAnchorInfo, setDraggingAnchorInfo,
	getCamera
} from '../core/state.js';
import { redrawCanvas, redrawLive, getStrokeBounds } from '../canvas/renderer.js';
import {
	findStrokeAtPoint, findStrokesInRect,
	moveSelectedStrokes, updateSelectionCursor
} from './selection.js';
import { saveToHistory } from '../core/history.js';
import { updatePropertyPanel } from '../ui/property-panel.js';
import { findAnchorAtPoint, onAnchorDrag } from '../canvas/anchors.js';

// ============ Render loop ============
let renderLoopActive = false;

function startRenderLoop() {
	if (renderLoopActive) return;
	renderLoopActive = true;
	renderLoopTick();
}

function stopRenderLoop() {
	renderLoopActive = false;
}

function renderLoopTick() {
	if (!renderLoopActive) return;
	requestAnimationFrame(() => {
		redrawLive();
		if (renderLoopActive) renderLoopTick();
	});
}

// ============ Deferred heavy work ============
function deferWork(fn) {
	if (typeof requestIdleCallback === 'function') {
		requestIdleCallback(() => fn(), { timeout: 100 });
	} else {
		setTimeout(fn, 0);
	}
}

// ============ Select tool handlers ============

export function onSelectPointerDown(pos) {
	const selected = getSelectedStrokes();
	const strokes = getStrokes();
	const camera = getCamera();

	// 1. Anchor hit
	if (selected.length > 0) {
		for (const idx of selected) {
			const stroke = strokes[idx];
			if (!stroke) continue;
			const anchor = findAnchorAtPoint(stroke, pos, camera);
			if (anchor) {
				setIsDraggingAnchor(true);
				const info = { strokeIdx: idx, anchorId: anchor.id };
				if (stroke.shape && stroke.shape.type === 'parabola' && anchor.id === 'vertex') {
					const s = stroke.shape;
					info.savedEndpointYLeft = s.a * (s.xMin - s.h) ** 2 + s.k;
					info.savedEndpointYRight = s.a * (s.xMax - s.h) ** 2 + s.k;
				}
				setDraggingAnchorInfo(info);
				setDragStartPos(pos);
				startRenderLoop();
				return;
			}
		}
	}

	// 2. Selection bounds hit → drag
	if (selected.length > 0) {
		const PADDING = 6;
		const insideBounds = selected.some(idx => {
			const stroke = strokes[idx];
			const bounds = getStrokeBounds(stroke);
			if (!bounds) return false;
			let testX = pos.x, testY = pos.y;
			const rotation = (stroke.shape && stroke.shape.rotation) || 0;
			if (rotation !== 0) {
				const cx = (bounds.minX + bounds.maxX) / 2;
				const cy = (bounds.minY + bounds.maxY) / 2;
				const cos = Math.cos(-rotation);
				const sin = Math.sin(-rotation);
				const dx = pos.x - cx, dy = pos.y - cy;
				testX = cx + dx * cos - dy * sin;
				testY = cy + dx * sin + dy * cos;
			}
			return testX >= bounds.minX - PADDING / camera.zoom &&
			       testX <= bounds.maxX + PADDING / camera.zoom &&
			       testY >= bounds.minY - PADDING / camera.zoom &&
			       testY <= bounds.maxY + PADDING / camera.zoom;
		});
		if (insideBounds) {
			setIsDraggingSelection(true);
			setDragStartPos(pos);
			startRenderLoop();
			return;
		}
	}

	// 3. Click on stroke → select
	const clickedStrokeIdx = findStrokeAtPoint(pos);
	if (clickedStrokeIdx !== -1) {
		setSelectedStrokes([clickedStrokeIdx]);
		setDragStartPos(pos);
		setIsDraggingSelection(true);
		updateSelectionCursor();
		updatePropertyPanel();
		redrawCanvas();
		return;
	}

	// 4. Start rectangle selection
	setSelectedStrokes([]);
	setIsSelecting(true);
	setSelectionRect({ x1: pos.screenX, y1: pos.screenY, x2: pos.screenX, y2: pos.screenY });
	updateSelectionCursor();
	updatePropertyPanel();
	startRenderLoop();
}

export function onSelectPointerMove(pos) {
	// Anchor drag
	if (getIsDraggingAnchor() && getDraggingAnchorInfo()) {
		const info = getDraggingAnchorInfo();
		const strokes = getStrokes();
		const stroke = strokes[info.strokeIdx];
		if (stroke) {
			onAnchorDrag(stroke, info.anchorId, pos, info);
		}
		return;
	}

	// Selection drag
	if (getIsDraggingSelection() && getDragStartPos()) {
		const start = getDragStartPos();
		const dx = pos.x - start.x;
		const dy = pos.y - start.y;
		moveSelectedStrokes(dx, dy);
		setDragStartPos(pos);
		return;
	}

	// Selection rect
	if (getIsSelecting() && getSelectionRect()) {
		const rect = getSelectionRect();
		setSelectionRect({ ...rect, x2: pos.screenX, y2: pos.screenY });
		return;
	}
}

export function onSelectPointerUp(pos) {
	if (getIsDraggingAnchor()) {
		setIsDraggingAnchor(false);
		setDraggingAnchorInfo(null);
		stopRenderLoop();
		deferWork(() => { saveToHistory(); redrawCanvas(); });
		updatePropertyPanel();
		return;
	}

	if (getIsDraggingSelection()) {
		setIsDraggingSelection(false);
		setDragStartPos(null);
		stopRenderLoop();
		if (getSelectedStrokes().length > 0) {
			deferWork(() => { saveToHistory(); redrawCanvas(); });
		}
		updatePropertyPanel();
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
		stopRenderLoop();
		redrawCanvas();
		return;
	}
}

export function onSelectCancel() {
	if (getIsDraggingAnchor()) {
		setIsDraggingAnchor(false);
		setDraggingAnchorInfo(null);
	}
	if (getIsDraggingSelection()) {
		setIsDraggingSelection(false);
		setDragStartPos(null);
	}
	if (getIsSelecting()) {
		setIsSelecting(false);
		setSelectionRect(null);
	}
	stopRenderLoop();
	redrawCanvas();
}
