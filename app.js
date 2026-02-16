// OpenMathBoard - Math Teaching Canvas
// A simple whiteboard tool for math teachers
import { initI18n, t, setLanguage, applyTranslations, setupLanguagePicker } from './lib/i18n.js';

// ============ Constants ============
const TOOLS = {
	PEN: 'pen',
	ERASER: 'eraser',
	SELECT: 'select'
};

const DEFAULT_COLOR = '#000000';
const DEFAULT_STROKE_WIDTH = 4;

// i18n translations
const TRANSLATIONS = {
	en: {
		// Page title
		pageTitle: 'OpenMathBoard - Math Teaching Canvas',

		// Toolbar tooltips
		backToHome: 'Back to Yummy Jars',
		undoTitle: 'Undo (Ctrl+Z)',
		redoTitle: 'Redo (Ctrl+Shift+Z)',
		penTitle: 'Pen Tool (P)',
		eraserTitle: 'Eraser (E)',
		selectTitle: 'Select (S)',
		colorTitle: 'Color',
		strokeWidthTitle: 'Stroke Width',
		smartShapesTitle: 'Smart Shapes (G)',
		importTitle: 'Import Image',
		clearTitle: 'Clear Canvas',
		copyTitle: 'Copy to Clipboard',
		saveTitle: 'Save Image',
		languageTitle: 'Language',
		menuTitle: 'Menu',

		// Menu items
		importImage: 'Import Image',
		clearCanvas: 'Clear Canvas',
		copyToClipboard: 'Copy to Clipboard',
		saveImage: 'Save Image',

		// Colors
		colorBlack: 'Black',
		colorBlue: 'Blue',
		colorRed: 'Red',
		colorGreen: 'Green',
		colorPurple: 'Purple',
		colorOrange: 'Orange',

		// Stroke sizes
		strokeThin: 'Thin',
		strokeMedium: 'Medium',
		strokeThick: 'Thick',

		// Smart shapes
		smartShapes: 'Smart Shapes',
		sensitivity: 'Sensitivity',
		low: 'Low',
		medium: 'Med',
		high: 'High',
		sensitivityLow: 'Low Sensitivity',
		sensitivityMedium: 'Medium Sensitivity',
		sensitivityHigh: 'High Sensitivity',

		// Language switcher
		switchToEnglish: 'Switch to English',
		switchToChinese: 'Switch to Chinese',

		// Drop zone
		dropZoneText: 'Drop image here or paste from clipboard',

		// Toast messages
		toastCopied: 'Copied to clipboard!',
		toastCopyFailed: 'Copy failed',
		toastImageSaved: 'Image saved!',
		toastImageDownloaded: 'Image downloaded!',
		toastSaveFailed: 'Save failed',
		toastCanvasCleared: 'Canvas cleared',
		toastImageAdded: 'Image added - drag to position',
		toastImageRemoved: 'Image removed',
		toastSmartShapesOn: 'Smart Shapes on',
		toastSmartShapesOff: 'Smart Shapes off',
		toastSnappedTo: 'Snapped to',
		toastCopiedStroke: 'Copied 1 stroke',
		toastCopiedStrokes: 'Copied {0} strokes',
		toastPasted: 'Pasted',

		// Confirm dialogs
		confirmClear: 'Clear all content?',

		// Shape names
		shapeLine: 'Line',
		shapeCircle: 'Circle',
		shapeParabola: 'Parabola',

		// Hero section
		heroTitle: 'Welcome to',
		heroBrandName: 'OpenMathBoard',
		heroSubtitle: 'A simple canvas for teaching math concepts',
		heroFeatureDraw: 'Draw anywhere to start',
		heroFeatureShapes: 'Smart shapes auto-correct your drawings',
		heroOr: 'or import an image',
		heroImportBtn: 'Import Image',
		heroHint: 'Drop image here, paste, or click to import',
		heroFormats: 'Supports JPG, PNG, GIF, and WebP'
	},
	zh: {
		// Page title
		pageTitle: '简学板',

		// Toolbar tooltips
		backToHome: '返回主页',
		undoTitle: '撤销 (Ctrl+Z)',
		redoTitle: '重做 (Ctrl+Shift+Z)',
		penTitle: '画笔工具 (P)',
		eraserTitle: '橡皮擦 (E)',
		selectTitle: '选择 (S)',
		colorTitle: '颜色',
		strokeWidthTitle: '线条粗细',
		smartShapesTitle: '智能形状 (G)',
		importTitle: '导入图片',
		clearTitle: '清空画布',
		copyTitle: '复制到剪贴板',
		saveTitle: '保存图片',
		languageTitle: '语言',
		menuTitle: '菜单',

		// Menu items
		importImage: '导入图片',
		clearCanvas: '清除画布',
		copyToClipboard: '复制到剪贴板',
		saveImage: '保存图片',

		// Colors
		colorBlack: '黑色',
		colorBlue: '蓝色',
		colorRed: '红色',
		colorGreen: '绿色',
		colorPurple: '紫色',
		colorOrange: '橙色',

		// Stroke sizes
		strokeThin: '细',
		strokeMedium: '中',
		strokeThick: '粗',

		// Smart shapes
		smartShapes: '智能形状',
		sensitivity: '敏感度',
		low: '低',
		medium: '中',
		high: '高',
		sensitivityLow: '低敏感度',
		sensitivityMedium: '中等敏感度',
		sensitivityHigh: '高敏感度',

		// Language switcher
		switchToEnglish: '切换到英文',
		switchToChinese: '切换到中文',

		// Drop zone
		dropZoneText: '拖放图片到此处或从剪贴板粘贴',

		// Toast messages
		toastCopied: '已复制到剪贴板！',
		toastCopyFailed: '复制失败',
		toastImageSaved: '图片已保存！',
		toastImageDownloaded: '图片已下载！',
		toastSaveFailed: '保存失败',
		toastCanvasCleared: '画布已清空',
		toastImageAdded: '图片已添加 - 拖动调整位置',
		toastImageRemoved: '图片已删除',
		toastSmartShapesOn: '智能形状已开启',
		toastSmartShapesOff: '智能形状已关闭',
		toastSnappedTo: '已转换为',
		toastCopiedStroke: '已复制 1 个笔画',
		toastCopiedStrokes: '已复制 {0} 个笔画',
		toastPasted: '已粘贴',

		// Confirm dialogs
		confirmClear: '确定要清空所有内容吗？',

		// Shape names
		shapeLine: '直线',
		shapeCircle: '圆形',
		shapeParabola: '抛物线',

		// Hero section
		heroTitle: '欢迎使用',
		heroBrandName: '简学板',
		heroSubtitle: '简洁的数学教学画布',
		heroFeatureDraw: '在任意位置开始绘画',
		heroFeatureShapes: '智能形状自动修正您的绘图',
		heroOr: '或导入图片',
		heroImportBtn: '导入图片',
		heroHint: '拖放图片到此处、粘贴或点击导入',
		heroFormats: '支持 JPG、PNG、GIF 和 WebP 格式'
	}
};

// Initialize i18n
initI18n({
	storageKey: 'openmathboard.lang.v1',
	defaultLang: 'zh',
	translations: TRANSLATIONS
});

// Smart shapes
const SMART_SHAPE_MIN_POINTS = 10;

const SMART_SHAPE_DEFAULTS = {
	enabled: true,
	// 0..100 (higher snaps more aggressively)
	sensitivity: 50
};

const SMART_SHAPE_STORAGE_KEY = 'openmathboard.smartShapes.v1';
const SMART_SHAPE_DEBUG_THROTTLE_MS = 250;

// ============ State ============
let currentTool = TOOLS.PEN;
let currentColor = DEFAULT_COLOR;
let currentStrokeWidth = DEFAULT_STROKE_WIDTH;
let isDrawing = false;
let currentStroke = null;
let strokes = [];
let historyStack = [];
let historyIndex = -1;

// Canvas state
let canvas = null;
let ctx = null;
let canvasRect = null;

// Selection state
let selectedStrokes = [];  // Array of selected stroke indices
let selectionRect = null;  // {x1, y1, x2, y2} for drag selection
let isSelecting = false;   // Whether we're dragging to select
let isDraggingSelection = false;  // Whether we're moving selected strokes
let dragStartPos = null;   // Starting position of drag
let clipboardStrokes = [];  // Copied strokes for paste

// ============ DOM Elements ============
let canvasContainer = null;
let imagesLayer = null;
let dropZone = null;
let fileInput = null;
let toast = null;
let heroSection = null;
let heroImportBtn = null;

// Toolbar buttons
let undoBtn = null;
let redoBtn = null;
let penBtn = null;
let eraserBtn = null;
let selectBtn = null;
let colorBtn = null;
let colorDropdown = null;
let strokeBtn = null;
let strokeDropdown = null;
let importBtn = null;
let clearBtn = null;
let copyBtn = null;
let saveBtn = null;

// Hamburger menu (mobile)
let menuBtn = null;
let menuDropdown = null;

// Mobile toolbar buttons
let undoBtnMobile = null;
let redoBtnMobile = null;
let penBtnMobile = null;
let eraserBtnMobile = null;
let selectBtnMobile = null;
let colorBtnMobile = null;
let colorDropdownMobile = null;
let strokeBtnMobile = null;
let strokeDropdownMobile = null;
let smartShapeBtnMobile = null;
let smartShapeDropdownMobile = null;
let smartShapeToggleMobile = null;
let smartShapeSensitivityMobile = null;
let smartShapeValueMobile = null;

// Smart shape controls
let smartShapeBtn = null;
let smartShapeDropdown = null;
let smartShapeToggle = null;
let smartShapeSensitivity = null;
let smartShapeValue = null;
let smartShapePresets = null;

// Smart shape state
let smartShapeSettings = { ...SMART_SHAPE_DEFAULTS };

// Debug logging (enable with ?debug=1)
let smartShapeDebugEnabled = false;
let lastSmartShapeDebugAt = 0;
let lastSmartShapeDebugKey = '';

// ============ Initialization ============
function init() {
	// Cache DOM elements
	canvas = document.getElementById('drawingCanvas');
	ctx = canvas.getContext('2d');
	canvasContainer = document.getElementById('canvasContainer');
	imagesLayer = document.getElementById('imagesLayer');
	dropZone = document.getElementById('dropZone');
	fileInput = document.getElementById('fileInput');
	toast = document.getElementById('toast');
	heroSection = document.getElementById('heroSection');
	heroImportBtn = document.getElementById('heroImportBtn');

	// Toolbar buttons
	undoBtn = document.getElementById('undoBtn');
	redoBtn = document.getElementById('redoBtn');
	penBtn = document.getElementById('penBtn');
	eraserBtn = document.getElementById('eraserBtn');
	selectBtn = document.getElementById('selectBtn');
	colorBtn = document.getElementById('colorBtn');
	colorDropdown = document.getElementById('colorDropdown');
	strokeBtn = document.getElementById('strokeBtn');
	strokeDropdown = document.getElementById('strokeDropdown');
	importBtn = document.getElementById('importBtn');
	clearBtn = document.getElementById('clearBtn');
	copyBtn = document.getElementById('copyBtn');
	saveBtn = document.getElementById('saveBtn');

	// Hamburger menu (mobile)
	menuBtn = document.getElementById('menuBtn');
	menuDropdown = document.getElementById('menuDropdown');

	// Mobile toolbar buttons
	undoBtnMobile = document.getElementById('undoBtnMobile');
	redoBtnMobile = document.getElementById('redoBtnMobile');
	penBtnMobile = document.getElementById('penBtnMobile');
	eraserBtnMobile = document.getElementById('eraserBtnMobile');
	selectBtnMobile = document.getElementById('selectBtnMobile');
	colorBtnMobile = document.getElementById('colorBtnMobile');
	colorDropdownMobile = document.getElementById('colorDropdownMobile');
	strokeBtnMobile = document.getElementById('strokeBtnMobile');
	strokeDropdownMobile = document.getElementById('strokeDropdownMobile');
	smartShapeBtnMobile = document.getElementById('smartShapeBtnMobile');
	smartShapeDropdownMobile = document.getElementById('smartShapeDropdownMobile');
	smartShapeToggleMobile = document.getElementById('smartShapeToggleMobile');
	smartShapeSensitivityMobile = document.getElementById('smartShapeSensitivityMobile');
	smartShapeValueMobile = document.getElementById('smartShapeValueMobile');

	// Smart shape controls (optional if markup changes)
	smartShapeBtn = document.getElementById('smartShapeBtn');
	smartShapeDropdown = document.getElementById('smartShapeDropdown');
	smartShapeToggle = document.getElementById('smartShapeToggle');
	smartShapeSensitivity = document.getElementById('smartShapeSensitivity');
	smartShapeValue = document.getElementById('smartShapeValue');
	smartShapePresets = document.querySelectorAll('.smart-shape-preset');

	// Setup canvas
	setupCanvas();

	// Debug mode
	try {
		const qs = new URLSearchParams(window.location.search);
		smartShapeDebugEnabled = qs.get('debug') === '1' || qs.get('debugShapes') === '1' || qs.has('debugShapes');
	} catch {
		smartShapeDebugEnabled = false;
	}

	// Setup event listeners
	setupToolbarListeners();
	setupCanvasListeners();
	setupDropZone();
	setupClipboard();
	setupKeyboardShortcuts();

	loadSmartShapeSettings();
	updateSmartShapeUI();

	// Setup i18n
	setupLanguagePicker({
		buttonId: 'langBtn',
		dropdownId: 'langDropdown',
		onToggle: () => {
			// Close other menus when language picker opens
			colorDropdown.classList.remove('show');
			strokeDropdown.classList.remove('show');
			if (smartShapeDropdown) smartShapeDropdown.classList.remove('show');
		}
	});
	applyTranslations();

	// Initial state
	setTool(TOOLS.PEN);
	saveToHistory();

	if (smartShapeDebugEnabled) console.log('OpenMathBoard initialized (debug mode)');
}

// ============ Canvas Setup ============
function setupCanvas() {
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
	const dpr = window.devicePixelRatio || 1;
	const rect = canvasContainer.getBoundingClientRect();

	canvas.width = rect.width * dpr;
	canvas.height = rect.height * dpr;
	canvas.style.width = rect.width + 'px';
	canvas.style.height = rect.height + 'px';

	// Avoid accumulating transforms across resizes
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	canvasRect = rect;

	// Redraw strokes after resize
	redrawCanvas();
}

function redrawCanvas() {
	ctx.clearRect(0, 0, canvasRect.width, canvasRect.height);

	// Draw all strokes
	for (let i = 0; i < strokes.length; i++) {
		drawStroke(strokes[i]);
	}

	// Draw selection highlights
	if (selectedStrokes.length > 0) {
		drawSelectionHighlights();
	}

	// Draw selection rectangle while dragging
	if (isSelecting && selectionRect) {
		drawSelectionRect();
	}
}

// ============ Selection Functions ============
function drawSelectionRect() {
	if (!selectionRect) return;
	const x = Math.min(selectionRect.x1, selectionRect.x2);
	const y = Math.min(selectionRect.y1, selectionRect.y2);
	const w = Math.abs(selectionRect.x2 - selectionRect.x1);
	const h = Math.abs(selectionRect.y2 - selectionRect.y1);

	ctx.save();
	ctx.strokeStyle = '#2563eb';
	ctx.lineWidth = 1;
	ctx.setLineDash([5, 5]);
	ctx.strokeRect(x, y, w, h);
	ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
	ctx.fillRect(x, y, w, h);
	ctx.restore();
}

function drawSelectionHighlights() {
	for (const idx of selectedStrokes) {
		const stroke = strokes[idx];
		if (!stroke) continue;
		const bounds = getStrokeBounds(stroke);
		if (!bounds) continue;

		const padding = 6;
		ctx.save();
		ctx.strokeStyle = '#2563eb';
		ctx.lineWidth = 2;
		ctx.setLineDash([4, 4]);
		ctx.strokeRect(
			bounds.minX - padding,
			bounds.minY - padding,
			bounds.maxX - bounds.minX + padding * 2,
			bounds.maxY - bounds.minY + padding * 2
		);
		ctx.restore();
	}
}

function getStrokeBounds(stroke) {
	if (!stroke) return null;

	// Handle shape types
	if (stroke.shape) {
		if (stroke.shape.type === 'circle') {
			return {
				minX: stroke.shape.cx - stroke.shape.r,
				minY: stroke.shape.cy - stroke.shape.r,
				maxX: stroke.shape.cx + stroke.shape.r,
				maxY: stroke.shape.cy + stroke.shape.r
			};
		}
		if (stroke.shape.type === 'line') {
			return {
				minX: Math.min(stroke.shape.x1, stroke.shape.x2),
				minY: Math.min(stroke.shape.y1, stroke.shape.y2),
				maxX: Math.max(stroke.shape.x1, stroke.shape.x2),
				maxY: Math.max(stroke.shape.y1, stroke.shape.y2)
			};
		}
	}

	// Use points for freeform strokes and parabolas
	if (!stroke.points || stroke.points.length === 0) return null;
	return getBounds(stroke.points);
}

function isPointNearStroke(pos, stroke, threshold = 15) {
	if (!stroke) return false;

	// Shape: circle
	if (stroke.shape && stroke.shape.type === 'circle') {
		const dist = Math.hypot(pos.x - stroke.shape.cx, pos.y - stroke.shape.cy);
		return Math.abs(dist - stroke.shape.r) < threshold + stroke.width / 2;
	}

	// Shape: line
	if (stroke.shape && stroke.shape.type === 'line') {
		return pointToSegmentDistance(pos, 
			{ x: stroke.shape.x1, y: stroke.shape.y1 },
			{ x: stroke.shape.x2, y: stroke.shape.y2 }
		) < threshold + stroke.width / 2;
	}

	// Freeform or parabola: check points
	if (!stroke.points || stroke.points.length < 2) return false;
	return pointToPolylineDistance(pos, stroke.points) < threshold + stroke.width / 2;
}

function findStrokeAtPoint(pos) {
	// Search from top (last drawn) to bottom
	for (let i = strokes.length - 1; i >= 0; i--) {
		if (isPointNearStroke(pos, strokes[i])) {
			return i;
		}
	}
	return -1;
}

function findStrokesInRect(rect) {
	const minX = Math.min(rect.x1, rect.x2);
	const maxX = Math.max(rect.x1, rect.x2);
	const minY = Math.min(rect.y1, rect.y2);
	const maxY = Math.max(rect.y1, rect.y2);

	const result = [];
	for (let i = 0; i < strokes.length; i++) {
		const bounds = getStrokeBounds(strokes[i]);
		if (!bounds) continue;

		// Check if stroke bounds overlap with selection rect
		if (bounds.maxX >= minX && bounds.minX <= maxX &&
		    bounds.maxY >= minY && bounds.minY <= maxY) {
			result.push(i);
		}
	}
	return result;
}

function moveSelectedStrokes(dx, dy) {
	for (const idx of selectedStrokes) {
		const stroke = strokes[idx];
		if (!stroke) continue;

		// Move shape data
		if (stroke.shape) {
			if (stroke.shape.type === 'circle') {
				stroke.shape.cx += dx;
				stroke.shape.cy += dy;
			}
			if (stroke.shape.type === 'line') {
				stroke.shape.x1 += dx;
				stroke.shape.y1 += dy;
				stroke.shape.x2 += dx;
				stroke.shape.y2 += dy;
			}
			if (stroke.shape.type === 'parabola') {
				stroke.shape.origin += dx;
				stroke.shape.c += dy;
			}
		}

		// Move all points
		if (stroke.points) {
			for (const pt of stroke.points) {
				pt.x += dx;
				pt.y += dy;
			}
		}
	}
}

function clearSelection() {
	selectedStrokes = [];
	selectionRect = null;
	isSelecting = false;
	isDraggingSelection = false;
	dragStartPos = null;
	updateSelectionCursor();
	redrawCanvas();
}

function updateSelectionCursor() {
	if (currentTool === TOOLS.SELECT) {
		canvasContainer.classList.toggle('has-selection', selectedStrokes.length > 0);
	} else {
		canvasContainer.classList.remove('has-selection');
	}
}

function deleteSelectedStrokes() {
	if (selectedStrokes.length === 0) return;

	// Sort indices in descending order to remove from end first
	const sorted = [...selectedStrokes].sort((a, b) => b - a);
	for (const idx of sorted) {
		strokes.splice(idx, 1);
	}
	selectedStrokes = [];
	redrawCanvas();
	saveToHistory();
}

function copySelectedStrokes() {
	if (selectedStrokes.length === 0) return;

	// Deep copy selected strokes
	clipboardStrokes = selectedStrokes.map(idx => JSON.parse(JSON.stringify(strokes[idx])));
	showToast(clipboardStrokes.length === 1 ? t('toastCopiedStroke') : t('toastCopiedStrokes', clipboardStrokes.length), 'success');
}

function pasteStrokes() {
	if (clipboardStrokes.length === 0) return;

	// Offset paste by 20px so it's visible
	const offset = 20;

	// Deep copy and offset the strokes
	const newStrokes = clipboardStrokes.map(stroke => {
		const copy = JSON.parse(JSON.stringify(stroke));
		
		// Offset shape data
		if (copy.shape) {
			if (copy.shape.type === 'circle') {
				copy.shape.cx += offset;
				copy.shape.cy += offset;
			}
			if (copy.shape.type === 'line') {
				copy.shape.x1 += offset;
				copy.shape.y1 += offset;
				copy.shape.x2 += offset;
				copy.shape.y2 += offset;
			}
			if (copy.shape.type === 'parabola') {
				copy.shape.origin += offset;
				copy.shape.c += offset;
			}
		}

		// Offset all points
		if (copy.points) {
			for (const pt of copy.points) {
				pt.x += offset;
				pt.y += offset;
			}
		}

		return copy;
	});

	// Add new strokes and select them
	const startIdx = strokes.length;
	strokes.push(...newStrokes);
	selectedStrokes = newStrokes.map((_, i) => startIdx + i);
	
	updateSelectionCursor();
	redrawCanvas();
	saveToHistory();
	showToast(t('toastPasted'), 'success');
}

function drawStroke(stroke) {
	if (!stroke || !stroke.points || stroke.points.length < 2) return;

	if (stroke.shape && stroke.shape.type === 'line') {
		ctx.beginPath();
		ctx.strokeStyle = stroke.color;
		ctx.lineWidth = stroke.width;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.moveTo(stroke.shape.x1, stroke.shape.y1);
		ctx.lineTo(stroke.shape.x2, stroke.shape.y2);
		ctx.stroke();
		return;
	}

	if (stroke.shape && stroke.shape.type === 'circle') {
		ctx.beginPath();
		ctx.strokeStyle = stroke.color;
		ctx.lineWidth = stroke.width;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.arc(stroke.shape.cx, stroke.shape.cy, stroke.shape.r, 0, Math.PI * 2);
		ctx.stroke();
		return;
	}

	if (stroke.shape && stroke.shape.type === 'parabola') {
		ctx.beginPath();
		ctx.strokeStyle = stroke.color;
		ctx.lineWidth = stroke.width;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		const points = stroke.points;
		ctx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.stroke();
		return;
	}

	ctx.beginPath();
	ctx.strokeStyle = stroke.color;
	ctx.lineWidth = stroke.width;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	const points = stroke.points;
	ctx.moveTo(points[0].x, points[0].y);

	// Smooth curve through points
	for (let i = 1; i < points.length - 1; i++) {
		const xc = (points[i].x + points[i + 1].x) / 2;
		const yc = (points[i].y + points[i + 1].y) / 2;
		ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
	}

	// Last point
	if (points.length > 1) {
		const last = points[points.length - 1];
		ctx.lineTo(last.x, last.y);
	}

	ctx.stroke();
}

// ============ Tool Selection ============
function setTool(tool) {
	// Clear selection when switching away from select tool
	if (currentTool === TOOLS.SELECT && tool !== TOOLS.SELECT) {
		clearSelection();
	}

	currentTool = tool;

	// Update button states
	penBtn.classList.toggle('active', tool === TOOLS.PEN);
	eraserBtn.classList.toggle('active', tool === TOOLS.ERASER);
	selectBtn.classList.toggle('active', tool === TOOLS.SELECT);

	// Sync mobile buttons
	if (penBtnMobile) penBtnMobile.classList.toggle('active', tool === TOOLS.PEN);
	if (eraserBtnMobile) eraserBtnMobile.classList.toggle('active', tool === TOOLS.ERASER);
	if (selectBtnMobile) selectBtnMobile.classList.toggle('active', tool === TOOLS.SELECT);

	// Update cursor
	canvasContainer.className = 'canvas-container tool-' + tool;
}

// ============ Toolbar Listeners ============
function setupToolbarListeners() {
	// Undo/Redo
	undoBtn.addEventListener('click', undo);
	redoBtn.addEventListener('click', redo);

	// Tool buttons
	penBtn.addEventListener('click', () => setTool(TOOLS.PEN));
	eraserBtn.addEventListener('click', () => setTool(TOOLS.ERASER));
	selectBtn.addEventListener('click', () => setTool(TOOLS.SELECT));

	// Color picker
	colorBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		colorDropdown.classList.toggle('show');
		strokeDropdown.classList.remove('show');
	});

	document.querySelectorAll('.color-option').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const color = e.target.dataset.color;
			setColor(color);
			colorDropdown.classList.remove('show');
		});
	});

	// Stroke width picker
	strokeBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		strokeDropdown.classList.toggle('show');
		colorDropdown.classList.remove('show');
	});

	document.querySelectorAll('.stroke-option').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const width = parseInt(e.currentTarget.dataset.width);
			setStrokeWidth(width);
			strokeDropdown.classList.remove('show');
		});
	});

	// Close dropdowns when clicking elsewhere
	document.addEventListener('click', (e) => {
		// Don't close if clicking inside a dropdown or on a picker button
		const target = e.target;
		const isDropdownClick = target.closest('.color-dropdown, .stroke-dropdown, .smart-shape-dropdown, .lang-dropdown, .menu-dropdown');
		const isPickerClick = target.closest('.color-picker, .stroke-picker, .smart-shape-picker, .lang-btn, .hamburger-btn');
		if (isDropdownClick || isPickerClick) return;
		
		colorDropdown.classList.remove('show');
		strokeDropdown.classList.remove('show');
		if (colorDropdownMobile) colorDropdownMobile.classList.remove('show');
		if (strokeDropdownMobile) strokeDropdownMobile.classList.remove('show');
		if (smartShapeDropdown) smartShapeDropdown.classList.remove('show');
		if (smartShapeDropdownMobile) smartShapeDropdownMobile.classList.remove('show');
		if (langDropdown) langDropdown.classList.remove('show');
		if (menuDropdown) menuDropdown.classList.remove('show');
	});

	// Smart shapes
	if (smartShapeBtn && smartShapeDropdown) {
		smartShapeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			smartShapeDropdown.classList.toggle('show');
			colorDropdown.classList.remove('show');
			strokeDropdown.classList.remove('show');
		});
	}

	if (smartShapeToggle) {
		smartShapeToggle.addEventListener('change', () => {
			smartShapeSettings.enabled = !!smartShapeToggle.checked;
			updateSmartShapeUI();
		});
	}

	if (smartShapeSensitivity) {
		smartShapeSensitivity.addEventListener('input', () => {
			smartShapeSettings.sensitivity = parseInt(smartShapeSensitivity.value, 10);
			updateSmartShapeUI();
		});
	}

	if (smartShapePresets && smartShapePresets.length) {
		smartShapePresets.forEach(btn => {
			btn.addEventListener('click', () => {
				const value = parseInt(btn.dataset.value, 10);
				smartShapeSettings.sensitivity = Number.isFinite(value) ? value : smartShapeSettings.sensitivity;
				updateSmartShapeUI();
			});
		});
	}

	// Import, Clear, Copy, Save
	importBtn.addEventListener('click', () => fileInput.click());
	fileInput.addEventListener('change', handleFileSelect);
	clearBtn.addEventListener('click', clearCanvas);
	copyBtn.addEventListener('click', copyToClipboard);
	saveBtn.addEventListener('click', saveImage);

	// Hero import button
	if (heroImportBtn) {
		heroImportBtn.addEventListener('click', () => fileInput.click());
	}

	// Hamburger menu (mobile)
	if (menuBtn && menuDropdown) {
		menuBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			menuDropdown.classList.toggle('show');
			colorDropdown.classList.remove('show');
			strokeDropdown.classList.remove('show');
			if (smartShapeDropdown) smartShapeDropdown.classList.remove('show');
		});

		document.querySelectorAll('.menu-option').forEach(btn => {
			btn.addEventListener('click', () => {
				const action = btn.dataset.action;
				menuDropdown.classList.remove('show');
				switch (action) {
					case 'import': fileInput.click(); break;
					case 'clear': clearCanvas(); break;
					case 'copy': copyToClipboard(); break;
					case 'save': saveImage(); break;
					case 'lang-en':
					case 'lang-zh':
						const lang = action === 'lang-en' ? 'en' : 'zh';
						setLanguage(lang);
						applyTranslations();
						// Update lang-option active states everywhere
						document.querySelectorAll('.lang-option').forEach(b => {
							b.classList.toggle('active', b.dataset.lang === lang);
						});
						break;
				}
			});
		});
	}

	// Mobile toolbar buttons
	setupMobileToolbar();
}

function setupMobileToolbar() {
	// Helper to position mobile dropdowns using fixed positioning
	function positionMobileDropdown(btn, dropdown) {
		if (!btn || !dropdown) return;
		const rect = btn.getBoundingClientRect();
		const toolbarHeight = document.querySelector('.toolbar')?.offsetHeight || 48;
		
		// Get dropdown width after it's visible
		const dropdownWidth = dropdown.offsetWidth || 150;
		
		// Center dropdown under the button
		let left = rect.left + (rect.width / 2) - (dropdownWidth / 2);
		
		// Keep within viewport
		const padding = 8;
		if (left < padding) left = padding;
		if (left + dropdownWidth > window.innerWidth - padding) {
			left = window.innerWidth - dropdownWidth - padding;
		}
		
		dropdown.style.left = left + 'px';
		dropdown.style.top = (rect.bottom + 8) + 'px';
		dropdown.style.transform = 'none';
	}

	// Undo/Redo mobile
	if (undoBtnMobile) undoBtnMobile.addEventListener('click', undo);
	if (redoBtnMobile) redoBtnMobile.addEventListener('click', redo);

	// Tool buttons mobile
	if (penBtnMobile) penBtnMobile.addEventListener('click', () => setTool(TOOLS.PEN));
	if (eraserBtnMobile) eraserBtnMobile.addEventListener('click', () => setTool(TOOLS.ERASER));
	if (selectBtnMobile) selectBtnMobile.addEventListener('click', () => setTool(TOOLS.SELECT));

	// Color picker mobile
	if (colorBtnMobile && colorDropdownMobile) {
		colorBtnMobile.addEventListener('click', (e) => {
			e.stopPropagation();
			const wasShown = colorDropdownMobile.classList.contains('show');
			if (strokeDropdownMobile) strokeDropdownMobile.classList.remove('show');
			if (smartShapeDropdownMobile) smartShapeDropdownMobile.classList.remove('show');
			colorDropdownMobile.classList.toggle('show');
			if (!wasShown) {
				// Position after showing so we can measure
				requestAnimationFrame(() => positionMobileDropdown(colorBtnMobile, colorDropdownMobile));
			}
		});

		colorDropdownMobile.querySelectorAll('.color-option').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const color = e.target.dataset.color;
				setColor(color);
				colorDropdownMobile.classList.remove('show');
			});
		});
	}

	// Stroke width picker mobile
	if (strokeBtnMobile && strokeDropdownMobile) {
		strokeBtnMobile.addEventListener('click', (e) => {
			e.stopPropagation();
			const wasShown = strokeDropdownMobile.classList.contains('show');
			if (colorDropdownMobile) colorDropdownMobile.classList.remove('show');
			if (smartShapeDropdownMobile) smartShapeDropdownMobile.classList.remove('show');
			strokeDropdownMobile.classList.toggle('show');
			if (!wasShown) {
				requestAnimationFrame(() => positionMobileDropdown(strokeBtnMobile, strokeDropdownMobile));
			}
		});

		strokeDropdownMobile.querySelectorAll('.stroke-option').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const width = parseInt(e.currentTarget.dataset.width);
				setStrokeWidth(width);
				strokeDropdownMobile.classList.remove('show');
			});
		});
	}

	// Smart shapes mobile
	if (smartShapeBtnMobile && smartShapeDropdownMobile) {
		smartShapeBtnMobile.addEventListener('click', (e) => {
			e.stopPropagation();
			const wasShown = smartShapeDropdownMobile.classList.contains('show');
			if (colorDropdownMobile) colorDropdownMobile.classList.remove('show');
			if (strokeDropdownMobile) strokeDropdownMobile.classList.remove('show');
			smartShapeDropdownMobile.classList.toggle('show');
			if (!wasShown) {
				requestAnimationFrame(() => positionMobileDropdown(smartShapeBtnMobile, smartShapeDropdownMobile));
			}
		});
	}

	if (smartShapeToggleMobile) {
		smartShapeToggleMobile.addEventListener('change', () => {
			smartShapeSettings.enabled = !!smartShapeToggleMobile.checked;
			updateSmartShapeUI();
		});
	}

	if (smartShapeSensitivityMobile) {
		smartShapeSensitivityMobile.addEventListener('input', () => {
			smartShapeSettings.sensitivity = parseInt(smartShapeSensitivityMobile.value, 10);
			updateSmartShapeUI();
		});
	}

	// Mobile smart shape presets
	if (smartShapeDropdownMobile) {
		smartShapeDropdownMobile.querySelectorAll('.smart-shape-preset').forEach(btn => {
			btn.addEventListener('click', () => {
				const value = parseInt(btn.dataset.value, 10);
				smartShapeSettings.sensitivity = Number.isFinite(value) ? value : smartShapeSettings.sensitivity;
				updateSmartShapeUI();
			});
		});
	}
}

function updateSmartShapeUI() {
	// Desktop controls
	if (smartShapeToggle) smartShapeToggle.checked = !!smartShapeSettings.enabled;
	if (smartShapeSensitivity) smartShapeSensitivity.value = String(smartShapeSettings.sensitivity);
	if (smartShapeValue) smartShapeValue.textContent = String(smartShapeSettings.sensitivity);

	if (smartShapePresets && smartShapePresets.length) {
		smartShapePresets.forEach(btn => {
			btn.classList.toggle('active', parseInt(btn.dataset.value, 10) === smartShapeSettings.sensitivity);
		});
	}

	if (smartShapeBtn) smartShapeBtn.classList.toggle('active', !!smartShapeSettings.enabled);

	// Mobile controls
	if (smartShapeToggleMobile) smartShapeToggleMobile.checked = !!smartShapeSettings.enabled;
	if (smartShapeSensitivityMobile) smartShapeSensitivityMobile.value = String(smartShapeSettings.sensitivity);
	if (smartShapeValueMobile) smartShapeValueMobile.textContent = String(smartShapeSettings.sensitivity);
	if (smartShapeBtnMobile) smartShapeBtnMobile.classList.toggle('active', !!smartShapeSettings.enabled);

	// Mobile presets
	if (smartShapeDropdownMobile) {
		smartShapeDropdownMobile.querySelectorAll('.smart-shape-preset').forEach(btn => {
			btn.classList.toggle('active', parseInt(btn.dataset.value, 10) === smartShapeSettings.sensitivity);
		});
	}

	saveSmartShapeSettings();
}

function loadSmartShapeSettings() {
	try {
		const raw = localStorage.getItem(SMART_SHAPE_STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw);
		if (typeof parsed !== 'object' || !parsed) return;
		smartShapeSettings.enabled = typeof parsed.enabled === 'boolean' ? parsed.enabled : smartShapeSettings.enabled;
		if (Number.isFinite(parsed.sensitivity)) smartShapeSettings.sensitivity = clampInt(parsed.sensitivity, 0, 100);
	} catch {
		// ignore
	}
}

function saveSmartShapeSettings() {
	try {
		localStorage.setItem(SMART_SHAPE_STORAGE_KEY, JSON.stringify({
			enabled: !!smartShapeSettings.enabled,
			sensitivity: clampInt(smartShapeSettings.sensitivity, 0, 100)
		}));
	} catch {
		// ignore
	}
}

function setColor(color) {
	currentColor = color;
	
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

function setStrokeWidth(width) {
	currentStrokeWidth = width;

	// Update active state
	document.querySelectorAll('.stroke-option').forEach(btn => {
		btn.classList.toggle('active', parseInt(btn.dataset.width) === width);
	});
}

// ============ Canvas Drawing ============
function setupCanvasListeners() {
	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerup', onPointerUp);
	canvas.addEventListener('pointerleave', onPointerUp);
}

function getPointerPos(e) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top,
		pressure: e.pressure || 0.5
	};
}

function onPointerDown(e) {
	e.preventDefault();
	canvas.setPointerCapture(e.pointerId);

	const pos = getPointerPos(e);

	if (currentTool === TOOLS.SELECT) {
		// Check if clicking on already selected strokes to drag them
		if (selectedStrokes.length > 0) {
			const clickedOnSelected = selectedStrokes.some(idx => isPointNearStroke(pos, strokes[idx]));
			if (clickedOnSelected) {
				// Start dragging the selection
				isDraggingSelection = true;
				dragStartPos = pos;
				return;
			}
		}

		// Check if clicking on a stroke to select it
		const clickedStrokeIdx = findStrokeAtPoint(pos);
		if (clickedStrokeIdx !== -1) {
			selectedStrokes = [clickedStrokeIdx];
			dragStartPos = pos;
			isDraggingSelection = true;
			updateSelectionCursor();
			redrawCanvas();
			return;
		}

		// Start rectangle selection
		selectedStrokes = [];
		isSelecting = true;
		selectionRect = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
		updateSelectionCursor();
		redrawCanvas();
		return;
	}

	// Hide hero section when user starts drawing
	hideHeroSection();

	if (currentTool === TOOLS.ERASER) {
		eraseAtPoint(pos);
		isDrawing = true;
	} else if (currentTool === TOOLS.PEN) {
		isDrawing = true;
		currentStroke = {
			color: currentColor,
			width: currentStrokeWidth,
			points: [pos]
		};
	}
}

function onPointerMove(e) {
	const pos = getPointerPos(e);

	// Handle selection mode
	if (currentTool === TOOLS.SELECT) {
		if (isDraggingSelection && dragStartPos) {
			// Move selected strokes
			const dx = pos.x - dragStartPos.x;
			const dy = pos.y - dragStartPos.y;
			moveSelectedStrokes(dx, dy);
			dragStartPos = pos;
			redrawCanvas();
			return;
		}

		if (isSelecting && selectionRect) {
			// Update selection rectangle
			selectionRect.x2 = pos.x;
			selectionRect.y2 = pos.y;
			redrawCanvas();
			return;
		}
		return;
	}

	if (!isDrawing) return;

	if (currentTool === TOOLS.ERASER) {
		eraseAtPoint(pos);
	} else if (currentTool === TOOLS.PEN && currentStroke) {
		currentStroke.points.push(pos);
		if (smartShapeSettings.enabled && smartShapeDebugEnabled) {
			maybeLogSmartShapeProgress(currentStroke);
		}
		
		// Draw current stroke
		redrawCanvas();
		drawStroke(currentStroke);
	}
}

function onPointerUp(e) {
	// Handle selection mode
	if (currentTool === TOOLS.SELECT) {
		if (isDraggingSelection) {
			isDraggingSelection = false;
			dragStartPos = null;
			if (selectedStrokes.length > 0) {
				saveToHistory();
			}
			return;
		}

		if (isSelecting && selectionRect) {
			// Finalize rectangle selection
			selectedStrokes = findStrokesInRect(selectionRect);
			isSelecting = false;
			selectionRect = null;
			updateSelectionCursor();
			redrawCanvas();
			return;
		}
		return;
	}

	if (!isDrawing) return;

	isDrawing = false;

	if (currentTool === TOOLS.PEN && currentStroke && currentStroke.points.length > 1) {
		const finalStroke = smartShapeSettings.enabled ? recognizeAndSnapStroke(currentStroke) : currentStroke;
		if (smartShapeSettings.enabled && smartShapeDebugEnabled) {
			logSmartShapeFinalDecision(currentStroke, finalStroke);
		}
		if (finalStroke && finalStroke !== currentStroke && finalStroke.shape && finalStroke.shape.type) {
			const shapeKey = 'shape' + finalStroke.shape.type.charAt(0).toUpperCase() + finalStroke.shape.type.slice(1);
			const label = t(shapeKey);
			showToast(t('toastSnappedTo') + ' ' + label, 'success');
		}
		strokes.push(finalStroke);
		saveToHistory();
	}

	currentStroke = null;
	redrawCanvas();
}

function eraseAtPoint(pos) {
	const eraseRadius = 20;

	// Find and remove strokes that intersect with eraser
	const remainingStrokes = strokes.filter(stroke => {
		if (!stroke) return true;

		if (stroke.shape && stroke.shape.type === 'circle') {
			const dx = pos.x - stroke.shape.cx;
			const dy = pos.y - stroke.shape.cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const band = eraseRadius + (stroke.width / 2) + 2;
			return Math.abs(dist - stroke.shape.r) > band;
		}

		if (stroke.shape && stroke.shape.type === 'line') {
			const band = eraseRadius + (stroke.width / 2) + 2;
			return pointToSegmentDistance(pos, { x: stroke.shape.x1, y: stroke.shape.y1 }, { x: stroke.shape.x2, y: stroke.shape.y2 }) > band;
		}

		if (stroke.shape && stroke.shape.type === 'parabola') {
			const band = eraseRadius + (stroke.width / 2) + 2;
			return pointToPolylineDistance(pos, stroke.points) > band;
		}

		return !stroke.points.some(point => {
			const dx = point.x - pos.x;
			const dy = point.y - pos.y;
			return Math.sqrt(dx * dx + dy * dy) < eraseRadius;
		});
	});

	if (remainingStrokes.length !== strokes.length) {
		strokes = remainingStrokes;
		redrawCanvas();
	}
}

// ============ History (Undo/Redo) ============
function saveToHistory() {
	// Remove any redo states
	historyStack = historyStack.slice(0, historyIndex + 1);

	// Save current state
	historyStack.push({
		strokes: JSON.parse(JSON.stringify(strokes)),
		// images state would go here
	});

	historyIndex = historyStack.length - 1;
	updateHistoryButtons();
}

function undo() {
	if (historyIndex > 0) {
		historyIndex--;
		restoreFromHistory();
	}
}

function redo() {
	if (historyIndex < historyStack.length - 1) {
		historyIndex++;
		restoreFromHistory();
	}
}

function restoreFromHistory() {
	const state = historyStack[historyIndex];
	strokes = JSON.parse(JSON.stringify(state.strokes));
	// Clear selection when undoing/redoing
	selectedStrokes = [];
	redrawCanvas();
	updateHistoryButtons();
}

function updateHistoryButtons() {
	undoBtn.disabled = historyIndex <= 0;
	redoBtn.disabled = historyIndex >= historyStack.length - 1;
	
	// Sync mobile buttons
	if (undoBtnMobile) undoBtnMobile.disabled = historyIndex <= 0;
	if (redoBtnMobile) redoBtnMobile.disabled = historyIndex >= historyStack.length - 1;
}

// ============ Image Import ============
function setupDropZone() {
	// Drag and drop
	canvasContainer.addEventListener('dragenter', (e) => {
		e.preventDefault();
		dropZone.classList.add('active');
	});

	canvasContainer.addEventListener('dragover', (e) => {
		e.preventDefault();
	});

	canvasContainer.addEventListener('dragleave', (e) => {
		if (!canvasContainer.contains(e.relatedTarget)) {
			dropZone.classList.remove('active');
		}
	});

	canvasContainer.addEventListener('drop', (e) => {
		e.preventDefault();
		dropZone.classList.remove('active');

		const files = e.dataTransfer.files;
		if (files.length > 0 && files[0].type.startsWith('image/')) {
			loadImageFile(files[0]);
		}
	});
}

function handleFileSelect(e) {
	const file = e.target.files[0];
	if (file && file.type.startsWith('image/')) {
		loadImageFile(file);
	}
	fileInput.value = '';
}

function loadImageFile(file) {
	const reader = new FileReader();
	reader.onload = (e) => {
		addImageToCanvas(e.target.result);
	};
	reader.readAsDataURL(file);
}

function addImageToCanvas(src) {
	// Hide hero section when image is added
	hideHeroSection();

	const img = document.createElement('img');
	img.src = src;

	img.onload = () => {
		// Scale image to fit canvas
		const maxWidth = canvasRect.width * 0.8;
		const maxHeight = canvasRect.height * 0.8;
		let width = img.naturalWidth;
		let height = img.naturalHeight;

		if (width > maxWidth) {
			height = (maxWidth / width) * height;
			width = maxWidth;
		}
		if (height > maxHeight) {
			width = (maxHeight / height) * width;
			height = maxHeight;
		}

		// Create wrapper
		const wrapper = document.createElement('div');
		wrapper.className = 'imported-image';
		wrapper.style.left = '20px';
		wrapper.style.top = '20px';
		wrapper.style.width = width + 'px';
		
		const imgEl = document.createElement('img');
		imgEl.src = src;
		wrapper.appendChild(imgEl);

		// Add resize handle
		const resizeHandle = document.createElement('div');
		resizeHandle.className = 'resize-handle';
		wrapper.appendChild(resizeHandle);

		// Add delete handle
		const deleteHandle = document.createElement('div');
		deleteHandle.className = 'delete-handle';
		deleteHandle.textContent = '×';
		deleteHandle.addEventListener('click', (e) => {
			e.stopPropagation();
			wrapper.remove();
			showToast(t('toastImageRemoved'));
		});
		wrapper.appendChild(deleteHandle);

		// Make draggable
		setupImageDrag(wrapper);

		imagesLayer.appendChild(wrapper);
		showToast(t('toastImageAdded'));
	};
}

function setupImageDrag(wrapper) {
	let isDragging = false;
	let startX, startY, startLeft, startTop;

	wrapper.addEventListener('pointerdown', (e) => {
		if (e.target.className === 'resize-handle' || e.target.className === 'delete-handle') return;

		// Select this image
		document.querySelectorAll('.imported-image').forEach(el => el.classList.remove('selected'));
		wrapper.classList.add('selected');

		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
		startLeft = wrapper.offsetLeft;
		startTop = wrapper.offsetTop;
		wrapper.setPointerCapture(e.pointerId);
	});

	wrapper.addEventListener('pointermove', (e) => {
		if (!isDragging) return;

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		wrapper.style.left = (startLeft + dx) + 'px';
		wrapper.style.top = (startTop + dy) + 'px';
	});

	wrapper.addEventListener('pointerup', () => {
		isDragging = false;
	});

	// Click elsewhere to deselect
	document.addEventListener('click', (e) => {
		if (!wrapper.contains(e.target)) {
			wrapper.classList.remove('selected');
		}
	});
}

// ============ Clipboard ============
function setupClipboard() {
	document.addEventListener('paste', async (e) => {
		const items = e.clipboardData.items;

		for (const item of items) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const blob = item.getAsFile();
				const reader = new FileReader();
				reader.onload = (e) => addImageToCanvas(e.target.result);
				reader.readAsDataURL(blob);
				return;
			}
		}
	});
}

async function copyToClipboard() {
	try {
		// Check if we're in a secure context (required for Clipboard API)
		if (!window.isSecureContext) {
			console.warn('Clipboard API requires HTTPS or localhost');
			showToast(t('toastCopyFailedInsecure') || 'Copy requires HTTPS', 'error');
			return;
		}
		
		// Try standard Clipboard API first
		// Pass Promise directly to ClipboardItem (Safari requires this to stay within user activation)
		if (navigator.clipboard && window.ClipboardItem) {
			try {
				await navigator.clipboard.write([
					new ClipboardItem({ 'image/png': getCanvasBlob() })
				]);
				showToast(t('toastCopied'), 'success');
				return;
			} catch (clipboardErr) {
				// Clipboard API failed, try fallback
				console.error('Clipboard API failed:', clipboardErr.name, clipboardErr.message);
			}
		}
		
		const blob = await getCanvasBlob();
		
		// Fallback: Use Web Share API (works on iOS Safari)
		if (navigator.canShare && navigator.share) {
			const file = new File([blob], 'openmathboard.png', { type: 'image/png' });
			if (navigator.canShare({ files: [file] })) {
				await navigator.share({
					files: [file],
					title: 'OpenMathBoard'
				});
				showToast(t('toastShared') || 'Shared!', 'success');
				return;
			}
		}
		
		// Final fallback: download the image
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'openmathboard-' + Date.now() + '.png';
		a.click();
		URL.revokeObjectURL(url);
		showToast(t('toastImageDownloaded') || 'Image downloaded', 'success');
	} catch (err) {
		console.error('Copy failed:', err);
		showToast(t('toastCopyFailed'), 'error');
	}
}

async function saveImage() {
	try {
		const blob = await getCanvasBlob();

		// Try native file picker first
		if ('showSaveFilePicker' in window) {
			const handle = await window.showSaveFilePicker({
				suggestedName: 'openmathboard-' + Date.now() + '.png',
				types: [{
					description: 'PNG Image',
					accept: { 'image/png': ['.png'] }
				}]
			});
			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
			showToast(t('toastImageSaved'), 'success');
		} else {
			// Fallback to download
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'openmathboard-' + Date.now() + '.png';
			a.click();
			URL.revokeObjectURL(url);
			showToast(t('toastImageDownloaded'), 'success');
		}
	} catch (err) {
		if (err.name !== 'AbortError') {
			console.error('Save failed:', err);
			showToast(t('toastSaveFailed'), 'error');
		}
	}
}

async function getCanvasBlob() {
	// Create a temporary canvas to combine layers
	const tempCanvas = document.createElement('canvas');
	const dpr = window.devicePixelRatio || 1;
	tempCanvas.width = canvasRect.width * dpr;
	tempCanvas.height = canvasRect.height * dpr;
	const tempCtx = tempCanvas.getContext('2d');
	tempCtx.scale(dpr, dpr);

	// White background
	tempCtx.fillStyle = '#ffffff';
	tempCtx.fillRect(0, 0, canvasRect.width, canvasRect.height);

	// Draw imported images
	const images = imagesLayer.querySelectorAll('.imported-image');
	for (const wrapper of images) {
		const img = wrapper.querySelector('img');
		const left = wrapper.offsetLeft;
		const top = wrapper.offsetTop;
		const width = wrapper.offsetWidth;
		const height = img.offsetHeight;
		tempCtx.drawImage(img, left, top, width, height);
	}

	// Draw strokes
	for (const stroke of strokes) {
		if (!stroke || !stroke.points || stroke.points.length < 2) continue;

		if (stroke.shape && stroke.shape.type === 'line') {
			tempCtx.beginPath();
			tempCtx.strokeStyle = stroke.color;
			tempCtx.lineWidth = stroke.width;
			tempCtx.lineCap = 'round';
			tempCtx.lineJoin = 'round';
			tempCtx.moveTo(stroke.shape.x1, stroke.shape.y1);
			tempCtx.lineTo(stroke.shape.x2, stroke.shape.y2);
			tempCtx.stroke();
			continue;
		}

		if (stroke.shape && stroke.shape.type === 'circle') {
			tempCtx.beginPath();
			tempCtx.strokeStyle = stroke.color;
			tempCtx.lineWidth = stroke.width;
			tempCtx.lineCap = 'round';
			tempCtx.lineJoin = 'round';
			tempCtx.arc(stroke.shape.cx, stroke.shape.cy, stroke.shape.r, 0, Math.PI * 2);
			tempCtx.stroke();
			continue;
		}

		if (stroke.shape && stroke.shape.type === 'parabola') {
			tempCtx.beginPath();
			tempCtx.strokeStyle = stroke.color;
			tempCtx.lineWidth = stroke.width;
			tempCtx.lineCap = 'round';
			tempCtx.lineJoin = 'round';
			const points = stroke.points;
			tempCtx.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				tempCtx.lineTo(points[i].x, points[i].y);
			}
			tempCtx.stroke();
			continue;
		}

		tempCtx.beginPath();
		tempCtx.strokeStyle = stroke.color;
		tempCtx.lineWidth = stroke.width;
		tempCtx.lineCap = 'round';
		tempCtx.lineJoin = 'round';

		const points = stroke.points;
		tempCtx.moveTo(points[0].x, points[0].y);

		for (let i = 1; i < points.length - 1; i++) {
			const xc = (points[i].x + points[i + 1].x) / 2;
			const yc = (points[i].y + points[i + 1].y) / 2;
			tempCtx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
		}

		if (points.length > 1) {
			const last = points[points.length - 1];
			tempCtx.lineTo(last.x, last.y);
		}

		tempCtx.stroke();
	}

	return new Promise(resolve => {
		tempCanvas.toBlob(resolve, 'image/png');
	});
}

function clearCanvas() {
	if (strokes.length === 0 && imagesLayer.children.length === 0) {
		return;
	}

	if (confirm(t('confirmClear'))) {
		strokes = [];
		imagesLayer.innerHTML = '';
		redrawCanvas();
		saveToHistory();
		showToast(t('toastCanvasCleared'));
	}
}

// ============ Smart Shape Recognition (Line/Circle/Parabola) ============
function recognizeAndSnapStroke(stroke) {
	if (!stroke || !stroke.points || stroke.points.length < SMART_SHAPE_MIN_POINTS) return stroke;

	const rawPoints = simplifyStrokePoints(stroke.points, Math.max(1.5, stroke.width * 0.5));
	if (rawPoints.length < SMART_SHAPE_MIN_POINTS) return stroke;

	const bounds = getBounds(rawPoints);
	const diag = Math.max(1, Math.hypot(bounds.w, bounds.h));
	if (diag < 12) return stroke;

	const params = getSmartShapeParams(smartShapeSettings.sensitivity);

	const candidates = [];

	const lineResult = detectLine(rawPoints, diag, stroke.width, params);
	if (lineResult) {
		candidates.push({
			type: 'line',
			score: lineResult.score,
			data: lineResult
		});
	}

	const circleResult = detectCircle(rawPoints, diag, stroke.width, params);
	if (circleResult) {
		candidates.push({
			type: 'circle',
			score: circleResult.score,
			data: circleResult
		});
	}

	const parabolaResult = detectParabola(rawPoints, diag, stroke.width, params);
	if (parabolaResult) {
		candidates.push({
			type: 'parabola',
			score: parabolaResult.score,
			data: parabolaResult
		});
	}

	if (candidates.length === 0) return stroke;
	candidates.sort((a, b) => b.score - a.score);
	const best = candidates[0];
	let accept = params.acceptScore;
	if (best.type === 'line') accept = params.acceptLine;
	if (best.type === 'circle') accept = params.acceptCircle;
	if (best.type === 'parabola') accept = params.acceptParabola;
	if (best.score < accept) return stroke;

	if (best.type === 'line') {
		const r = best.data;
		return {
			...stroke,
			shape: {
				type: 'line',
				x1: r.p1.x,
				y1: r.p1.y,
				x2: r.p2.x,
				y2: r.p2.y
			},
			points: [r.p1, r.p2]
		};
	}

	if (best.type === 'circle') {
		const r = best.data;
		const points = generateCirclePoints(r.cx, r.cy, r.r, 120);
		return {
			...stroke,
			shape: {
				type: 'circle',
				cx: r.cx,
				cy: r.cy,
				r: r.r
			},
			points
		};
	}

	if (best.type === 'parabola') {
		const r = best.data;
		const points = generateParabolaPoints(r, 140);
		return {
			...stroke,
			shape: {
				type: 'parabola',
				mode: r.mode,
				origin: r.origin,
				a: r.a,
				b: r.b,
				c: r.c,
				tMin: r.tMin,
				tMax: r.tMax
			},
			points
		};
	}

	return stroke;
}

function getSmartShapeParams(sensitivity) {
	const s = clamp01((clampInt(sensitivity, 0, 100)) / 100);
	const lerp = (a, b) => a + (b - a) * s;

	return {
		s,
		// Overall accept score (fallback). Prefer per-shape thresholds below.
		acceptScore: lerp(0.96, 0.62),
		acceptLine: lerp(0.96, 0.70),
		acceptCircle: lerp(0.96, 0.45),
		acceptParabola: lerp(0.96, 0.42),

		// Line tolerances
		lineRmseTol: lerp(0.018, 0.070),
		lineMaxTol: lerp(0.045, 0.120),
		lineStraightMin: lerp(0.90, 0.65),
		lineInlierMin: lerp(0.82, 0.60),
		lineEpsNorm: lerp(0.010, 0.020),

		// Circle tolerances
		circleClosedMax: lerp(0.12, 0.50),
		circleRadialStdTol: lerp(0.08, 0.22),
		circleMeanAbsTol: lerp(0.05, 0.12),
		circleCoverageMin: lerp(5.6, 2.8),
		circleAspectMin: lerp(0.85, 0.25),
		circleInlierMin: lerp(0.82, 0.45),
		circleEpsNorm: lerp(0.012, 0.024),

		// Parabola tolerances
		parabolaRmseTol: lerp(0.020, 0.180),
		parabolaInlierFrac: lerp(0.85, 0.50),
		parabolaCurvMin: lerp(0.20, 0.02),
		parabolaClosedMax: lerp(0.10, 0.35)
	};
}

function simplifyStrokePoints(points, minDist) {
	if (!points || points.length === 0) return [];
	const simplified = [points[0]];
	let last = points[0];
	for (let i = 1; i < points.length; i++) {
		const p = points[i];
		if (Math.hypot(p.x - last.x, p.y - last.y) >= minDist) {
			simplified.push(p);
			last = p;
		}
	}
	if (simplified.length === 1 && points.length > 1) simplified.push(points[points.length - 1]);
	return simplified;
}

function getBounds(points) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const p of points) {
		if (p.x < minX) minX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.x > maxX) maxX = p.x;
		if (p.y > maxY) maxY = p.y;
	}
	return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function pathLength(points) {
	let len = 0;
	for (let i = 1; i < points.length; i++) {
		len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
	}
	return len;
}

function pointToLineDistance(p, a, b) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const denom = Math.hypot(dx, dy);
	if (denom < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
	return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / denom;
}

function pointToSegmentDistance(p, a, b) {
	const abx = b.x - a.x;
	const aby = b.y - a.y;
	const apx = p.x - a.x;
	const apy = p.y - a.y;
	const abLen2 = abx * abx + aby * aby;
	if (abLen2 < 1e-6) return Math.hypot(apx, apy);
	let t = (apx * abx + apy * aby) / abLen2;
	t = Math.max(0, Math.min(1, t));
	const cx = a.x + t * abx;
	const cy = a.y + t * aby;
	return Math.hypot(p.x - cx, p.y - cy);
}

function pointToPolylineDistance(p, points) {
	if (!points || points.length < 2) return Infinity;
	let best = Infinity;
	for (let i = 1; i < points.length; i++) {
		const d = pointToSegmentDistance(p, points[i - 1], points[i]);
		if (d < best) best = d;
	}
	return best;
}

function detectLine(points, diag, strokeWidth, params, debug = false) {
	if (points.length < 2) return null;
	const p = params || getSmartShapeParams(50);

	const eps = Math.max(strokeWidth * 1.5, diag * p.lineEpsNorm, 2.5);
	const iterations = Math.min(96, Math.max(32, points.length * 2));
	let bestInliers = null;
	let bestCount = 0;

	for (let iter = 0; iter < iterations; iter++) {
		const i = Math.floor(Math.random() * points.length);
		let j = Math.floor(Math.random() * points.length);
		if (j === i) j = (j + 1) % points.length;
		const a = points[i];
		const b = points[j];
		if (Math.hypot(b.x - a.x, b.y - a.y) < diag * 0.1) continue;

		const inliers = [];
		for (const p of points) {
			if (pointToLineDistance(p, a, b) <= eps) inliers.push(p);
		}
		if (inliers.length > bestCount) {
			bestCount = inliers.length;
			bestInliers = inliers;
		}
	}

	const inlierRatio = bestInliers ? (bestInliers.length / points.length) : 0;
	if (!bestInliers || bestInliers.length < Math.max(10, points.length * p.lineInlierMin)) {
		return debug ? { rejected: true, reason: 'inliers', inlierRatio, score: 0 } : null;
	}

	const fit = fitLinePCA(bestInliers);
	if (!fit) return null;

	const endDist = Math.hypot(fit.p2.x - fit.p1.x, fit.p2.y - fit.p1.y);
	const len = Math.max(1e-6, pathLength(points));
	const straightness = Math.min(1, endDist / len);

	let sum2 = 0;
	let maxD = 0;
	for (const p of points) {
		const d = pointToLineDistance(p, fit.p1, fit.p2);
		sum2 += d * d;
		if (d > maxD) maxD = d;
	}
	const rmse = Math.sqrt(sum2 / points.length);
	const rmseNorm = rmse / diag;
	const maxNorm = maxD / diag;

	// Score 0..1 (higher is better). Uses tolerances that change with sensitivity.
	let score = 1;
	score *= clamp01(1 - rmseNorm / p.lineRmseTol);
	score *= clamp01(1 - maxNorm / p.lineMaxTol);
	score *= clamp01((straightness - p.lineStraightMin) / (1 - p.lineStraightMin));
	score *= clamp01((inlierRatio - p.lineInlierMin) / (1 - p.lineInlierMin));

	if (score < 0.55) {
		return debug ? { ...fit, rejected: true, reason: 'score', score, metrics: { rmseNorm, maxNorm, straightness, inlierRatio } } : null;
	}
	return { ...fit, score, metrics: { rmseNorm, maxNorm, straightness, inlierRatio } };
}

function fitLinePCA(points) {
	if (!points || points.length < 2) return null;

	let meanX = 0;
	let meanY = 0;
	for (const p of points) {
		meanX += p.x;
		meanY += p.y;
	}
	meanX /= points.length;
	meanY /= points.length;

	let sxx = 0;
	let sxy = 0;
	let syy = 0;
	for (const p of points) {
		const dx = p.x - meanX;
		const dy = p.y - meanY;
		sxx += dx * dx;
		sxy += dx * dy;
		syy += dy * dy;
	}

	// Principal eigenvector of 2x2 covariance matrix
	const trace = sxx + syy;
	const det = sxx * syy - sxy * sxy;
	const temp = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
	const lambda1 = trace / 2 + temp;

	let vx = sxy;
	let vy = lambda1 - sxx;
	if (Math.hypot(vx, vy) < 1e-6) {
		// Fallback: vertical/horizontal-ish
		vx = 1;
		vy = 0;
	}
	const vlen = Math.hypot(vx, vy);
	vx /= vlen;
	vy /= vlen;

	let tMin = Infinity;
	let tMax = -Infinity;
	for (const p of points) {
		const t = (p.x - meanX) * vx + (p.y - meanY) * vy;
		if (t < tMin) tMin = t;
		if (t > tMax) tMax = t;
	}
	const p1 = { x: meanX + vx * tMin, y: meanY + vy * tMin };
	const p2 = { x: meanX + vx * tMax, y: meanY + vy * tMax };
	return { p1, p2 };
}

function detectCircle(points, diag, strokeWidth, params, debug = false) {
	if (points.length < 6) return null;
	const p = params || getSmartShapeParams(50);

	const bounds = getBounds(points);
	const aspect = bounds.w / Math.max(1e-6, bounds.h);
	const aspectMin = p.circleAspectMin;
	const aspectMax = 1 / Math.max(1e-6, aspectMin);
	if (aspect < aspectMin || aspect > aspectMax) {
		return debug ? { rejected: true, reason: 'aspect', aspect, aspectMin, aspectMax, score: 0 } : null;
	}

	const start = points[0];
	const end = points[points.length - 1];
	const closedness = Math.hypot(end.x - start.x, end.y - start.y) / diag;
	const closedTooOpen = closedness > p.circleClosedMax;
	// Production default: keep strict on low/med sensitivity, but allow more open circles on high sensitivity.
	if (closedTooOpen && p.s < 0.65) {
		return debug ? { rejected: true, reason: 'closedness', closedness, closedMax: p.circleClosedMax, score: 0 } : null;
	}

	const eps = Math.max(strokeWidth * 1.8, diag * p.circleEpsNorm, 3.5);
	const iterations = Math.min(140, Math.max(50, points.length * 3));
	let best = null;
	let bestCount = 0;

	for (let iter = 0; iter < iterations; iter++) {
		const i = Math.floor(Math.random() * points.length);
		let j = Math.floor(Math.random() * points.length);
		let k = Math.floor(Math.random() * points.length);
		if (j === i) j = (j + 1) % points.length;
		if (k === i || k === j) k = (k + 2) % points.length;

		const c = circleFrom3(points[i], points[j], points[k]);
		if (!c) continue;
		if (!Number.isFinite(c.cx) || !Number.isFinite(c.cy) || !Number.isFinite(c.r)) continue;
		if (c.r < 6 || c.r > diag * 2) continue;

		const inliers = [];
		for (const p of points) {
			const d = Math.abs(Math.hypot(p.x - c.cx, p.y - c.cy) - c.r);
			if (d <= eps) inliers.push(p);
		}

		if (inliers.length > bestCount) {
			bestCount = inliers.length;
			best = { ...c, inliers };
		}
	}

	let refined = null;
	let inlierRatio = 0;
	let usedFallback = false;
	if (best && bestCount >= Math.max(14, points.length * p.circleInlierMin)) {
		inlierRatio = bestCount / points.length;
		refined = fitCircleLeastSquares(best.inliers);
	} else {
		// Fallback: least-squares fit to all points, then derive inliers from residuals.
		usedFallback = true;
		refined = fitCircleLeastSquares(points);
		if (refined) {
			let inliers = 0;
			for (const pt of points) {
				const d = Math.abs(Math.hypot(pt.x - refined.cx, pt.y - refined.cy) - refined.r);
				if (d <= eps) inliers++;
			}
			inlierRatio = inliers / points.length;
		}
	}
	if (!refined) return debug ? { rejected: true, reason: 'fit-failed', score: 0 } : null;

	// If we're still wildly low on inliers at low sensitivity, bail out.
	if (inlierRatio < p.circleInlierMin && p.s < 0.70) {
		return debug ? { ...refined, rejected: true, reason: 'inliers', inlierRatio, inlierMin: p.circleInlierMin, usedFallback, score: 0 } : null;
	}

	// Coverage check (avoid snapping C-shapes)
	const coverage = angleCoverage(points, refined.cx, refined.cy);
	if (coverage < p.circleCoverageMin) {
		return debug ? { ...refined, rejected: true, reason: 'coverage', coverage, coverageMin: p.circleCoverageMin, inlierRatio, closedness, closedMax: p.circleClosedMax, usedFallback, score: 0 } : null;
	}

	const stats = circleErrorStats(points, refined.cx, refined.cy, refined.r);
	const radialStdNorm = stats.std / Math.max(1e-6, refined.r);
	const meanAbsNorm = stats.meanAbs / Math.max(1e-6, refined.r);

	const radialStdScore = clamp01(1 - radialStdNorm / p.circleRadialStdTol);
	const meanAbsScore = clamp01(1 - meanAbsNorm / p.circleMeanAbsTol);
	// If it's more open than the preferred closedness threshold, penalize but don't collapse at high sensitivity.
	const closedPenaltyDenom = p.circleClosedMax * (closedTooOpen ? 2.6 : 1);
	const closedScore = clamp01(1 - closedness / Math.max(1e-6, closedPenaltyDenom));
	const coverageScore = clamp01((coverage - p.circleCoverageMin) / (Math.PI * 2 - p.circleCoverageMin));
	const inlierScore = clamp01(inlierRatio / Math.max(1e-6, p.circleInlierMin));

	// Weighted score: prioritize fit quality, de-emphasize closedness (esp. at high sensitivity)
	const wClosed = (p.s >= 0.80) ? 0.06 : 0.14;
	let score =
		(0.34 * radialStdScore) +
		(0.24 * meanAbsScore) +
		(0.22 * coverageScore) +
		(0.14 * inlierScore) +
		(wClosed * closedScore);

	// Extra nudge: if fit is excellent, allow score to be dominated by fit even when open.
	if (p.s >= 0.80 && radialStdNorm < p.circleRadialStdTol * 0.55 && meanAbsNorm < p.circleMeanAbsTol * 0.55) {
		score = Math.max(score, 0.72);
	}

	if (score < 0.45 || (closedTooOpen && p.s < 0.80)) {
		const reason = (closedTooOpen && p.s < 0.80) ? 'closedness' : 'score';
		return debug ? {
			...refined,
			rejected: true,
			reason,
			score,
			metrics: {
				radialStdNorm,
				meanAbsNorm,
				closedness,
				coverage,
				inlierRatio,
				radialStdScore,
				meanAbsScore,
				coverageScore,
				inlierScore,
				closedScore,
				usedFallback
			},
			closedMax: p.circleClosedMax
		} : null;
	}

	return {
		...refined,
		score,
		metrics: {
			radialStdNorm,
			meanAbsNorm,
			closedness,
			coverage,
			inlierRatio,
			radialStdScore,
			meanAbsScore,
			coverageScore,
			inlierScore,
			closedScore,
			usedFallback
		},
		closedMax: p.circleClosedMax
	};
}

function detectParabola(points, diag, strokeWidth, params, debug = false) {
	if (points.length < 10) return null;
	const p = params || getSmartShapeParams(50);

	// Avoid competing with circles: parabolas should generally not be closed
	const start = points[0];
	const end = points[points.length - 1];
	const closedness = Math.hypot(end.x - start.x, end.y - start.y) / diag;
	if (closedness < p.parabolaClosedMax) {
		// still allow if the stroke is clearly not a circle later, but this is a strong hint
	}

	const bounds = getBounds(points);
	const diagLocal = Math.max(1, Math.hypot(bounds.w, bounds.h));
	if (diagLocal < 20) return null;

	const fitY = fitQuadraticTrimmed(points, 'yOfX', p.parabolaInlierFrac);
	const fitX = fitQuadraticTrimmed(points, 'xOfY', p.parabolaInlierFrac);

	const cand = [];
	if (fitY) cand.push(fitY);
	if (fitX) cand.push(fitX);
	if (!cand.length) return debug ? { rejected: true, reason: 'fit-failed', score: 0 } : null;

	// Pick best by normalized RMSE
	cand.sort((a, b) => a.rmseNorm - b.rmseNorm);
	const best = cand[0];

	// Curvature heuristic: ensure it's not essentially a line
	const range = Math.max(1e-6, (best.tMax - best.tMin));
	const curv = Math.abs(best.a) * range * range / diag;

	const rmseScore = clamp01(1 - best.rmseNorm / p.parabolaRmseTol);
	const curvScore = clamp01((curv - p.parabolaCurvMin) / (0.7 - p.parabolaCurvMin));
	// Treat an inlier ratio near parabolaInlierFrac as "good enough" (especially for high sensitivity verification)
	const inlierScore = clamp01(best.inlierRatio / Math.max(1e-6, p.parabolaInlierFrac));

	// Weighted score (less brittle than multiplying; avoids a single factor collapsing the result)
	let score = (0.55 * rmseScore) + (0.25 * curvScore) + (0.20 * inlierScore);

	// If stroke is very closed, penalize parabola heavily
	if (closedness < p.parabolaClosedMax) score *= 0.35;

	if (score < 0.45) {
		return debug ? { ...best, rejected: true, reason: 'score', score, metrics: { rmseNorm: best.rmseNorm, curv, inlierRatio: best.inlierRatio, inlierFrac: p.parabolaInlierFrac, closedness, rmseScore, curvScore, inlierScore } } : null;
	}
	return { ...best, score, metrics: { rmseNorm: best.rmseNorm, curv, inlierRatio: best.inlierRatio, inlierFrac: p.parabolaInlierFrac, closedness, rmseScore, curvScore, inlierScore } };
}

function maybeLogSmartShapeProgress(stroke) {
	const now = Date.now();
	if (now - lastSmartShapeDebugAt < SMART_SHAPE_DEBUG_THROTTLE_MS) return;
	if (!stroke || !stroke.points || stroke.points.length < SMART_SHAPE_MIN_POINTS) return;

	const rawPoints = simplifyStrokePoints(stroke.points, Math.max(1.5, stroke.width * 0.5));
	if (rawPoints.length < SMART_SHAPE_MIN_POINTS) return;
	const pts = downsamplePoints(rawPoints, 120);
	const bounds = getBounds(pts);
	const diag = Math.max(1, Math.hypot(bounds.w, bounds.h));
	if (diag < 12) return;

	const params = getSmartShapeParams(smartShapeSettings.sensitivity);
	const line = detectLine(pts, diag, stroke.width, params, true);
	const circle = detectCircle(pts, diag, stroke.width, params, true);
	const parabola = detectParabola(pts, diag, stroke.width, params, true);

	const summarize = (name, obj) => {
		if (!obj) return `${name}:n/a`;
		if (obj.rejected) {
			const reason = obj.reason || 'rejected';
			const score = (obj.score ?? 0).toFixed(2);
			return `${name}:reject(${reason}) s=${score}`;
		}
		return `${name}:ok s=${(obj.score ?? 0).toFixed(2)}`;
	};

	const best = [
		{ t: 'line', o: line },
		{ t: 'circle', o: circle },
		{ t: 'parabola', o: parabola }
	].filter(x => x.o && !x.o.rejected).sort((a, b) => (b.o.score ?? 0) - (a.o.score ?? 0))[0];

	const bestStr = best ? `${best.t} ${(best.o.score ?? 0).toFixed(2)}` : 'none';
	const key = `${smartShapeSettings.sensitivity}|${bestStr}|${(circle && circle.reason) || ''}|${(parabola && parabola.reason) || ''}`;
	if (key === lastSmartShapeDebugKey && now - lastSmartShapeDebugAt < 1000) return;
	lastSmartShapeDebugKey = key;
	lastSmartShapeDebugAt = now;

	console.groupCollapsed(`[SmartShapes] drawing… sens=${smartShapeSettings.sensitivity} accept=${params.acceptScore.toFixed(2)} best=${bestStr}`);
	console.log(summarize('line', line));
	if (line && line.metrics) console.log('line.metrics', line.metrics);
	console.log(summarize('circle', circle));
	if (circle) {
		if (circle.metrics) console.log('circle.metrics', circle.metrics);
		if (circle.reason && !circle.metrics) console.log('circle.details', circle);
	}
	console.log(summarize('parabola', parabola));
	if (parabola) {
		if (parabola.metrics) console.log('parabola.metrics', parabola.metrics);
		if (parabola.reason && !parabola.metrics) console.log('parabola.details', parabola);
	}
	console.groupEnd();
}

function logSmartShapeFinalDecision(originalStroke, finalStroke) {
	try {
		const rawPoints = simplifyStrokePoints(originalStroke.points, Math.max(1.5, originalStroke.width * 0.5));
		const pts = downsamplePoints(rawPoints, 160);
		const bounds = getBounds(pts);
		const diag = Math.max(1, Math.hypot(bounds.w, bounds.h));
		const params = getSmartShapeParams(smartShapeSettings.sensitivity);
		const line = detectLine(pts, diag, originalStroke.width, params, true);
		const circle = detectCircle(pts, diag, originalStroke.width, params, true);
		const parabola = detectParabola(pts, diag, originalStroke.width, params, true);
		const snapped = finalStroke && finalStroke.shape ? finalStroke.shape.type : 'none';

		console.group(`[SmartShapes] pointerup sens=${smartShapeSettings.sensitivity} accept=${params.acceptScore.toFixed(2)} snapped=${snapped}`);
		console.log('line', line);
		console.log('circle', circle);
		console.log('parabola', parabola);
		if (finalStroke && finalStroke.shape) console.log('final.shape', finalStroke.shape);
		console.groupEnd();
	} catch (err) {
		console.warn('[SmartShapes] debug logging failed', err);
	}
}

function downsamplePoints(points, maxPoints) {
	if (!points || points.length <= maxPoints) return points;
	const out = [];
	const n = points.length;
	for (let i = 0; i < maxPoints; i++) {
		const idx = Math.floor((i / (maxPoints - 1)) * (n - 1));
		out.push(points[idx]);
	}
	return out;
}

function fitQuadraticTrimmed(points, mode, keepFrac) {
	// mode: 'yOfX' => y = a*(x-origin)^2 + b*(x-origin) + c
	//       'xOfY' => x = a*(y-origin)^2 + b*(y-origin) + c
	const frac = Math.max(0.5, Math.min(0.95, keepFrac));

	let origin = 0;
	for (const pt of points) origin += (mode === 'yOfX') ? pt.x : pt.y;
	origin /= points.length;

	const allPoints = points.slice();
	let active = allPoints.slice();
	let coeffs = null;

	for (let iter = 0; iter < 3; iter++) {
		coeffs = fitQuadraticLeastSquares(active, mode, origin);
		if (!coeffs) return null;

		// IMPORTANT: trim against the full point set each iteration so the kept fraction doesn't shrink multiplicatively.
		const residuals = allPoints.map(pt => {
			const t = (mode === 'yOfX') ? (pt.x - origin) : (pt.y - origin);
			const y = (mode === 'yOfX') ? pt.y : pt.x;
			const yHat = coeffs.a * t * t + coeffs.b * t + coeffs.c;
			return { pt, absErr: Math.abs(y - yHat) };
		});
		residuals.sort((a, b) => a.absErr - b.absErr);
		const keepN = Math.max(8, Math.floor(allPoints.length * frac));
		active = residuals.slice(0, keepN).map(r => r.pt);
	}

	if (!coeffs) return null;

	// RMSE on all original points
	let sum2 = 0;
	let maxAbs = 0;
	for (const pt of allPoints) {
		const t = (mode === 'yOfX') ? (pt.x - origin) : (pt.y - origin);
		const y = (mode === 'yOfX') ? pt.y : pt.x;
		const yHat = coeffs.a * t * t + coeffs.b * t + coeffs.c;
		const err = y - yHat;
		sum2 += err * err;
		maxAbs = Math.max(maxAbs, Math.abs(err));
	}
	const rmse = Math.sqrt(sum2 / allPoints.length);
	const diag = Math.max(1, Math.hypot(getBounds(points).w, getBounds(points).h));
	const rmseNorm = rmse / diag;

	// Domain limits
	let tMin = Infinity;
	let tMax = -Infinity;
	for (const pt of allPoints) {
		const t = (mode === 'yOfX') ? (pt.x - origin) : (pt.y - origin);
		if (t < tMin) tMin = t;
		if (t > tMax) tMax = t;
	}

	return {
		mode,
		origin,
		a: coeffs.a,
		b: coeffs.b,
		c: coeffs.c,
		tMin,
		tMax,
		rmseNorm,
		maxAbs,
		inlierRatio: active.length / allPoints.length
	};
}

function fitQuadraticLeastSquares(points, mode, origin) {
	// Fits y = a t^2 + b t + c where t = (x-origin) or (y-origin)
	if (!points || points.length < 3) return null;
	let s4 = 0;
	let s3 = 0;
	let s2 = 0;
	let s1 = 0;
	let s0 = 0;
	let sy2 = 0;
	let sy1 = 0;
	let sy0 = 0;

	for (const pt of points) {
		const t = (mode === 'yOfX') ? (pt.x - origin) : (pt.y - origin);
		const y = (mode === 'yOfX') ? pt.y : pt.x;
		const t2 = t * t;
		const t3 = t2 * t;
		const t4 = t2 * t2;
		s4 += t4;
		s3 += t3;
		s2 += t2;
		s1 += t;
		s0 += 1;
		sy2 += y * t2;
		sy1 += y * t;
		sy0 += y;
	}

	const M = [
		[s4, s3, s2],
		[s3, s2, s1],
		[s2, s1, s0]
	];
	const v = [sy2, sy1, sy0];
	const sol = solve3x3(M, v);
	if (!sol) return null;
	if (!Number.isFinite(sol[0]) || !Number.isFinite(sol[1]) || !Number.isFinite(sol[2])) return null;
	return { a: sol[0], b: sol[1], c: sol[2] };
}

function generateParabolaPoints(fit, count) {
	const pts = [];
	const n = Math.max(30, count || 140);
	for (let i = 0; i <= n; i++) {
		const t = fit.tMin + ((fit.tMax - fit.tMin) * (i / n));
		if (fit.mode === 'yOfX') {
			const x = fit.origin + t;
			const y = fit.a * t * t + fit.b * t + fit.c;
			pts.push({ x, y, pressure: 0.5 });
		} else {
			const y = fit.origin + t;
			const x = fit.a * t * t + fit.b * t + fit.c;
			pts.push({ x, y, pressure: 0.5 });
		}
	}
	return pts;
}

function circleFrom3(p1, p2, p3) {
	const x1 = p1.x, y1 = p1.y;
	const x2 = p2.x, y2 = p2.y;
	const x3 = p3.x, y3 = p3.y;

	const a = x1 - x2;
	const b = y1 - y2;
	const c = x1 - x3;
	const d = y1 - y3;

	const e = ((x1 * x1 - x2 * x2) + (y1 * y1 - y2 * y2)) / 2;
	const f = ((x1 * x1 - x3 * x3) + (y1 * y1 - y3 * y3)) / 2;

	const det = a * d - b * c;
	if (Math.abs(det) < 1e-6) return null;

	const cx = (d * e - b * f) / det;
	const cy = (-c * e + a * f) / det;
	const r = Math.hypot(x1 - cx, y1 - cy);
	return { cx, cy, r };
}

function fitCircleLeastSquares(points) {
	// Solve for A,B,C in x^2 + y^2 = A x + B y + C (least squares)
	let sxx = 0;
	let syy = 0;
	let sxy = 0;
	let sx = 0;
	let sy = 0;
	let sxz = 0;
	let syz = 0;
	let sz = 0;

	for (const p of points) {
		const x = p.x;
		const y = p.y;
		const z = x * x + y * y;
		sxx += x * x;
		syy += y * y;
		sxy += x * y;
		sx += x;
		sy += y;
		sxz += x * z;
		syz += y * z;
		sz += z;
	}

	const n = points.length;
	const M = [
		[sxx, sxy, sx],
		[sxy, syy, sy],
		[sx,  sy,  n]
	];
	const v = [sxz, syz, sz];
	const sol = solve3x3(M, v);
	if (!sol) return null;

	const A = sol[0];
	const B = sol[1];
	const C = sol[2];
	const cx = A / 2;
	const cy = B / 2;
	const r2 = (A * A + B * B) / 4 + C;
	if (r2 <= 0) return null;
	const r = Math.sqrt(r2);
	if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r)) return null;
	return { cx, cy, r };
}

function solve3x3(M, v) {
	// Gaussian elimination with partial pivoting
	const A = [
		[M[0].slice(), [v[0]]],
		[M[1].slice(), [v[1]]],
		[M[2].slice(), [v[2]]]
	];

	for (let col = 0; col < 3; col++) {
		let pivotRow = col;
		let pivotVal = Math.abs(A[col][0][col]);
		for (let r = col + 1; r < 3; r++) {
			const val = Math.abs(A[r][0][col]);
			if (val > pivotVal) {
				pivotVal = val;
				pivotRow = r;
			}
		}
		if (pivotVal < 1e-9) return null;
		if (pivotRow !== col) {
			const tmp = A[col];
			A[col] = A[pivotRow];
			A[pivotRow] = tmp;
		}

		const pivot = A[col][0][col];
		for (let c = col; c < 3; c++) A[col][0][c] /= pivot;
		A[col][1][0] /= pivot;

		for (let r = 0; r < 3; r++) {
			if (r === col) continue;
			const factor = A[r][0][col];
			for (let c = col; c < 3; c++) A[r][0][c] -= factor * A[col][0][c];
			A[r][1][0] -= factor * A[col][1][0];
		}
	}

	return [A[0][1][0], A[1][1][0], A[2][1][0]];
}

function angleCoverage(points, cx, cy) {
	if (!points || points.length < 3) return 0;
	const angles = [];
	for (const p of points) {
		angles.push(Math.atan2(p.y - cy, p.x - cx));
	}
	angles.sort((a, b) => a - b);
	let maxGap = 0;
	for (let i = 1; i < angles.length; i++) {
		maxGap = Math.max(maxGap, angles[i] - angles[i - 1]);
	}
	maxGap = Math.max(maxGap, (angles[0] + Math.PI * 2) - angles[angles.length - 1]);
	return Math.PI * 2 - maxGap;
}

function circleErrorStats(points, cx, cy, r) {
	let sumAbs = 0;
	let sum = 0;
	let sum2 = 0;
	for (const p of points) {
		const d = Math.hypot(p.x - cx, p.y - cy);
		const err = d - r;
		sumAbs += Math.abs(err);
		sum += err;
		sum2 += err * err;
	}
	const n = points.length;
	const mean = sum / n;
	const variance = Math.max(0, sum2 / n - mean * mean);
	return { meanAbs: sumAbs / n, std: Math.sqrt(variance) };
}

function generateCirclePoints(cx, cy, r, count) {
	const pts = [];
	for (let i = 0; i <= count; i++) {
		const t = (i / count) * Math.PI * 2;
		pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r, pressure: 0.5 });
	}
	return pts;
}

function clamp01(x) {
	return Math.max(0, Math.min(1, x));
}

function clampInt(value, min, max) {
	const v = parseInt(value, 10);
	if (!Number.isFinite(v)) return min;
	return Math.max(min, Math.min(max, v));
}

// ============ Keyboard Shortcuts ============
function setupKeyboardShortcuts() {
	document.addEventListener('keydown', (e) => {
		// Ignore if typing in input
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

		// Escape: clear selection
		if (e.key === 'Escape') {
			if (selectedStrokes.length > 0 || isSelecting) {
				clearSelection();
				return;
			}
		}

		// Delete/Backspace: delete selected strokes
		if (e.key === 'Delete' || e.key === 'Backspace') {
			if (selectedStrokes.length > 0) {
				e.preventDefault();
				deleteSelectedStrokes();
				return;
			}
		}

		// Copy: Ctrl+C
		if (e.ctrlKey && e.key === 'c') {
			if (selectedStrokes.length > 0) {
				e.preventDefault();
				copySelectedStrokes();
				return;
			}
		}

		// Paste: Ctrl+V
		if (e.ctrlKey && e.key === 'v') {
			if (clipboardStrokes.length > 0) {
				e.preventDefault();
				pasteStrokes();
				return;
			}
		}

		// Undo: Ctrl+Z
		if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			undo();
		}

		// Redo: Ctrl+Shift+Z or Ctrl+Y
		if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
			e.preventDefault();
			redo();
		}

		// Tools
		if (e.key === 'p' || e.key === 'P') setTool(TOOLS.PEN);
		if (e.key === 'e' || e.key === 'E') setTool(TOOLS.ERASER);
		if ((e.key === 's' || e.key === 'S') && !e.ctrlKey) setTool(TOOLS.SELECT);

		// Smart Shapes toggle: G
		if (e.key === 'g' || e.key === 'G') {
			smartShapeSettings.enabled = !smartShapeSettings.enabled;
			updateSmartShapeUI();
			showToast(smartShapeSettings.enabled ? t('toastSmartShapesOn') : t('toastSmartShapesOff'));
		}

		// Save: Ctrl+S
		if (e.ctrlKey && e.key === 's') {
			e.preventDefault();
			saveImage();
		}
	});
}

// ============ Hero Section ============
function hideHeroSection() {
	if (heroSection && !heroSection.classList.contains('hidden')) {
		heroSection.classList.add('hidden');
	}
}

function showHeroSection() {
	if (heroSection) {
		heroSection.classList.remove('hidden');
	}
}

// ============ Toast Notifications ============
function showToast(message, type = '') {
	toast.textContent = message;
	toast.className = 'toast show ' + type;

	setTimeout(() => {
		toast.classList.remove('show');
	}, 2000);
}

// ============ Start ============
document.addEventListener('DOMContentLoaded', init);
