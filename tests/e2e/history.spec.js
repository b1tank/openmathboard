import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers.js';

test.describe('Undo and redo history', () => {
	test('deduplicates no-op snapshots and preserves the redo branch', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		const result = await page.evaluate(async () => {
			const state = await import('/src/core/state.js');
			const history = await import('/src/core/history.js');
			state.setStrokes([]);
			state.setHistoryStack([]);
			state.setHistoryIndex(-1);
			history.saveToHistory();
			history.saveToHistory();
			const afterDuplicate = { length: state.getHistoryStack().length, index: state.getHistoryIndex() };

			state.getStrokes().push({
				color: '#000', width: 4, dash: false,
				points: [{ x: 0, y: 0 }, { x: 20, y: 20 }]
			});
			history.saveToHistory();
			history.undo();
			const afterUndo = {
				count: state.getStrokes().length,
				index: state.getHistoryIndex(),
				redoDisabled: document.getElementById('redoBtnMobile').disabled
			};
			history.redo();
			return {
				afterDuplicate,
				afterUndo,
				afterRedo: { count: state.getStrokes().length, index: state.getHistoryIndex() }
			};
		});

		expect(result.afterDuplicate).toEqual({ length: 1, index: 0 });
		expect(result.afterUndo).toEqual({ count: 0, index: 0, redoDisabled: false });
		expect(result.afterRedo).toEqual({ count: 1, index: 1 });
	});

	test('bounds history snapshots while preserving recent undo states', async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
		const result = await page.evaluate(async () => {
			const state = await import('/src/core/state.js');
			const history = await import('/src/core/history.js');
			state.setHistoryStack([]);
			state.setHistoryIndex(-1);
			for (let i = 0; i < history.HISTORY_MAX_ENTRIES + 12; i++) {
				state.setStrokes([{
					color: '#000', width: 4, dash: false,
					points: [{ x: i, y: 0 }, { x: i + 1, y: 1 }]
				}]);
				history.saveToHistory();
			}
			const newestX = state.getStrokes()[0].points[0].x;
			history.undo();
			return {
				length: state.getHistoryStack().length,
				index: state.getHistoryIndex(),
				newestX,
				undoX: state.getStrokes()[0].points[0].x,
				maxEntries: history.HISTORY_MAX_ENTRIES
			};
		});
		expect(result.length).toBe(result.maxEntries);
		expect(result.index).toBe(result.maxEntries - 2);
		expect(result.undoX).toBe(result.newestX - 1);
	});
});
