// OpenMathBoard — Sine/Cosine shape: y = A·sin(B(x - C)) + D
// Enhanced anchors for period control, amplitude, stretch/narrow

export function renderSine(ctx, obj) {
	if (!obj.shape) return;
	const { A, B, C, D, xMin, xMax } = obj.shape;
	const isCosine = obj.shape.type === 'cosine';
	const steps = Math.max(200, Math.ceil(Math.abs(xMax - xMin) * 2));
	ctx.beginPath();
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = xMin + t * (xMax - xMin);
		const y = isCosine
			? A * Math.cos(B * (x - C)) + D
			: A * Math.sin(B * (x - C)) + D;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();
}

export function createDefaultSine(worldX, worldY) {
	const period = 200;
	const B = (2 * Math.PI) / period;
	return {
		id: crypto.randomUUID(),
		type: 'sine',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'sine',
			A: 50, B, C: worldX, D: worldY,
			xMin: worldX - period,
			xMax: worldX + period
		},
		points: genPts(50, B, worldX, worldY, worldX - period, worldX + period, false)
	};
}

export function createDefaultCosine(worldX, worldY) {
	const period = 200;
	const B = (2 * Math.PI) / period;
	return {
		id: crypto.randomUUID(),
		type: 'cosine',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'cosine',
			A: 50, B, C: worldX, D: worldY,
			xMin: worldX - period,
			xMax: worldX + period
		},
		points: genPts(50, B, worldX, worldY, worldX - period, worldX + period, true)
	};
}

function genPts(A, B, C, D, xMin, xMax, isCosine) {
	const pts = [];
	const steps = 100;
	for (let i = 0; i <= steps; i++) {
		const x = xMin + (i / steps) * (xMax - xMin);
		const y = isCosine
			? A * Math.cos(B * (x - C)) + D
			: A * Math.sin(B * (x - C)) + D;
		pts.push({ x, y });
	}
	return pts;
}

export function isPointNearSine(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { A, B, C, D, xMin, xMax } = obj.shape;
	const isCosine = obj.shape.type === 'cosine';
	const steps = 100;
	let minDist = Infinity;
	for (let i = 0; i <= steps; i++) {
		const x = xMin + (i / steps) * (xMax - xMin);
		const y = isCosine
			? A * Math.cos(B * (x - C)) + D
			: A * Math.sin(B * (x - C)) + D;
		const d = Math.hypot(pos.x - x, pos.y - y);
		if (d < minDist) minDist = d;
	}
	return minDist < threshold + obj.width / 2;
}
