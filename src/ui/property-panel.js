// OpenMathBoard — Property editing panel (floating, contextual)
// Positioned adjacent to selection. Auto-sizes to content. Responsive.
import {
	getStrokes, getSelectedStrokes, getCamera
} from '../core/state.js';
import { redrawCanvas, getStrokeBounds } from '../canvas/renderer.js';
import { saveToHistory } from '../core/history.js';
import { deleteSelectedStrokes } from '../interaction/selection.js';

let panelEl = null;
const PANEL_GAP = 12;
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
}

function applyToSelected(fn) {
	const strokes = getStrokes();
	const selected = getSelectedStrokes();
	for (const idx of selected) {
		if (strokes[idx]) fn(strokes[idx]);
	}
	highlightCurrentState();
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
	if (selected.length === 0) {
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
	const toolbarH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-height')) || 56;

	// Compute selection bounds in screen coords
	let sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
	for (const idx of selected) {
		const bounds = getStrokeBounds(strokes[idx]);
		if (!bounds) continue;
		sMinX = Math.min(sMinX, (bounds.minX - camera.x) * camera.zoom);
		sMinY = Math.min(sMinY, (bounds.minY - camera.y) * camera.zoom);
		sMaxX = Math.max(sMaxX, (bounds.maxX - camera.x) * camera.zoom);
		sMaxY = Math.max(sMaxY, (bounds.maxY - camera.y) * camera.zoom);
	}

	const panelW = panelEl.offsetWidth || 180;
	const panelH = panelEl.offsetHeight || 120;
	const vpW = window.innerWidth;
	const vpH = window.innerHeight;

	// M3: Account for shape palette stealing right-side space
	const palette = document.getElementById('shapePalette');
	const paletteOpen = palette && palette.classList.contains('show');
	const usableW = paletteOpen ? vpW - (palette.offsetWidth || 200) : vpW;

	let left, top;

	// Strategy 1: RIGHT of selection
	left = sMaxX + PANEL_GAP;
	top = sMinY + toolbarH;

	if (left + panelW > usableW - EDGE_MARGIN) {
		// Strategy 2: LEFT of selection
		left = sMinX - panelW - PANEL_GAP;
	}

	if (left < EDGE_MARGIN) {
		// Strategy 3: BELOW selection centered
		left = (sMinX + sMaxX) / 2 - panelW / 2;
		top = sMaxY + toolbarH + PANEL_GAP;
	}

	// E2: If shape is huge and covers entire viewport, anchor to top-right corner
	if (sMaxX - sMinX > vpW * 0.8 && sMaxY - sMinY > (vpH - toolbarH) * 0.8) {
		left = usableW - panelW - EDGE_MARGIN;
		top = toolbarH + EDGE_MARGIN;
	}

	// Clamp within viewport
	left = Math.max(EDGE_MARGIN, Math.min(left, usableW - panelW - EDGE_MARGIN));
	top = Math.max(toolbarH + EDGE_MARGIN, Math.min(top, vpH - panelH - EDGE_MARGIN));

	panelEl.style.left = left + 'px';
	panelEl.style.top = top + 'px';
}

export function hidePropertyPanel() {
	if (panelEl) panelEl.classList.remove('show');
}
