// OpenMathBoard — Anchor system (rendering, hit testing, drag handling)
import { getCamera } from '../core/state.js';
import { worldToScreen } from './camera.js';
import { getStrokeBounds } from './renderer.js';

const ANCHOR_SIZE = 12;
const HIT_THRESHOLD = 28; // screen pixels — large for touch targets
const ROTATION_HANDLE_OFFSET = 40; // pixels above top of bounding box (screen space)

// ============ Get anchors for any shape type ============

/**
 * Returns general bounding-box anchors (stretch N/S/E/W + rotation).
 * These apply to ALL shapes. Returns world-coordinate anchors.
 */
export function getGeneralAnchors(obj, camera) {
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

// ============ Get anchors for any shape type ============

export function getAnchors(obj, camera) {
	if (!obj) return [];
	const cam = camera || getCamera();
	const general = getGeneralAnchors(obj, cam);
	const special = getSpecialAnchors(obj);
	return [...special, ...general];
}

/**
 * Shape-specific anchors (endpoints, centers, curve handles, etc.)
 */
export function getSpecialAnchors(obj) {
	if (!obj || !obj.shape) return [];

	switch (obj.shape.type) {
		case 'line':
			return [
				{ id: 'p1', x: obj.shape.x1, y: obj.shape.y1, type: 'endpoint' },
				{ id: 'p2', x: obj.shape.x2, y: obj.shape.y2, type: 'endpoint' },
			];
		case 'circle':
			return [
				{ id: 'center', x: obj.shape.cx, y: obj.shape.cy, type: 'center' },
				{ id: 'radius', x: obj.shape.cx + obj.shape.r, y: obj.shape.cy, type: 'scale' },
			];
		case 'ellipse':
			return [
				{ id: 'center', x: obj.shape.cx, y: obj.shape.cy, type: 'center' },
				{ id: 'rx', x: obj.shape.cx + obj.shape.rx, y: obj.shape.cy, type: 'scale' },
				{ id: 'ry', x: obj.shape.cx, y: obj.shape.cy - obj.shape.ry, type: 'scale' },
			];
		case 'parabola':
			return [
				{ id: 'vertex', x: obj.shape.h, y: obj.shape.k, type: 'center' },
				{ id: 'left', x: obj.shape.xMin, y: obj.shape.a * (obj.shape.xMin - obj.shape.h) ** 2 + obj.shape.k, type: 'curve' },
				{ id: 'right', x: obj.shape.xMax, y: obj.shape.a * (obj.shape.xMax - obj.shape.h) ** 2 + obj.shape.k, type: 'curve' },
			];
		case 'sine':
		case 'cosine': {
			const s = obj.shape;
			const midX = (s.xMin + s.xMax) / 2;
			const period = (2 * Math.PI) / Math.abs(s.B || 0.01);
			// periodEnd: one period to the right of center, on midline
			const periodEndX = midX + period;
			return [
				{ id: 'center', x: midX, y: s.D, type: 'center' },          // move whole shape
				{ id: 'left', x: s.xMin, y: s.D, type: 'endpoint' },        // extend left (more periods)
				{ id: 'right', x: s.xMax, y: s.D, type: 'endpoint' },       // extend right (more periods)
				{ id: 'peak', x: midX, y: s.D - s.A, type: 'curve' },       // amplitude (drag up/down)
				{ id: 'valley', x: midX, y: s.D + s.A, type: 'curve' },     // amplitude (drag up/down, symmetric)
				{ id: 'period', x: Math.min(periodEndX, s.xMax), y: s.D, type: 'scale' }, // frequency/period control
			];
		}
		case 'arrow':
			return [
				{ id: 'p1', x: obj.shape.x1, y: obj.shape.y1, type: 'endpoint' },
				{ id: 'p2', x: obj.shape.x2, y: obj.shape.y2, type: 'endpoint' },
			];
		case 'axes': {
			const s = obj.shape;
			const xPos = s.xPosLen || s.xLen || 120;
			const xNeg = s.xNegLen || s.xLen || 120;
			const yPos = s.yPosLen || s.yLen || 120;
			const yNeg = s.yNegLen || s.yLen || 120;
			return [
				{ id: 'origin', x: s.ox, y: s.oy, type: 'center' },
				{ id: 'xPosEnd', x: s.ox + xPos, y: s.oy, type: 'scale' },
				{ id: 'xNegEnd', x: s.ox - xNeg, y: s.oy, type: 'scale' },
				{ id: 'yNegEnd', x: s.ox, y: s.oy - yNeg, type: 'scale' },   // up
				{ id: 'yPosEnd', x: s.ox, y: s.oy + yPos, type: 'scale' },   // down
			];
		}		case 'numberline':
			return [
				{ id: 'center', x: obj.shape.ox, y: obj.shape.oy, type: 'center' },
				{ id: 'left', x: obj.shape.ox - obj.shape.leftLen, y: obj.shape.oy, type: 'endpoint' },
				{ id: 'right', x: obj.shape.ox + obj.shape.rightLen, y: obj.shape.oy, type: 'endpoint' },
			];
		case 'axes3d': {
			const s3 = obj.shape;
			const cosZ = Math.cos(Math.PI - Math.PI / 6);
			const sinZ = Math.sin(Math.PI - Math.PI / 6);
			return [
				{ id: 'origin', x: s3.ox, y: s3.oy, type: 'center' },
				{ id: 'xEnd', x: s3.ox + s3.xLen, y: s3.oy, type: 'scale' },
				{ id: 'yEnd', x: s3.ox, y: s3.oy - s3.yLen, type: 'scale' },
				{ id: 'zEnd', x: s3.ox + s3.zLen * cosZ, y: s3.oy - s3.zLen * sinZ, type: 'scale' },
			];
		}		default:
			return [];
	}
}

// ============ Anchor drag handling ============

export function onAnchorDrag(obj, anchorId, newWorldPos) {
	if (!obj) return;

	// General anchors (stretch / rotation)
	if (anchorId.startsWith('stretch-') || anchorId === 'rotation') {
		onGeneralAnchorDrag(obj, anchorId, newWorldPos);
		return;
	}

	if (!obj.shape) return;

	switch (obj.shape.type) {
		case 'line':
			if (anchorId === 'p1') { obj.shape.x1 = newWorldPos.x; obj.shape.y1 = newWorldPos.y; }
			if (anchorId === 'p2') { obj.shape.x2 = newWorldPos.x; obj.shape.y2 = newWorldPos.y; }
			break;
		case 'circle':
			if (anchorId === 'center') { obj.shape.cx = newWorldPos.x; obj.shape.cy = newWorldPos.y; }
			if (anchorId === 'radius') { obj.shape.r = Math.hypot(newWorldPos.x - obj.shape.cx, newWorldPos.y - obj.shape.cy); }
			break;
		case 'ellipse':
			if (anchorId === 'center') { obj.shape.cx = newWorldPos.x; obj.shape.cy = newWorldPos.y; }
			if (anchorId === 'rx') { obj.shape.rx = Math.max(5, Math.abs(newWorldPos.x - obj.shape.cx)); }
			if (anchorId === 'ry') { obj.shape.ry = Math.max(5, Math.abs(newWorldPos.y - obj.shape.cy)); }
			break;
		case 'parabola':
			if (anchorId === 'vertex') { obj.shape.h = newWorldPos.x; obj.shape.k = newWorldPos.y; }
			if (anchorId === 'left') {
				obj.shape.xMin = Math.min(newWorldPos.x, obj.shape.h - 5);
			}
			if (anchorId === 'right') {
				obj.shape.xMax = Math.max(newWorldPos.x, obj.shape.h + 5);
			}
			break;
		case 'sine':
		case 'cosine': {
			const s = obj.shape;
			const midX = (s.xMin + s.xMax) / 2;
			const halfSpan = (s.xMax - s.xMin) / 2;
			if (anchorId === 'center') {
				// Move entire wave
				const dx = newWorldPos.x - midX;
				const dy = newWorldPos.y - s.D;
				s.C += dx; s.D += dy;
				s.xMin += dx; s.xMax += dx;
			}
			if (anchorId === 'left') {
				s.xMin = Math.min(newWorldPos.x, s.xMax - 20);
			}
			if (anchorId === 'right') {
				s.xMax = Math.max(newWorldPos.x, s.xMin + 20);
			}
			if (anchorId === 'peak') {
				// Amplitude: distance from midline to peak
				s.A = Math.max(5, s.D - newWorldPos.y);
			}
			if (anchorId === 'valley') {
				// Amplitude from valley side
				s.A = Math.max(5, newWorldPos.y - s.D);
			}
			if (anchorId === 'period') {
				// Period control: distance from center to this handle = one period
				const dist = Math.abs(newWorldPos.x - midX);
				const newPeriod = Math.max(20, dist);
				s.B = (2 * Math.PI) / newPeriod;
			}
			break;
		}
		case 'arrow':
			if (anchorId === 'p1') { obj.shape.x1 = newWorldPos.x; obj.shape.y1 = newWorldPos.y; }
			if (anchorId === 'p2') { obj.shape.x2 = newWorldPos.x; obj.shape.y2 = newWorldPos.y; }
			break;
		case 'axes':
			if (anchorId === 'origin') { obj.shape.ox = newWorldPos.x; obj.shape.oy = newWorldPos.y; }
			if (anchorId === 'xPosEnd') { obj.shape.xPosLen = Math.max(20, newWorldPos.x - obj.shape.ox); }
			if (anchorId === 'xNegEnd') { obj.shape.xNegLen = Math.max(20, obj.shape.ox - newWorldPos.x); }
			if (anchorId === 'yNegEnd') { obj.shape.yNegLen = Math.max(20, obj.shape.oy - newWorldPos.y); }
			if (anchorId === 'yPosEnd') { obj.shape.yPosLen = Math.max(20, newWorldPos.y - obj.shape.oy); }
			break;
		case 'numberline':
			if (anchorId === 'center') { obj.shape.ox = newWorldPos.x; obj.shape.oy = newWorldPos.y; }
			if (anchorId === 'left') { obj.shape.leftLen = Math.max(20, obj.shape.ox - newWorldPos.x); }
			if (anchorId === 'right') { obj.shape.rightLen = Math.max(20, newWorldPos.x - obj.shape.ox); }
			break;
		case 'axes3d': {
			const s3 = obj.shape;
			if (anchorId === 'origin') { s3.ox = newWorldPos.x; s3.oy = newWorldPos.y; }
			if (anchorId === 'xEnd') { s3.xLen = Math.max(20, newWorldPos.x - s3.ox); }
			if (anchorId === 'yEnd') { s3.yLen = Math.max(20, s3.oy - newWorldPos.y); }
			if (anchorId === 'zEnd') {
				// Distance from origin to point along z direction
				const cosZ = Math.cos(Math.PI - Math.PI / 6);
				const sinZ = Math.sin(Math.PI - Math.PI / 6);
				const dx = newWorldPos.x - s3.ox, dy = newWorldPos.y - s3.oy;
				s3.zLen = Math.max(20, (dx * cosZ - dy * sinZ));
			}
			break;
		}
	}
}

// ============ General anchor drag (stretch + rotation) ============

function onGeneralAnchorDrag(obj, anchorId, newWorldPos) {
	const bounds = getStrokeBounds(obj);
	if (!bounds) return;

	const cx = (bounds.minX + bounds.maxX) / 2;
	const cy = (bounds.minY + bounds.maxY) / 2;
	const w = bounds.maxX - bounds.minX;
	const h = bounds.maxY - bounds.minY;

	if (anchorId === 'rotation') {
		// Compute angle from center to pointer
		const angle = Math.atan2(newWorldPos.y - cy, newWorldPos.x - cx) + Math.PI / 2;
		// Snap to 15-degree increments if close
		const snap = Math.PI / 12;
		const snapped = Math.round(angle / snap) * snap;
		const finalAngle = Math.abs(angle - snapped) < 0.05 ? snapped : angle;
		
		if (obj.shape) {
			obj.shape.rotation = finalAngle;
		}
		return;
	}

	// Stretch: scale shape geometry from bounding box
	if (w < 1 || h < 1) return;

	let scaleX = 1, scaleY = 1;
	let newCx = cx, newCy = cy;

	switch (anchorId) {
		case 'stretch-n': {
			const newMinY = Math.min(newWorldPos.y, bounds.maxY - 5);
			const newH = bounds.maxY - newMinY;
			scaleY = newH / h;
			newCy = (newMinY + bounds.maxY) / 2;
			break;
		}
		case 'stretch-s': {
			const newMaxY = Math.max(newWorldPos.y, bounds.minY + 5);
			const newH = newMaxY - bounds.minY;
			scaleY = newH / h;
			newCy = (bounds.minY + newMaxY) / 2;
			break;
		}
		case 'stretch-e': {
			const newMaxX = Math.max(newWorldPos.x, bounds.minX + 5);
			const newW = newMaxX - bounds.minX;
			scaleX = newW / w;
			newCx = (bounds.minX + newMaxX) / 2;
			break;
		}
		case 'stretch-w': {
			const newMinX = Math.min(newWorldPos.x, bounds.maxX - 5);
			const newW = bounds.maxX - newMinX;
			scaleX = newW / w;
			newCx = (newMinX + bounds.maxX) / 2;
			break;
		}
	}

	// Apply scale to shape
	scaleShape(obj, cx, cy, newCx, newCy, scaleX, scaleY);
}

/**
 * Scale a shape's geometry around (oldCx, oldCy), then translate center to (newCx, newCy).
 */
function scaleShape(obj, oldCx, oldCy, newCx, newCy, scaleX, scaleY) {
	function transformPt(x, y) {
		return {
			x: (x - oldCx) * scaleX + newCx,
			y: (y - oldCy) * scaleY + newCy
		};
	}

	if (obj.shape) {
		const s = obj.shape;
		switch (s.type) {
			case 'circle': {
				const c = transformPt(s.cx, s.cy);
				s.cx = c.x; s.cy = c.y;
				s.r = s.r * Math.max(scaleX, scaleY);
				break;
			}
			case 'ellipse': {
				const c = transformPt(s.cx, s.cy);
				s.cx = c.x; s.cy = c.y;
				s.rx = s.rx * scaleX; s.ry = s.ry * scaleY;
				break;
			}
			case 'line':
			case 'arrow': {
				const p1 = transformPt(s.x1, s.y1);
				const p2 = transformPt(s.x2, s.y2);
				s.x1 = p1.x; s.y1 = p1.y;
				s.x2 = p2.x; s.y2 = p2.y;
				break;
			}
			case 'parabola': {
				const v = transformPt(s.h, s.k);
				const lx = transformPt(s.xMin, 0);
				const rx = transformPt(s.xMax, 0);
				s.h = v.x; s.k = v.y;
				s.xMin = lx.x; s.xMax = rx.x;
				// Adjust 'a' to preserve visual shape under scale
				if (scaleX !== 0) s.a = s.a * (scaleY / scaleX);
				break;
			}
			case 'sine':
			case 'cosine': {
				const c = transformPt((s.xMin + s.xMax) / 2, s.D);
				const lx = transformPt(s.xMin, 0);
				const rx = transformPt(s.xMax, 0);
				s.C = c.x; s.D = c.y;
				s.xMin = lx.x; s.xMax = rx.x;
				s.A = s.A * scaleY;
				if (scaleX !== 1) s.B = s.B / scaleX;
				break;
			}
			case 'axes': {
				const o = transformPt(s.ox, s.oy);
				s.ox = o.x; s.oy = o.y;
				const xPos = s.xPosLen || s.xLen || 120;
				const xNeg = s.xNegLen || s.xLen || 120;
				const yPos = s.yPosLen || s.yLen || 120;
				const yNeg = s.yNegLen || s.yLen || 120;
				s.xPosLen = xPos * scaleX; s.xNegLen = xNeg * scaleX;
				s.yPosLen = yPos * scaleY; s.yNegLen = yNeg * scaleY;
				break;
			}
			case 'numberline': {
				const o = transformPt(s.ox, s.oy);
				s.ox = o.x; s.oy = o.y;
				s.leftLen = s.leftLen * scaleX;
				s.rightLen = s.rightLen * scaleX;
				break;
			}
			case 'axes3d': {
				const o = transformPt(s.ox, s.oy);
				s.ox = o.x; s.oy = o.y;
				s.xLen = s.xLen * scaleX;
				s.yLen = s.yLen * scaleY;
				s.zLen = s.zLen * Math.max(scaleX, scaleY);
				break;
			}
		}
	}

	// Scale all points
	if (obj.points) {
		for (const pt of obj.points) {
			const t = { x: (pt.x - oldCx) * scaleX + newCx, y: (pt.y - oldCy) * scaleY + newCy };
			pt.x = t.x; pt.y = t.y;
		}
	}
}

// ============ Anchor rendering ============

export function renderAnchors(ctx, obj, camera) {
	const anchors = getAnchors(obj, camera);
	if (anchors.length === 0) return;

	// Draw rotation handle line (from top-center of bounds to rotation anchor)
	const bounds = getStrokeBounds(obj);
	if (bounds) {
		const topCenterX = ((bounds.minX + bounds.maxX) / 2 - camera.x) * camera.zoom;
		const topCenterY = (bounds.minY - camera.y) * camera.zoom - 6; // 6 = padding
		const rotAnchor = anchors.find(a => a.id === 'rotation');
		if (rotAnchor) {
			const rx = (rotAnchor.x - camera.x) * camera.zoom;
			const ry = (rotAnchor.y - camera.y) * camera.zoom;
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
		const sx = (anchor.x - camera.x) * camera.zoom;
		const sy = (anchor.y - camera.y) * camera.zoom;
		const size = ANCHOR_SIZE;

		ctx.save();
		ctx.translate(sx, sy);

		switch (anchor.type) {
			case 'endpoint': // Circle
				ctx.beginPath();
				ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
				ctx.fillStyle = 'white';
				ctx.fill();
				ctx.strokeStyle = '#2563eb';
				ctx.lineWidth = 2;
				ctx.stroke();
				break;
			case 'center': // Crosshair circle
				ctx.beginPath();
				ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
				ctx.fillStyle = 'white';
				ctx.fill();
				ctx.strokeStyle = '#2563eb';
				ctx.lineWidth = 2;
				ctx.stroke();
				// Crosshair
				ctx.beginPath();
				ctx.moveTo(-size / 2, 0); ctx.lineTo(size / 2, 0);
				ctx.moveTo(0, -size / 2); ctx.lineTo(0, size / 2);
				ctx.strokeStyle = '#2563eb';
				ctx.lineWidth = 1;
				ctx.stroke();
				break;
			case 'scale': // Square
				ctx.fillStyle = 'white';
				ctx.fillRect(-size / 2, -size / 2, size, size);
				ctx.strokeStyle = '#2563eb';
				ctx.lineWidth = 2;
				ctx.strokeRect(-size / 2, -size / 2, size, size);
				break;
			case 'curve': // Diamond
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
			case 'stretch': // Small outlined square (green)
				ctx.fillStyle = 'white';
				ctx.fillRect(-size / 3, -size / 3, size * 2 / 3, size * 2 / 3);
				ctx.strokeStyle = '#16a34a';
				ctx.lineWidth = 1.5;
				ctx.strokeRect(-size / 3, -size / 3, size * 2 / 3, size * 2 / 3);
				break;
			case 'rotation': // Circular rotation icon (orange)
				ctx.beginPath();
				ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
				ctx.fillStyle = 'white';
				ctx.fill();
				ctx.strokeStyle = '#ea580c';
				ctx.lineWidth = 2;
				ctx.stroke();
				// Rotation arrow icon
				ctx.beginPath();
				ctx.arc(0, 0, size / 3, -Math.PI * 0.8, Math.PI * 0.5);
				ctx.strokeStyle = '#ea580c';
				ctx.lineWidth = 1.5;
				ctx.stroke();
				// Arrowhead on arc
				const tipAngle = Math.PI * 0.5;
				const tipX = (size / 3) * Math.cos(tipAngle);
				const tipY = (size / 3) * Math.sin(tipAngle);
				ctx.beginPath();
				ctx.moveTo(tipX, tipY);
				ctx.lineTo(tipX + 3, tipY - 3);
				ctx.moveTo(tipX, tipY);
				ctx.lineTo(tipX - 3, tipY - 2);
				ctx.stroke();
				break;
		}

		ctx.restore();
	}
}

// ============ Anchor hit testing ============

export function findAnchorAtPoint(obj, worldPos, camera) {
	const anchors = getAnchors(obj, camera);
	for (const anchor of anchors) {
		const sx = (anchor.x - camera.x) * camera.zoom;
		const sy = (anchor.y - camera.y) * camera.zoom;
		const px = (worldPos.x - camera.x) * camera.zoom;
		const py = (worldPos.y - camera.y) * camera.zoom;
		const dist = Math.hypot(px - sx, py - sy);
		if (dist < HIT_THRESHOLD) {
			return anchor;
		}
	}
	return null;
}
