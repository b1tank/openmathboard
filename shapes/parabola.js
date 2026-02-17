// OpenMathBoard — Parabola shape: y = a(x-h)² + k

export function renderParabola(ctx, obj) {
	if (!obj.shape) return;
	const { h, k, a, xMin, xMax } = obj.shape;
	const steps = 200;
	ctx.beginPath();
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = xMin + t * (xMax - xMin);
		const y = a * (x - h) ** 2 + k;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();
}

export function createDefaultParabola(worldX, worldY) {
	const h = worldX, k = worldY;
	const a = 0.01;
	const xMin = worldX - 100, xMax = worldX + 100;
	return {
		id: crypto.randomUUID(),
		type: 'parabola',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: { type: 'parabola', h, k, a, xMin, xMax },
		points: generateParabolaPoints(h, k, a, xMin, xMax)
	};
}

function generateParabolaPoints(h, k, a, xMin, xMax) {
	const pts = [];
	const steps = 100;
	for (let i = 0; i <= steps; i++) {
		const x = xMin + (i / steps) * (xMax - xMin);
		pts.push({ x, y: a * (x - h) ** 2 + k });
	}
	return pts;
}

export function isPointNearParabola(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { h, k, a, xMin, xMax } = obj.shape;
	const steps = 100;
	let minDist = Infinity;
	for (let i = 0; i <= steps; i++) {
		const x = xMin + (i / steps) * (xMax - xMin);
		const y = a * (x - h) ** 2 + k;
		const d = Math.hypot(pos.x - x, pos.y - y);
		if (d < minDist) minDist = d;
	}
	return minDist < threshold + obj.width / 2;
}
