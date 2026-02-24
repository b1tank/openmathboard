// OpenMathBoard — Triangle shape: render, create, hit testing

export function renderTriangle(ctx, obj) {
	if (!obj.shape) return;
	const { x1, y1, x2, y2, x3, y3 } = obj.shape;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x3, y3);
	ctx.closePath();
	ctx.stroke();
}

export function createDefaultTriangle(worldX, worldY) {
	// Equilateral triangle centered at (worldX, worldY), side ≈ 140
	const side = 140;
	const h = side * Math.sqrt(3) / 2;
	return {
		id: crypto.randomUUID(),
		type: 'triangle',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'triangle',
			x1: worldX, y1: worldY - h * 2 / 3,
			x2: worldX - side / 2, y2: worldY + h / 3,
			x3: worldX + side / 2, y3: worldY + h / 3
		},
		points: [
			{ x: worldX, y: worldY - h * 2 / 3 },
			{ x: worldX - side / 2, y: worldY + h / 3 },
			{ x: worldX + side / 2, y: worldY + h / 3 },
			{ x: worldX, y: worldY - h * 2 / 3 }
		]
	};
}

export function isPointNearTriangle(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { x1, y1, x2, y2, x3, y3 } = obj.shape;
	const band = threshold + obj.width / 2;
	// Check proximity to each of the 3 edges
	if (ptSegDist(pos, x1, y1, x2, y2) < band) return true;
	if (ptSegDist(pos, x2, y2, x3, y3) < band) return true;
	if (ptSegDist(pos, x3, y3, x1, y1) < band) return true;
	return false;
}

function ptSegDist(pos, ax, ay, bx, by) {
	const abx = bx - ax, aby = by - ay;
	const apx = pos.x - ax, apy = pos.y - ay;
	const len2 = abx * abx + aby * aby;
	if (len2 < 1e-6) return Math.hypot(apx, apy);
	let t = (apx * abx + apy * aby) / len2;
	t = Math.max(0, Math.min(1, t));
	return Math.hypot(pos.x - (ax + t * abx), pos.y - (ay + t * aby));
}
