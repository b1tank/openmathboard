// OpenMathBoard — Canvas renderer
import {
	getStrokes, getSelectedStrokes, getIsSelecting, getSelectionRect,
	getCurrentStroke, getCanvasRect, getCanvas, getCtx, getCamera
} from './state.js';
import { renderFreehand } from './shapes/freehand.js';
import { pointToSegmentDistance, pointToPolylineDistance, getBounds } from './detection.js';

// ============ Main render ============

export function redrawCanvas() {
	const ctx = getCtx();
	const rect = getCanvasRect();
	if (!ctx || !rect) return;

	ctx.clearRect(0, 0, rect.width, rect.height);

	const camera = getCamera();

	ctx.save();
	ctx.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
	ctx.scale(camera.zoom, camera.zoom);

	// Draw all strokes
	const strokes = getStrokes();
	for (let i = 0; i < strokes.length; i++) {
		drawStroke(ctx, strokes[i], camera);
	}

	ctx.restore();

	// Draw selection highlights (in screen space)
	const selected = getSelectedStrokes();
	if (selected.length > 0) {
		drawSelectionHighlights(ctx, strokes, selected, camera);
	}

	// Draw selection rectangle while dragging
	if (getIsSelecting() && getSelectionRect()) {
		drawSelectionRect(ctx, getSelectionRect());
	}
}

// ============ Stroke drawing ============

export function drawStroke(ctx, stroke, camera) {
	if (!stroke || !stroke.points || stroke.points.length < 2) return;

	ctx.strokeStyle = stroke.color;
	ctx.lineWidth = stroke.width;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	if (stroke.dash) {
		ctx.setLineDash([8, 6]);
	} else {
		ctx.setLineDash([]);
	}

	if (stroke.shape && stroke.shape.type === 'line') {
		ctx.beginPath();
		ctx.moveTo(stroke.shape.x1, stroke.shape.y1);
		ctx.lineTo(stroke.shape.x2, stroke.shape.y2);
		ctx.stroke();
		ctx.setLineDash([]);
		return;
	}

	if (stroke.shape && stroke.shape.type === 'circle') {
		ctx.beginPath();
		ctx.arc(stroke.shape.cx, stroke.shape.cy, stroke.shape.r, 0, Math.PI * 2);
		ctx.stroke();
		ctx.setLineDash([]);
		return;
	}

	if (stroke.shape && stroke.shape.type === 'parabola') {
		ctx.beginPath();
		const points = stroke.points;
		ctx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.stroke();
		ctx.setLineDash([]);
		return;
	}

	// Freehand
	renderFreehand(ctx, stroke);
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

		// Convert bounds to screen coords
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
		if (stroke.shape.type === 'circle') {
			return {
				minX: stroke.shape.cx - stroke.shape.r,
				minY: stroke.shape.cy - stroke.shape.r,
				maxX: stroke.shape.cx + stroke.shape.r,
				maxY: stroke.shape.cy + stroke.shape.r
			};
		}
		if (stroke.shape.type === 'line') {
			return {
				minX: Math.min(stroke.shape.x1, stroke.shape.x2),
				minY: Math.min(stroke.shape.y1, stroke.shape.y2),
				maxX: Math.max(stroke.shape.x1, stroke.shape.x2),
				maxY: Math.max(stroke.shape.y1, stroke.shape.y2)
			};
		}
	}

	if (!stroke.points || stroke.points.length === 0) return null;
	return getBounds(stroke.points);
}

// ============ Hit testing ============

export function isPointNearStroke(pos, stroke, threshold = 15) {
	if (!stroke) return false;

	if (stroke.shape && stroke.shape.type === 'circle') {
		const dist = Math.hypot(pos.x - stroke.shape.cx, pos.y - stroke.shape.cy);
		return Math.abs(dist - stroke.shape.r) < threshold + stroke.width / 2;
	}

	if (stroke.shape && stroke.shape.type === 'line') {
		return pointToSegmentDistance(pos,
			{ x: stroke.shape.x1, y: stroke.shape.y1 },
			{ x: stroke.shape.x2, y: stroke.shape.y2 }
		) < threshold + stroke.width / 2;
	}

	if (!stroke.points || stroke.points.length < 2) return false;
	return pointToPolylineDistance(pos, stroke.points) < threshold + stroke.width / 2;
}
