// OpenMathBoard — Pen Tool
// Owns the freehand drawing state machine.
// Renders the active stroke on the live canvas only.
// On completion, commits to the scene store and triggers scene redraw.

import {
	getCurrentColor, getCurrentStrokeWidth, getCurrentDash,
	getIsDrawing, setIsDrawing,
	getCurrentStroke, setCurrentStroke,
	getStrokes,
	getCamera
} from '../core/state.js';
import { redrawScene, redrawLive, drawStroke, invalidateCache } from '../canvas/renderer.js';
import { saveToHistory } from '../core/history.js';
import { hideHeroSection } from '../ui/hero.js';
import { showConversionPopup } from '../ui/conversion.js';

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
		// Only redraw the live canvas — scene canvas stays cached
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

export function onPenPointerDown(pos) {
	hideHeroSection();

	setIsDrawing(true);
	setCurrentStroke({
		color: getCurrentColor(),
		width: getCurrentStrokeWidth(),
		dash: getCurrentDash(),
		points: [pos]
	});
	startRenderLoop();
}

export function onPenPointerMove(pos) {
	if (!getIsDrawing()) return;

	const stroke = getCurrentStroke();
	if (!stroke) return;

	const lastPt = stroke.points[stroke.points.length - 1];
	const minSpacing = getMinSpacing();
	if (!lastPt || worldDistance(lastPt, pos) >= minSpacing) {
		stroke.points.push(pos);
	}
}

export function onPenPointerUp(pos) {
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
				currentStroke.points.push(pos);
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

		// Clear in-progress stroke and redraw scene
		setCurrentStroke(null);
		redrawScene();
		redrawLive();

		// Defer heavy work
		deferWork(() => {
			saveToHistory();
			showConversionPopup(currentStroke, screenX, screenY);
		});
	} else {
		setCurrentStroke(null);
		redrawLive();
	}
}

export function onPenCancel() {
	if (!getIsDrawing()) return;
	setIsDrawing(false);
	stopRenderLoop();
	setCurrentStroke(null);
	redrawLive();
}
