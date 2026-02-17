// OpenMathBoard — Freehand stroke rendering + hit testing
import { pointToPolylineDistance } from '../detection.js';

export function renderFreehand(ctx, stroke) {
	if (!stroke || !stroke.points || stroke.points.length < 2) return;

	ctx.beginPath();
	ctx.strokeStyle = stroke.color;
	ctx.lineWidth = stroke.width;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	if (stroke.dash) {
		ctx.setLineDash([8, 6]);
	} else {
		ctx.setLineDash([]);
	}

	const points = stroke.points;
	ctx.moveTo(points[0].x, points[0].y);

	// Smooth curve through points
	for (let i = 1; i < points.length - 1; i++) {
		const xc = (points[i].x + points[i + 1].x) / 2;
		const yc = (points[i].y + points[i + 1].y) / 2;
		ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
	}

	// Last point
	if (points.length > 1) {
		const last = points[points.length - 1];
		ctx.lineTo(last.x, last.y);
	}

	ctx.stroke();
	ctx.setLineDash([]);
}

export function isPointNearFreehand(pos, stroke, threshold = 15) {
	if (!stroke.points || stroke.points.length < 2) return false;
	return pointToPolylineDistance(pos, stroke.points) < threshold + stroke.width / 2;
}
