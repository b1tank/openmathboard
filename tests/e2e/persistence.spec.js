import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers.js';

test.describe('Local persistence lifecycle', () => {
	test('pagehide flushes a pending save synchronously', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		const saved = await page.evaluate(async () => {
			const state = await import('/src/core/state.js');
			const persistence = await import('/src/core/persistence.js');
			localStorage.removeItem('openmathboard.canvas.v2');
			state.setStrokes([{
				color: '#000', width: 4, dash: false,
				points: [{ x: 1, y: 2 }, { x: 3, y: 4 }]
			}]);
			persistence.scheduleSave();
			window.dispatchEvent(new PageTransitionEvent('pagehide'));
			return JSON.parse(localStorage.getItem('openmathboard.canvas.v2'));
		});
		expect(saved.version).toBe(2);
		expect(saved.strokes).toHaveLength(1);
		expect(saved.strokes[0].points[1]).toMatchObject({ x: 3, y: 4 });
	});
});
