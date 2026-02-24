// OpenMathBoard — Anchor system (rendering, hit testing, drag handling)
//
// Anchor design per shape:
//   Circle:     radius (E) + rotation
//   Ellipse:    rx-east, rx-west, ry-north, ry-south + rotation
//   Line:       p1, p2 + rotation
//   Arrow:      p1, p2 + rotation
//   Parabola:   vertex, left, right + rotation
//   Sine/Cos:   left, right, peak, valley, period + rotation
//   Axes:       4 arm endpoints + rotation
//   Freehand:   stretch-n/s/e/w + rotation

import { getCamera } from '../core/state.js';
import { getStrokeBounds } from './renderer.js';

const ANCHOR_SIZE = 12;
const HIT_THRESHOLD = 28; // screen pixels — large for touch targets
const ROTATION_HANDLE_OFFSET = 40; // pixels above top of bounding box (screen space)

/**
 * Rotate point (x, y) around center (cx, cy) by angle (radians).
 */
function rotatePoint(x, y, cx, cy, angle) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const dx = x - cx;
	const dy = y - cy;
	return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

// ============ Rotation anchor helper ============

function getRotationAnchor(obj, camera) {
	const bounds = getStrokeBounds(obj);
	if (!bounds) return null;
	const cx = (bounds.minX + bounds.maxX) / 2;
	const rotOffset = ROTATION_HANDLE_OFFSET / camera.zoom;
	return { id: 'rotation', x: cx, y: bounds.minY - rotOffset, type: 'rotation' };
}

// ============ Get all anchors for a stroke ============

export function getAnchors(obj, camera) {
	if (!obj) return [];
	const cam = camera || getCamera();

	// Freehand strokes (no shape) get stretch anchors
	if (!obj.shape) {
		return getFreehandAnchors(obj, cam);
	}

	const special = getShapeAnchors(obj);
	const rot = getRotationAnchor(obj, cam);
	return rot ? [...special, rot] : special;
}

/**
 * Freehand: 4 bounding-box stretch handles + rotation.
 */
function getFreehandAnchors(obj, camera) {
	const bounds = getStrokeBounds(obj);
	if (!bounds) return [];
	const cx = (bounds.minX + bounds.maxX) / 2;
	const cy = (bounds.minY + bounds.maxY) / 2;
	const rotOffset = ROTATION_HANDLE_OFFSET / camera.zoom;
	return [
		{ id: 'stretch-n', x: cx, y: bounds.minY, type: 'stretch' },
		{ id: 'stretch-s', x: cx, y: bounds.maxY, type: 'stretch' },
		{ id: 'stretch-e', x: bounds.maxX, y: cy, type: 'stretch' },
		{ id: 'stretch-w', x: bounds.minX, y: cy, type: 'stretch' },
		{ id: 'rotation', x: cx, y: bounds.minY - rotOffset, type: 'rotation' },
	];
}

/**
 * Shape-specific anchors — tailored per shape for best UX.
 */
function getShapeAnchors(obj) {
	const s = obj.shape;
	switch (s.type) {
		case 'line':
			return [
				{ id: 'p1', x: s.x1, y: s.y1, type: 'endpoint' },
				{ id: 'p2', x: s.x2, y: s.y2, type: 'endpoint' },
			];
		case 'arrow':
			return [
				{ id: 'p1', x: s.x1, y: s.y1, type: 'endpoint' },
				{ id: 'p2', x: s.x2, y: s.y2, type: 'endpoint' },
			];
		case 'circle':
			return [
				{ id: 'radius', x: s.cx + s.r, y: s.cy, type: 'scale' },
			];
		case 'ellipse':
			return [
				{ id: 'rx-east',  x: s.cx + s.rx, y: s.cy, type: 'scale' },
				{ id: 'rx-west',  x: s.cx - s.rx, y: s.cy, type: 'scale' },
				{ id: 'ry-north', x: s.cx, y: s.cy - s.ry, type: 'scale' },
				{ id: 'ry-south', x: s.cx, y: s.cy + s.ry, type: 'scale' },
			];
		case 'parabola':
			return [
				{ id: 'vertex', x: s.h, y: s.k, type: 'curve' },
				{ id: 'left',  x: s.xMin, y: s.a * (s.xMin - s.h) ** 2 + s.k, type: 'endpoint' },
				{ id: 'right', x: s.xMax, y: s.a * (s.xMax - s.h) ** 2 + s.k, type: 'endpoint' },
			];
		case 'sine':
		case 'cosine': {
			const midX = (s.xMin + s.xMax) / 2;
			const period = (2 * Math.PI) / Math.abs(s.B || 0.01);
			const periodEndX = midX + period;
			return [
				{ id: 'left',   x: s.xMin, y: s.D, type: 'endpoint' },
				{ id: 'right',  x: s.xMax, y: s.D, type: 'endpoint' },
				{ id: 'peak',   x: midX, y: s.D - s.A, type: 'curve' },
				{ id: 'valley', x: midX, y: s.D + s.A, type: 'curve' },
				{ id: 'period', x: Math.min(periodEndX, s.xMax), y: s.D, type: 'scale' },
			];
		}
		case 'axes': {
			const xPos = s.xPosLen || s.xLen || 120;
			const xNeg = s.xNegLen || s.xLen || 120;
			const yPos = s.yPosLen || s.yLen || 120;
			const yNeg = s.yNegLen || s.yLen || 120;
			return [
				{ id: 'xPosEnd', x: s.ox + xPos, y: s.oy, type: 'scale' },
				{ id: 'xNegEnd', x: s.ox - xNeg, y: s.oy, type: 'scale' },
				{ id: 'yNegEnd', x: s.ox, y: s.oy - yNeg, type: 'scale' },
				{ id: 'yPosEnd', x: s.ox, y: s.oy + yPos, type: 'scale' },
			];
		}
		case 'square': {
			const half = s.size / 2;
			return [
				{ id: 'scale', x: s.cx + half, y: s.cy + half, type: 'scale' },
			];
		}
		case 'rectangle': {
			return [
				{ id: 'right', x: s.cx + s.w / 2, y: s.cy, type: 'scale' },
				{ id: 'bottom', x: s.cx, y: s.cy + s.h / 2, type: 'scale' },
			];
		}
		case 'triangle':
			return [
				{ id: 'p1', x: s.x1, y: s.y1, type: 'endpoint' },
				{ id: 'p2', x: s.x2, y: s.y2, type: 'endpoint' },
				{ id: 'p3', x: s.x3, y: s.y3, type: 'endpoint' },
			];
		default:
			return [];
	}
}

// ============ Anchor drag handling ============

export function onAnchorDrag(obj, anchorId, newWorldPos, dragInfo) {
	if (!obj) return;

	// Rotation (any shape including freehand)
	if (anchorId === 'rotation') {
		const bounds = getStrokeBounds(obj);
		if (!bounds) return;
		const cx = (bounds.minX + bounds.maxX) / 2;
		const cy = (bounds.minY + bounds.maxY) / 2;
		const angle = Math.atan2(newWorldPos.y - cy, newWorldPos.x - cx) + Math.PI / 2;
		const snap = Math.PI / 12;
		const snapped = Math.round(angle / snap) * snap;
		if (obj.shape) {
			obj.shape.rotation = Math.abs(angle - snapped) < 0.05 ? snapped : angle;
		}
		return;
	}

	// Freehand stretch
	if (anchorId.startsWith('stretch-')) {
		onFreehandStretch(obj, anchorId, newWorldPos);
		return;
	}

	if (!obj.shape) return;
	const s = obj.shape;

	switch (s.type) {
		case 'line':
			if (anchorId === 'p1') { s.x1 = newWorldPos.x; s.y1 = newWorldPos.y; }
			if (anchorId === 'p2') { s.x2 = newWorldPos.x; s.y2 = newWorldPos.y; }
			break;
		case 'arrow':
			if (anchorId === 'p1') { s.x1 = newWorldPos.x; s.y1 = newWorldPos.y; }
			if (anchorId === 'p2') { s.x2 = newWorldPos.x; s.y2 = newWorldPos.y; }
			break;
		case 'circle':
			if (anchorId === 'radius') {
				s.r = Math.max(5, Math.hypot(newWorldPos.x - s.cx, newWorldPos.y - s.cy));
			}
			break;
		case 'ellipse':
			if (anchorId === 'rx-east' || anchorId === 'rx-west') {
				s.rx = Math.max(5, Math.abs(newWorldPos.x - s.cx));
			}
			if (anchorId === 'ry-north' || anchorId === 'ry-south') {
				s.ry = Math.max(5, Math.abs(newWorldPos.y - s.cy));
			}
			break;
		case 'parabola':
			if (anchorId === 'vertex') {
				const newH = Math.max(s.xMin + 1, Math.min(s.xMax - 1, newWorldPos.x));
				s.h = newH;
				s.k = newWorldPos.y;
				if (dragInfo && dragInfo.savedEndpointYLeft !== undefined) {
					const dxL = s.xMin - newH;
					const dxR = s.xMax - newH;
					const yL = dragInfo.savedEndpointYLeft;
					const yR = dragInfo.savedEndpointYRight;
					if (Math.abs(dxL) >= Math.abs(dxR) && dxL * dxL > 1) {
						s.a = (yL - s.k) / (dxL * dxL);
					} else if (dxR * dxR > 1) {
						s.a = (yR - s.k) / (dxR * dxR);
					}
				}
			}
			if (anchorId === 'left') { s.xMin = Math.min(newWorldPos.x, s.h - 5); }
			if (anchorId === 'right') { s.xMax = Math.max(newWorldPos.x, s.h + 5); }
			regenerateParabolaPoints(obj);
			break;
		case 'sine':
		case 'cosine': {
			const midX = (s.xMin + s.xMax) / 2;
			if (anchorId === 'left')  { s.xMin = Math.min(newWorldPos.x, s.xMax - 20); }
			if (anchorId === 'right') { s.xMax = Math.max(newWorldPos.x, s.xMin + 20); }
			if (anchorId === 'peak')  { s.A = Math.max(5, s.D - newWorldPos.y); }
			if (anchorId === 'valley') { s.A = Math.max(5, newWorldPos.y - s.D); }
			if (anchorId === 'period') {
				const dist = Math.abs(newWorldPos.x - midX);
				s.B = (2 * Math.PI) / Math.max(20, dist);
			}
			break;
		}
		case 'axes':
			if (anchorId === 'xPosEnd') { s.xPosLen = Math.max(20, newWorldPos.x - s.ox); }
			if (anchorId === 'xNegEnd') { s.xNegLen = Math.max(20, s.ox - newWorldPos.x); }
			if (anchorId === 'yNegEnd') { s.yNegLen = Math.max(20, s.oy - newWorldPos.y); }
			if (anchorId === 'yPosEnd') { s.yPosLen = Math.max(20, newWorldPos.y - s.oy); }
			break;
		case 'square':
			if (anchorId === 'scale') {
				s.size = Math.max(10, Math.max(Math.abs(newWorldPos.x - s.cx), Math.abs(newWorldPos.y - s.cy)) * 2);
			}
			break;
		case 'rectangle':
			if (anchorId === 'right') { s.w = Math.max(10, Math.abs(newWorldPos.x - s.cx) * 2); }
			if (anchorId === 'bottom') { s.h = Math.max(10, Math.abs(newWorldPos.y - s.cy) * 2); }
			break;
		case 'triangle':
			if (anchorId === 'p1') { s.x1 = newWorldPos.x; s.y1 = newWorldPos.y; }
			if (anchorId === 'p2') { s.x2 = newWorldPos.x; s.y2 = newWorldPos.y; }
			if (anchorId === 'p3') { s.x3 = newWorldPos.x; s.y3 = newWorldPos.y; }
			break;

	}
}

// ============ Freehand stretch ============

function onFreehandStretch(obj, anchorId, newWorldPos) {
	const bounds = getStrokeBounds(obj);
	if (!bounds) return;
	const cx = (bounds.minX + bounds.maxX) / 2;
	const cy = (bounds.minY + bounds.maxY) / 2;
	const w = bounds.maxX - bounds.minX;
	const h = bounds.maxY - bounds.minY;
	if (w < 1 || h < 1) return;

	let scaleX = 1, scaleY = 1;
	let newCx = cx, newCy = cy;

	switch (anchorId) {
		case 'stretch-n': {
			const newMinY = Math.min(newWorldPos.y, bounds.maxY - 5);
			scaleY = (bounds.maxY - newMinY) / h;
			newCy = (newMinY + bounds.maxY) / 2;
			break;
		}
		case 'stretch-s': {
			const newMaxY = Math.max(newWorldPos.y, bounds.minY + 5);
			scaleY = (newMaxY - bounds.minY) / h;
			newCy = (bounds.minY + newMaxY) / 2;
			break;
		}
		case 'stretch-e': {
			const newMaxX = Math.max(newWorldPos.x, bounds.minX + 5);
			scaleX = (newMaxX - bounds.minX) / w;
			newCx = (bounds.minX + newMaxX) / 2;
			break;
		}
		case 'stretch-w': {
			const newMinX = Math.min(newWorldPos.x, bounds.maxX - 5);
			scaleX = (bounds.maxX - newMinX) / w;
			newCx = (newMinX + bounds.maxX) / 2;
			break;
		}
	}

	// Scale all freehand points
	if (obj.points) {
		for (const pt of obj.points) {
			pt.x = (pt.x - cx) * scaleX + newCx;
			pt.y = (pt.y - cy) * scaleY + newCy;
		}
	}
}

// ============ Anchor rendering ============

export function renderAnchors(ctx, obj, camera) {
	const anchors = getAnchors(obj, camera);
	if (anchors.length === 0) return;

	const rotation = (obj.shape && obj.shape.rotation) || 0;
	const bounds = getStrokeBounds(obj);

	// Compute rotation center (screen space)
	let rotCenterSx = 0, rotCenterSy = 0;
	if (bounds) {
		rotCenterSx = ((bounds.minX + bounds.maxX) / 2 - camera.x) * camera.zoom;
		rotCenterSy = ((bounds.minY + bounds.maxY) / 2 - camera.y) * camera.zoom;
	}

	// Draw rotation handle line (from top-center of bounds to rotation anchor)
	if (bounds) {
		let topCenterX = ((bounds.minX + bounds.maxX) / 2 - camera.x) * camera.zoom;
		let topCenterY = (bounds.minY - camera.y) * camera.zoom - 6;
		const rotAnchor = anchors.find(a => a.id === 'rotation');
		if (rotAnchor) {
			let rx = (rotAnchor.x - camera.x) * camera.zoom;
			let ry = (rotAnchor.y - camera.y) * camera.zoom;
			if (rotation !== 0) {
				const p1 = rotatePoint(topCenterX, topCenterY, rotCenterSx, rotCenterSy, rotation);
				const p2 = rotatePoint(rx, ry, rotCenterSx, rotCenterSy, rotation);
				topCenterX = p1.x; topCenterY = p1.y;
				rx = p2.x; ry = p2.y;
			}
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(topCenterX, topCenterY);
			ctx.lineTo(rx, ry);
			ctx.strokeStyle = '#94a3b8';
			ctx.lineWidth = 1;
			ctx.setLineDash([]);
			ctx.stroke();
			ctx.restore();
		}
	}

	for (const anchor of anchors) {
		let sx = (anchor.x - camera.x) * camera.zoom;
		let sy = (anchor.y - camera.y) * camera.zoom;
		if (rotation !== 0 && bounds) {
			const rp = rotatePoint(sx, sy, rotCenterSx, rotCenterSy, rotation);
			sx = rp.x; sy = rp.y;
		}
		const size = ANCHOR_SIZE;

		ctx.save();
		ctx.translate(sx, sy);

		switch (anchor.type) {
			case 'endpoint': // Circle — for draggable endpoints
				ctx.beginPath();
				ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
				ctx.fillStyle = 'white';
				ctx.fill();
				ctx.strokeStyle = '#2563eb';
				ctx.lineWidth = 2;
				ctx.stroke();
				break;
			case 'scale': // Square — for resize/scale handles
				ctx.fillStyle = 'white';
				ctx.fillRect(-size / 2, -size / 2, size, size);
				ctx.strokeStyle = '#2563eb';
				ctx.lineWidth = 2;
				ctx.strokeRect(-size / 2, -size / 2, size, size);
				break;
			case 'curve': // Diamond — for curve/curvature control
				ctx.beginPath();
				ctx.moveTo(0, -size / 2);
				ctx.lineTo(size / 2, 0);
				ctx.lineTo(0, size / 2);
				ctx.lineTo(-size / 2, 0);
				ctx.closePath();
				ctx.fillStyle = 'white';
				ctx.fill();
				ctx.strokeStyle = '#2563eb';
				ctx.lineWidth = 2;
				ctx.stroke();
				break;
			case 'stretch': // Small green square — freehand only
				ctx.fillStyle = 'white';
				ctx.fillRect(-size / 3, -size / 3, size * 2 / 3, size * 2 / 3);
				ctx.strokeStyle = '#16a34a';
				ctx.lineWidth = 1.5;
				ctx.strokeRect(-size / 3, -size / 3, size * 2 / 3, size * 2 / 3);
				break;
			case 'rotation': { // Circular arrow — rotation handle
				const r = size * 0.55;
				ctx.beginPath();
				ctx.arc(0, 0, r, 0, Math.PI * 2);
				ctx.fillStyle = 'white';
				ctx.fill();
				ctx.strokeStyle = '#ea580c';
				ctx.lineWidth = 1.5;
				ctx.stroke();
				const arcR = r * 0.55;
				const arcStart = -Math.PI * 0.75;
				const arcEnd = Math.PI * 0.65;
				ctx.beginPath();
				ctx.arc(0, 0, arcR, arcStart, arcEnd);
				ctx.strokeStyle = '#ea580c';
				ctx.lineWidth = 1.5;
				ctx.lineCap = 'round';
				ctx.stroke();
				const ax = arcR * Math.cos(arcEnd);
				const ay = arcR * Math.sin(arcEnd);
				const tx = -Math.sin(arcEnd);
				const ty = Math.cos(arcEnd);
				const hl = 3.5;
				ctx.beginPath();
				ctx.moveTo(ax, ay);
				ctx.lineTo(ax - hl * tx - hl * 0.5 * ty, ay - hl * ty + hl * 0.5 * tx);
				ctx.moveTo(ax, ay);
				ctx.lineTo(ax - hl * tx + hl * 0.5 * ty, ay - hl * ty - hl * 0.5 * tx);
				ctx.stroke();
				ctx.lineCap = 'butt';
				break;
			}
		}

		ctx.restore();
	}
}

// ============ Anchor hit testing ============

export function findAnchorAtPoint(obj, worldPos, camera) {
	const anchors = getAnchors(obj, camera);
	const rotation = (obj.shape && obj.shape.rotation) || 0;
	const bounds = getStrokeBounds(obj);

	let rotCx = 0, rotCy = 0;
	if (bounds) {
		rotCx = ((bounds.minX + bounds.maxX) / 2 - camera.x) * camera.zoom;
		rotCy = ((bounds.minY + bounds.maxY) / 2 - camera.y) * camera.zoom;
	}

	const px = (worldPos.x - camera.x) * camera.zoom;
	const py = (worldPos.y - camera.y) * camera.zoom;

	for (const anchor of anchors) {
		let sx = (anchor.x - camera.x) * camera.zoom;
		let sy = (anchor.y - camera.y) * camera.zoom;
		if (rotation !== 0 && bounds) {
			const rp = rotatePoint(sx, sy, rotCx, rotCy, rotation);
			sx = rp.x; sy = rp.y;
		}
		if (Math.hypot(px - sx, py - sy) < HIT_THRESHOLD) {
			return anchor;
		}
	}
	return null;
}

// ============ Helpers ============

function regenerateParabolaPoints(obj) {
	if (!obj.shape) return;
	const { h, k, a, xMin, xMax } = obj.shape;
	const steps = 100;
	const pts = [];
	for (let i = 0; i <= steps; i++) {
		const x = xMin + (i / steps) * (xMax - xMin);
		pts.push({ x, y: a * (x - h) ** 2 + k });
	}
	obj.points = pts;
}
