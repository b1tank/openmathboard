// OpenMathBoard — Property editing panel (floating, contextual)
import {
	getStrokes, getSelectedStrokes, getCamera
} from './state.js';
import { redrawCanvas, getStrokeBounds } from './renderer.js';
import { saveToHistory } from './history.js';
import { deleteSelectedStrokes } from './selection.js';

let panelEl = null;

export function initPropertyPanel() {
	panelEl = document.getElementById('propertyPanel');
	if (!panelEl) return;

	// Color buttons
	panelEl.querySelectorAll('.prop-color').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const color = btn.dataset.color;
			applyToSelected(stroke => { stroke.color = color; });
		});
	});

	// Width buttons
	panelEl.querySelectorAll('.prop-width').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const width = parseInt(btn.dataset.width);
			applyToSelected(stroke => { stroke.width = width; });
		});
	});

	// Dash buttons
	panelEl.querySelectorAll('.prop-dash-solid, .prop-dash-dashed').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const dash = btn.dataset.dash === 'true';
			applyToSelected(stroke => { stroke.dash = dash; });
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

	showPropertyPanel();
}

function showPropertyPanel() {
	if (!panelEl) return;

	const selected = getSelectedStrokes();
	const strokes = getStrokes();
	const camera = getCamera();

	// Position near the selection's bounding box
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const idx of selected) {
		const bounds = getStrokeBounds(strokes[idx]);
		if (!bounds) continue;
		const screenMinX = (bounds.minX - camera.x) * camera.zoom;
		const screenMinY = (bounds.minY - camera.y) * camera.zoom;
		const screenMaxX = (bounds.maxX - camera.x) * camera.zoom;
		const screenMaxY = (bounds.maxY - camera.y) * camera.zoom;
		if (screenMinX < minX) minX = screenMinX;
		if (screenMinY < minY) minY = screenMinY;
		if (screenMaxX > maxX) maxX = screenMaxX;
		if (screenMaxY > maxY) maxY = screenMaxY;
	}

	// Position above the selection (toolbar height offset)
	const toolbarH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-height')) || 56;
	const panelWidth = 200;
	const centerX = (minX + maxX) / 2;
	let left = centerX - panelWidth / 2;
	let top = minY + toolbarH - 10;

	// If above selection would go above toolbar, place below
	if (top < toolbarH + 8) {
		top = maxY + toolbarH + 10;
	}

	// Keep within viewport
	left = Math.max(8, Math.min(window.innerWidth - panelWidth - 8, left));

	panelEl.style.left = left + 'px';
	panelEl.style.top = top + 'px';
	panelEl.classList.add('show');
}

export function hidePropertyPanel() {
	if (panelEl) panelEl.classList.remove('show');
}
