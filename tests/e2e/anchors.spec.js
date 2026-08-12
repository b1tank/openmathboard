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
			const { createDefaultParabola } = await import('/src/shapes/parabola.js');
			const camera = { x: 0, y: 0, zoom: 1 };
			const circle = {
				width: 4,
				shape: { type: 'circle', cx: 100, cy: 100, r: 40 },
				points: []
			};
			const parabola = {
				width: 4,
				shape: { type: 'parabola', h: 100, k: 100, a: -0.01, xMin: 50, xMax: 150 },
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
			const parabolaAnchorIds = getAnchors(parabola, camera).map(anchor => anchor.id);
			onAnchorDrag(circle, 'center', { x: 140, y: 130 });
			// Vertical diamond reduces height while retaining an upward opening.
			onAnchorDrag(parabola, 'vertical-scale', { x: 100, y: 90 }, {
				savedEndpointYLeft: 75, savedEndpointYRight: 75
			});
			const aAfterVerticalScale = parabola.shape.a;
			// Endpoint circles crop only; they do not reshape the curve.
			onAnchorDrag(parabola, 'right', { x: 180, y: 20 });
			const aAfterCrop = parabola.shape.a;
			const oldRightY = parabola.shape.a * (parabola.shape.xMax - parabola.shape.h) ** 2 + parabola.shape.k;
			const oldLeftY = parabola.shape.a * (parabola.shape.xMin - parabola.shape.h) ** 2 + parabola.shape.k;
			onAnchorDrag(parabola, 'horizontal-scale', { x: 160, y: 90 });
			const newRightY = parabola.shape.a * (parabola.shape.xMax - parabola.shape.h) ** 2 + parabola.shape.k;
			const newLeftY = parabola.shape.a * (parabola.shape.xMin - parabola.shape.h) ** 2 + parabola.shape.k;
			const asymmetricAfterScale = { xMin: parabola.shape.xMin, xMax: parabola.shape.xMax };
			parabola.shape.symmetricEndpoints = true;
			onAnchorDrag(parabola, 'left', { x: 70, y: 0 });
			const symmetricAfterLeft = { xMin: parabola.shape.xMin, xMax: parabola.shape.xMax };
			const waveRightHandle = findAnchorAtPoint(wave, { x: 300, y: 100 }, camera)?.id;
			const periodStartX = getAnchors(wave, camera).find(anchor => anchor.id === 'period').x;
			onAnchorDrag(wave, 'period', { x: periodStartX + 160, y: 100 }, {
				savedPeriod: 200, periodDragStartX: periodStartX, cameraZoom: 1
			});
			const periodAfterScrub = (2 * Math.PI) / wave.shape.B;
			const periodAnchorX = getAnchors(wave, camera).find(anchor => anchor.id === 'period')?.x;
			onAnchorDrag(wave, 'midline', { x: 150, y: 130 });

			return {
				defaultParabolaA: createDefaultParabola(0, 0).shape.a,
				circleAnchorIds,
				circle: circle.shape,
				parabolaAnchorIds,
				parabola: parabola.shape,
				aAfterVerticalScale,
				aAfterCrop,
				oldRightY,
				newRightY,
				oldLeftY,
				newLeftY,
				asymmetricAfterScale,
				symmetricAfterLeft,
				waveRightHandle,
				periodAfterScrub,
				periodAnchorX,
				wave: wave.shape
			};
		});

		expect(result.defaultParabolaA).toBeLessThan(0);
		expect(result.circleAnchorIds).toContain('center');
		expect(result.circle).toMatchObject({ cx: 140, cy: 130, r: 40 });
		expect(result.parabolaAnchorIds).toEqual(expect.arrayContaining([
			'vertical-scale', 'horizontal-scale', 'left', 'right'
		]));
		expect(result.aAfterVerticalScale).toBeLessThan(0);
		expect(result.aAfterCrop).toBeCloseTo(result.aAfterVerticalScale, 8);
		// Left was cropped to 50 and right to 80 before scaling. Moving the right
		// scale handle to 60 applies a 0.75 ratio to both, preserving asymmetry.
		expect(result.asymmetricAfterScale.xMin).toBeCloseTo(62.5, 8);
		expect(result.asymmetricAfterScale.xMax).toBe(160);
		expect(result.newRightY).toBeCloseTo(result.oldRightY, 8);
		expect(result.newLeftY).toBeCloseTo(result.oldLeftY, 8);
		expect(result.symmetricAfterLeft).toEqual({ xMin: 70, xMax: 130 });
		expect(result.waveRightHandle).toBe('right');
		expect(result.periodAfterScrub).toBeCloseTo(200 * Math.E, 8);
		expect(result.periodAnchorX).toBe(200);
		expect(result.wave).toMatchObject({ C: 150, D: 130, xMin: -50, xMax: 350 });
	});

	test('parabola property panel exposes an endpoint symmetry lock', async ({ page }) => {
		await page.evaluate(async () => {
			const state = await import('/src/core/state.js');
			state.setStrokes([{
				color: '#000', width: 4, dash: false,
				shape: { type: 'parabola', h: 100, k: 100, a: -0.01, xMin: 50, xMax: 170 },
				points: []
			}]);
		});
		await page.locator('#selectBtn').click();
		await page.locator('#liveCanvas').click({ position: { x: 100, y: 100 } });
		const symmetry = page.locator('#propSymmetryBtn');
		await expect(symmetry).toBeVisible();
		await symmetry.click();
		await expect(symmetry).toHaveClass(/active/);
		const enabled = await page.evaluate(async () =>
			(await import('/src/core/state.js')).getStrokes()[0].shape.symmetricEndpoints
		);
		expect(enabled).toBe(true);
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
