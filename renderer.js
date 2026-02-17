// OpenMathBoard — Canvas renderer with shape registry
import {
	getStrokes, getSelectedStrokes, getIsSelecting, getSelectionRect,
	getCanvasRect, getCtx, getCamera
} from './state.js';
import { renderFreehand } from './shapes/freehand.js';
import { renderLine } from './shapes/line.js';
import { renderCircle } from './shapes/circle.js';
import { renderEllipse } from './shapes/ellipse.js';
import { renderParabola } from './shapes/parabola.js';
import { renderSine } from './shapes/sine.js';
import { renderArrow } from './shapes/arrow.js';
import { renderAxes } from './shapes/axes.js';
import { renderAnchors } from './anchors.js';
import { pointToSegmentDistance, pointToPolylineDistance, getBounds } from './detection.js';
import { renderGridOverlay } from './grid.js';

// Shape renderer registry
const RENDERERS = {
	line: renderLine,
	circle: renderCircle,
	ellipse: renderEllipse,
	parabola: renderParabola,
	sine: renderSine,
	cosine: renderSine, // Same renderer handles both
	arrow: renderArrow,
	axes: renderAxes,
};

// Dirty flag for performance
let dirty = true;

export function markDirty() { dirty = true; }

// ============ Main render ============

export function redrawCanvas() {
	const ctx = getCtx();
	const rect = getCanvasRect();
	if (!ctx || !rect) return;

	ctx.clearRect(0, 0, rect.width, rect.height);

	const camera = getCamera();
	const strokes = getStrokes();

	ctx.save();
	ctx.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
	ctx.scale(camera.zoom, camera.zoom);

	// Grid overlay (behind strokes)
	renderGridOverlay(ctx, camera, rect);

	// Draw all strokes
	for (let i = 0; i < strokes.length; i++) {
		drawStroke(ctx, strokes[i], camera);
	}

	ctx.restore();

	// Draw selection highlights + anchors (in screen space)
	const selected = getSelectedStrokes();
	if (selected.length > 0) {
		drawSelectionHighlights(ctx, strokes, selected, camera);
		// Draw anchors for selected shapes
		for (const idx of selected) {
			const stroke = strokes[idx];
			if (stroke && stroke.shape) {
				renderAnchors(ctx, stroke, camera);
			}
		}
	}

	// Draw selection rectangle while dragging
	if (getIsSelecting() && getSelectionRect()) {
		drawSelectionRect(ctx, getSelectionRect());
	}
}

// ============ Stroke drawing ============

export function drawStroke(ctx, stroke, camera) {
	if (!stroke) return;

	ctx.strokeStyle = stroke.color || '#000000';
	ctx.lineWidth = stroke.width || 4;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.setLineDash(stroke.dash ? [8, 6] : []);

	// Use shape registry for typed shapes
	if (stroke.shape && RENDERERS[stroke.shape.type]) {
		RENDERERS[stroke.shape.type](ctx, stroke);
		ctx.setLineDash([]);
		return;
	}

	// Freehand fallback
	if (stroke.points && stroke.points.length >= 2) {
		renderFreehand(ctx, stroke);
	}
}

// ============ Selection rendering ============

function drawSelectionRect(ctx, selectionRect) {
	if (!selectionRect) return;
	const x = Math.min(selectionRect.x1, selectionRect.x2);
	const y = Math.min(selectionRect.y1, selectionRect.y2);
	const w = Math.abs(selectionRect.x2 - selectionRect.x1);
	const h = Math.abs(selectionRect.y2 - selectionRect.y1);

	ctx.save();
	ctx.strokeStyle = '#2563eb';
	ctx.lineWidth = 1;
	ctx.setLineDash([5, 5]);
	ctx.strokeRect(x, y, w, h);
	ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
	ctx.fillRect(x, y, w, h);
	ctx.restore();
}

function drawSelectionHighlights(ctx, strokes, selectedStrokes, camera) {
	for (const idx of selectedStrokes) {
		const stroke = strokes[idx];
		if (!stroke) continue;
		const bounds = getStrokeBounds(stroke);
		if (!bounds) continue;

		const sx = (bounds.minX - camera.x) * camera.zoom;
		const sy = (bounds.minY - camera.y) * camera.zoom;
		const sw = (bounds.maxX - bounds.minX) * camera.zoom;
		const sh = (bounds.maxY - bounds.minY) * camera.zoom;
		const padding = 6;

		ctx.save();
		ctx.strokeStyle = '#2563eb';
		ctx.lineWidth = 2;
		ctx.setLineDash([4, 4]);
		ctx.strokeRect(sx - padding, sy - padding, sw + padding * 2, sh + padding * 2);
		ctx.restore();
	}
}

// ============ Bounds ============

export function getStrokeBounds(stroke) {
	if (!stroke) return null;

	if (stroke.shape) {
		const s = stroke.shape;
		switch (s.type) {
			case 'circle':
				return { minX: s.cx - s.r, minY: s.cy - s.r, maxX: s.cx + s.r, maxY: s.cy + s.r };
			case 'ellipse':
				return { minX: s.cx - s.rx, minY: s.cy - s.ry, maxX: s.cx + s.rx, maxY: s.cy + s.ry };
			case 'line':
			case 'arrow':
				return {
					minX: Math.min(s.x1, s.x2), minY: Math.min(s.y1, s.y2),
					maxX: Math.max(s.x1, s.x2), maxY: Math.max(s.y1, s.y2)
				};
			case 'axes':
				return {
					minX: s.ox - s.xLen, minY: s.oy - s.yLen,
					maxX: s.ox + s.xLen, maxY: s.oy + s.yLen
				};
		}
	}

	if (!stroke.points || stroke.points.length === 0) return null;
	return getBounds(stroke.points);
}

// ============ Hit testing ============

export function isPointNearStroke(pos, stroke, threshold = 15) {
	if (!stroke) return false;

	if (stroke.shape) {
		const s = stroke.shape;
		const half = threshold + stroke.width / 2;
		switch (s.type) {
			case 'circle': {
				const dist = Math.hypot(pos.x - s.cx, pos.y - s.cy);
				return Math.abs(dist - s.r) < half;
			}
			case 'line':
			case 'arrow':
				return pointToSegmentDistance(pos, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }) < half;
			case 'ellipse': {
				const dx = pos.x - s.cx, dy = pos.y - s.cy;
				const norm = Math.sqrt((dx * dx) / (s.rx * s.rx) + (dy * dy) / (s.ry * s.ry));
				return Math.abs(norm - 1) * Math.min(s.rx, s.ry) < half;
			}
			case 'axes': {
				if (pos.y >= s.oy - half && pos.y <= s.oy + half && pos.x >= s.ox - s.xLen - half && pos.x <= s.ox + s.xLen + half) return true;
				if (pos.x >= s.ox - half && pos.x <= s.ox + half && pos.y >= s.oy - s.yLen - half && pos.y <= s.oy + s.yLen + half) return true;
				return false;
			}
		}
	}

	if (!stroke.points || stroke.points.length < 2) return false;
	return pointToPolylineDistance(pos, stroke.points) < threshold + stroke.width / 2;
}
