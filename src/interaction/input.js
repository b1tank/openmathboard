// OpenMathBoard — Input handling (pointer/touch/keyboard events)
//
// Architecture: input capture and rendering are fully decoupled.
//   pointerdown  → pure data setup + start render loop   (<0.1ms)
//   pointermove  → push points to buffer only             (<0.1ms)
//   pointerup    → finalize stroke data + stop loop       (<0.5ms)
//                   heavy work deferred via rIC/setTimeout
//   render loop  → independent RAF; blits cache + overlay

import {
	TOOLS, getCurrentTool, getCurrentColor, getCurrentStrokeWidth, getCurrentDash,
	getIsDrawing, setIsDrawing,
	getCurrentStroke, setCurrentStroke,
	getStrokes, setStrokes,
	getSelectedStrokes, setSelectedStrokes,
	getSelectionRect, setSelectionRect,
	getIsSelecting, setIsSelecting,
	getIsDraggingSelection, setIsDraggingSelection,
	getDragStartPos, setDragStartPos,
	getClipboardStrokes,
	getIsDraggingAnchor, setIsDraggingAnchor,
	getDraggingAnchorInfo, setDraggingAnchorInfo,
	getCanvas, getCtx, getCamera
} from '../core/state.js';
import { redrawCanvas, drawStroke, isPointNearStroke, getStrokeBounds, invalidateCache } from '../canvas/renderer.js';
import {
	findStrokeAtPoint, findStrokesInRect,
	moveSelectedStrokes, clearSelection, updateSelectionCursor,
	deleteSelectedStrokes, copySelectedStrokes, pasteStrokes
} from './selection.js';
import { saveToHistory, undo, redo } from '../core/history.js';
import { setTool } from './tools.js';
import {
	pointToSegmentDistance, pointToPolylineDistance
} from './detection.js';
import { t } from '../i18n/i18n.js';
import { showToast } from '../ui/toast.js';
import { saveImage } from '../ui/export.js';
import { hideHeroSection } from '../ui/hero.js';
import { isSpacebarPanning } from '../canvas/camera.js';
import { updatePropertyPanel } from '../ui/property-panel.js';
import { showConversionPopup } from '../ui/conversion.js';
import { findAnchorAtPoint, onAnchorDrag } from '../canvas/anchors.js';

// ============ Touch/stylus detection ============
let hasPenInput = false;
let activePointerId = null;

// ============ Independent render loop ============
// Runs continuously while any high-frequency interaction is active.
// Stops itself when the interaction ends.
let renderLoopId = null;
let renderLoopActive = false;

function startRenderLoop() {
	if (renderLoopActive) return;
	renderLoopActive = true;
	renderLoopTick();
}

function stopRenderLoop() {
	renderLoopActive = false;
	// Don't cancel the current frame — let the last frame render cleanly.
	// The loop self-terminates when renderLoopActive is false.
}

function renderLoopTick() {
	if (!renderLoopActive) {
		renderLoopId = null;
		return;
	}
	renderLoopId = requestAnimationFrame(() => {
		redrawCanvas();
		// Draw in-progress stroke on top (PEN tool only)
		const stroke = getCurrentStroke();
		if (stroke) {
			const ctx = getCtx();
			const camera = getCamera();
			ctx.save();
			ctx.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
			ctx.scale(camera.zoom, camera.zoom);
			drawStroke(ctx, stroke, camera);
			ctx.restore();
		}
		renderLoopTick(); // schedule next frame
	});
}

// ============ Deferred heavy work ============
// Runs history save, shape detection, etc. outside the input-critical path.
function deferWork(fn) {
	if (typeof requestIdleCallback === 'function') {
		requestIdleCallback(() => fn(), { timeout: 100 });
	} else {
		setTimeout(fn, 0);
	}
}

// ============ Coalesced events helpers ============
const MIN_POINT_SPACING = 1.5; // world units

function worldDistance(a, b) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

// ============ Canvas event setup ============

export function setupCanvasListeners() {
	const canvas = getCanvas();
	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerup', onPointerUp);
	canvas.addEventListener('pointerleave', onPointerUp);
}

function getPointerPos(e) {
	const canvas = getCanvas();
	const rect = canvas.getBoundingClientRect();
	const camera = getCamera();
	const sx = e.clientX - rect.left;
	const sy = e.clientY - rect.top;
	return {
		x: sx / camera.zoom + camera.x,
		y: sy / camera.zoom + camera.y,
		screenX: sx,
		screenY: sy,
		pressure: e.pressure || 0.5
	};
}

function onPointerDown(e) {
	e.preventDefault();

	if (isSpacebarPanning()) return;

	const isPencil = e.pointerType === 'pen';
	const isFinger = e.pointerType === 'touch';

	if (isPencil) hasPenInput = true;

	if (isFinger && hasPenInput && getCurrentTool() !== TOOLS.SELECT) {
		return;
	}

	if (isFinger && activePointerId !== null && activePointerId !== e.pointerId) {
		if (getIsDrawing()) {
			setIsDrawing(false);
			setCurrentStroke(null);
			stopRenderLoop();
			redrawCanvas();
		}
		activePointerId = null;
		return;
	}

	const canvas = getCanvas();
	canvas.setPointerCapture(e.pointerId);
	activePointerId = e.pointerId;

	const pos = getPointerPos(e);

	if (getCurrentTool() === TOOLS.SELECT) {
		const selected = getSelectedStrokes();
		const strokes = getStrokes();
		const camera = getCamera();

		// 1. Anchor hit
		if (selected.length > 0) {
			for (const idx of selected) {
				const stroke = strokes[idx];
				if (!stroke) continue;
				const anchor = findAnchorAtPoint(stroke, pos, camera);
				if (anchor) {
					setIsDraggingAnchor(true);
					const info = { strokeIdx: idx, anchorId: anchor.id };
					if (stroke.shape && stroke.shape.type === 'parabola' && anchor.id === 'vertex') {
						const s = stroke.shape;
						info.savedEndpointYLeft = s.a * (s.xMin - s.h) ** 2 + s.k;
						info.savedEndpointYRight = s.a * (s.xMax - s.h) ** 2 + s.k;
					}
					setDraggingAnchorInfo(info);
					setDragStartPos(pos);
					startRenderLoop();
					return;
				}
			}
		}

		// 2. Selection bounds hit → drag
		if (selected.length > 0) {
			const PADDING = 6;
			const insideBounds = selected.some(idx => {
				const stroke = strokes[idx];
				const bounds = getStrokeBounds(stroke);
				if (!bounds) return false;
				let testX = pos.x, testY = pos.y;
				const rotation = (stroke.shape && stroke.shape.rotation) || 0;
				if (rotation !== 0) {
					const cx = (bounds.minX + bounds.maxX) / 2;
					const cy = (bounds.minY + bounds.maxY) / 2;
					const cos = Math.cos(-rotation);
					const sin = Math.sin(-rotation);
					const dx = pos.x - cx, dy = pos.y - cy;
					testX = cx + dx * cos - dy * sin;
					testY = cy + dx * sin + dy * cos;
				}
				return testX >= bounds.minX - PADDING / camera.zoom &&
				       testX <= bounds.maxX + PADDING / camera.zoom &&
				       testY >= bounds.minY - PADDING / camera.zoom &&
				       testY <= bounds.maxY + PADDING / camera.zoom;
			});
			if (insideBounds) {
				setIsDraggingSelection(true);
				setDragStartPos(pos);
				startRenderLoop();
				return;
			}
		}

		// 3. Click on stroke → select
		const clickedStrokeIdx = findStrokeAtPoint(pos);
		if (clickedStrokeIdx !== -1) {
			setSelectedStrokes([clickedStrokeIdx]);
			setDragStartPos(pos);
			setIsDraggingSelection(true);
			updateSelectionCursor();
			updatePropertyPanel();
			redrawCanvas();
			return;
		}

		// 4. Start rectangle selection
		setSelectedStrokes([]);
		setIsSelecting(true);
		setSelectionRect({ x1: pos.screenX, y1: pos.screenY, x2: pos.screenX, y2: pos.screenY });
		updateSelectionCursor();
		updatePropertyPanel();
		startRenderLoop();
		return;
	}

	hideHeroSection();

	if (getCurrentTool() === TOOLS.ERASER) {
		eraseAtPoint(pos);
		setIsDrawing(true);
		startRenderLoop();
	} else if (getCurrentTool() === TOOLS.PEN) {
		setIsDrawing(true);
		setCurrentStroke({
			color: getCurrentColor(),
			width: getCurrentStrokeWidth(),
			dash: getCurrentDash(),
			points: [pos]
		});
		startRenderLoop();
	}
}

function onPointerMove(e) {
	if (activePointerId !== null && e.pointerId !== activePointerId) return;

	const pos = getPointerPos(e);

	if (getCurrentTool() === TOOLS.SELECT) {
		// Anchor drag — data only, render loop handles display
		if (getIsDraggingAnchor() && getDraggingAnchorInfo()) {
			const info = getDraggingAnchorInfo();
			const strokes = getStrokes();
			const stroke = strokes[info.strokeIdx];
			if (stroke) {
				onAnchorDrag(stroke, info.anchorId, pos, info);
			}
			return;
		}

		// Selection drag — data only
		if (getIsDraggingSelection() && getDragStartPos()) {
			const start = getDragStartPos();
			const dx = pos.x - start.x;
			const dy = pos.y - start.y;
			moveSelectedStrokes(dx, dy);
			setDragStartPos(pos);
			return;
		}

		// Selection rect — data only
		if (getIsSelecting() && getSelectionRect()) {
			const rect = getSelectionRect();
			setSelectionRect({ ...rect, x2: pos.screenX, y2: pos.screenY });
			return;
		}
		return;
	}

	if (!getIsDrawing()) return;

	if (getCurrentTool() === TOOLS.ERASER) {
		eraseAtPoint(pos);
	} else if (getCurrentTool() === TOOLS.PEN && getCurrentStroke()) {
		// Harvest coalesced events for maximum point fidelity
		const stroke = getCurrentStroke();
		const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
		for (const ce of events) {
			const pt = getPointerPos(ce);
			const lastPt = stroke.points[stroke.points.length - 1];
			if (!lastPt || worldDistance(lastPt, pt) >= MIN_POINT_SPACING) {
				stroke.points.push(pt);
			}
		}
		// No scheduleRedraw / redrawCanvas here — render loop handles it
	}
}

function onPointerUp(e) {
	if (activePointerId !== null && e && e.pointerId !== activePointerId) return;
	activePointerId = null;

	if (getCurrentTool() === TOOLS.SELECT) {
		if (getIsDraggingAnchor()) {
			setIsDraggingAnchor(false);
			setDraggingAnchorInfo(null);
			stopRenderLoop();
			// Defer history save — not input-critical
			deferWork(() => { saveToHistory(); redrawCanvas(); });
			updatePropertyPanel();
			return;
		}

		if (getIsDraggingSelection()) {
			setIsDraggingSelection(false);
			setDragStartPos(null);
			stopRenderLoop();
			if (getSelectedStrokes().length > 0) {
				deferWork(() => { saveToHistory(); redrawCanvas(); });
			}
			updatePropertyPanel();
			return;
		}

		if (getIsSelecting() && getSelectionRect()) {
			const rect = getSelectionRect();
			const camera = getCamera();
			const worldRect = {
				x1: rect.x1 / camera.zoom + camera.x,
				y1: rect.y1 / camera.zoom + camera.y,
				x2: rect.x2 / camera.zoom + camera.x,
				y2: rect.y2 / camera.zoom + camera.y
			};
			setSelectedStrokes(findStrokesInRect(worldRect));
			setIsSelecting(false);
			setSelectionRect(null);
			updateSelectionCursor();
			updatePropertyPanel();
			stopRenderLoop();
			redrawCanvas();
			return;
		}
		return;
	}

	if (!getIsDrawing()) return;
	setIsDrawing(false);
	stopRenderLoop();

	const currentStroke = getCurrentStroke();
	if (getCurrentTool() === TOOLS.PEN && currentStroke && currentStroke.points.length > 1) {
		// Capture the final lift-point
		if (e) {
			const finalPt = getPointerPos(e);
			const lastPt = currentStroke.points[currentStroke.points.length - 1];
			if (!lastPt || worldDistance(lastPt, finalPt) >= MIN_POINT_SPACING) {
				currentStroke.points.push(finalPt);
			}
		}

		// Commit stroke — lightweight data push only
		getStrokes().push(currentStroke);
		invalidateCache();

		// Snapshot screen coords for popup BEFORE clearing current stroke
		const lastPt = currentStroke.points[currentStroke.points.length - 1];
		const camera = getCamera();
		const screenX = (lastPt.x - camera.x) * camera.zoom;
		const screenY = (lastPt.y - camera.y) * camera.zoom + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-height')) || 56);

		// Clear in-progress stroke and do a single synchronous render
		// This is fast because the cache is valid for all previously committed
		// strokes — only the newly-added stroke triggers a cache rebuild.
		setCurrentStroke(null);
		redrawCanvas();

		// Defer ALL heavy work: history clone + shape detection
		// This keeps the main thread free for the next pointerdown
		deferWork(() => {
			saveToHistory();
			showConversionPopup(currentStroke, screenX, screenY);
		});
	} else {
		setCurrentStroke(null);
		redrawCanvas();
	}
}

function eraseAtPoint(pos) {
	const eraseRadius = 20;
	const strokes = getStrokes();

	const remainingStrokes = strokes.filter(stroke => {
		if (!stroke) return true;

		if (stroke.shape && stroke.shape.type === 'circle') {
			const dx = pos.x - stroke.shape.cx;
			const dy = pos.y - stroke.shape.cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const band = eraseRadius + (stroke.width / 2) + 2;
			return Math.abs(dist - stroke.shape.r) > band;
		}

		if (stroke.shape && stroke.shape.type === 'line') {
			const band = eraseRadius + (stroke.width / 2) + 2;
			return pointToSegmentDistance(pos,
				{ x: stroke.shape.x1, y: stroke.shape.y1 },
				{ x: stroke.shape.x2, y: stroke.shape.y2 }
			) > band;
		}

		if (stroke.shape && stroke.shape.type === 'parabola') {
			const band = eraseRadius + (stroke.width / 2) + 2;
			return pointToPolylineDistance(pos, stroke.points) > band;
		}

		// Generic shape eraser using renderer hit-test (covers square, rectangle, triangle, etc.)
		if (stroke.shape) {
			return !isPointNearStroke(pos, stroke, eraseRadius);
		}

		return !stroke.points.some(point => {
			const dx = point.x - pos.x;
			const dy = point.y - pos.y;
			return Math.sqrt(dx * dx + dy * dy) < eraseRadius;
		});
	});

	if (remainingStrokes.length !== strokes.length) {
		setStrokes(remainingStrokes);
		scheduleRedraw();
	}
}

// ============ Keyboard shortcuts ============

export function setupKeyboardShortcuts() {
	document.addEventListener('keydown', (e) => {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

		if (e.key === 'Escape') {
			if (getSelectedStrokes().length > 0 || getIsSelecting()) {
				clearSelection();
				return;
			}
		}

		if (e.key === 'Delete' || e.key === 'Backspace') {
			if (getSelectedStrokes().length > 0) {
				e.preventDefault();
				deleteSelectedStrokes();
				return;
			}
		}

		if (e.ctrlKey && e.key === 'c') {
			if (getSelectedStrokes().length > 0) {
				e.preventDefault();
				copySelectedStrokes();
				return;
			}
		}

		if (e.ctrlKey && e.key === 'v') {
			if (getClipboardStrokes().length > 0) {
				e.preventDefault();
				pasteStrokes();
				return;
			}
		}

		if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			undo();
		}

		if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
			e.preventDefault();
			redo();
		}

		if (e.key === 'p' || e.key === 'P') setTool(TOOLS.PEN);
		if (e.key === 'e' || e.key === 'E') setTool(TOOLS.ERASER);
		if ((e.key === 's' || e.key === 'S') && !e.ctrlKey) setTool(TOOLS.SELECT);

		if (e.ctrlKey && e.key === 's') {
			e.preventDefault();
			saveImage();
		}
	});
}
