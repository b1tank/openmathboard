// OpenMathBoard — Anchor system (rendering, hit testing, drag handling)
import { getCamera } from './state.js';
import { worldToScreen } from './camera.js';

const ANCHOR_SIZE = 12;
const HIT_THRESHOLD = 28; // screen pixels — large for touch targets

// ============ Get anchors for any shape type ============

export function getAnchors(obj) {
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
		case 'axes':
			return [
				{ id: 'origin', x: obj.shape.ox, y: obj.shape.oy, type: 'center' },
				{ id: 'xEnd', x: obj.shape.ox + obj.shape.xLen, y: obj.shape.oy, type: 'scale' },
				{ id: 'yEnd', x: obj.shape.ox, y: obj.shape.oy - obj.shape.yLen, type: 'scale' },
			];
		default:
			return [];
	}
}

// ============ Anchor drag handling ============

export function onAnchorDrag(obj, anchorId, newWorldPos) {
	if (!obj || !obj.shape) return;

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
			if (anchorId === 'rx') { obj.shape.rx = Math.abs(newWorldPos.x - obj.shape.cx); }
			if (anchorId === 'ry') { obj.shape.ry = Math.abs(newWorldPos.y - obj.shape.cy); }
			break;
		case 'parabola':
			if (anchorId === 'vertex') { obj.shape.h = newWorldPos.x; obj.shape.k = newWorldPos.y; }
			if (anchorId === 'left') {
				obj.shape.xMin = newWorldPos.x;
				const dx = obj.shape.xMin - obj.shape.h;
				if (Math.abs(dx) > 1) obj.shape.a = (newWorldPos.y - obj.shape.k) / (dx * dx);
			}
			if (anchorId === 'right') {
				obj.shape.xMax = newWorldPos.x;
				const dx = obj.shape.xMax - obj.shape.h;
				if (Math.abs(dx) > 1) obj.shape.a = (newWorldPos.y - obj.shape.k) / (dx * dx);
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
			if (anchorId === 'xEnd') { obj.shape.xLen = newWorldPos.x - obj.shape.ox; }
			if (anchorId === 'yEnd') { obj.shape.yLen = obj.shape.oy - newWorldPos.y; }
			break;
	}
}

// ============ Anchor rendering ============

export function renderAnchors(ctx, obj, camera) {
	const anchors = getAnchors(obj);
	if (anchors.length === 0) return;

	const invZoom = 1 / camera.zoom;

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
		}

		ctx.restore();
	}
}

// ============ Anchor hit testing ============

export function findAnchorAtPoint(obj, worldPos, camera) {
	const anchors = getAnchors(obj);
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
