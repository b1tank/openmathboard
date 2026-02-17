// OpenMathBoard — "Draw then choose" conversion popup
import { getStrokes, getCamera } from './state.js';
import {
	detectLine, detectCircle, detectParabola,
	getSmartShapeParams, simplifyStrokePoints, getBounds, generateCirclePoints
} from './detection.js';
import { redrawCanvas } from './renderer.js';
import { saveToHistory } from './history.js';
import { t } from './lib/i18n.js';

let popupEl = null;
let popupTimer = null;

export function initConversionPopup() {
	popupEl = document.getElementById('conversionPopup');
}

/**
 * After a freehand stroke ends, detect candidate shapes and show popup
 */
export function showConversionPopup(stroke, screenX, screenY) {
	if (!popupEl || !stroke || !stroke.points || stroke.points.length < 10) return;

	const rawPoints = simplifyStrokePoints(stroke.points, Math.max(1.5, stroke.width * 0.5));
	if (rawPoints.length < 10) return;

	const bounds = getBounds(rawPoints);
	const diag = Math.max(1, Math.hypot(bounds.w, bounds.h));
	if (diag < 12) return;

	// Use fixed moderate sensitivity (50)
	const params = getSmartShapeParams(50);

	const candidates = [];

	const lineResult = detectLine(rawPoints, diag, stroke.width, params);
	if (lineResult && lineResult.score >= params.acceptLine) {
		candidates.push({ type: 'line', score: lineResult.score, data: lineResult });
	}

	const circleResult = detectCircle(rawPoints, diag, stroke.width, params);
	if (circleResult && circleResult.score >= params.acceptCircle) {
		candidates.push({ type: 'circle', score: circleResult.score, data: circleResult });
	}

	const parabolaResult = detectParabola(rawPoints, diag, stroke.width, params);
	if (parabolaResult && parabolaResult.score >= params.acceptParabola) {
		candidates.push({ type: 'parabola', score: parabolaResult.score, data: parabolaResult });
	}

	if (candidates.length === 0) return;

	candidates.sort((a, b) => b.score - a.score);

	// Build popup content
	const shapeLabels = {
		line: t('shapeLine'),
		circle: t('shapeCircle'),
		parabola: t('shapeParabola'),
	};

	const shapeIcons = {
		line: '📏',
		circle: '⭕',
		parabola: '📐',
	};

	popupEl.innerHTML = candidates.map(c =>
		`<button data-shape="${c.type}">${shapeIcons[c.type] || ''} ${shapeLabels[c.type] || c.type}</button>`
	).join('') + `<button data-shape="keep">✏️ ${t('convertKeep')}</button>`;

	// Position near stroke end
	popupEl.style.left = Math.min(screenX + 10, window.innerWidth - 200) + 'px';
	popupEl.style.top = Math.max(screenY - 40, 60) + 'px';
	popupEl.classList.add('show');

	// Auto-dismiss after 3s
	clearTimeout(popupTimer);
	popupTimer = setTimeout(() => {
		popupEl.classList.remove('show');
	}, 3000);

	// Handle clicks
	popupEl.onclick = (e) => {
		const btn = e.target.closest('button');
		if (!btn) return;

		const shapeType = btn.dataset.shape;
		if (shapeType && shapeType !== 'keep') {
			convertLastStroke(shapeType, candidates);
		}

		popupEl.classList.remove('show');
		clearTimeout(popupTimer);
	};
}

function convertLastStroke(shapeType, candidates) {
	const strokes = getStrokes();
	if (strokes.length === 0) return;

	const lastIdx = strokes.length - 1;
	const stroke = strokes[lastIdx];
	const candidate = candidates.find(c => c.type === shapeType);
	if (!candidate) return;

	if (shapeType === 'line') {
		const r = candidate.data;
		strokes[lastIdx] = {
			...stroke,
			shape: { type: 'line', x1: r.p1.x, y1: r.p1.y, x2: r.p2.x, y2: r.p2.y },
			points: [r.p1, r.p2]
		};
	} else if (shapeType === 'circle') {
		const r = candidate.data;
		strokes[lastIdx] = {
			...stroke,
			shape: { type: 'circle', cx: r.cx, cy: r.cy, r: r.r },
			points: generateCirclePoints(r.cx, r.cy, r.r, 120)
		};
	} else if (shapeType === 'parabola') {
		const r = candidate.data;
		// Convert old parabola format to new v2 format
		const h = r.mode === 'yOfX' ? r.origin : 0;
		const k = r.mode === 'yOfX' ? r.c : r.origin;
		const a_val = r.a;
		const xMin = r.mode === 'yOfX' ? r.origin + r.tMin : r.c + r.tMin;
		const xMax = r.mode === 'yOfX' ? r.origin + r.tMax : r.c + r.tMax;
		strokes[lastIdx] = {
			...stroke,
			shape: {
				type: 'parabola',
				h, k, a: a_val, xMin, xMax,
				// Keep legacy fields for backward compat
				mode: r.mode, origin: r.origin,
				b: r.b, c: r.c, tMin: r.tMin, tMax: r.tMax
			},
			points: stroke.points
		};
	}

	redrawCanvas();
	saveToHistory();
}

export function hideConversionPopup() {
	if (popupEl) popupEl.classList.remove('show');
	clearTimeout(popupTimer);
}
