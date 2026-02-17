// OpenMathBoard — Ellipse shape: render, anchors, hit testing

export function renderEllipse(ctx, obj) {
	if (!obj.shape) return;
	ctx.beginPath();
	ctx.ellipse(obj.shape.cx, obj.shape.cy, obj.shape.rx, obj.shape.ry, obj.shape.rotation || 0, 0, Math.PI * 2);
	ctx.stroke();
	if (obj.fill && obj.fill !== 'none') {
		ctx.fillStyle = obj.fill === 'transparent' ? 'rgba(0,0,0,0.05)' : obj.color;
		ctx.globalAlpha = obj.fill === 'transparent' ? 0.1 : 0.3;
		ctx.fill();
		ctx.globalAlpha = 1;
	}
}

export function createDefaultEllipse(worldX, worldY) {
	return {
		id: crypto.randomUUID(),
		type: 'ellipse',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'ellipse',
			cx: worldX,
			cy: worldY,
			rx: 80,
			ry: 50,
			rotation: 0
		},
		points: generateEllipsePoints(worldX, worldY, 80, 50, 120)
	};
}

function generateEllipsePoints(cx, cy, rx, ry, count) {
	const pts = [];
	for (let i = 0; i <= count; i++) {
		const t = (i / count) * Math.PI * 2;
		pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
	}
	return pts;
}

export function isPointNearEllipse(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { cx, cy, rx, ry } = obj.shape;
	// Approximate: check if distance from point to ellipse boundary is within threshold
	const dx = pos.x - cx, dy = pos.y - cy;
	const normalized = Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
	const distFromEdge = Math.abs(normalized - 1) * Math.min(rx, ry);
	return distFromEdge < threshold + obj.width / 2;
}
