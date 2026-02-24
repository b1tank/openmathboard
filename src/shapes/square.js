// OpenMathBoard — Square shape: render, create, hit testing

export function renderSquare(ctx, obj) {
	if (!obj.shape) return;
	const { cx, cy, size } = obj.shape;
	const half = size / 2;
	ctx.beginPath();
	ctx.rect(cx - half, cy - half, size, size);
	ctx.stroke();
}

export function createDefaultSquare(worldX, worldY) {
	const size = 120;
	return {
		id: crypto.randomUUID(),
		type: 'square',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'square',
			cx: worldX,
			cy: worldY,
			size
		},
		points: generateSquarePoints(worldX, worldY, size)
	};
}

function generateSquarePoints(cx, cy, size) {
	const half = size / 2;
	return [
		{ x: cx - half, y: cy - half },
		{ x: cx + half, y: cy - half },
		{ x: cx + half, y: cy + half },
		{ x: cx - half, y: cy + half },
		{ x: cx - half, y: cy - half }
	];
}

export function isPointNearSquare(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { cx, cy, size } = obj.shape;
	const half = size / 2;
	const left = cx - half, right = cx + half, top = cy - half, bottom = cy + half;
	const band = threshold + obj.width / 2;

	// Check proximity to each of the 4 edges
	if (pos.x >= left - band && pos.x <= right + band && Math.abs(pos.y - top) < band) return true;
	if (pos.x >= left - band && pos.x <= right + band && Math.abs(pos.y - bottom) < band) return true;
	if (pos.y >= top - band && pos.y <= bottom + band && Math.abs(pos.x - left) < band) return true;
	if (pos.y >= top - band && pos.y <= bottom + band && Math.abs(pos.x - right) < band) return true;
	return false;
}
