// OpenMathBoard — Arrow shape: line + arrowhead

export function renderArrow(ctx, obj) {
	if (!obj.shape) return;
	const { x1, y1, x2, y2 } = obj.shape;

	// Line
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();

	// Arrowhead
	const angle = Math.atan2(y2 - y1, x2 - x1);
	const headLen = Math.max(12, obj.width * 3);
	const headAngle = Math.PI / 6;

	ctx.beginPath();
	ctx.moveTo(x2, y2);
	ctx.lineTo(
		x2 - headLen * Math.cos(angle - headAngle),
		y2 - headLen * Math.sin(angle - headAngle)
	);
	ctx.moveTo(x2, y2);
	ctx.lineTo(
		x2 - headLen * Math.cos(angle + headAngle),
		y2 - headLen * Math.sin(angle + headAngle)
	);
	ctx.stroke();
}

export function createDefaultArrow(worldX, worldY) {
	return {
		id: crypto.randomUUID(),
		type: 'arrow',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'arrow',
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

export function isPointNearArrow(pos, obj, threshold = 15) {
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
