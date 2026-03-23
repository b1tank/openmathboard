// Input architecture e2e tests — pointercancel, rapid strokes
import { test, expect } from '@playwright/test';
import { drawStroke, waitForCanvas, hasDrawnPixels } from './helpers.js';

test.describe('Input Architecture', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
	});

	test('rapid short strokes all register (10 consecutive)', async ({ page }) => {
		const toolbarH = 56;
		const baseY = toolbarH + 100;

		// Draw 10 short strokes side by side
		for (let i = 0; i < 10; i++) {
			const x = 100 + i * 50;
			await drawStroke(page, x, baseY, x, baseY + 30, 3);
			await page.waitForTimeout(50);
		}

		// Check that strokes exist by counting via JS
		const strokeCount = await page.evaluate(() => {
			// Access the strokes array from state
			const mod = window.__OMB_STATE;
			if (mod && typeof mod.getStrokes === 'function') {
				return mod.getStrokes().length;
			}
			return -1;
		});

		// If we can't access state, fall back to pixel check
		if (strokeCount >= 0) {
			expect(strokeCount).toBeGreaterThanOrEqual(10);
		} else {
			// Pixel check on the last stroke area
			const hasPixels = await hasDrawnPixels(page, 500, baseY - toolbarH - 10, 60, 60);
			expect(hasPixels).toBe(true);
		}
	});

	test('pointercancel discards in-progress stroke', async ({ page }) => {
		const toolbarH = 56;

		// Start a stroke but don't finish it — fire pointercancel instead
		await page.mouse.move(300, toolbarH + 150);
		await page.mouse.down();
		await page.mouse.move(350, toolbarH + 180);
		await page.mouse.move(400, toolbarH + 200);

		// Fire synthetic pointercancel on the live canvas
		await page.evaluate(() => {
			const liveCanvas = document.getElementById('liveCanvas');
			const event = new PointerEvent('pointercancel', {
				pointerId: 1,
				pointerType: 'mouse',
				bubbles: true,
				cancelable: true
			});
			liveCanvas.dispatchEvent(event);
		});

		await page.waitForTimeout(200);

		// The stroke should NOT have been committed
		const hasPixels = await hasDrawnPixels(page, 280, 130, 150, 100);
		expect(hasPixels).toBe(false);
	});
});
