// OpenMathBoard — 3-D isometric axes (x right, y up, z out at 30°)

const Z_ANGLE = Math.PI / 6; // 30° for z-axis (isometric projection)
const COS_Z = Math.cos(Math.PI - Z_ANGLE); // pointing lower-left
const SIN_Z = Math.sin(Math.PI - Z_ANGLE);

export function renderAxes3d(ctx, obj) {
	if (!obj.shape) return;
	const { ox, oy, xLen, yLen, zLen, showTicks } = obj.shape;

	// X axis (right)
	ctx.beginPath();
	ctx.moveTo(ox, oy);
	ctx.lineTo(ox + xLen, oy);
	ctx.stroke();
	drawArrowhead(ctx, ox + xLen, oy, 0);

	// Y axis (up)
	ctx.beginPath();
	ctx.moveTo(ox, oy);
	ctx.lineTo(ox, oy - yLen);
	ctx.stroke();
	drawArrowhead(ctx, ox, oy - yLen, -Math.PI / 2);

	// Z axis (lower-left at 30°)
	const zEndX = ox + zLen * COS_Z;
	const zEndY = oy - zLen * SIN_Z;
	ctx.beginPath();
	ctx.moveTo(ox, oy);
	ctx.lineTo(zEndX, zEndY);
	ctx.stroke();
	drawArrowhead(ctx, zEndX, zEndY, Math.PI - Z_ANGLE);

	// Tick marks
	if (showTicks !== false) {
		const tickSize = 4, spacing = 30;

		// X ticks
		for (let d = spacing; d < xLen - 5; d += spacing) {
			ctx.beginPath(); ctx.moveTo(ox + d, oy - tickSize); ctx.lineTo(ox + d, oy + tickSize); ctx.stroke();
		}
		// Y ticks
		for (let d = spacing; d < yLen - 5; d += spacing) {
			ctx.beginPath(); ctx.moveTo(ox - tickSize, oy - d); ctx.lineTo(ox + tickSize, oy - d); ctx.stroke();
		}
		// Z ticks
		for (let d = spacing; d < zLen - 5; d += spacing) {
			const tx = ox + d * COS_Z;
			const ty = oy - d * SIN_Z;
			const nx = -SIN_Z * tickSize;
			const ny = -COS_Z * tickSize;
			ctx.beginPath(); ctx.moveTo(tx + nx, ty + ny); ctx.lineTo(tx - nx, ty - ny); ctx.stroke();
		}
	}

	// Axis labels (small text)
	ctx.save();
	ctx.font = `${Math.max(10, obj.width * 3)}px sans-serif`;
	ctx.fillStyle = obj.color;
	ctx.textAlign = 'center';
	ctx.fillText('x', ox + xLen + 12, oy + 4);
	ctx.fillText('y', ox - 12, oy - yLen);
	ctx.fillText('z', zEndX - 10, zEndY - 4);
	ctx.restore();
}

function drawArrowhead(ctx, tipX, tipY, angle) {
	const len = 8, spread = Math.PI / 6;
	ctx.beginPath();
	ctx.moveTo(tipX, tipY);
	ctx.lineTo(tipX - len * Math.cos(angle - spread), tipY - len * Math.sin(angle - spread));
	ctx.moveTo(tipX, tipY);
	ctx.lineTo(tipX - len * Math.cos(angle + spread), tipY - len * Math.sin(angle + spread));
	ctx.stroke();
}

export function createDefaultAxes3d(worldX, worldY) {
	return {
		id: crypto.randomUUID(),
		type: 'axes3d',
		color: '#000000',
		width: 2,
		dash: false,
		fill: 'none',
		shape: {
			type: 'axes3d',
			ox: worldX, oy: worldY,
			xLen: 100, yLen: 100, zLen: 80,
			showTicks: true
		},
		points: [
			{ x: worldX, y: worldY },
			{ x: worldX + 100, y: worldY },
			{ x: worldX, y: worldY - 100 },
			{ x: worldX + 80 * COS_Z, y: worldY - 80 * SIN_Z }
		]
	};
}

export function isPointNearAxes3d(pos, obj, threshold = 15) {
	if (!obj.shape) return false;
	const { ox, oy, xLen, yLen, zLen } = obj.shape;
	const half = threshold + obj.width / 2;

	// X axis
	if (pos.y >= oy - half && pos.y <= oy + half && pos.x >= ox - half && pos.x <= ox + xLen + half) return true;
	// Y axis
	if (pos.x >= ox - half && pos.x <= ox + half && pos.y >= oy - yLen - half && pos.y <= oy + half) return true;
	// Z axis (point-to-segment check)
	const zEndX = ox + zLen * COS_Z, zEndY = oy - zLen * SIN_Z;
	const abx = zEndX - ox, aby = zEndY - oy;
	const apx = pos.x - ox, apy = pos.y - oy;
	const len2 = abx * abx + aby * aby;
	if (len2 > 0) {
		const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / len2));
		const cx = ox + t * abx, cy = oy + t * aby;
		if (Math.hypot(pos.x - cx, pos.y - cy) < half) return true;
	}
	return false;
}
