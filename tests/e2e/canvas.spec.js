// Canvas e2e tests — draw freehand, zoom, pan
import { test, expect } from '@playwright/test';
import { hasDrawnPixels, drawStroke, waitForCanvas } from './helpers.js';

test.describe('Canvas', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
	});

	test('draw freehand stroke appears on canvas', async ({ page }) => {
		// The toolbar height offset
		const toolbarH = 56;
		const cx = 512;
		const cy = toolbarH + 200;

		// Draw a diagonal stroke
		await drawStroke(page, cx - 100, cy, cx + 100, cy + 100);

		// Verify pixels were drawn in that region
		const hasPixels = await hasDrawnPixels(page, cx - 100, cy - toolbarH, 200, 150);
		expect(hasPixels).toBe(true);
	});
});
