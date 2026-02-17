// OpenMathBoard — Grid overlay + coordinate axes background
import { getCamera, getCanvasRect } from '../core/state.js';

let showGrid = false;
let showAxesOverlay = false;

export function toggleGrid() {
	showGrid = !showGrid;
	return showGrid;
}

export function toggleAxesOverlay() {
	showAxesOverlay = !showAxesOverlay;
	return showAxesOverlay;
}

export function isGridVisible() { return showGrid; }
export function isAxesOverlayVisible() { return showAxesOverlay; }

/**
 * Render grid and axes onto the canvas (called before strokes)
 */
export function renderGridOverlay(ctx, camera, canvasRect) {
	if (!showGrid && !showAxesOverlay) return;

	ctx.save();

	if (showGrid) {
		renderGrid(ctx, camera, canvasRect);
	}

	if (showAxesOverlay) {
		renderAxesBg(ctx, camera, canvasRect);
	}

	ctx.restore();
}

function renderGrid(ctx, camera, rect) {
	// Calculate grid spacing that looks reasonable at current zoom
	let baseSpacing = 40;
	let spacing = baseSpacing;

	// Scale grid lines with zoom
	while (spacing * camera.zoom < 20) spacing *= 2;
	while (spacing * camera.zoom > 80) spacing /= 2;

	const left = camera.x - 10 / camera.zoom;
	const top = camera.y - 10 / camera.zoom;
	const right = camera.x + rect.width / camera.zoom + 10;
	const bottom = camera.y + rect.height / camera.zoom + 10;

	const startX = Math.floor(left / spacing) * spacing;
	const startY = Math.floor(top / spacing) * spacing;

	ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
	ctx.lineWidth = 0.5 / camera.zoom;
	ctx.setLineDash([]);

	// Vertical lines
	for (let x = startX; x <= right; x += spacing) {
		ctx.beginPath();
		ctx.moveTo(x, top);
		ctx.lineTo(x, bottom);
		ctx.stroke();
	}

	// Horizontal lines
	for (let y = startY; y <= bottom; y += spacing) {
		ctx.beginPath();
		ctx.moveTo(left, y);
		ctx.lineTo(right, y);
		ctx.stroke();
	}
}

function renderAxesBg(ctx, camera, rect) {
	const left = camera.x;
	const top = camera.y;
	const right = camera.x + rect.width / camera.zoom;
	const bottom = camera.y + rect.height / camera.zoom;

	// X axis (y=0)
	if (top <= 0 && bottom >= 0) {
		ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
		ctx.lineWidth = 1 / camera.zoom;
		ctx.setLineDash([]);
		ctx.beginPath();
		ctx.moveTo(left, 0);
		ctx.lineTo(right, 0);
		ctx.stroke();
	}

	// Y axis (x=0)
	if (left <= 0 && right >= 0) {
		ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
		ctx.lineWidth = 1 / camera.zoom;
		ctx.setLineDash([]);
		ctx.beginPath();
		ctx.moveTo(0, top);
		ctx.lineTo(0, bottom);
		ctx.stroke();
	}
}
