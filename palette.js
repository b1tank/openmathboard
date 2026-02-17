// OpenMathBoard — Shape palette UI (toolbar drawer)
import { getStrokes, getCamera, getCanvasRect } from './state.js';
import { screenToWorld } from './camera.js';
import { createDefaultLine } from './shapes/line.js';
import { createDefaultCircle } from './shapes/circle.js';
import { createDefaultEllipse } from './shapes/ellipse.js';
import { createDefaultParabola } from './shapes/parabola.js';
import { createDefaultSine, createDefaultCosine } from './shapes/sine.js';
import { createDefaultArrow } from './shapes/arrow.js';
import { createDefaultAxes } from './shapes/axes.js';
import { redrawCanvas } from './renderer.js';
import { saveToHistory } from './history.js';
import { hideHeroSection } from './hero.js';
import { t } from './lib/i18n.js';

let paletteEl = null;
let isOpen = false;

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
	cosine: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6 C8 6 8 26 16 26 S24 6 30 6"/></svg>',
	arrow: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="16" x2="24" y2="16"/><polyline points="20 10 26 16 20 22"/></svg>',
	axes: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="24" x2="28" y2="24"/><line x1="8" y1="28" x2="8" y2="4"/><polyline points="4 8 8 4 12 8"/><polyline points="24 20 28 24 24 28"/></svg>',
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

	const title = document.createElement('div');
	title.className = 'shape-palette-title';
	title.textContent = t('shapePalette');
	paletteEl.appendChild(title);

	const grid = document.createElement('div');
	grid.className = 'shape-palette-grid';

	const shapes = ['line', 'circle', 'ellipse', 'parabola', 'sine', 'cosine', 'arrow', 'axes'];
	for (const shape of shapes) {
		const item = document.createElement('button');
		item.className = 'shape-palette-item';
		item.dataset.shape = shape;
		item.innerHTML = `${SHAPE_ICONS[shape] || ''}<span>${t('shape' + shape.charAt(0).toUpperCase() + shape.slice(1))}</span>`;
		item.addEventListener('click', () => placeShape(shape));
		grid.appendChild(item);
	}

	paletteEl.appendChild(grid);
}

function placeShape(shapeType) {
	const constructor = SHAPE_CONSTRUCTORS[shapeType];
	if (!constructor) return;

	hideHeroSection();

	// Place at center of current viewport
	const rect = getCanvasRect();
	const centerScreen = { x: rect.width / 2, y: rect.height / 2 };
	const worldPos = screenToWorld(centerScreen.x, centerScreen.y);

	const obj = constructor(worldPos.x, worldPos.y);
	getStrokes().push(obj);
	redrawCanvas();
	saveToHistory();
}

export function toggleShapePalette() {
	isOpen = !isOpen;
	if (paletteEl) {
		paletteEl.classList.toggle('show', isOpen);
	}
}

export function isShapePaletteOpen() {
	return isOpen;
}
