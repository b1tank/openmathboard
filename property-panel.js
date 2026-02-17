// OpenMathBoard — Property editing panel (floating, contextual)
// UX: positioned to the RIGHT of the selection bounding box, never overlapping the shape.
// Follows shape during move/anchor drag. Falls back to left/below if no space on right.
import {
	getStrokes, getSelectedStrokes, getCamera
} from './state.js';
import { redrawCanvas, getStrokeBounds } from './renderer.js';
import { saveToHistory } from './history.js';
import { deleteSelectedStrokes } from './selection.js';

let panelEl = null;
const PANEL_WIDTH = 170;
const PANEL_GAP = 14; // gap between shape edge and panel

export function initPropertyPanel() {
	panelEl = document.getElementById('propertyPanel');
	if (!panelEl) return;

	// Color buttons
	panelEl.querySelectorAll('.prop-color').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			applyToSelected(stroke => { stroke.color = btn.dataset.color; });
		});
	});

	// Width buttons
	panelEl.querySelectorAll('.prop-width').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			applyToSelected(stroke => { stroke.width = parseInt(btn.dataset.width); });
		});
	});

	// Dash buttons
	panelEl.querySelectorAll('.prop-dash-solid, .prop-dash-dashed').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			applyToSelected(stroke => { stroke.dash = btn.dataset.dash === 'true'; });
		});
	});

	// Delete button
	const deleteBtn = document.getElementById('propDeleteBtn');
	if (deleteBtn) {
		deleteBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			deleteSelectedStrokes();
			hidePropertyPanel();
		});
	}

	// Prevent pointer events on panel from reaching the canvas
	panelEl.addEventListener('pointerdown', (e) => e.stopPropagation());
}

function applyToSelected(fn) {
	const strokes = getStrokes();
	const selected = getSelectedStrokes();
	for (const idx of selected) {
		if (strokes[idx]) fn(strokes[idx]);
	}
	redrawCanvas();
	saveToHistory();
}

export function updatePropertyPanel() {
	if (!panelEl) return;

	const selected = getSelectedStrokes();
	if (selected.length === 0) {
		hidePropertyPanel();
		return;
	}

	positionPanel();
	panelEl.classList.add('show');
}

function positionPanel() {
	if (!panelEl) return;

	const selected = getSelectedStrokes();
	const strokes = getStrokes();
	const camera = getCamera();
	const toolbarH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-height')) || 56;

	// Compute selection bounding box in screen coords
	let sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
	for (const idx of selected) {
		const bounds = getStrokeBounds(strokes[idx]);
		if (!bounds) continue;
		const x1 = (bounds.minX - camera.x) * camera.zoom;
		const y1 = (bounds.minY - camera.y) * camera.zoom;
		const x2 = (bounds.maxX - camera.x) * camera.zoom;
		const y2 = (bounds.maxY - camera.y) * camera.zoom;
		sMinX = Math.min(sMinX, x1);
		sMinY = Math.min(sMinY, y1);
		sMaxX = Math.max(sMaxX, x2);
		sMaxY = Math.max(sMaxY, y2);
	}

	const panelHeight = panelEl.offsetHeight || 160;
	const vpW = window.innerWidth;
	const vpH = window.innerHeight;

	// Strategy 1: RIGHT of selection
	let left = sMaxX + PANEL_GAP;
	let top = sMinY + toolbarH;

	// If panel would go off-screen right, try LEFT of selection
	if (left + PANEL_WIDTH > vpW - 8) {
		left = sMinX - PANEL_WIDTH - PANEL_GAP;
	}

	// If still off-screen left, place BELOW selection
	if (left < 8) {
		left = Math.max(8, Math.min(sMinX, vpW - PANEL_WIDTH - 8));
		top = sMaxY + toolbarH + PANEL_GAP;
	}

	// Clamp vertically
	top = Math.max(toolbarH + 8, Math.min(top, vpH - panelHeight - 8));

	// Clamp horizontally
	left = Math.max(8, Math.min(left, vpW - PANEL_WIDTH - 8));

	panelEl.style.left = left + 'px';
	panelEl.style.top = top + 'px';
	panelEl.style.width = PANEL_WIDTH + 'px';
}

export function hidePropertyPanel() {
	if (panelEl) panelEl.classList.remove('show');
}
