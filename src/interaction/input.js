// OpenMathBoard — Input handling (pointer/touch/keyboard events)
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
// Track whether the device has a stylus (e.g. iPad + Apple Pencil).
// When a stylus is present, finger input pans/zooms and pen draws.
// When no stylus is detected (phones), finger input draws.
let hasPenInput = false;
// Track the active pointer (prevents multi-touch glitches)
let activePointerId = null;

// ============ RAF-batched rendering ============
// Gate high-frequency pointermove redraws to one per animation frame.
let rafId = null;

function scheduleRedraw() {
	if (rafId !== null) return;
	rafId = requestAnimationFrame(() => {
		rafId = null;
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
	});
}

// ============ Coalesced events helpers ============
// Minimum distance (world units) between consecutive points.
// Filters sub-pixel noise while preserving visible detail.
// Tune higher if zoomed detail feels too coarse.
const MIN_POINT_SPACING = 1.5;

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

	// Don't start drawing when spacebar-panning
	if (isSpacebarPanning()) return;

	// Pencil/finger detection: pen draws, touch pans (only when stylus is available)
	const isPencil = e.pointerType === 'pen';
	const isFinger = e.pointerType === 'touch';

	// Remember if a stylus has ever been used on this device
	if (isPencil) hasPenInput = true;

	// On devices with a stylus, finger always pans (handled by camera.js).
	// On devices WITHOUT a stylus (phones), finger is allowed to draw.
	if (isFinger && hasPenInput && getCurrentTool() !== TOOLS.SELECT) {
		return; // Let camera.js handle touch pan/zoom
	}

	// Multi-touch: if a second finger arrives, cancel in-progress drawing
	// and let pinch-zoom (camera.js) take over.
	if (isFinger && activePointerId !== null && activePointerId !== e.pointerId) {
		if (getIsDrawing()) {
			setIsDrawing(false);
			setCurrentStroke(null);
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

		// 1. Check if clicking on an anchor of a selected stroke
		if (selected.length > 0) {
			for (const idx of selected) {
				const stroke = strokes[idx];
				if (!stroke) continue;
				const anchor = findAnchorAtPoint(stroke, pos, camera);
				if (anchor) {
					setIsDraggingAnchor(true);
					const info = { strokeIdx: idx, anchorId: anchor.id };
					// For parabola vertex drag, save endpoint y-values
					if (stroke.shape && stroke.shape.type === 'parabola' && anchor.id === 'vertex') {
						const s = stroke.shape;
						info.savedEndpointYLeft = s.a * (s.xMin - s.h) ** 2 + s.k;
						info.savedEndpointYRight = s.a * (s.xMax - s.h) ** 2 + s.k;
					}
					setDraggingAnchorInfo(info);
					setDragStartPos(pos);
					return;
				}
			}
		}

		// 2. Check if clicking inside the selection bounding box → drag selection
		if (selected.length > 0) {
			const PADDING = 6; // must match renderer padding
			const insideBounds = selected.some(idx => {
				const stroke = strokes[idx];
				const bounds = getStrokeBounds(stroke);
				if (!bounds) return false;
				// Inverse-rotate point if shape is rotated
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
				return;
			}
		}

		// 3. Check if clicking on any stroke → select it
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
		redrawCanvas();
		return;
	}

	hideHeroSection();

	if (getCurrentTool() === TOOLS.ERASER) {
		eraseAtPoint(pos);
		setIsDrawing(true);
	} else if (getCurrentTool() === TOOLS.PEN) {
		setIsDrawing(true);
		setCurrentStroke({
			color: getCurrentColor(),
			width: getCurrentStrokeWidth(),
			dash: getCurrentDash(),
			points: [pos]
		});
	}
}

function onPointerMove(e) {
	// Ignore events from non-active pointers (prevents multi-touch glitches)
	if (activePointerId !== null && e.pointerId !== activePointerId) return;

	const pos = getPointerPos(e);

	if (getCurrentTool() === TOOLS.SELECT) {
		// Anchor dragging
		if (getIsDraggingAnchor() && getDraggingAnchorInfo()) {
			const info = getDraggingAnchorInfo();
			const strokes = getStrokes();
			const stroke = strokes[info.strokeIdx];
			if (stroke) {
				onAnchorDrag(stroke, info.anchorId, pos, info);
				scheduleRedraw();
				updatePropertyPanel();
			}
			return;
		}

		if (getIsDraggingSelection() && getDragStartPos()) {
			const start = getDragStartPos();
			const dx = pos.x - start.x;
			const dy = pos.y - start.y;
			moveSelectedStrokes(dx, dy);
			setDragStartPos(pos);
			scheduleRedraw();
			updatePropertyPanel();
			return;
		}

		if (getIsSelecting() && getSelectionRect()) {
			const rect = getSelectionRect();
			setSelectionRect({ ...rect, x2: pos.screenX, y2: pos.screenY });
			scheduleRedraw();
			return;
		}
		return;
	}

	if (!getIsDrawing()) return;

	if (getCurrentTool() === TOOLS.ERASER) {
		eraseAtPoint(pos);
	} else if (getCurrentTool() === TOOLS.PEN && getCurrentStroke()) {
		const stroke = getCurrentStroke();
		const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
		for (const ce of events) {
			const pt = getPointerPos(ce);
			const lastPt = stroke.points[stroke.points.length - 1];
			if (!lastPt || worldDistance(lastPt, pt) >= MIN_POINT_SPACING) {
				stroke.points.push(pt);
			}
		}
		scheduleRedraw();
	}
}

function onPointerUp(e) {
	// Ignore events from non-active pointers
	if (activePointerId !== null && e && e.pointerId !== activePointerId) return;
	activePointerId = null;

	if (getCurrentTool() === TOOLS.SELECT) {
		// End anchor drag
		if (getIsDraggingAnchor()) {
			setIsDraggingAnchor(false);
			setDraggingAnchorInfo(null);
			saveToHistory();
			updatePropertyPanel();
			return;
		}

		if (getIsDraggingSelection()) {
			setIsDraggingSelection(false);
			setDragStartPos(null);
			if (getSelectedStrokes().length > 0) {
				saveToHistory();
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
			redrawCanvas();
			return;
		}
		return;
	}

	if (!getIsDrawing()) return;
	setIsDrawing(false);

	const currentStroke = getCurrentStroke();
	if (getCurrentTool() === TOOLS.PEN && currentStroke && currentStroke.points.length > 1) {
		// Capture the final lift-point so the stroke doesn't end short
		if (e) {
			const finalPt = getPointerPos(e);
			const lastPt = currentStroke.points[currentStroke.points.length - 1];
			if (!lastPt || worldDistance(lastPt, finalPt) >= MIN_POINT_SPACING) {
				currentStroke.points.push(finalPt);
			}
		}
		getStrokes().push(currentStroke);
		invalidateCache();
		saveToHistory();

		// Show conversion popup if shapes detected
		const lastPt = currentStroke.points[currentStroke.points.length - 1];
		const camera = getCamera();
		const screenX = (lastPt.x - camera.x) * camera.zoom;
		const screenY = (lastPt.y - camera.y) * camera.zoom + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-height')) || 56);
		showConversionPopup(currentStroke, screenX, screenY);
	}

	// Clear in-progress stroke BEFORE any pending RAF fires.
	// scheduleRedraw()'s callback checks getCurrentStroke() and gracefully handles null.
	setCurrentStroke(null);
	redrawCanvas();
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
