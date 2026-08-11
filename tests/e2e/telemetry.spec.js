import { test, expect } from '@playwright/test';

test.describe('Frontend telemetry', () => {
	test('emits release-scoped operational events without board content', async ({ page }) => {
		await page.addInitScript(() => {
			window.__OMB_TELEMETRY_ENDPOINT = '/telemetry-test';
			window.__OMB_RELEASE = 'test-sha';
			window.__OMB_TELEMETRY_EVENTS = [];
			window.__OMB_TELEMETRY_TRANSPORT = payload => {
				window.__OMB_TELEMETRY_EVENTS.push(JSON.parse(payload));
			};
		});
		await page.goto('/');
		await page.evaluate(async () => {
			const telemetry = await import('/src/core/telemetry.js');
			const persistence = await import('/src/core/persistence.js');
			telemetry.trackEvent('test_event', { safeValue: 'ok', nested: { points: [1, 2] } });
			window.dispatchEvent(new ErrorEvent('error', {
				error: new TypeError('private board text must not be sent'),
				filename: `${location.origin}/src/example.js`,
				lineno: 12,
				colno: 4
			}));
			const original = Storage.prototype.setItem;
			Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
			persistence.scheduleSave();
			persistence.flushSave();
			Storage.prototype.setItem = original;
		});
		const payloads = await page.evaluate(() => window.__OMB_TELEMETRY_EVENTS);
		expect(payloads.length).toBeGreaterThanOrEqual(4);
		const names = payloads.map(payload => payload.name);
		expect(names).toEqual(expect.arrayContaining(['app_loaded', 'test_event', 'client_error', 'local_save_failed']));
		for (const payload of payloads) {
			expect(payload.release).toBe('test-sha');
			expect(JSON.stringify(payload)).not.toContain('private board text');
			expect(JSON.stringify(payload)).not.toContain('points');
		}
	});
});
