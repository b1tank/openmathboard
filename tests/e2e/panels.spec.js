import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers.js';

test.describe('Floating panels', () => {
	test('mobile properties stay centered near the shape and yield to the shape picker', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await waitForCanvas(page);

		await page.evaluate(async () => {
			const state = await import('/src/core/state.js');
			const properties = await import('/src/ui/property-panel.js');
			properties.initPropertyPanel();
			state.setStrokes([{
				width: 4,
				color: '#000000',
				dash: false,
				shape: { type: 'circle', cx: 195, cy: 200, r: 60 },
				points: []
			}]);
			state.setSelectedStrokes([0]);
			properties.updatePropertyPanel();
		});

		const properties = page.locator('#propertyPanel');
		await expect(properties).toHaveClass(/show/);
		const box = await properties.boundingBox();
		expect(box).not.toBeNull();
		expect(box.x + box.width / 2).toBeCloseTo(195, 0);
		// Circle bottom is at page Y 48 + 260; panel should be just below it.
		expect(box.y).toBeGreaterThanOrEqual(325);
		expect(box.y).toBeLessThan(345);

		await page.evaluate(async () => {
			const palette = await import('/src/ui/palette.js');
			palette.initShapePalette();
			palette.toggleShapePalette();
		});
		await expect(page.locator('#shapePalette')).toHaveClass(/show/);
		await expect(properties).not.toHaveClass(/show/);

		// A direct action in the unobscured canvas dismisses the transient picker
		// and restores contextual properties.
		await page.locator('#liveCanvas').click({ position: { x: 30, y: 80 } });
		await expect(page.locator('#shapePalette')).not.toHaveClass(/show/);
		await expect(properties).toHaveClass(/show/);
	});
});
