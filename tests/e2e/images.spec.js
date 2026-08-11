import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers.js';

test.describe('Imported image interaction', () => {
	test('tap selects an image and four corner anchors resize it', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		await page.evaluate(async () => {
			const { addImageToCanvas } = await import('/src/ui/images.js');
			addImageToCanvas('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
				'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#93c5fd"/></svg>'
			));
		});
		const image = page.locator('.imported-image');
		await expect(image).toBeVisible();
		const imageBox = await image.boundingBox();

		// Pen-mode tap uses the same deferred tap-vs-draw gesture as ink.
		await page.mouse.click(imageBox.x + imageBox.width / 2, imageBox.y + imageBox.height / 2);
		await expect(image).toHaveClass(/selected/);
		const tool = await page.evaluate(async () => (await import('/src/core/state.js')).getCurrentTool());
		expect(tool).toBe('select');
		await expect(image.locator('.resize-handle')).toHaveCount(4);
		for (const handle of await image.locator('.resize-handle').all()) await expect(handle).toBeVisible();

		const widthBefore = (await image.boundingBox()).width;
		const southeast = image.locator('.resize-se');
		const handleBox = await southeast.boundingBox();
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
		await page.mouse.down();
		await page.mouse.move(handleBox.x + 70, handleBox.y + 45, { steps: 5 });
		await page.mouse.up();
		expect((await image.boundingBox()).width).toBeGreaterThan(widthBefore);
	});

	test('dragging from a photo in Pen mode still draws over it', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		await page.evaluate(async () => {
			const { addImageToCanvas } = await import('/src/ui/images.js');
			addImageToCanvas('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
				'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#fde68a"/></svg>'
			));
		});
		const image = page.locator('.imported-image');
		await expect(image).toBeVisible();
		const box = await image.boundingBox();
		await page.mouse.move(box.x + 40, box.y + 40);
		await page.mouse.down();
		await page.mouse.move(box.x + 120, box.y + 70, { steps: 8 });
		await page.mouse.up();
		const result = await page.evaluate(async () => {
			const state = await import('/src/core/state.js');
			return { tool: state.getCurrentTool(), strokes: state.getStrokes().length };
		});
		expect(result).toEqual({ tool: 'pen', strokes: 1 });
	});
});
