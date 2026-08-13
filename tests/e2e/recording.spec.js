import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers.js';

test.describe('Course recording', () => {
	test('mobile toolbar consolidates pen styles and exposes recording settings', async ({ page, browserName }) => {
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
		const canExerciseSyntheticCamera = supportsCanvasCapture && browserName !== 'webkit';
		if (canExerciseSyntheticCamera) {
			await page.locator('#recordFaceToggle').check();
			await expect(page.locator('#recordingFacePreview')).toBeVisible();
		} else {
			// Playwright WebKit cannot reliably play a synthetic canvas camera stream
			// across host platforms. Exercise the responsive controls here; real iPad
			// camera preview remains part of the release checklist.
			await page.locator('#recordFaceToggle').evaluate(toggle => { toggle.checked = true; });
			await page.locator('#recordFaceSettings').evaluate(settings => { settings.hidden = false; });
		}
		await expect(page.locator('#recordFaceSettings')).toBeVisible();
		await expect(page.locator('.recording-aspect-label')).toHaveText('方向');
		expect(await page.locator('[data-size]').allTextContents()).toEqual(['小', '中', '大']);
		await expect(page.locator('[data-aspect="portrait"]')).toHaveClass(/active/);
		await page.locator('[data-aspect="landscape"]').click();
		await expect(page.locator('[data-aspect="landscape"]')).toHaveClass(/active/);
		if (canExerciseSyntheticCamera) {
			await expect(page.locator('#recordingFacePreview')).toHaveClass(/face-landscape/);
		}
		const groups = await page.locator('.recording-face-control-group').evaluateAll(elements =>
			elements.map(element => element.getBoundingClientRect().top)
		);
		expect(groups[0]).toBeCloseTo(groups[1], 0);

		const menu = await page.locator('#recordingMenu').boundingBox();
		if (canExerciseSyntheticCamera) {
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
		expect(await page.locator('[data-size]').allTextContents()).toEqual(['S', 'M', 'L']);
	});

	test('camera window defaults to the device orientation', async ({ page }) => {
		await page.setViewportSize({ width: 844, height: 390 });
		await page.goto('/');
		await waitForCanvas(page);
		await page.locator('#recordBtn').click();
		await expect(page.locator('[data-aspect="landscape"]')).toHaveClass(/active/);
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

		await expect(page.locator('#recordBtn .record-dot')).toBeHidden();
		await page.locator('#recordBtn').click();
		await expect(page.locator('#recordingMenu')).toHaveClass(/show/);
		await expect(page.locator('body')).toHaveClass(/recording-paused/);
		await expect(page.locator('#recordPauseBtn')).toHaveText(/Resume|继续/);
		await expect(page.locator('#recordPauseBtn')).toHaveClass(/resume/);
		await page.waitForTimeout(250); // allow toolbar background transition to settle
		const pausedColors = await page.evaluate(() => ({
			timer: getComputedStyle(document.getElementById('recordBtn')).backgroundColor,
			resume: getComputedStyle(document.getElementById('recordPauseBtn')).backgroundColor,
			stop: getComputedStyle(document.getElementById('recordStopBtn')).backgroundColor
		}));
		expect(pausedColors).toEqual({
			timer: 'rgb(245, 158, 11)',
			resume: 'rgb(22, 163, 74)',
			stop: 'rgb(37, 99, 235)'
		});
		await page.locator('#recordPauseBtn').click();
		await expect(page.locator('#recordingMenu')).not.toHaveClass(/show/);
		await expect(page.locator('body')).not.toHaveClass(/recording-paused/);
		await page.waitForTimeout(500);

		await expect(page.locator('#recordStopToolbarBtn')).toHaveCount(0);
		await expect(page.locator('#recordStopToolbarBtnMobile')).toHaveCount(0);
		await page.locator('#recordBtn').click();
		await expect(page.locator('#recordPauseBtn')).toHaveText(/Resume|继续/);
		await page.locator('#recordStopBtn').click();
		await expect(page.locator('#recordResult')).toBeVisible();
		await expect(page.locator('#recordResultPreview')).toBeVisible();
		await expect(page.locator('#recordDownloadLink')).toBeVisible();

		const result = await page.locator('#recordDownloadLink').evaluate(link => ({
			href: link.href,
			download: link.download
		}));
		expect(result.href).toMatch(/^blob:/);
		expect(result.download).toMatch(/\.(mp4|webm)$/);
		const download = page.waitForEvent('download');
		await page.locator('#recordDownloadLink').click();
		await download;
		await expect(page.locator('#recordResult')).toBeHidden();
		await expect(page.locator('#recordStartBtn')).not.toHaveAttribute('hidden');
	});

	test('stopped recording can be previewed then discarded', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		test.skip(!await page.evaluate(() =>
			typeof document.createElement('canvas').captureStream === 'function' && typeof MediaRecorder !== 'undefined'
		), 'This Playwright browser build does not expose canvas recording');
		await page.locator('#recordBtn').click();
		await page.locator('#recordMicToggle').uncheck();
		await page.locator('#recordStartBtn').click();
		await page.waitForTimeout(300);
		await page.locator('#recordBtn').click();
		await page.locator('#recordStopBtn').click();
		await expect(page.locator('#recordResultPreview')).toBeVisible();
		page.once('dialog', dialog => dialog.accept());
		await page.locator('#recordResultDiscardBtn').click();
		await expect(page.locator('#recordResult')).toBeHidden();
		await expect(page.locator('#recordingMenu')).not.toHaveClass(/show/);
	});

	test('discard releases camera and the next session gets a fresh stream', async ({ page, browserName }) => {
		test.skip(browserName === 'webkit', 'Synthetic camera playback is not reliable in Playwright WebKit');
		await page.goto('/');
		await waitForCanvas(page);
		test.skip(!await page.evaluate(() =>
			typeof document.createElement('canvas').captureStream === 'function' && typeof MediaRecorder !== 'undefined'
		), 'This Playwright browser build does not expose canvas recording');
		await page.evaluate(() => {
			window.__OMB_CAMERA_STREAMS = [];
			window.__OMB_GET_USER_MEDIA = async constraints => {
				if (!constraints.video) return new MediaStream();
				const canvas = document.createElement('canvas');
				canvas.width = 640; canvas.height = 480;
				canvas.getContext('2d').fillRect(0, 0, 640, 480);
				const stream = canvas.captureStream(5);
				window.__OMB_CAMERA_STREAMS.push(stream);
				return stream;
			};
		});

		await page.locator('#recordBtn').click();
		await page.locator('#recordMicToggle').uncheck();
		await page.locator('#recordFaceToggle').check();
		await expect(page.locator('#recordingFacePreview')).toBeVisible();
		await page.locator('#recordStartBtn').click();
		await page.locator('#recordBtn').click();
		page.once('dialog', dialog => dialog.accept());
		await page.locator('#recordDiscardBtn').click();
		await expect(page.locator('#recordingFacePreview')).toBeHidden();
		const firstSession = await page.evaluate(() => ({
			count: window.__OMB_CAMERA_STREAMS.length,
			states: window.__OMB_CAMERA_STREAMS[0].getTracks().map(track => track.readyState)
		}));
		expect(firstSession).toEqual({ count: 1, states: ['ended'] });

		await page.locator('#recordBtn').click();
		await expect(page.locator('#recordingFacePreview')).toBeVisible();
		const secondSession = await page.evaluate(() => ({
			count: window.__OMB_CAMERA_STREAMS.length,
			state: window.__OMB_CAMERA_STREAMS[1].getVideoTracks()[0].readyState
		}));
		expect(secondSession).toEqual({ count: 2, state: 'live' });
		await page.locator('#recordStartBtn').click();
		expect(await page.evaluate(() => window.__OMB_CAMERA_STREAMS.length)).toBe(2);

		await page.locator('#recordBtn').click();
		page.once('dialog', dialog => dialog.accept());
		await page.locator('#recordDiscardBtn').click();
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
