// OpenMathBoard — Input Manager
// Single owner of all pointer events on the live canvas.
// Normalizes events and routes to the active tool module.
// During Sprint 1, eraser/select fall through to legacy input.js handlers.

import {
	TOOLS, getCurrentTool,
	getLiveCanvas, getCanvasRect, setCanvasRect, getCamera,
	getDomRefs
} from '../core/state.js';
import { isSpacebarPanning } from '../canvas/camera.js';
import { onPenPointerDown, onPenPointerMove, onPenPointerUp, onPenCancel } from './pen-tool.js';

// ============ Pen/finger detection ============
let hasPenInput = false;
let activePointerId = null;

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

// ============ Legacy bridge ============
// During Sprint 1, eraser and select still use the old input.js handlers.
// We import them lazily to avoid circular deps at load time.
let legacyDown = null;
let legacyMove = null;
let legacyUp = null;

export function setLegacyHandlers(down, move, up) {
	legacyDown = down;
	legacyMove = move;
	legacyUp = up;
}

// ============ Pointer handlers ============

function onPointerDown(e) {
	e.preventDefault();

	if (isSpacebarPanning()) return;

	const isPen = e.pointerType === 'pen';
	const isFinger = e.pointerType === 'touch';

	if (isPen) hasPenInput = true;

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

	const tool = getCurrentTool();

	if (tool === TOOLS.PEN) {
		const pos = normalizeEvent(e);
		onPenPointerDown(pos);
	} else {
		// Legacy bridge for eraser/select (Sprint 1)
		if (legacyDown) legacyDown(e);
	}
}

function onPointerMove(e) {
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
	} else {
		// Legacy bridge for eraser/select
		if (legacyMove) legacyMove(e);
	}
}

function onPointerUp(e) {
	if (activePointerId !== null && e && e.pointerId !== activePointerId) return;
	activePointerId = null;

	const tool = getCurrentTool();

	if (tool === TOOLS.PEN) {
		const pos = normalizeEvent(e);
		onPenPointerUp(pos);
	} else {
		// Legacy bridge for eraser/select
		if (legacyUp) legacyUp(e);
	}
}

function onPointerCancel(e) {
	activePointerId = null;

	const tool = getCurrentTool();
	if (tool === TOOLS.PEN) {
		onPenCancel();
	} else {
		// For legacy tools, treat cancel as pointer up
		if (legacyUp) legacyUp(e);
	}
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
