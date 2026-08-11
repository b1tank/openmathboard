// OpenMathBoard — Property editing panel (floating, contextual)
// Positioned adjacent to selection. Auto-sizes to content. Responsive.
import {
	getStrokes, getSelectedStrokes, getCamera, getCanvasRect
} from '../core/state.js';
import { redrawCanvas, getStrokeBounds, invalidateCache } from '../canvas/renderer.js';
import { saveToHistory } from '../core/history.js';
import { deleteSelectedStrokes } from '../interaction/selection.js';

let panelEl = null;
const PANEL_GAP = 20;
const ROTATION_CLEARANCE = 52;
const EDGE_MARGIN = 8;

export function initPropertyPanel() {
	panelEl = document.getElementById('propertyPanel');
	if (!panelEl) return;

	panelEl.querySelectorAll('.prop-color').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			applyToSelected(stroke => { stroke.color = btn.dataset.color; });
		});
	});

	panelEl.querySelectorAll('.prop-width').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			applyToSelected(stroke => { stroke.width = parseInt(btn.dataset.width); });
		});
	});

	panelEl.querySelectorAll('.prop-dash-solid, .prop-dash-dashed').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			applyToSelected(stroke => { stroke.dash = btn.dataset.dash === 'true'; });
		});
	});

	const deleteBtn = document.getElementById('propDeleteBtn');
	if (deleteBtn) {
		deleteBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			deleteSelectedStrokes();
			hidePropertyPanel();
		});
	}

	panelEl.addEventListener('pointerdown', (e) => e.stopPropagation());

	// iOS changes the visual viewport as browser chrome appears/disappears.
	const reposition = () => {
		if (panelEl?.classList.contains('show')) positionPanel();
	};
	window.addEventListener('resize', reposition);
	window.visualViewport?.addEventListener('resize', reposition);
	window.visualViewport?.addEventListener('scroll', reposition);
}

function applyToSelected(fn) {
	const strokes = getStrokes();
	const selected = getSelectedStrokes();
	for (const idx of selected) {
		if (strokes[idx]) fn(strokes[idx]);
	}
	highlightCurrentState();
	invalidateCache();
	redrawCanvas();
	saveToHistory();
}

// ============ U1: Highlight current state ============

function highlightCurrentState() {
	if (!panelEl) return;

	const strokes = getStrokes();
	const selected = getSelectedStrokes();
	if (selected.length === 0) return;

	// Use first selected object's properties as reference
	const ref = strokes[selected[0]];
	if (!ref) return;

	const allSameColor = selected.every(i => strokes[i]?.color === ref.color);
	const allSameWidth = selected.every(i => strokes[i]?.width === ref.width);
	const allSameDash = selected.every(i => strokes[i]?.dash === ref.dash);

	// Colors
	panelEl.querySelectorAll('.prop-color').forEach(btn => {
		btn.classList.toggle('active', allSameColor && btn.dataset.color === ref.color);
	});

	// Widths
	panelEl.querySelectorAll('.prop-width').forEach(btn => {
		btn.classList.toggle('active', allSameWidth && parseInt(btn.dataset.width) === ref.width);
	});

	// Dash
	panelEl.querySelectorAll('.prop-dash-solid, .prop-dash-dashed').forEach(btn => {
		const isDash = btn.dataset.dash === 'true';
		btn.classList.toggle('active', allSameDash && isDash === !!ref.dash);
	});
}

// ============ Show / Hide / Position ============

export function updatePropertyPanel() {
	if (!panelEl) return;

	const selected = getSelectedStrokes();
	const shapePalette = document.getElementById('shapePalette');
	// The mobile shape picker is a bottom sheet. Two floating panels competing
	// for the same space is both occluding and confusing, so it takes priority.
	if (selected.length === 0 || shapePalette?.classList.contains('show')) {
		hidePropertyPanel();
		return;
	}

	highlightCurrentState();
	panelEl.classList.add('show');

	// Position after show so offsetWidth/Height are measurable
	requestAnimationFrame(() => positionPanel());
}

function positionPanel() {
	if (!panelEl) return;

	const selected = getSelectedStrokes();
	const strokes = getStrokes();
	const camera = getCamera();
	const canvasRect = getCanvasRect();
	if (!canvasRect) return;

	// Compute the actual on-screen envelope, including shape rotation.
	let sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
	for (const idx of selected) {
		const stroke = strokes[idx];
		const bounds = getStrokeBounds(stroke);
		if (!bounds) continue;
		const cx = (bounds.minX + bounds.maxX) / 2;
		const cy = (bounds.minY + bounds.maxY) / 2;
		const rotation = (stroke.shape && stroke.shape.rotation) || stroke.rotation || 0;
		const cos = Math.cos(rotation), sin = Math.sin(rotation);
		for (const [x, y] of [
			[bounds.minX, bounds.minY], [bounds.maxX, bounds.minY],
			[bounds.maxX, bounds.maxY], [bounds.minX, bounds.maxY]
		]) {
			const dx = x - cx, dy = y - cy;
			const rx = cx + dx * cos - dy * sin;
			const ry = cy + dx * sin + dy * cos;
			const sx = canvasRect.left + (rx - camera.x) * camera.zoom;
			const sy = canvasRect.top + (ry - camera.y) * camera.zoom;
			sMinX = Math.min(sMinX, sx); sMaxX = Math.max(sMaxX, sx);
			sMinY = Math.min(sMinY, sy); sMaxY = Math.max(sMaxY, sy);
		}
	}
	if (!Number.isFinite(sMinX)) return;

	const panelW = panelEl.offsetWidth || 180;
	const panelH = panelEl.offsetHeight || 120;
	const vv = window.visualViewport;
	const vpLeft = vv?.offsetLeft || 0;
	const vpTop = vv?.offsetTop || 0;
	const viewportWidth = vv?.width || window.innerWidth;
	let vpRight = vpLeft + viewportWidth;
	let vpBottom = vpTop + (vv?.height || window.innerHeight);

	// Account for either desktop's right drawer or mobile's bottom sheet.
	const palette = document.getElementById('shapePalette');
	if (palette?.classList.contains('show')) {
		const paletteRect = palette.getBoundingClientRect();
		if (paletteRect.width < viewportWidth * 0.75) {
			vpRight = Math.min(vpRight, paletteRect.left);
		} else {
			vpBottom = Math.min(vpBottom, paletteRect.top);
		}
	}

	const minLeft = vpLeft + EDGE_MARGIN;
	const maxLeft = vpRight - panelW - EDGE_MARGIN;
	const minTop = Math.max(vpTop + EDGE_MARGIN, canvasRect.top + EDGE_MARGIN);
	const maxTop = vpBottom - panelH - EDGE_MARGIN;
	const centerX = (sMinX + sMaxX) / 2;
	const centerY = (sMinY + sMaxY) / 2;
	const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

	const candidates = {
		right: {
			left: sMaxX + PANEL_GAP,
			top: clamp(centerY - panelH / 2, minTop, maxTop),
			fits: sMaxX + PANEL_GAP + panelW <= vpRight - EDGE_MARGIN
		},
		left: {
			left: sMinX - panelW - PANEL_GAP,
			top: clamp(centerY - panelH / 2, minTop, maxTop),
			fits: sMinX - panelW - PANEL_GAP >= minLeft
		},
		below: {
			left: clamp(centerX - panelW / 2, minLeft, maxLeft),
			top: sMaxY + PANEL_GAP,
			fits: sMaxY + PANEL_GAP + panelH <= vpBottom - EDGE_MARGIN
		},
		above: {
			left: clamp(centerX - panelW / 2, minLeft, maxLeft),
			top: sMinY - panelH - ROTATION_CLEARANCE,
			fits: sMinY - panelH - ROTATION_CLEARANCE >= minTop
		}
	};

	// Narrow iOS screens work better above/below the object; wider screens can
	// use the side without pushing the panel across the canvas.
	const narrow = (vv?.width || window.innerWidth) <= 600;
	const order = narrow
		? ['below', 'above', 'right', 'left']
		: ['right', 'left', 'below', 'above'];
	const chosen = order.map(name => candidates[name]).find(candidate => candidate.fits);

	let left, top;
	if (chosen) {
		({ left, top } = chosen);
	} else {
		// Very large selections leave no adjacent space. Dock to whichever
		// viewport edge is farther from the selection center.
		left = clamp(centerX - panelW / 2, minLeft, maxLeft);
		const dockTop = minTop;
		const dockBottom = maxTop;
		top = centerY > (minTop + vpBottom) / 2 ? dockTop : dockBottom;
	}

	panelEl.style.left = Math.round(clamp(left, minLeft, maxLeft)) + 'px';
	panelEl.style.top = Math.round(clamp(top, minTop, maxTop)) + 'px';
}

export function hidePropertyPanel() {
	if (panelEl) panelEl.classList.remove('show');
}
