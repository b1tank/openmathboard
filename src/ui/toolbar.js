// OpenMathBoard — Toolbar setup, dropdowns, mobile menu
import { getDomRefs, getCurrentDash } from '../core/state.js';
import { setTool, setColor, setStrokeWidth, setDash } from '../interaction/tools.js';
import { TOOLS } from '../core/state.js';
import { undo, redo } from '../core/history.js';
import { copyToClipboard, saveImage } from './export.js';
import { handleFileSelect } from './images.js';
import { t } from '../i18n/i18n.js';
import { showToast } from './toast.js';
import { setLanguage, applyTranslations } from '../i18n/i18n.js';
import { toggleShapePalette } from './palette.js';
import { toggleGrid, toggleAxesOverlay } from '../canvas/grid.js';

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

	// Dash toggle (desktop)
	const dashBtn = document.getElementById('dashBtn');
	if (dashBtn) {
		dashBtn.addEventListener('click', () => {
			setDash(!getCurrentDash());
		});
	}

	// Shape Palette toggle (desktop)
	const shapePaletteBtn = document.getElementById('shapePaletteBtn');
	if (shapePaletteBtn) {
		shapePaletteBtn.addEventListener('click', () => {
			toggleShapePalette();
			shapePaletteBtn.classList.toggle('active');
			if (refs.shapePaletteBtnMobile) refs.shapePaletteBtnMobile.classList.toggle('active', shapePaletteBtn.classList.contains('active'));
		});
	}

	// Grid toggle
	const gridBtn = document.getElementById('gridBtn');
	if (gridBtn) {
		gridBtn.addEventListener('click', () => {
			const on = toggleGrid();
			gridBtn.classList.toggle('active', on);
			// Trigger redraw via dynamic import to avoid circular dep
			import('../canvas/renderer.js').then(m => m.redrawCanvas());
		});
	}

	// Close dropdowns
	document.addEventListener('click', (e) => {
		const target = e.target;
		const isDropdownClick = target.closest('.color-dropdown, .stroke-dropdown, .lang-dropdown, .menu-dropdown');
		const isPickerClick = target.closest('.color-picker, .stroke-picker, .lang-btn, .hamburger-btn');
		if (isDropdownClick || isPickerClick) return;

		refs.colorDropdown.classList.remove('show');
		refs.strokeDropdown.classList.remove('show');
		if (refs.colorDropdownMobile) refs.colorDropdownMobile.classList.remove('show');
		if (refs.strokeDropdownMobile) refs.strokeDropdownMobile.classList.remove('show');
		const langDropdown = document.getElementById('langDropdown');
		if (langDropdown) langDropdown.classList.remove('show');
		if (refs.menuDropdown) refs.menuDropdown.classList.remove('show');
	});

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
					case 'grid': {
						const on = toggleGrid();
						const gridBtn = document.getElementById('gridBtn');
						if (gridBtn) gridBtn.classList.toggle('active', on);
						import('../canvas/renderer.js').then(m => m.redrawCanvas());
						break;
					}
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

	// Dash toggle (mobile) — wired here alongside other mobile buttons
	if (refs.dashBtnMobile) {
		const handler = (e) => {
			e.preventDefault(); // Stop ghost clicks on iOS
			e.stopPropagation();
			setDash(!getCurrentDash());
		};
		// Use touchend for faster response on mobile, click as fallback
		refs.dashBtnMobile.addEventListener('touchend', handler);
		refs.dashBtnMobile.addEventListener('click', handler);
	}

	// Shape Palette toggle (mobile) — wired here alongside other mobile buttons
	if (refs.shapePaletteBtnMobile) {
		const shapePaletteBtn = document.getElementById('shapePaletteBtn');
		const handler = (e) => {
			e.preventDefault(); // Stop ghost clicks on iOS
			e.stopPropagation();
			toggleShapePalette();
			refs.shapePaletteBtnMobile.classList.toggle('active');
			const isActive = refs.shapePaletteBtnMobile.classList.contains('active');
			if (shapePaletteBtn) shapePaletteBtn.classList.toggle('active', isActive);
		};
		refs.shapePaletteBtnMobile.addEventListener('touchend', handler);
		refs.shapePaletteBtnMobile.addEventListener('click', handler);
	}
}

function clearCanvas() {
	Promise.all([
		import('../core/state.js'),
		import('../canvas/renderer.js'),
		import('../core/history.js')
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
