// OpenMathBoard — Entry point (wiring only)
import { TRANSLATIONS } from './i18n-strings.js';
import { initI18n, applyTranslations, setupLanguagePicker } from './lib/i18n.js';
import {
	TOOLS,
	setCanvas, setCtx, setCanvasRect, setDomRefs,
	getCanvas, getCtx, getCanvasRect, getDomRefs
} from './state.js';
import { redrawCanvas } from './renderer.js';
import { setupCanvasListeners, setupKeyboardShortcuts } from './input.js';
import { setupToolbarListeners } from './toolbar.js';
import { setupDropZone, setupClipboard } from './images.js';
import { setTool } from './tools.js';
import { saveToHistory } from './history.js';
import { initToast } from './toast.js';
import { initHero } from './hero.js';
import { setupWheelZoom, setupPinchZoom, setupSpacebarPan } from './camera.js';
import { initPropertyPanel } from './property-panel.js';

// ============ Initialize i18n ============
initI18n({
	storageKey: 'openmathboard.lang.v1',
	defaultLang: 'zh',
	translations: TRANSLATIONS
});

// ============ Initialization ============
function init() {
	// Canvas
	const canvas = document.getElementById('drawingCanvas');
	setCanvas(canvas);
	setCtx(canvas.getContext('2d'));

	// DOM refs
	const refs = {
		canvasContainer: document.getElementById('canvasContainer'),
		imagesLayer: document.getElementById('imagesLayer'),
		dropZone: document.getElementById('dropZone'),
		fileInput: document.getElementById('fileInput'),
		heroImportBtn: document.getElementById('heroImportBtn'),
		// Desktop toolbar
		undoBtn: document.getElementById('undoBtn'),
		redoBtn: document.getElementById('redoBtn'),
		penBtn: document.getElementById('penBtn'),
		eraserBtn: document.getElementById('eraserBtn'),
		selectBtn: document.getElementById('selectBtn'),
		colorBtn: document.getElementById('colorBtn'),
		colorDropdown: document.getElementById('colorDropdown'),
		strokeBtn: document.getElementById('strokeBtn'),
		strokeDropdown: document.getElementById('strokeDropdown'),
		importBtn: document.getElementById('importBtn'),
		clearBtn: document.getElementById('clearBtn'),
		copyBtn: document.getElementById('copyBtn'),
		saveBtn: document.getElementById('saveBtn'),
		// Hamburger menu
		menuBtn: document.getElementById('menuBtn'),
		menuDropdown: document.getElementById('menuDropdown'),
		// Mobile toolbar
		undoBtnMobile: document.getElementById('undoBtnMobile'),
		redoBtnMobile: document.getElementById('redoBtnMobile'),
		penBtnMobile: document.getElementById('penBtnMobile'),
		eraserBtnMobile: document.getElementById('eraserBtnMobile'),
		selectBtnMobile: document.getElementById('selectBtnMobile'),
		colorBtnMobile: document.getElementById('colorBtnMobile'),
		colorDropdownMobile: document.getElementById('colorDropdownMobile'),
		strokeBtnMobile: document.getElementById('strokeBtnMobile'),
		strokeDropdownMobile: document.getElementById('strokeDropdownMobile'),
	};
	setDomRefs(refs);

	// Toast + Hero
	initToast(document.getElementById('toast'));
	initHero(document.getElementById('heroSection'));

	// Setup canvas
	setupCanvas();

	// Setup modules
	setupToolbarListeners();
	setupCanvasListeners();
	setupDropZone();
	setupClipboard();
	setupKeyboardShortcuts();

	// Camera: zoom/pan
	const canvasEl = getCanvas();
	setupWheelZoom(canvasEl, () => redrawCanvas());
	setupPinchZoom(canvasEl, () => redrawCanvas());
	setupSpacebarPan(canvasEl, () => redrawCanvas());

	// Property panel
	initPropertyPanel();

	// i18n
	setupLanguagePicker({
		buttonId: 'langBtn',
		dropdownId: 'langDropdown',
		onToggle: () => {
			refs.colorDropdown.classList.remove('show');
			refs.strokeDropdown.classList.remove('show');
			if (refs.smartShapeDropdown) refs.smartShapeDropdown.classList.remove('show');
		}
	});
	applyTranslations();

	// Initial state
	setTool(TOOLS.PEN);
	saveToHistory();
}

// ============ Canvas Setup ============
function setupCanvas() {
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
	const canvas = getCanvas();
	const ctx = getCtx();
	const refs = getDomRefs();
	const dpr = window.devicePixelRatio || 1;
	const rect = refs.canvasContainer.getBoundingClientRect();

	canvas.width = rect.width * dpr;
	canvas.height = rect.height * dpr;
	canvas.style.width = rect.width + 'px';
	canvas.style.height = rect.height + 'px';

	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	setCanvasRect(rect);

	redrawCanvas();
}

// ============ Start ============
document.addEventListener('DOMContentLoaded', init);
