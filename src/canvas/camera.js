// OpenMathBoard — Camera system (zoom, pan, world↔screen transforms)
import { getCamera, updateCamera, getCanvasRect } from '../core/state.js';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(wx, wy) {
	const cam = getCamera();
	return {
		x: (wx - cam.x) * cam.zoom,
		y: (wy - cam.y) * cam.zoom
	};
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(sx, sy) {
	const cam = getCamera();
	return {
		x: sx / cam.zoom + cam.x,
		y: sy / cam.zoom + cam.y
	};
}

/**
 * Zoom centered on a screen point (e.g., pointer or pinch midpoint)
 */
export function zoomAtPoint(screenX, screenY, factor) {
	const cam = getCamera();
	const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.zoom * factor));
	if (newZoom === cam.zoom) return;

	// Keep the world point under the cursor stationary
	const worldX = screenX / cam.zoom + cam.x;
	const worldY = screenY / cam.zoom + cam.y;

	const newX = worldX - screenX / newZoom;
	const newY = worldY - screenY / newZoom;

	updateCamera({ x: newX, y: newY, zoom: newZoom });
}

/**
 * Pan the camera by screen-space delta
 */
export function panByScreenDelta(dx, dy) {
	const cam = getCamera();
	updateCamera({
		x: cam.x - dx / cam.zoom,
		y: cam.y - dy / cam.zoom
	});
}

/**
 * Reset camera to default position
 */
export function resetCamera() {
	updateCamera({ x: 0, y: 0, zoom: 1 });
}

/**
 * Set zoom level directly (clamped)
 */
export function setZoom(zoom) {
	const rect = getCanvasRect();
	const cx = rect ? rect.width / 2 : 512;
	const cy = rect ? rect.height / 2 : 384;
	const cam = getCamera();

	const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
	const worldX = cx / cam.zoom + cam.x;
	const worldY = cy / cam.zoom + cam.y;
	const newX = worldX - cx / newZoom;
	const newY = worldY - cy / newZoom;

	updateCamera({ x: newX, y: newY, zoom: newZoom });
}

/**
 * Setup scroll-wheel zoom on the canvas
 */
export function setupWheelZoom(canvasEl, onUpdate) {
	canvasEl.addEventListener('wheel', (e) => {
		e.preventDefault();

		const rect = canvasEl.getBoundingClientRect();
		const sx = e.clientX - rect.left;
		const sy = e.clientY - rect.top;

		// Zoom factor: scroll up = zoom in, scroll down = zoom out
		const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
		zoomAtPoint(sx, sy, factor);

		if (onUpdate) onUpdate();
	}, { passive: false });
}

// ============ Pinch zoom ============
// Touch-based pinch handling has been removed.
// Pinch zoom is now detected via pointer events in input-manager.js
// and forwarded to zoomAtPoint/panByScreenDelta.
// setupPinchZoom is kept as a no-op for backward compatibility.
export function setupPinchZoom(canvasEl, onUpdate) {
	// No-op: pinch is handled by input-manager via pointer events
}

// ============ Spacebar pan ============
let spacebarDown = false;
let spacebarPanning = false;
let spacebarLastPos = null;

export function setupSpacebarPan(canvasEl, onUpdate) {
	document.addEventListener('keydown', (e) => {
		if (e.code === 'Space' && !e.repeat && !isInputFocused()) {
			e.preventDefault();
			spacebarDown = true;
			canvasEl.style.cursor = 'grab';
		}
	});

	document.addEventListener('keyup', (e) => {
		if (e.code === 'Space') {
			spacebarDown = false;
			spacebarPanning = false;
			spacebarLastPos = null;
			canvasEl.style.cursor = '';
		}
	});

	canvasEl.addEventListener('pointerdown', (e) => {
		if (spacebarDown) {
			e.preventDefault();
			e.stopPropagation();
			spacebarPanning = true;
			spacebarLastPos = { x: e.clientX, y: e.clientY };
			canvasEl.style.cursor = 'grabbing';
			canvasEl.setPointerCapture(e.pointerId);
		}
	}, true); // capture phase

	canvasEl.addEventListener('pointermove', (e) => {
		if (spacebarPanning && spacebarLastPos) {
			const dx = e.clientX - spacebarLastPos.x;
			const dy = e.clientY - spacebarLastPos.y;
			panByScreenDelta(dx, dy);
			spacebarLastPos = { x: e.clientX, y: e.clientY };
			if (onUpdate) onUpdate();
		}
	}, true);

	canvasEl.addEventListener('pointerup', () => {
		if (spacebarPanning) {
			spacebarPanning = false;
			spacebarLastPos = null;
			canvasEl.style.cursor = spacebarDown ? 'grab' : '';
		}
	}, true);
}

export function isSpacebarPanning() {
	return spacebarPanning || spacebarDown;
}

function isInputFocused() {
	const tag = document.activeElement?.tagName;
	return tag === 'INPUT' || tag === 'TEXTAREA';
}
