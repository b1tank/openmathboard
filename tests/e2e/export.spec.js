// Export e2e tests — save image
import { test, expect } from '@playwright/test';
import { drawStroke, waitForCanvas } from './helpers.js';

test.describe('Export', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
	});

	test('save image triggers download', async ({ page }) => {
		// Remove showSaveFilePicker so the fallback <a download> path is used
		await page.evaluate(() => { delete window.showSaveFilePicker; });

		// Draw something first
		await drawStroke(page, 400, 300, 600, 400);

		// Click save button and expect a download
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			page.click('#saveBtn'),
		]);

		expect(download.suggestedFilename()).toMatch(/openmathboard-.*\.png/);
	});
});
