// OpenMathBoard — Line shape: render, anchors, hit testing

export function renderLine(ctx, obj) {
	if (!obj.shape) return;
	ctx.beginPath();
	ctx.moveTo(obj.shape.x1, obj.shape.y1);
	ctx.lineTo(obj.shape.x2, obj.shape.y2);
	ctx.stroke();
}

export function createDefaultLine(worldX, worldY) {
	return {
		id: crypto.randomUUID(),
		type: 'line',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'line',
			x1: worldX - 80,
			y1: worldY,
			x2: worldX + 80,
			y2: worldY
		},
		points: [
			{ x: worldX - 80, y: worldY },
			{ x: worldX + 80, y: worldY }
		]
	};
}

export function isPointNearLine(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { x1, y1, x2, y2 } = obj.shape;
	const abx = x2 - x1, aby = y2 - y1;
	const apx = pos.x - x1, apy = pos.y - y1;
	const abLen2 = abx * abx + aby * aby;
	if (abLen2 < 1e-6) return Math.hypot(apx, apy) < threshold;
	let t = (apx * abx + apy * aby) / abLen2;
	t = Math.max(0, Math.min(1, t));
	const cx = x1 + t * abx, cy = y1 + t * aby;
	return Math.hypot(pos.x - cx, pos.y - cy) < threshold + obj.width / 2;
}
