// OpenMathBoard — Hyperbola shape: (x-h)²/a² - (y-k)²/b² = 1

export function renderHyperbola(ctx, obj) {
	if (!obj.shape) return;
	const { h, k, a, b, xMin, xMax } = obj.shape;
	const steps = 400;

	// Parametric: x = h ± a*cosh(t), y = k + b*sinh(t)
	// At t=0 → vertex (h+a, k); as t grows → branches open

	// Right branch: t from -tMax to +tMax traces a smooth U-shape
	const rightEdge = xMax;
	if (rightEdge > h + a) {
		const tMax = Math.acosh((rightEdge - h) / a);
		ctx.beginPath();
		for (let i = 0; i <= steps; i++) {
			const t = -tMax + (i / steps) * (2 * tMax);
			const x = h + a * Math.cosh(t);
			const y = k + b * Math.sinh(t);
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	// Left branch: mirrored, x = h - a*cosh(t)
	const leftEdge = xMin;
	if (leftEdge < h - a) {
		const tMax = Math.acosh((h - leftEdge) / a);
		ctx.beginPath();
		for (let i = 0; i <= steps; i++) {
			const t = -tMax + (i / steps) * (2 * tMax);
			const x = h - a * Math.cosh(t);
			const y = k + b * Math.sinh(t);
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}
}

export function createDefaultHyperbola(worldX, worldY) {
	const h = worldX, k = worldY;
	const a = 60, b = 40;
	const xMin = worldX - 150, xMax = worldX + 150;
	return {
		id: crypto.randomUUID(),
		type: 'hyperbola',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: { type: 'hyperbola', h, k, a, b, xMin, xMax },
		points: generateHyperbolaPoints(h, k, a, b, xMin, xMax)
	};
}

function generateHyperbolaPoints(h, k, a, b, xMin, xMax) {
	const pts = [];
	const steps = 100;

	// Right branch
	const rightStart = h + a;
	const rightEnd = xMax;
	if (rightEnd > rightStart) {
		for (let i = 0; i <= steps; i++) {
			const x = rightStart + (i / steps) * (rightEnd - rightStart);
			const yOff = b * Math.sqrt((x - h) * (x - h) / (a * a) - 1);
			pts.push({ x, y: k + yOff });
		}
		for (let i = steps; i >= 0; i--) {
			const x = rightStart + (i / steps) * (rightEnd - rightStart);
			const yOff = b * Math.sqrt((x - h) * (x - h) / (a * a) - 1);
			pts.push({ x, y: k - yOff });
		}
	}

	// Left branch
	const leftEnd = h - a;
	const leftStart = xMin;
	if (leftStart < leftEnd) {
		for (let i = 0; i <= steps; i++) {
			const x = leftStart + (i / steps) * (leftEnd - leftStart);
			const yOff = b * Math.sqrt((x - h) * (x - h) / (a * a) - 1);
			pts.push({ x, y: k + yOff });
		}
		for (let i = steps; i >= 0; i--) {
			const x = leftStart + (i / steps) * (leftEnd - leftStart);
			const yOff = b * Math.sqrt((x - h) * (x - h) / (a * a) - 1);
			pts.push({ x, y: k - yOff });
		}
	}

	return pts;
}

export function isPointNearHyperbola(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { h, k, a, b, xMin, xMax } = obj.shape;
	const steps = 100;
	let minDist = Infinity;

	// Check right branch
	const rightStart = h + a;
	if (xMax > rightStart) {
		for (let i = 0; i <= steps; i++) {
			const x = rightStart + (i / steps) * (xMax - rightStart);
			const yOff = b * Math.sqrt((x - h) * (x - h) / (a * a) - 1);
			const d1 = Math.hypot(pos.x - x, pos.y - (k + yOff));
			const d2 = Math.hypot(pos.x - x, pos.y - (k - yOff));
			if (d1 < minDist) minDist = d1;
			if (d2 < minDist) minDist = d2;
		}
	}

	// Check left branch
	const leftEnd = h - a;
	if (xMin < leftEnd) {
		for (let i = 0; i <= steps; i++) {
			const x = xMin + (i / steps) * (leftEnd - xMin);
			const yOff = b * Math.sqrt((x - h) * (x - h) / (a * a) - 1);
			const d1 = Math.hypot(pos.x - x, pos.y - (k + yOff));
			const d2 = Math.hypot(pos.x - x, pos.y - (k - yOff));
			if (d1 < minDist) minDist = d1;
			if (d2 < minDist) minDist = d2;
		}
	}

	return minDist < threshold + obj.width / 2;
}
