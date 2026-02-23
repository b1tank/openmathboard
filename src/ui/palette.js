// OpenMathBoard — Shape palette UI (toolbar drawer)
import { getStrokes, getCamera, getCanvasRect, getDomRefs } from '../core/state.js';
import { screenToWorld } from '../canvas/camera.js';
import { createDefaultLine } from '../shapes/line.js';
import { createDefaultCircle } from '../shapes/circle.js';
import { createDefaultEllipse } from '../shapes/ellipse.js';
import { createDefaultParabola } from '../shapes/parabola.js';
import { createDefaultSine, createDefaultCosine } from '../shapes/sine.js';
import { createDefaultArrow } from '../shapes/arrow.js';
import { createDefaultAxes } from '../shapes/axes.js';
import { redrawCanvas } from '../canvas/renderer.js';
import { saveToHistory } from '../core/history.js';
import { hideHeroSection } from './hero.js';
import { t } from '../i18n/i18n.js';

let paletteEl = null;
let isOpen = false;

// Drag state
let dragShape = null;
let dragGhost = null;

const SHAPE_CONSTRUCTORS = {
	line: createDefaultLine,
	circle: createDefaultCircle,
	ellipse: createDefaultEllipse,
	parabola: createDefaultParabola,
	sine: createDefaultSine,
	cosine: createDefaultCosine,
	arrow: createDefaultArrow,
	axes: createDefaultAxes,
};

const SHAPE_ICONS = {
	line: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="28" x2="28" y2="4"/></svg>',
	circle: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="16" r="12"/></svg>',
	ellipse: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="16" cy="16" rx="14" ry="9"/></svg>',
	parabola: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 28 Q16 0 28 28"/></svg>',
	sine: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 16 C8 4 12 4 16 16 S24 28 30 16"/></svg>',
	cosine: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8 C8 8 8 24 16 24 S24 8 30 8"/></svg>',
	arrow: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="16" x2="24" y2="16"/><polyline points="20 10 26 16 20 22"/></svg>',
	axes: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="20" x2="28" y2="20"/><line x1="10" y1="28" x2="10" y2="4"/><polyline points="6 8 10 4 14 8"/><polyline points="24 16 28 20 24 24"/></svg>',
};

export function initShapePalette() {
	paletteEl = document.getElementById('shapePalette');
	if (!paletteEl) {
		// Create the palette element dynamically
		paletteEl = document.createElement('div');
		paletteEl.id = 'shapePalette';
		paletteEl.className = 'shape-palette';
		document.body.appendChild(paletteEl);
	}

	buildPalette();
}

function buildPalette() {
	if (!paletteEl) return;

	// Clear previous content (for rebuild on language change)
	paletteEl.innerHTML = '';

	const title = document.createElement('div');
	title.className = 'shape-palette-title';
	title.setAttribute('data-i18n', 'shapePalette');
	title.textContent = t('shapePalette');
	paletteEl.appendChild(title);

	const grid = document.createElement('div');
	grid.className = 'shape-palette-grid';

	const shapes = ['line', 'circle', 'ellipse', 'parabola', 'sine', 'cosine', 'arrow', 'axes'];
	for (const shape of shapes) {
		const i18nKey = 'shape' + shape.charAt(0).toUpperCase() + shape.slice(1);
		const item = document.createElement('button');
		item.className = 'shape-palette-item';
		item.dataset.shape = shape;
		item.innerHTML = `${SHAPE_ICONS[shape] || ''}<span data-i18n="${i18nKey}">${t(i18nKey)}</span>`;
		item.addEventListener('pointerdown', (e) => startDrag(e, shape));
		grid.appendChild(item);
	}

	paletteEl.appendChild(grid);
}

/**
 * Rebuild palette labels on language change.
 * Called externally after applyTranslations().
 */
export function refreshPaletteLabels() {
	if (!paletteEl) return;
	paletteEl.querySelectorAll('[data-i18n]').forEach(el => {
		el.textContent = t(el.dataset.i18n);
	});
}

function placeShape(shapeType, screenX, screenY) {
	const constructor = SHAPE_CONSTRUCTORS[shapeType];
	if (!constructor) return;

	hideHeroSection();

	const rect = getCanvasRect();
	const worldPos = screenToWorld(screenX - rect.left, screenY - rect.top);

	const obj = constructor(worldPos.x, worldPos.y);
	getStrokes().push(obj);
	redrawCanvas();
	saveToHistory();
}

function startDrag(e, shapeType) {
	e.preventDefault();
	dragShape = shapeType;

	// Create ghost element
	dragGhost = document.createElement('div');
	dragGhost.className = 'shape-drag-ghost';
	dragGhost.innerHTML = SHAPE_ICONS[shapeType] || '';
	document.body.appendChild(dragGhost);
	positionGhost(e.clientX, e.clientY);

	document.addEventListener('pointermove', onDragMove);
	document.addEventListener('pointerup', onDragEnd);
	document.addEventListener('pointercancel', onDragCancel);
}

function positionGhost(x, y) {
	if (!dragGhost) return;
	dragGhost.style.left = x + 'px';
	dragGhost.style.top = y + 'px';
}

function onDragMove(e) {
	e.preventDefault();
	positionGhost(e.clientX, e.clientY);
}

function onDragEnd(e) {
	cleanupDragListeners();
	if (!dragShape) return;

	const rect = getCanvasRect();
	const x = e.clientX;
	const y = e.clientY;

	// Only place if dropped over the canvas area
	if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
		placeShape(dragShape, x, y);
	}

	dragShape = null;
	removeDragGhost();
}

function onDragCancel() {
	cleanupDragListeners();
	dragShape = null;
	removeDragGhost();
}

function cleanupDragListeners() {
	document.removeEventListener('pointermove', onDragMove);
	document.removeEventListener('pointerup', onDragEnd);
	document.removeEventListener('pointercancel', onDragCancel);
}

function removeDragGhost() {
	if (dragGhost) {
		dragGhost.remove();
		dragGhost = null;
	}
}

export function toggleShapePalette() {
	isOpen = !isOpen;
	if (paletteEl) {
		paletteEl.classList.toggle('show', isOpen);
	}
}

/**
 * Toggle shape palette and sync all button active states (desktop + mobile).
 * Mirrors the setTool / setDash pattern so callers are one-liners.
 */
export function toggleShapePaletteWithUI() {
	toggleShapePalette();
	const open = isOpen;
	const refs = getDomRefs();
	const desktopBtn = document.getElementById('shapePaletteBtn');
	if (desktopBtn) desktopBtn.classList.toggle('active', open);
	if (refs.shapePaletteBtnMobile) refs.shapePaletteBtnMobile.classList.toggle('active', open);
}

export function isShapePaletteOpen() {
	return isOpen;
}
