// OpenMathBoard — Pen Tool
// Owns the freehand drawing state machine.
// Renders the active stroke on the live canvas only.
// On completion, commits to the scene store and triggers scene redraw.

import {
	getCurrentColor, getCurrentStrokeWidth, getCurrentDash,
	getIsDrawing, setIsDrawing,
	getCurrentStroke, setCurrentStroke,
	getStrokes,
	getCamera,
	setSelectedStrokes,
	TOOLS
} from '../core/state.js';
import { redrawScene, redrawLive, redrawCanvas, drawStroke, invalidateCache } from '../canvas/renderer.js';
import { saveToHistory } from '../core/history.js';
import { hideHeroSection } from '../ui/hero.js';
import { showConversionPopup } from '../ui/conversion.js';
import { perfReset, perfSampleReceived, perfSampleCommitted, perfFrameStart, perfFrameEnd, perfLogSummary, perfCancel } from '../core/perf.js';
import { findStrokeAtPoint, updateSelectionCursor } from './selection.js';
import { setTool } from './tools.js';
import { updatePropertyPanel } from '../ui/property-panel.js';
import { findImportedImageAtPoint, selectImportedImage } from '../ui/images.js';

// ============ Render loop ============
let renderLoopActive = false;
let pendingTapSelection = null;
const TAP_MOVE_THRESHOLD = 6; // screen pixels

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
		perfFrameStart();
		redrawLive();
		perfFrameEnd();
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

// ============ Zoom-aware point spacing ============
function worldDistance(a, b) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

function getMinSpacing() {
	const camera = getCamera();
	return Math.max(1, 2 / camera.zoom);
}

// ============ Pen tool handlers ============

function strokePoint(pos) {
	// Normalized input also carries the native PointerEvent for routing. DOM
	// events are not cloneable and must never enter persisted/history geometry.
	return { x: pos.x, y: pos.y, pressure: pos.pressure };
}

function beginStroke(pos) {
	hideHeroSection();
	perfReset();
	setIsDrawing(true);
	setCurrentStroke({
		color: getCurrentColor(),
		width: getCurrentStrokeWidth(),
		dash: getCurrentDash(),
		points: [strokePoint(pos)]
	});
	startRenderLoop();
}

export function onPenPointerDown(pos) {
	const image = findImportedImageAtPoint(pos.screenX, pos.screenY);
	if (image) {
		pendingTapSelection = { image, startPos: pos };
		return;
	}
	const strokeIdx = findStrokeAtPoint(pos);
	if (strokeIdx !== -1) {
		// Wait briefly before deciding: a tap selects, while movement starts a
		// normal stroke from the original contact point.
		pendingTapSelection = { strokeIdx, startPos: pos };
		return;
	}
	beginStroke(pos);
}

export function onPenPointerMove(pos) {
	if (pendingTapSelection) {
		const { startPos } = pendingTapSelection;
		const zoom = getCamera().zoom;
		const movedPx = Math.hypot(pos.x - startPos.x, pos.y - startPos.y) * zoom;
		if (movedPx < TAP_MOVE_THRESHOLD) return;
		pendingTapSelection = null;
		beginStroke(startPos);
	}

	if (!getIsDrawing()) return;
	perfSampleReceived();

	const stroke = getCurrentStroke();
	if (!stroke) return;

	const lastPt = stroke.points[stroke.points.length - 1];
	const minSpacing = getMinSpacing();
	if (!lastPt || worldDistance(lastPt, pos) >= minSpacing) {
		stroke.points.push(strokePoint(pos));
		perfSampleCommitted();
	}
}

export function onPenPointerUp(pos) {
	if (pendingTapSelection) {
		const { strokeIdx, image } = pendingTapSelection;
		pendingTapSelection = null;
		if (image?.isConnected) {
			setTool(TOOLS.SELECT);
			selectImportedImage(image);
			updateSelectionCursor();
			redrawCanvas();
		} else if (getStrokes()[strokeIdx]) {
			setTool(TOOLS.SELECT);
			setSelectedStrokes([strokeIdx]);
			updateSelectionCursor();
			updatePropertyPanel();
			redrawCanvas();
		}
		return;
	}

	if (!getIsDrawing()) return;
	setIsDrawing(false);
	stopRenderLoop();

	const currentStroke = getCurrentStroke();
	if (currentStroke && currentStroke.points.length > 1) {
		// Capture the final lift-point
		if (pos) {
			const lastPt = currentStroke.points[currentStroke.points.length - 1];
			const minSpacing = getMinSpacing();
			if (!lastPt || worldDistance(lastPt, pos) >= minSpacing) {
				currentStroke.points.push(strokePoint(pos));
			}
		}

		// Commit stroke to scene
		getStrokes().push(currentStroke);
		invalidateCache();

		// Snapshot screen coords for conversion popup
		const lastPt = currentStroke.points[currentStroke.points.length - 1];
		const camera = getCamera();
		const screenX = (lastPt.x - camera.x) * camera.zoom;
		const screenY = (lastPt.y - camera.y) * camera.zoom +
			(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-height')) || 56);

		// Commit history before returning control to the user. Deferring this let
		// an immediate Undo run before the stroke snapshot existed, then the late
		// snapshot incorrectly destroyed the Redo branch.
		setCurrentStroke(null);
		saveToHistory();
		redrawScene();
		redrawLive();

		// Defer shape detection and diagnostics only.
		deferWork(() => {
			showConversionPopup(currentStroke, screenX, screenY);
			perfLogSummary();
		});
	} else {
		setCurrentStroke(null);
		redrawLive();
	}
}

export function onPenCancel() {
	if (pendingTapSelection) {
		pendingTapSelection = null;
		return;
	}
	if (!getIsDrawing()) return;
	setIsDrawing(false);
	stopRenderLoop();
	setCurrentStroke(null);
	redrawLive();
	perfCancel();
	perfLogSummary();
}
