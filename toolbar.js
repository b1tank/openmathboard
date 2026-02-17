// OpenMathBoard — Toolbar setup, dropdowns, mobile menu
import {
	SMART_SHAPE_STORAGE_KEY,
	getSmartShapeSettings, getDomRefs, getCurrentDash
} from './state.js';
import { setTool, setColor, setStrokeWidth, setDash } from './tools.js';
import { TOOLS } from './state.js';
import { undo, redo } from './history.js';
import { copyToClipboard, saveImage } from './export.js';
import { handleFileSelect } from './images.js';
import { t } from './lib/i18n.js';
import { showToast } from './toast.js';
import { setLanguage, applyTranslations } from './lib/i18n.js';
import { clampInt } from './detection.js';

export function setupToolbarListeners() {
	const refs = getDomRefs();

	// Undo/Redo
	refs.undoBtn.addEventListener('click', undo);
	refs.redoBtn.addEventListener('click', redo);

	// Tool buttons
	refs.penBtn.addEventListener('click', () => setTool(TOOLS.PEN));
	refs.eraserBtn.addEventListener('click', () => setTool(TOOLS.ERASER));
	refs.selectBtn.addEventListener('click', () => setTool(TOOLS.SELECT));

	// Color picker
	refs.colorBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		refs.colorDropdown.classList.toggle('show');
		refs.strokeDropdown.classList.remove('show');
	});

	document.querySelectorAll('.color-option').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const color = e.target.dataset.color;
			setColor(color);
			refs.colorDropdown.classList.remove('show');
		});
	});

	// Stroke width picker
	refs.strokeBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		refs.strokeDropdown.classList.toggle('show');
		refs.colorDropdown.classList.remove('show');
	});

	document.querySelectorAll('.stroke-option').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const width = parseInt(e.currentTarget.dataset.width);
			setStrokeWidth(width);
			refs.strokeDropdown.classList.remove('show');
		});
	});

	// Dash toggle
	const dashBtn = document.getElementById('dashBtn');
	if (dashBtn) {
		dashBtn.addEventListener('click', () => {
			setDash(!getCurrentDash());
		});
	}

	// Close dropdowns
	document.addEventListener('click', (e) => {
		const target = e.target;
		const isDropdownClick = target.closest('.color-dropdown, .stroke-dropdown, .smart-shape-dropdown, .lang-dropdown, .menu-dropdown');
		const isPickerClick = target.closest('.color-picker, .stroke-picker, .smart-shape-picker, .lang-btn, .hamburger-btn');
		if (isDropdownClick || isPickerClick) return;

		refs.colorDropdown.classList.remove('show');
		refs.strokeDropdown.classList.remove('show');
		if (refs.colorDropdownMobile) refs.colorDropdownMobile.classList.remove('show');
		if (refs.strokeDropdownMobile) refs.strokeDropdownMobile.classList.remove('show');
		if (refs.smartShapeDropdown) refs.smartShapeDropdown.classList.remove('show');
		if (refs.smartShapeDropdownMobile) refs.smartShapeDropdownMobile.classList.remove('show');
		const langDropdown = document.getElementById('langDropdown');
		if (langDropdown) langDropdown.classList.remove('show');
		if (refs.menuDropdown) refs.menuDropdown.classList.remove('show');
	});

	// Smart shapes
	if (refs.smartShapeBtn && refs.smartShapeDropdown) {
		refs.smartShapeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			refs.smartShapeDropdown.classList.toggle('show');
			refs.colorDropdown.classList.remove('show');
			refs.strokeDropdown.classList.remove('show');
		});
	}

	if (refs.smartShapeToggle) {
		refs.smartShapeToggle.addEventListener('change', () => {
			getSmartShapeSettings().enabled = !!refs.smartShapeToggle.checked;
			updateSmartShapeUI();
		});
	}

	if (refs.smartShapeSensitivity) {
		refs.smartShapeSensitivity.addEventListener('input', () => {
			getSmartShapeSettings().sensitivity = parseInt(refs.smartShapeSensitivity.value, 10);
			updateSmartShapeUI();
		});
	}

	const presets = document.querySelectorAll('#smartShapeDropdown .smart-shape-preset');
	if (presets && presets.length) {
		presets.forEach(btn => {
			btn.addEventListener('click', () => {
				const value = parseInt(btn.dataset.value, 10);
				if (Number.isFinite(value)) getSmartShapeSettings().sensitivity = value;
				updateSmartShapeUI();
			});
		});
	}

	// Import, Clear, Copy, Save
	refs.importBtn.addEventListener('click', () => refs.fileInput.click());
	refs.fileInput.addEventListener('change', handleFileSelect);
	refs.clearBtn.addEventListener('click', () => clearCanvas());
	refs.copyBtn.addEventListener('click', copyToClipboard);
	refs.saveBtn.addEventListener('click', saveImage);

	// Hero import
	if (refs.heroImportBtn) {
		refs.heroImportBtn.addEventListener('click', () => refs.fileInput.click());
	}

	// Hamburger menu
	if (refs.menuBtn && refs.menuDropdown) {
		refs.menuBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			refs.menuDropdown.classList.toggle('show');
			refs.colorDropdown.classList.remove('show');
			refs.strokeDropdown.classList.remove('show');
			if (refs.smartShapeDropdown) refs.smartShapeDropdown.classList.remove('show');
		});

		document.querySelectorAll('.menu-option').forEach(btn => {
			btn.addEventListener('click', () => {
				const action = btn.dataset.action;
				refs.menuDropdown.classList.remove('show');
				switch (action) {
					case 'import': refs.fileInput.click(); break;
					case 'clear': clearCanvas(); break;
					case 'copy': copyToClipboard(); break;
					case 'save': saveImage(); break;
					case 'lang-en':
					case 'lang-zh': {
						const lang = action === 'lang-en' ? 'en' : 'zh';
						setLanguage(lang);
						applyTranslations();
						document.querySelectorAll('.lang-option').forEach(b => {
							b.classList.toggle('active', b.dataset.lang === lang);
						});
						break;
					}
				}
			});
		});
	}

	setupMobileToolbar();

	// Listen for keyboard toggle
	document.addEventListener('smartshape-toggled', () => updateSmartShapeUI());
}

function setupMobileToolbar() {
	const refs = getDomRefs();

	function positionMobileDropdown(btn, dropdown) {
		if (!btn || !dropdown) return;
		const rect = btn.getBoundingClientRect();
		const dropdownWidth = dropdown.offsetWidth || 150;
		let left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
		const padding = 8;
		if (left < padding) left = padding;
		if (left + dropdownWidth > window.innerWidth - padding) {
			left = window.innerWidth - dropdownWidth - padding;
		}
		dropdown.style.left = left + 'px';
		dropdown.style.top = (rect.bottom + 8) + 'px';
		dropdown.style.transform = 'none';
	}

	if (refs.undoBtnMobile) refs.undoBtnMobile.addEventListener('click', undo);
	if (refs.redoBtnMobile) refs.redoBtnMobile.addEventListener('click', redo);
	if (refs.penBtnMobile) refs.penBtnMobile.addEventListener('click', () => setTool(TOOLS.PEN));
	if (refs.eraserBtnMobile) refs.eraserBtnMobile.addEventListener('click', () => setTool(TOOLS.ERASER));
	if (refs.selectBtnMobile) refs.selectBtnMobile.addEventListener('click', () => setTool(TOOLS.SELECT));

	if (refs.colorBtnMobile && refs.colorDropdownMobile) {
		refs.colorBtnMobile.addEventListener('click', (e) => {
			e.stopPropagation();
			const wasShown = refs.colorDropdownMobile.classList.contains('show');
			if (refs.strokeDropdownMobile) refs.strokeDropdownMobile.classList.remove('show');
			if (refs.smartShapeDropdownMobile) refs.smartShapeDropdownMobile.classList.remove('show');
			refs.colorDropdownMobile.classList.toggle('show');
			if (!wasShown) {
				requestAnimationFrame(() => positionMobileDropdown(refs.colorBtnMobile, refs.colorDropdownMobile));
			}
		});

		refs.colorDropdownMobile.querySelectorAll('.color-option').forEach(btn => {
			btn.addEventListener('click', (e) => {
				setColor(e.target.dataset.color);
				refs.colorDropdownMobile.classList.remove('show');
			});
		});
	}

	if (refs.strokeBtnMobile && refs.strokeDropdownMobile) {
		refs.strokeBtnMobile.addEventListener('click', (e) => {
			e.stopPropagation();
			const wasShown = refs.strokeDropdownMobile.classList.contains('show');
			if (refs.colorDropdownMobile) refs.colorDropdownMobile.classList.remove('show');
			if (refs.smartShapeDropdownMobile) refs.smartShapeDropdownMobile.classList.remove('show');
			refs.strokeDropdownMobile.classList.toggle('show');
			if (!wasShown) {
				requestAnimationFrame(() => positionMobileDropdown(refs.strokeBtnMobile, refs.strokeDropdownMobile));
			}
		});

		refs.strokeDropdownMobile.querySelectorAll('.stroke-option').forEach(btn => {
			btn.addEventListener('click', (e) => {
				setStrokeWidth(parseInt(e.currentTarget.dataset.width));
				refs.strokeDropdownMobile.classList.remove('show');
			});
		});
	}

	if (refs.smartShapeBtnMobile && refs.smartShapeDropdownMobile) {
		refs.smartShapeBtnMobile.addEventListener('click', (e) => {
			e.stopPropagation();
			const wasShown = refs.smartShapeDropdownMobile.classList.contains('show');
			if (refs.colorDropdownMobile) refs.colorDropdownMobile.classList.remove('show');
			if (refs.strokeDropdownMobile) refs.strokeDropdownMobile.classList.remove('show');
			refs.smartShapeDropdownMobile.classList.toggle('show');
			if (!wasShown) {
				requestAnimationFrame(() => positionMobileDropdown(refs.smartShapeBtnMobile, refs.smartShapeDropdownMobile));
			}
		});
	}

	if (refs.smartShapeToggleMobile) {
		refs.smartShapeToggleMobile.addEventListener('change', () => {
			getSmartShapeSettings().enabled = !!refs.smartShapeToggleMobile.checked;
			updateSmartShapeUI();
		});
	}

	if (refs.smartShapeSensitivityMobile) {
		refs.smartShapeSensitivityMobile.addEventListener('input', () => {
			getSmartShapeSettings().sensitivity = parseInt(refs.smartShapeSensitivityMobile.value, 10);
			updateSmartShapeUI();
		});
	}

	if (refs.smartShapeDropdownMobile) {
		refs.smartShapeDropdownMobile.querySelectorAll('.smart-shape-preset').forEach(btn => {
			btn.addEventListener('click', () => {
				const value = parseInt(btn.dataset.value, 10);
				if (Number.isFinite(value)) getSmartShapeSettings().sensitivity = value;
				updateSmartShapeUI();
			});
		});
	}
}

export function updateSmartShapeUI() {
	const refs = getDomRefs();
	const settings = getSmartShapeSettings();

	if (refs.smartShapeToggle) refs.smartShapeToggle.checked = !!settings.enabled;
	if (refs.smartShapeSensitivity) refs.smartShapeSensitivity.value = String(settings.sensitivity);
	if (refs.smartShapeValue) refs.smartShapeValue.textContent = String(settings.sensitivity);

	const presets = document.querySelectorAll('#smartShapeDropdown .smart-shape-preset');
	if (presets) {
		presets.forEach(btn => {
			btn.classList.toggle('active', parseInt(btn.dataset.value, 10) === settings.sensitivity);
		});
	}

	if (refs.smartShapeBtn) refs.smartShapeBtn.classList.toggle('active', !!settings.enabled);

	// Mobile
	if (refs.smartShapeToggleMobile) refs.smartShapeToggleMobile.checked = !!settings.enabled;
	if (refs.smartShapeSensitivityMobile) refs.smartShapeSensitivityMobile.value = String(settings.sensitivity);
	if (refs.smartShapeValueMobile) refs.smartShapeValueMobile.textContent = String(settings.sensitivity);
	if (refs.smartShapeBtnMobile) refs.smartShapeBtnMobile.classList.toggle('active', !!settings.enabled);

	if (refs.smartShapeDropdownMobile) {
		refs.smartShapeDropdownMobile.querySelectorAll('.smart-shape-preset').forEach(btn => {
			btn.classList.toggle('active', parseInt(btn.dataset.value, 10) === settings.sensitivity);
		});
	}

	saveSmartShapeSettings();
}

export function loadSmartShapeSettings() {
	const settings = getSmartShapeSettings();
	try {
		const raw = localStorage.getItem(SMART_SHAPE_STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw);
		if (typeof parsed !== 'object' || !parsed) return;
		settings.enabled = typeof parsed.enabled === 'boolean' ? parsed.enabled : settings.enabled;
		if (Number.isFinite(parsed.sensitivity)) settings.sensitivity = clampInt(parsed.sensitivity, 0, 100);
	} catch {
		// ignore
	}
}

function saveSmartShapeSettings() {
	const settings = getSmartShapeSettings();
	try {
		localStorage.setItem(SMART_SHAPE_STORAGE_KEY, JSON.stringify({
			enabled: !!settings.enabled,
			sensitivity: clampInt(settings.sensitivity, 0, 100)
		}));
	} catch {
		// ignore
	}
}

function clearCanvas() {
	// Dynamic import to avoid circular dependency with renderer/history
	Promise.all([
		import('./state.js'),
		import('./renderer.js'),
		import('./history.js')
	]).then(([stateMod, rendererMod, historyMod]) => {
		const refs = getDomRefs();
		const strokes = stateMod.getStrokes();
		if (strokes.length === 0 && refs.imagesLayer.children.length === 0) return;
		if (confirm(t('confirmClear'))) {
			stateMod.setStrokes([]);
			refs.imagesLayer.innerHTML = '';
			rendererMod.redrawCanvas();
			historyMod.saveToHistory();
			showToast(t('toastCanvasCleared'));
		}
	});
}
