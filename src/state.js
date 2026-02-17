// OpenMathBoard — Centralized state management

// ============ Constants ============
export const TOOLS = {
	PEN: 'pen',
	ERASER: 'eraser',
	SELECT: 'select'
};

export const DEFAULT_COLOR = '#000000';
export const DEFAULT_STROKE_WIDTH = 4;

// Smart shapes
export const SMART_SHAPE_MIN_POINTS = 10;
export const SMART_SHAPE_DEFAULTS = {
	enabled: true,
	sensitivity: 50
};
export const SMART_SHAPE_STORAGE_KEY = 'openmathboard.smartShapes.v1';
export const SMART_SHAPE_DEBUG_THROTTLE_MS = 250;

// ============ State ============
let currentTool = TOOLS.PEN;
let currentColor = DEFAULT_COLOR;
let currentStrokeWidth = DEFAULT_STROKE_WIDTH;
let currentDash = false;
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
let selectedStrokes = [];
let selectionRect = null;
let isSelecting = false;
let isDraggingSelection = false;
let dragStartPos = null;
let clipboardStrokes = [];

// Anchor drag state
let isDraggingAnchor = false;
let draggingAnchorInfo = null; // { strokeIdx, anchorId }

// Smart shape state
let smartShapeSettings = { ...SMART_SHAPE_DEFAULTS };
let smartShapeDebugEnabled = false;
let lastSmartShapeDebugAt = 0;
let lastSmartShapeDebugKey = '';

// Camera state (v2 infinite canvas)
let camera = { x: 0, y: 0, zoom: 1 };

// DOM refs
let domRefs = {};

// ============ Getters ============
export function getCurrentTool() { return currentTool; }
export function getCurrentColor() { return currentColor; }
export function getCurrentStrokeWidth() { return currentStrokeWidth; }
export function getCurrentDash() { return currentDash; }
export function getIsDrawing() { return isDrawing; }
export function getCurrentStroke() { return currentStroke; }
export function getStrokes() { return strokes; }
export function getHistoryStack() { return historyStack; }
export function getHistoryIndex() { return historyIndex; }
export function getCanvas() { return canvas; }
export function getCtx() { return ctx; }
export function getCanvasRect() { return canvasRect; }
export function getSelectedStrokes() { return selectedStrokes; }
export function getSelectionRect() { return selectionRect; }
export function getIsSelecting() { return isSelecting; }
export function getIsDraggingSelection() { return isDraggingSelection; }
export function getDragStartPos() { return dragStartPos; }
export function getClipboardStrokes() { return clipboardStrokes; }
export function getIsDraggingAnchor() { return isDraggingAnchor; }
export function getDraggingAnchorInfo() { return draggingAnchorInfo; }
export function getSmartShapeSettings() { return smartShapeSettings; }
export function getSmartShapeDebugEnabled() { return smartShapeDebugEnabled; }
export function getLastSmartShapeDebugAt() { return lastSmartShapeDebugAt; }
export function getLastSmartShapeDebugKey() { return lastSmartShapeDebugKey; }
export function getCamera() { return camera; }
export function getDomRefs() { return domRefs; }

// ============ Setters ============
export function setCurrentTool(v) { currentTool = v; }
export function setCurrentColor(v) { currentColor = v; }
export function setCurrentStrokeWidth(v) { currentStrokeWidth = v; }
export function setCurrentDash(v) { currentDash = v; }
export function setIsDrawing(v) { isDrawing = v; }
export function setCurrentStroke(v) { currentStroke = v; }
export function setStrokes(v) { strokes = v; }
export function setHistoryStack(v) { historyStack = v; }
export function setHistoryIndex(v) { historyIndex = v; }
export function setCanvas(v) { canvas = v; }
export function setCtx(v) { ctx = v; }
export function setCanvasRect(v) { canvasRect = v; }
export function setSelectedStrokes(v) { selectedStrokes = v; }
export function setSelectionRect(v) { selectionRect = v; }
export function setIsSelecting(v) { isSelecting = v; }
export function setIsDraggingSelection(v) { isDraggingSelection = v; }
export function setDragStartPos(v) { dragStartPos = v; }
export function setClipboardStrokes(v) { clipboardStrokes = v; }
export function setIsDraggingAnchor(v) { isDraggingAnchor = v; }
export function setDraggingAnchorInfo(v) { draggingAnchorInfo = v; }
export function setSmartShapeSettings(v) { smartShapeSettings = v; }
export function setSmartShapeDebugEnabled(v) { smartShapeDebugEnabled = v; }
export function setLastSmartShapeDebugAt(v) { lastSmartShapeDebugAt = v; }
export function setLastSmartShapeDebugKey(v) { lastSmartShapeDebugKey = v; }
export function setCamera(v) { camera = v; }
export function setDomRefs(v) { domRefs = v; }

// ============ Helpers ============
export function updateCamera(partial) {
	camera = { ...camera, ...partial };
}
