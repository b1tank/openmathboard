// OpenMathBoard — Tool management
import {
	TOOLS,
	getCurrentTool, setCurrentTool,
	setCurrentColor, setCurrentStrokeWidth, setCurrentDash,
	getDomRefs
} from '../core/state.js';
import { clearSelection } from './selection.js';

export function setTool(tool) {
	const refs = getDomRefs();

	// Clear selection when switching away from select tool
	if (getCurrentTool() === TOOLS.SELECT && tool !== TOOLS.SELECT) {
		clearSelection();
	}

	setCurrentTool(tool);

	// Update button states
	if (refs.penBtn) refs.penBtn.classList.toggle('active', tool === TOOLS.PEN);
	if (refs.eraserBtn) refs.eraserBtn.classList.toggle('active', tool === TOOLS.ERASER);
	if (refs.selectBtn) refs.selectBtn.classList.toggle('active', tool === TOOLS.SELECT);

	// Sync mobile buttons
	if (refs.penBtnMobile) refs.penBtnMobile.classList.toggle('active', tool === TOOLS.PEN);
	if (refs.eraserBtnMobile) refs.eraserBtnMobile.classList.toggle('active', tool === TOOLS.ERASER);
	if (refs.selectBtnMobile) refs.selectBtnMobile.classList.toggle('active', tool === TOOLS.SELECT);

	// Update cursor
	if (refs.canvasContainer) refs.canvasContainer.className = 'canvas-container tool-' + tool;
}

export function setColor(color) {
	setCurrentColor(color);

	// Update all color indicators (desktop + mobile)
	document.querySelectorAll('.color-indicator').forEach(el => {
		el.style.background = color;
	});

	// Update active state
	document.querySelectorAll('.color-option').forEach(btn => {
		btn.classList.toggle('active', btn.dataset.color === color);
	});

	// Switch to pen tool
	setTool(TOOLS.PEN);
}

export function setStrokeWidth(width) {
	setCurrentStrokeWidth(width);

	// Update active state
	document.querySelectorAll('.stroke-option').forEach(btn => {
		btn.classList.toggle('active', parseInt(btn.dataset.width) === width);
	});
}

export function setDash(dash) {
	setCurrentDash(dash);

	// Update active state on dash toggle buttons (desktop + mobile via refs)
	const refs = getDomRefs();
	const dashBtn = document.getElementById('dashBtn');
	if (dashBtn) dashBtn.classList.toggle('active', dash);
	if (refs.dashBtnMobile) refs.dashBtnMobile.classList.toggle('active', dash);
}
