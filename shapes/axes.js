// OpenMathBoard — Coordinate axes shape: x-y axes with tick marks

export function renderAxes(ctx, obj) {
	if (!obj.shape) return;
	const { ox, oy, xLen, yLen } = obj.shape;

	// X axis
	ctx.beginPath();
	ctx.moveTo(ox - xLen, oy);
	ctx.lineTo(ox + xLen, oy);
	ctx.stroke();

	// Y axis
	ctx.beginPath();
	ctx.moveTo(ox, oy + yLen);
	ctx.lineTo(ox, oy - yLen);
	ctx.stroke();

	// Arrowheads
	const headLen = 10;
	const headAngle = Math.PI / 6;

	// X arrow
	ctx.beginPath();
	ctx.moveTo(ox + xLen, oy);
	ctx.lineTo(ox + xLen - headLen * Math.cos(headAngle), oy - headLen * Math.sin(headAngle));
	ctx.moveTo(ox + xLen, oy);
	ctx.lineTo(ox + xLen - headLen * Math.cos(headAngle), oy + headLen * Math.sin(headAngle));
	ctx.stroke();

	// Y arrow
	ctx.beginPath();
	ctx.moveTo(ox, oy - yLen);
	ctx.lineTo(ox - headLen * Math.sin(headAngle), oy - yLen + headLen * Math.cos(headAngle));
	ctx.moveTo(ox, oy - yLen);
	ctx.lineTo(ox + headLen * Math.sin(headAngle), oy - yLen + headLen * Math.cos(headAngle));
	ctx.stroke();

	// Tick marks
	const tickSize = 5;
	const tickSpacing = 30;

	// X ticks
	for (let x = ox - xLen + tickSpacing; x < ox + xLen; x += tickSpacing) {
		if (Math.abs(x - ox) < tickSpacing / 2) continue; // skip origin
		ctx.beginPath();
		ctx.moveTo(x, oy - tickSize);
		ctx.lineTo(x, oy + tickSize);
		ctx.stroke();
	}

	// Y ticks
	for (let y = oy - yLen + tickSpacing; y < oy + yLen; y += tickSpacing) {
		if (Math.abs(y - oy) < tickSpacing / 2) continue;
		ctx.beginPath();
		ctx.moveTo(ox - tickSize, y);
		ctx.lineTo(ox + tickSize, y);
		ctx.stroke();
	}
}

export function createDefaultAxes(worldX, worldY) {
	return {
		id: crypto.randomUUID(),
		type: 'axes',
		color: '#000000',
		width: 2,
		dash: false,
		fill: 'none',
		shape: {
			type: 'axes',
			ox: worldX,
			oy: worldY,
			xLen: 120,
			yLen: 120
		},
		points: [
			{ x: worldX - 120, y: worldY },
			{ x: worldX + 120, y: worldY },
			{ x: worldX, y: worldY - 120 },
			{ x: worldX, y: worldY + 120 }
		]
	};
}

export function isPointNearAxes(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { ox, oy, xLen, yLen } = obj.shape;
	const half = threshold + obj.width / 2;

	// Check X axis
	if (pos.y >= oy - half && pos.y <= oy + half &&
		pos.x >= ox - xLen - half && pos.x <= ox + xLen + half) {
		return true;
	}

	// Check Y axis
	if (pos.x >= ox - half && pos.x <= ox + half &&
		pos.y >= oy - yLen - half && pos.y <= oy + yLen + half) {
		return true;
	}

	return false;
}
