// OpenMathBoard — Input Manager
// Single owner of all pointer events on the live canvas.
// Normalizes events and routes to the active tool module.
// During Sprint 1, eraser/select fall through to legacy input.js handlers.

import {
	TOOLS, getCurrentTool,
	getLiveCanvas, getCanvasRect, setCanvasRect, getCamera,
	getDomRefs
} from '../core/state.js';
import { isSpacebarPanning, zoomAtPoint, panByScreenDelta } from '../canvas/camera.js';
import { onPenPointerDown, onPenPointerMove, onPenPointerUp, onPenCancel } from './pen-tool.js';
import { onEraserPointerDown, onEraserPointerMove, onEraserPointerUp, onEraserCancel } from './eraser-tool.js';
import { onSelectPointerDown, onSelectPointerMove, onSelectPointerUp, onSelectCancel } from './select-tool.js';
import { redrawCanvas } from '../canvas/renderer.js';

// ============ Pen/finger detection ============
let hasPenInput = false;
let activePointerId = null;

// ============ Pinch zoom state ============
// Track all active pointers for multi-touch pinch detection
let activePointers = new Map(); // pointerId → { x, y } (client coords)
let isPinching = false;

// Cached canvas rect — updated on pointerdown + resize, never during move
let cachedRect = null;

export function invalidateCachedRect() {
	cachedRect = null;
}

function ensureRect() {
	if (!cachedRect) {
		const liveCanvas = getLiveCanvas();
		cachedRect = liveCanvas.getBoundingClientRect();
	}
	return cachedRect;
}

// ============ Event normalization ============

function normalizeEvent(e) {
	const rect = ensureRect();
	const camera = getCamera();
	const sx = e.clientX - rect.left;
	const sy = e.clientY - rect.top;
	return {
		x: sx / camera.zoom + camera.x,
		y: sy / camera.zoom + camera.y,
		screenX: sx,
		screenY: sy,
		pressure: e.pressure || 0.5,
		pointerType: e.pointerType,
		pointerId: e.pointerId,
		buttons: e.buttons,
		rawEvent: e
	};
}

// ============ Pointer handlers ============

function onPointerDown(e) {
	e.preventDefault();

	if (isSpacebarPanning()) return;

	const isPen = e.pointerType === 'pen';
	const isFinger = e.pointerType === 'touch';

	if (isPen) hasPenInput = true;

	// Track all active pointers for pinch detection
	if (isFinger) {
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		// Two fingers → start pinch, cancel any active tool interaction
		if (activePointers.size >= 2) {
			if (!isPinching) {
				isPinching = true;
				// Cancel any active tool interaction
				if (activePointerId !== null) {
					cancelActiveTool();
					activePointerId = null;
				}
			}
			return;
		}
	}

	// Pen-vs-finger gating: when pen has been used, finger only allowed for select
	if (isFinger && hasPenInput && getCurrentTool() !== TOOLS.SELECT) {
		return;
	}

	// Second finger during active interaction → cancel current
	if (isFinger && activePointerId !== null && activePointerId !== e.pointerId) {
		onPointerCancel(e);
		return;
	}

	// Cache rect on every pointerdown
	cachedRect = getLiveCanvas().getBoundingClientRect();

	const liveCanvas = getLiveCanvas();
	liveCanvas.setPointerCapture(e.pointerId);
	activePointerId = e.pointerId;

	const pos = normalizeEvent(e);
	const tool = getCurrentTool();

	if (tool === TOOLS.PEN) {
		onPenPointerDown(pos);
	} else if (tool === TOOLS.ERASER) {
		onEraserPointerDown(pos);
	} else if (tool === TOOLS.SELECT) {
		onSelectPointerDown(pos);
	}
}

function onPointerMove(e) {
	// Handle pinch zoom/pan (two-finger gesture)
	if (isPinching && e.pointerType === 'touch') {
		const prev = activePointers.get(e.pointerId);
		if (!prev) return;

		const pointerIds = Array.from(activePointers.keys());
		if (pointerIds.length >= 2) {
			const otherId = pointerIds.find(id => id !== e.pointerId);
			const other = activePointers.get(otherId);
			if (other) {
				const rect = ensureRect();

				// Previous state
				const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
				const prevMidX = (prev.x + other.x) / 2 - rect.left;
				const prevMidY = (prev.y + other.y) / 2 - rect.top;

				// Current state
				const currDist = Math.hypot(e.clientX - other.x, e.clientY - other.y);
				const midX = (e.clientX + other.x) / 2 - rect.left;
				const midY = (e.clientY + other.y) / 2 - rect.top;

				// Pinch zoom
				if (prevDist > 0 && currDist > 0) {
					const factor = currDist / prevDist;
					zoomAtPoint(midX, midY, factor);
				}

				// Pan
				const dx = midX - prevMidX;
				const dy = midY - prevMidY;
				if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
					panByScreenDelta(dx, dy);
				}

				redrawCanvas();
			}
		}

		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		return;
	}

	if (activePointerId !== null && e.pointerId !== activePointerId) return;

	const tool = getCurrentTool();

	if (tool === TOOLS.PEN) {
		// Feature-gated coalesced events
		const useCoalesced = !isIOS() && typeof e.getCoalescedEvents === 'function';
		const events = useCoalesced ? e.getCoalescedEvents() : [e];
		for (const ce of events) {
			const pos = normalizeEvent(ce);
			onPenPointerMove(pos);
		}
	} else if (tool === TOOLS.ERASER) {
		const pos = normalizeEvent(e);
		onEraserPointerMove(pos);
	} else if (tool === TOOLS.SELECT) {
		const pos = normalizeEvent(e);
		onSelectPointerMove(pos);
	}
}

function onPointerUp(e) {
	// Track pointer removal for pinch
	if (e && e.pointerType === 'touch') {
		activePointers.delete(e.pointerId);
		if (isPinching) {
			if (activePointers.size < 2) {
				isPinching = false;
			}
			return;
		}
	}

	if (activePointerId !== null && e && e.pointerId !== activePointerId) return;
	activePointerId = null;

	const pos = normalizeEvent(e);
	const tool = getCurrentTool();

	if (tool === TOOLS.PEN) {
		onPenPointerUp(pos);
	} else if (tool === TOOLS.ERASER) {
		onEraserPointerUp(pos);
	} else if (tool === TOOLS.SELECT) {
		onSelectPointerUp(pos);
	}
}

function cancelActiveTool() {
	const tool = getCurrentTool();
	if (tool === TOOLS.PEN) {
		onPenCancel();
	} else if (tool === TOOLS.ERASER) {
		onEraserCancel();
	} else if (tool === TOOLS.SELECT) {
		onSelectCancel();
	}
}

function onPointerCancel(e) {
	if (e && e.pointerType === 'touch') {
		activePointers.delete(e.pointerId);
		if (isPinching && activePointers.size < 2) {
			isPinching = false;
		}
	}
	activePointerId = null;
	cancelActiveTool();
}

function onPointerLeave(e) {
	// Guard: on iPad Safari, Apple Pencil can trigger spurious pointerleave
	// events even during active drawing. Only finalize if no buttons pressed.
	if (e.buttons !== 0) return;
	onPointerUp(e);
}

// ============ iOS detection ============

let _isIOS = null;
function isIOS() {
	if (_isIOS === null) {
		_isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
			(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
	}
	return _isIOS;
}

// ============ Setup ============

export function setupInputManager() {
	const liveCanvas = getLiveCanvas();

	liveCanvas.addEventListener('pointerdown', onPointerDown);
	liveCanvas.addEventListener('pointermove', onPointerMove);
	liveCanvas.addEventListener('pointerup', onPointerUp);
	liveCanvas.addEventListener('pointercancel', onPointerCancel);
	liveCanvas.addEventListener('pointerleave', onPointerLeave);
}
