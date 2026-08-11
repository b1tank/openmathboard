import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers.js';

test.describe('Course recording', () => {
	test('mobile toolbar consolidates pen styles and exposes recording settings', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await waitForCanvas(page);
		await page.evaluate(() => {
			window.__OMB_GET_USER_MEDIA = async constraints => {
				if (!constraints.video) return new MediaStream();
				const canvas = document.createElement('canvas');
				canvas.width = 640; canvas.height = 480;
				canvas.getContext('2d').fillRect(0, 0, 640, 480);
				return canvas.captureStream(5);
			};
		});

		await expect(page.locator('#penStyleBtnMobile')).toBeVisible();
		await expect(page.locator('#colorBtnMobile')).toBeHidden();
		await expect(page.locator('#strokeBtnMobile')).toBeHidden();
		await expect(page.locator('#dashBtnMobile')).toBeHidden();
		await expect(page.locator('#recordBtnMobile')).toBeVisible();
		await expect(page.locator('#redoBtnMobile')).toBeVisible();
		await page.locator('#penStyleBtnMobile').click();
		await expect(page.locator('#penStylePanelMobile')).toHaveClass(/show/);
		await expect(page.locator('#penStylePanelMobile .pen-style-options svg')).toHaveCount(5);
		const labels = await page.locator('#penStylePanelMobile .pen-style-options button').allTextContents();
		expect(labels.every(label => label.trim() === '')).toBe(true);

		await page.locator('#recordBtnMobile').click();
		await expect(page.locator('#recordingMenu')).toHaveClass(/show/);
		const supportsCanvasCapture = await page.evaluate(() =>
			typeof document.createElement('canvas').captureStream === 'function'
		);
		if (supportsCanvasCapture) {
			await page.locator('#recordFaceToggle').check();
			await expect(page.locator('#recordingFacePreview')).toBeVisible();
		} else {
			// Playwright's Linux WebKit build lacks canvas capture even though iOS
			// Safari supports it. Exercise the responsive controls without faking a
			// production capability result.
			await page.locator('#recordFaceToggle').evaluate(toggle => { toggle.checked = true; });
			await page.locator('#recordFaceSettings').evaluate(settings => { settings.hidden = false; });
		}
		await expect(page.locator('#recordFaceSettings')).toBeVisible();
		const groups = await page.locator('.recording-face-control-group').evaluateAll(elements =>
			elements.map(element => element.getBoundingClientRect().top)
		);
		expect(groups[0]).toBeCloseTo(groups[1], 0);

		const menu = await page.locator('#recordingMenu').boundingBox();
		if (supportsCanvasCapture) {
			const face = await page.locator('#recordingFacePreview').boundingBox();
			expect(face.y + face.height).toBeLessThanOrEqual(menu.y - 7);
			const topElementId = await page.evaluate(({ x, y }) =>
				document.elementFromPoint(x, y)?.id,
				{ x: face.x + face.width / 2, y: face.y + face.height / 2 }
			);
			expect(topElementId).toBe('recordingFacePreview');
			await page.locator('#recordLivePreviewToggle').uncheck();
			await expect(page.locator('#recordingFacePreview')).toHaveClass(/live-preview-off/);
			await page.locator('#recordLivePreviewToggle').check();
			await expect(page.locator('#recordingFacePreview')).not.toHaveClass(/live-preview-off/);
		}
		expect(menu.x).toBe(6);
		expect(menu.width).toBe(378);
		expect(menu.y + menu.height).toBe(838);

		await page.locator('#recordBtnMobile').click();
		await page.locator('#menuBtn').click();
		await expect(page.locator('#menuDropdown [data-action="redo"]')).toHaveCount(0);
		await expect(page.locator('#menuDropdown > .menu-divider')).toHaveCount(2);
		await expect(page.locator('#menuDropdown [data-action="language-toggle"]')).toHaveCount(1);
		const languageBefore = await page.locator('#menuLanguageValue').textContent();
		await page.locator('#menuDropdown [data-action="language-toggle"]').click();
		const languageAfter = await page.locator('#menuLanguageValue').textContent();
		expect(languageAfter).not.toBe(languageBefore);
	});

	test('video-only recording produces a downloadable canvas video', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		test.skip(!await page.evaluate(() =>
			typeof document.createElement('canvas').captureStream === 'function' && typeof MediaRecorder !== 'undefined'
		), 'This Playwright browser build does not expose canvas recording');
		await page.locator('#recordBtn').click();
		await page.locator('#recordMicToggle').uncheck();
		await page.locator('#recordStartBtn').click();
		await expect(page.locator('#recordingMenu')).not.toHaveClass(/show/);
		await expect(page.locator('#recordBtn')).toHaveClass(/recording/);
		await page.waitForTimeout(600);

		await page.locator('#recordBtn').click();
		await page.locator('#recordPauseBtn').click();
		await expect(page.locator('#recordPauseBtn')).toHaveText(/Resume|继续/);
		await page.locator('#recordPauseBtn').click();
		await expect(page.locator('#recordingMenu')).not.toHaveClass(/show/);
		await page.waitForTimeout(500);

		await page.locator('#recordBtn').click();
		await page.locator('#recordStopBtn').click();
		await expect(page.locator('#recordDownloadLink')).toBeVisible();

		const result = await page.locator('#recordDownloadLink').evaluate(link => ({
			href: link.href,
			download: link.download
		}));
		expect(result.href).toMatch(/^blob:/);
		expect(result.download).toMatch(/\.(mp4|webm)$/);
	});

	test('discard asks for confirmation and produces no download', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		test.skip(!await page.evaluate(() =>
			typeof document.createElement('canvas').captureStream === 'function' && typeof MediaRecorder !== 'undefined'
		), 'This Playwright browser build does not expose canvas recording');
		await page.locator('#recordBtn').click();
		await page.locator('#recordMicToggle').uncheck();
		await page.locator('#recordStartBtn').click();
		await expect(page.locator('#recordingMenu')).not.toHaveClass(/show/);
		await page.locator('#recordBtn').click();
		page.once('dialog', dialog => dialog.accept());
		await page.locator('#recordDiscardBtn').click();
		await expect(page.locator('#recordBtn')).not.toHaveClass(/recording/);
		await expect(page.locator('#recordDownloadLink')).toBeHidden();
		await expect(page.locator('#recordingMenu')).not.toHaveClass(/show/);
	});
});
