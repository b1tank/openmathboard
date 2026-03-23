// OpenMathBoard — Eraser Tool
// Owns the eraser interaction: scribble to erase strokes under the pointer.

import {
	getIsDrawing, setIsDrawing,
	getStrokes, setStrokes
} from '../core/state.js';
import { redrawCanvas, isPointNearStroke } from '../canvas/renderer.js';
import { saveToHistory } from '../core/history.js';
import { hideHeroSection } from '../ui/hero.js';
import { redrawLive } from '../canvas/renderer.js';
import {
	pointToSegmentDistance, pointToPolylineDistance
} from './detection.js';

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
		redrawCanvas();
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

// ============ Erase logic ============

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

		if (stroke.shape) {
			return !isPointNearStroke(pos, stroke, eraseRadius);
		}

		return !stroke.points.some(point => {
			const dx = point.x - pos.x;
			const dy = point.y - pos.y;
			return Math.sqrt(dx * dx + dy * dy) < eraseRadius;
		});
	});

	if (remainingStrokes.length !== strokes.length) {
		setStrokes(remainingStrokes);
	}
}

// ============ Eraser tool handlers ============

export function onEraserPointerDown(pos) {
	hideHeroSection();
	eraseAtPoint(pos);
	setIsDrawing(true);
	startRenderLoop();
}

export function onEraserPointerMove(pos) {
	if (!getIsDrawing()) return;
	eraseAtPoint(pos);
}

export function onEraserPointerUp() {
	if (!getIsDrawing()) return;
	setIsDrawing(false);
	stopRenderLoop();
	redrawCanvas();
	deferWork(() => saveToHistory());
}

export function onEraserCancel() {
	if (!getIsDrawing()) return;
	setIsDrawing(false);
	stopRenderLoop();
	redrawCanvas();
}
