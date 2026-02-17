// OpenMathBoard — 1-D Number line: horizontal axis with ticks + arrowheads

export function renderNumberline(ctx, obj) {
	if (!obj.shape) return;
	const { ox, oy, leftLen, rightLen, showTicks } = obj.shape;

	// Main line
	ctx.beginPath();
	ctx.moveTo(ox - leftLen, oy);
	ctx.lineTo(ox + rightLen, oy);
	ctx.stroke();

	// Arrowheads on both ends
	const hl = 10, ha = Math.PI / 6;
	// Right arrow
	ctx.beginPath();
	ctx.moveTo(ox + rightLen, oy);
	ctx.lineTo(ox + rightLen - hl * Math.cos(ha), oy - hl * Math.sin(ha));
	ctx.moveTo(ox + rightLen, oy);
	ctx.lineTo(ox + rightLen - hl * Math.cos(ha), oy + hl * Math.sin(ha));
	ctx.stroke();
	// Left arrow
	ctx.beginPath();
	ctx.moveTo(ox - leftLen, oy);
	ctx.lineTo(ox - leftLen + hl * Math.cos(ha), oy - hl * Math.sin(ha));
	ctx.moveTo(ox - leftLen, oy);
	ctx.lineTo(ox - leftLen + hl * Math.cos(ha), oy + hl * Math.sin(ha));
	ctx.stroke();

	// Ticks
	if (showTicks !== false) {
		const tickSize = 6, spacing = 30;
		// Origin tick (larger)
		ctx.beginPath();
		ctx.moveTo(ox, oy - tickSize * 1.5);
		ctx.lineTo(ox, oy + tickSize * 1.5);
		ctx.stroke();

		for (let x = ox + spacing; x < ox + rightLen - 5; x += spacing) {
			ctx.beginPath(); ctx.moveTo(x, oy - tickSize); ctx.lineTo(x, oy + tickSize); ctx.stroke();
		}
		for (let x = ox - spacing; x > ox - leftLen + 5; x -= spacing) {
			ctx.beginPath(); ctx.moveTo(x, oy - tickSize); ctx.lineTo(x, oy + tickSize); ctx.stroke();
		}
	}
}

export function createDefaultNumberline(worldX, worldY) {
	return {
		id: crypto.randomUUID(),
		type: 'numberline',
		color: '#000000',
		width: 2,
		dash: false,
		fill: 'none',
		shape: {
			type: 'numberline',
			ox: worldX, oy: worldY,
			leftLen: 150, rightLen: 150,
			showTicks: true
		},
		points: [
			{ x: worldX - 150, y: worldY },
			{ x: worldX + 150, y: worldY }
		]
	};
}

export function isPointNearNumberline(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { ox, oy, leftLen, rightLen } = obj.shape;
	const half = threshold + obj.width / 2;
	return pos.y >= oy - half && pos.y <= oy + half &&
		pos.x >= ox - leftLen - half && pos.x <= ox + rightLen + half;
}
