import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers.js';

test.describe('Local persistence lifecycle', () => {
	test('pagehide flushes a pending save synchronously', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		const result = await page.evaluate(async () => {
			const state = await import('/src/core/state.js');
			const persistence = await import('/src/core/persistence.js');
			const statuses = [];
			persistence.subscribeSaveStatus(status => statuses.push(status));
			localStorage.removeItem('openmathboard.canvas.v2');
			state.setStrokes([{
				color: '#000', width: 4, dash: false,
				points: [{ x: 1, y: 2 }, { x: 3, y: 4 }]
			}]);
			persistence.scheduleSave();
			window.dispatchEvent(new PageTransitionEvent('pagehide'));
			return {
				saved: JSON.parse(localStorage.getItem('openmathboard.canvas.v2')),
				statuses,
				uiStatus: document.getElementById('saveStatus').dataset.status
			};
		});
		expect(result.saved.version).toBe(2);
		expect(result.saved.strokes).toHaveLength(1);
		expect(result.saved.strokes[0].points[1]).toMatchObject({ x: 3, y: 4 });
		expect(result.statuses).toContain('saving');
		expect(result.statuses.at(-1)).toBe('saved');
		expect(result.uiStatus).toBe('saved');
	});

	test('save failures remain dirty and surface an error status', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		const result = await page.evaluate(async () => {
			const persistence = await import('/src/core/persistence.js');
			const original = Storage.prototype.setItem;
			Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
			persistence.scheduleSave();
			const saved = persistence.flushSave();
			Storage.prototype.setItem = original;
			return { saved, uiStatus: document.getElementById('saveStatus').dataset.status };
		});
		expect(result).toEqual({ saved: false, uiStatus: 'error' });
	});
});
