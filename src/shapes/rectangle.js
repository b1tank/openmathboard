// OpenMathBoard — Rectangle shape: render, create, hit testing

export function renderRectangle(ctx, obj) {
	if (!obj.shape) return;
	const { cx, cy, w, h } = obj.shape;
	ctx.beginPath();
	ctx.rect(cx - w / 2, cy - h / 2, w, h);
	ctx.stroke();
}

export function createDefaultRectangle(worldX, worldY) {
	const w = 160, h = 100;
	return {
		id: crypto.randomUUID(),
		type: 'rectangle',
		color: '#000000',
		width: 4,
		dash: false,
		fill: 'none',
		shape: {
			type: 'rectangle',
			cx: worldX,
			cy: worldY,
			w,
			h
		},
		points: generateRectPoints(worldX, worldY, w, h)
	};
}

function generateRectPoints(cx, cy, w, h) {
	const hw = w / 2, hh = h / 2;
	return [
		{ x: cx - hw, y: cy - hh },
		{ x: cx + hw, y: cy - hh },
		{ x: cx + hw, y: cy + hh },
		{ x: cx - hw, y: cy + hh },
		{ x: cx - hw, y: cy - hh }
	];
}

export function isPointNearRectangle(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { cx, cy, w, h } = obj.shape;
	const left = cx - w / 2, right = cx + w / 2, top = cy - h / 2, bottom = cy + h / 2;
	const band = threshold + obj.width / 2;

	if (pos.x >= left - band && pos.x <= right + band && Math.abs(pos.y - top) < band) return true;
	if (pos.x >= left - band && pos.x <= right + band && Math.abs(pos.y - bottom) < band) return true;
	if (pos.y >= top - band && pos.y <= bottom + band && Math.abs(pos.x - left) < band) return true;
	if (pos.y >= top - band && pos.y <= bottom + band && Math.abs(pos.x - right) < band) return true;
	return false;
}
