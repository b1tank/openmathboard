// OpenMathBoard — 2-D Coordinate axes with 4 independent arms + tick toggle

export function renderAxes(ctx, obj) {
	if (!obj.shape) return;
	const s = obj.shape;
	const { ox, oy } = s;
	const xPos = s.xPosLen || s.xLen || 120;
	const xNeg = s.xNegLen || s.xLen || 120;
	const yPos = s.yPosLen || s.yLen || 120; // downward in screen coords
	const yNeg = s.yNegLen || s.yLen || 120; // upward in screen coords

	// X axis (left to right)
	ctx.beginPath();
	ctx.moveTo(ox - xNeg, oy);
	ctx.lineTo(ox + xPos, oy);
	ctx.stroke();

	// Y axis (bottom to top, screen coords inverted)
	ctx.beginPath();
	ctx.moveTo(ox, oy + yPos);
	ctx.lineTo(ox, oy - yNeg);
	ctx.stroke();

	// Arrowheads
	const hl = 10, ha = Math.PI / 6;
	drawArrowhead(ctx, ox + xPos, oy, 0, hl, ha);       // +x
	drawArrowhead(ctx, ox - xNeg, oy, Math.PI, hl, ha);  // -x
	drawArrowhead(ctx, ox, oy - yNeg, -Math.PI / 2, hl, ha); // -y (up)
	drawArrowhead(ctx, ox, oy + yPos, Math.PI / 2, hl, ha);  // +y (down)

	// Tick marks (optional)
	if (s.showTicks !== false) {
		const tickSize = 5;
		const tickSpacing = 30;

		for (let x = ox + tickSpacing; x < ox + xPos; x += tickSpacing) {
			ctx.beginPath(); ctx.moveTo(x, oy - tickSize); ctx.lineTo(x, oy + tickSize); ctx.stroke();
		}
		for (let x = ox - tickSpacing; x > ox - xNeg; x -= tickSpacing) {
			ctx.beginPath(); ctx.moveTo(x, oy - tickSize); ctx.lineTo(x, oy + tickSize); ctx.stroke();
		}
		for (let y = oy - tickSpacing; y > oy - yNeg; y -= tickSpacing) {
			ctx.beginPath(); ctx.moveTo(ox - tickSize, y); ctx.lineTo(ox + tickSize, y); ctx.stroke();
		}
		for (let y = oy + tickSpacing; y < oy + yPos; y += tickSpacing) {
			ctx.beginPath(); ctx.moveTo(ox - tickSize, y); ctx.lineTo(ox + tickSize, y); ctx.stroke();
		}
	}
}

function drawArrowhead(ctx, tipX, tipY, angle, len, spread) {
	ctx.beginPath();
	ctx.moveTo(tipX, tipY);
	ctx.lineTo(tipX - len * Math.cos(angle - spread), tipY - len * Math.sin(angle - spread));
	ctx.moveTo(tipX, tipY);
	ctx.lineTo(tipX - len * Math.cos(angle + spread), tipY - len * Math.sin(angle + spread));
	ctx.stroke();
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
			ox: worldX, oy: worldY,
			xPosLen: 120, xNegLen: 120,
			yPosLen: 120, yNegLen: 120,
			showTicks: true,
			// Legacy compat
			xLen: 120, yLen: 120
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
	const s = obj.shape;
	const { ox, oy } = s;
	const xPos = s.xPosLen || s.xLen || 120;
	const xNeg = s.xNegLen || s.xLen || 120;
	const yPos = s.yPosLen || s.yLen || 120;
	const yNeg = s.yNegLen || s.yLen || 120;
	const half = threshold + obj.width / 2;

	if (pos.y >= oy - half && pos.y <= oy + half &&
		pos.x >= ox - xNeg - half && pos.x <= ox + xPos + half) return true;
	if (pos.x >= ox - half && pos.x <= ox + half &&
		pos.y >= oy - yNeg - half && pos.y <= oy + yPos + half) return true;
	return false;
}
