// Shared test utilities for OpenMathBoard e2e tests

/**
 * Check if a region of the canvas has non-white pixels (something was drawn)
 */
export async function hasDrawnPixels(page, x, y, w, h) {
	return page.evaluate(({ x, y, w, h }) => {
		const canvas = document.querySelector('canvas');
		const ctx = canvas.getContext('2d');
		const data = ctx.getImageData(x, y, w, h).data;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return true;
		}
		return false;
	}, { x, y, w, h });
}

/**
 * Draw a stroke on the canvas from point A to point B
 */
export async function drawStroke(page, x1, y1, x2, y2, steps = 10) {
	await page.mouse.move(x1, y1);
	await page.mouse.down();
	for (let i = 1; i <= steps; i++) {
		const t = i / steps;
		await page.mouse.move(
			x1 + (x2 - x1) * t,
			y1 + (y2 - y1) * t
		);
	}
	await page.mouse.up();
}

/**
 * Wait for canvas to be ready (visible and sized)
 */
export async function waitForCanvas(page) {
	await page.waitForSelector('#drawingCanvas', { state: 'visible' });
	// Small delay for DOMContentLoaded to fire and canvas to initialize
	await page.waitForTimeout(500);
}
