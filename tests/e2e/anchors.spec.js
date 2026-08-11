import { test, expect } from '@playwright/test';
import { waitForCanvas } from './helpers.js';

test.describe('Shape anchors', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForCanvas(page);
	});

	test('center and curve anchors update complete shape geometry', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { getAnchors, findAnchorAtPoint, onAnchorDrag } = await import('/src/canvas/anchors.js');
			const camera = { x: 0, y: 0, zoom: 1 };
			const circle = {
				width: 4,
				shape: { type: 'circle', cx: 100, cy: 100, r: 40 },
				points: []
			};
			const parabola = {
				width: 4,
				shape: { type: 'parabola', h: 100, k: 100, a: 0.01, xMin: 50, xMax: 150 },
				points: []
			};
			const wave = {
				width: 4,
				shape: {
					type: 'sine', A: 50, B: 2 * Math.PI / 200,
					C: 100, D: 100, xMin: -100, xMax: 300
				},
				points: []
			};

			const circleAnchorIds = getAnchors(circle, camera).map(anchor => anchor.id);
			onAnchorDrag(circle, 'center', { x: 140, y: 130 });
			onAnchorDrag(parabola, 'right', { x: 180, y: 164 });
			const waveEdgeHandle = findAnchorAtPoint(wave, { x: 300, y: 100 }, camera)?.id;
			onAnchorDrag(wave, 'period', { x: 460, y: 100 }, {
				savedPeriod: 200, periodDragStartX: 300, cameraZoom: 1
			});
			const periodAfterScrub = (2 * Math.PI) / wave.shape.B;
			const periodAnchorX = getAnchors(wave, camera).find(anchor => anchor.id === 'period')?.x;
			onAnchorDrag(wave, 'midline', { x: 150, y: 130 });

			return {
				circleAnchorIds,
				circle: circle.shape,
				parabola: parabola.shape,
				waveEdgeHandle,
				periodAfterScrub,
				periodAnchorX,
				wave: wave.shape
			};
		});

		expect(result.circleAnchorIds).toContain('center');
		expect(result.circle).toMatchObject({ cx: 140, cy: 130, r: 40 });
		expect(result.parabola.xMax).toBe(180);
		expect(result.parabola.a).toBeCloseTo(0.01, 8);
		expect(result.waveEdgeHandle).toBe('period');
		expect(result.periodAfterScrub).toBeCloseTo(200 * Math.E, 8);
		expect(result.periodAnchorX).toBe(300);
		expect(result.wave).toMatchObject({ C: 150, D: 130, xMin: -50, xMax: 350 });
	});

	test('rotated resize handles use local coordinates and freehand rotation works', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { onAnchorDrag } = await import('/src/canvas/anchors.js');
			const rectangle = {
				width: 4,
				shape: { type: 'rectangle', cx: 100, cy: 100, w: 100, h: 50, rotation: Math.PI / 2 },
				points: []
			};
			const freehand = {
				width: 4,
				points: [{ x: 0, y: 0 }, { x: 100, y: 100 }]
			};

			// At 90 degrees the local right handle moves along the screen Y axis.
			onAnchorDrag(rectangle, 'right', { x: 100, y: 180 });
			onAnchorDrag(freehand, 'rotation', { x: 150, y: 50 });

			return {
				rectangleWidth: rectangle.shape.w,
				freehandRotation: freehand.rotation
			};
		});

		expect(result.rectangleWidth).toBeCloseTo(160, 8);
		expect(result.freehandRotation).toBeCloseTo(Math.PI / 2, 8);
	});
});
