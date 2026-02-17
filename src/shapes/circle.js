// OpenMathBoard — Circle shape: render, anchors, hit testing

export function renderCircle(ctx, obj) {
	if (!obj.shape) return;
	ctx.beginPath();
	ctx.arc(obj.shape.cx, obj.shape.cy, obj.shape.r, 0, Math.PI * 2);
	ctx.stroke();
	if (obj.fill && obj.fill !== 'none') {
		ctx.fillStyle = obj.fill === 'transparent' ? 'rgba(0,0,0,0.05)' : obj.color;
		ctx.globalAlpha = obj.fill === 'transparent' ? 0.1 : 0.3;
		ctx.fill();
		ctx.globalAlpha = 1;
	}
}

export function createDefaultCircle(worldX, worldY) {
	return {
		id: crypto.randomUUID(),
		type: 'circle',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'circle',
			cx: worldX,
			cy: worldY,
			r: 60
		},
		points: generateCirclePoints(worldX, worldY, 60, 120)
	};
}

function generateCirclePoints(cx, cy, r, count) {
	const pts = [];
	for (let i = 0; i <= count; i++) {
		const t = (i / count) * Math.PI * 2;
		pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r });
	}
	return pts;
}

export function isPointNearCircle(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const dist = Math.hypot(pos.x - obj.shape.cx, pos.y - obj.shape.cy);
	return Math.abs(dist - obj.shape.r) < threshold + obj.width / 2;
}
