// OpenMathBoard — Shape detection algorithms
import {
	SMART_SHAPE_MIN_POINTS, SMART_SHAPE_DEBUG_THROTTLE_MS,
	getSmartShapeSettings, getSmartShapeDebugEnabled,
	getLastSmartShapeDebugAt, setLastSmartShapeDebugAt,
	getLastSmartShapeDebugKey, setLastSmartShapeDebugKey
} from './state.js';

// ============ Public API ============

export function recognizeAndSnapStroke(stroke) {
	if (!stroke || !stroke.points || stroke.points.length < SMART_SHAPE_MIN_POINTS) return stroke;

	const rawPoints = simplifyStrokePoints(stroke.points, Math.max(1.5, stroke.width * 0.5));
	if (rawPoints.length < SMART_SHAPE_MIN_POINTS) return stroke;

	const bounds = getBounds(rawPoints);
	const diag = Math.max(1, Math.hypot(bounds.w, bounds.h));
	if (diag < 12) return stroke;

	const settings = getSmartShapeSettings();
	const params = getSmartShapeParams(settings.sensitivity);

	const candidates = [];

	const lineResult = detectLine(rawPoints, diag, stroke.width, params);
	if (lineResult) candidates.push({ type: 'line', score: lineResult.score, data: lineResult });

	const circleResult = detectCircle(rawPoints, diag, stroke.width, params);
	if (circleResult) candidates.push({ type: 'circle', score: circleResult.score, data: circleResult });

	const parabolaResult = detectParabola(rawPoints, diag, stroke.width, params);
	if (parabolaResult) candidates.push({ type: 'parabola', score: parabolaResult.score, data: parabolaResult });

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
			shape: { type: 'line', x1: r.p1.x, y1: r.p1.y, x2: r.p2.x, y2: r.p2.y },
			points: [r.p1, r.p2]
		};
	}

	if (best.type === 'circle') {
		const r = best.data;
		const points = generateCirclePoints(r.cx, r.cy, r.r, 120);
		return {
			...stroke,
			shape: { type: 'circle', cx: r.cx, cy: r.cy, r: r.r },
			points
		};
	}

	if (best.type === 'parabola') {
		const r = best.data;
		const points = generateParabolaPoints(r, 140);
		return {
			...stroke,
			shape: {
				type: 'parabola', mode: r.mode, origin: r.origin,
				a: r.a, b: r.b, c: r.c, tMin: r.tMin, tMax: r.tMax
			},
			points
		};
	}

	return stroke;
}

// ============ Sensitivity params ============

export function getSmartShapeParams(sensitivity) {
	const s = clamp01((clampInt(sensitivity, 0, 100)) / 100);
	const lerp = (a, b) => a + (b - a) * s;

	return {
		s,
		acceptScore: lerp(0.96, 0.62),
		acceptLine: lerp(0.96, 0.70),
		acceptCircle: lerp(0.96, 0.45),
		acceptParabola: lerp(0.96, 0.42),
		lineRmseTol: lerp(0.018, 0.070),
		lineMaxTol: lerp(0.045, 0.120),
		lineStraightMin: lerp(0.90, 0.65),
		lineInlierMin: lerp(0.82, 0.60),
		lineEpsNorm: lerp(0.010, 0.020),
		circleClosedMax: lerp(0.12, 0.50),
		circleRadialStdTol: lerp(0.08, 0.22),
		circleMeanAbsTol: lerp(0.05, 0.12),
		circleCoverageMin: lerp(5.6, 2.8),
		circleAspectMin: lerp(0.85, 0.25),
		circleInlierMin: lerp(0.82, 0.45),
		circleEpsNorm: lerp(0.012, 0.024),
		parabolaRmseTol: lerp(0.020, 0.180),
		parabolaInlierFrac: lerp(0.85, 0.50),
		parabolaCurvMin: lerp(0.20, 0.02),
		parabolaClosedMax: lerp(0.10, 0.35)
	};
}

// ============ Point utilities ============

export function simplifyStrokePoints(points, minDist) {
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

export function getBounds(points) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const p of points) {
		if (p.x < minX) minX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.x > maxX) maxX = p.x;
		if (p.y > maxY) maxY = p.y;
	}
	return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function pathLength(points) {
	let len = 0;
	for (let i = 1; i < points.length; i++) {
		len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
	}
	return len;
}

export function pointToLineDistance(p, a, b) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const denom = Math.hypot(dx, dy);
	if (denom < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
	return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / denom;
}

export function pointToSegmentDistance(p, a, b) {
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

export function pointToPolylineDistance(p, points) {
	if (!points || points.length < 2) return Infinity;
	let best = Infinity;
	for (let i = 1; i < points.length; i++) {
		const d = pointToSegmentDistance(p, points[i - 1], points[i]);
		if (d < best) best = d;
	}
	return best;
}

// ============ Line detection ============

export function detectLine(points, diag, strokeWidth, params, debug = false) {
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
		for (const pt of points) {
			if (pointToLineDistance(pt, a, b) <= eps) inliers.push(pt);
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

	let sum2 = 0, maxD = 0;
	for (const pt of points) {
		const d = pointToLineDistance(pt, fit.p1, fit.p2);
		sum2 += d * d;
		if (d > maxD) maxD = d;
	}
	const rmse = Math.sqrt(sum2 / points.length);
	const rmseNorm = rmse / diag;
	const maxNorm = maxD / diag;

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

	let meanX = 0, meanY = 0;
	for (const p of points) { meanX += p.x; meanY += p.y; }
	meanX /= points.length;
	meanY /= points.length;

	let sxx = 0, sxy = 0, syy = 0;
	for (const p of points) {
		const dx = p.x - meanX;
		const dy = p.y - meanY;
		sxx += dx * dx;
		sxy += dx * dy;
		syy += dy * dy;
	}

	const trace = sxx + syy;
	const det = sxx * syy - sxy * sxy;
	const temp = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
	const lambda1 = trace / 2 + temp;

	let vx = sxy, vy = lambda1 - sxx;
	if (Math.hypot(vx, vy) < 1e-6) { vx = 1; vy = 0; }
	const vlen = Math.hypot(vx, vy);
	vx /= vlen; vy /= vlen;

	let tMin = Infinity, tMax = -Infinity;
	for (const p of points) {
		const t = (p.x - meanX) * vx + (p.y - meanY) * vy;
		if (t < tMin) tMin = t;
		if (t > tMax) tMax = t;
	}
	const p1 = { x: meanX + vx * tMin, y: meanY + vy * tMin };
	const p2 = { x: meanX + vx * tMax, y: meanY + vy * tMax };
	return { p1, p2 };
}

// ============ Circle detection ============

export function detectCircle(points, diag, strokeWidth, params, debug = false) {
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
		for (const pt of points) {
			const d = Math.abs(Math.hypot(pt.x - c.cx, pt.y - c.cy) - c.r);
			if (d <= eps) inliers.push(pt);
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

	if (inlierRatio < p.circleInlierMin && p.s < 0.70) {
		return debug ? { ...refined, rejected: true, reason: 'inliers', inlierRatio, inlierMin: p.circleInlierMin, usedFallback, score: 0 } : null;
	}

	const coverage = angleCoverage(points, refined.cx, refined.cy);
	if (coverage < p.circleCoverageMin) {
		return debug ? { ...refined, rejected: true, reason: 'coverage', coverage, coverageMin: p.circleCoverageMin, inlierRatio, closedness, closedMax: p.circleClosedMax, usedFallback, score: 0 } : null;
	}

	const stats = circleErrorStats(points, refined.cx, refined.cy, refined.r);
	const radialStdNorm = stats.std / Math.max(1e-6, refined.r);
	const meanAbsNorm = stats.meanAbs / Math.max(1e-6, refined.r);

	const radialStdScore = clamp01(1 - radialStdNorm / p.circleRadialStdTol);
	const meanAbsScore = clamp01(1 - meanAbsNorm / p.circleMeanAbsTol);
	const closedPenaltyDenom = p.circleClosedMax * (closedTooOpen ? 2.6 : 1);
	const closedScore = clamp01(1 - closedness / Math.max(1e-6, closedPenaltyDenom));
	const coverageScore = clamp01((coverage - p.circleCoverageMin) / (Math.PI * 2 - p.circleCoverageMin));
	const inlierScore = clamp01(inlierRatio / Math.max(1e-6, p.circleInlierMin));

	const wClosed = (p.s >= 0.80) ? 0.06 : 0.14;
	let score =
		(0.34 * radialStdScore) +
		(0.24 * meanAbsScore) +
		(0.22 * coverageScore) +
		(0.14 * inlierScore) +
		(wClosed * closedScore);

	if (p.s >= 0.80 && radialStdNorm < p.circleRadialStdTol * 0.55 && meanAbsNorm < p.circleMeanAbsTol * 0.55) {
		score = Math.max(score, 0.72);
	}

	if (score < 0.45 || (closedTooOpen && p.s < 0.80)) {
		const reason = (closedTooOpen && p.s < 0.80) ? 'closedness' : 'score';
		return debug ? {
			...refined, rejected: true, reason, score,
			metrics: { radialStdNorm, meanAbsNorm, closedness, coverage, inlierRatio, radialStdScore, meanAbsScore, coverageScore, inlierScore, closedScore, usedFallback },
			closedMax: p.circleClosedMax
		} : null;
	}

	return {
		...refined, score,
		metrics: { radialStdNorm, meanAbsNorm, closedness, coverage, inlierRatio, radialStdScore, meanAbsScore, coverageScore, inlierScore, closedScore, usedFallback },
		closedMax: p.circleClosedMax
	};
}

// ============ Parabola detection ============

export function detectParabola(points, diag, strokeWidth, params, debug = false) {
	if (points.length < 10) return null;
	const p = params || getSmartShapeParams(50);

	const start = points[0];
	const end = points[points.length - 1];
	const closedness = Math.hypot(end.x - start.x, end.y - start.y) / diag;

	const bounds = getBounds(points);
	const diagLocal = Math.max(1, Math.hypot(bounds.w, bounds.h));
	if (diagLocal < 20) return null;

	const fitY = fitQuadraticTrimmed(points, 'yOfX', p.parabolaInlierFrac);
	const fitX = fitQuadraticTrimmed(points, 'xOfY', p.parabolaInlierFrac);

	const cand = [];
	if (fitY) cand.push(fitY);
	if (fitX) cand.push(fitX);
	if (!cand.length) return debug ? { rejected: true, reason: 'fit-failed', score: 0 } : null;

	cand.sort((a, b) => a.rmseNorm - b.rmseNorm);
	const bestFit = cand[0];

	const range = Math.max(1e-6, (bestFit.tMax - bestFit.tMin));
	const curv = Math.abs(bestFit.a) * range * range / diag;

	const rmseScore = clamp01(1 - bestFit.rmseNorm / p.parabolaRmseTol);
	const curvScore = clamp01((curv - p.parabolaCurvMin) / (0.7 - p.parabolaCurvMin));
	const inlierScore = clamp01(bestFit.inlierRatio / Math.max(1e-6, p.parabolaInlierFrac));

	let score = (0.55 * rmseScore) + (0.25 * curvScore) + (0.20 * inlierScore);
	if (closedness < p.parabolaClosedMax) score *= 0.35;

	if (score < 0.45) {
		return debug ? { ...bestFit, rejected: true, reason: 'score', score, metrics: { rmseNorm: bestFit.rmseNorm, curv, inlierRatio: bestFit.inlierRatio, inlierFrac: p.parabolaInlierFrac, closedness, rmseScore, curvScore, inlierScore } } : null;
	}
	return { ...bestFit, score, metrics: { rmseNorm: bestFit.rmseNorm, curv, inlierRatio: bestFit.inlierRatio, inlierFrac: p.parabolaInlierFrac, closedness, rmseScore, curvScore, inlierScore } };
}

// ============ Math helpers ============

function fitQuadraticTrimmed(points, mode, keepFrac) {
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

	let sum2 = 0, maxAbs = 0;
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

	let tMin = Infinity, tMax = -Infinity;
	for (const pt of allPoints) {
		const t = (mode === 'yOfX') ? (pt.x - origin) : (pt.y - origin);
		if (t < tMin) tMin = t;
		if (t > tMax) tMax = t;
	}

	return {
		mode, origin, a: coeffs.a, b: coeffs.b, c: coeffs.c,
		tMin, tMax, rmseNorm, maxAbs,
		inlierRatio: active.length / allPoints.length
	};
}

function fitQuadraticLeastSquares(points, mode, origin) {
	if (!points || points.length < 3) return null;
	let s4 = 0, s3 = 0, s2 = 0, s1 = 0, s0 = 0, sy2 = 0, sy1 = 0, sy0 = 0;

	for (const pt of points) {
		const t = (mode === 'yOfX') ? (pt.x - origin) : (pt.y - origin);
		const y = (mode === 'yOfX') ? pt.y : pt.x;
		const t2 = t * t;
		const t3 = t2 * t;
		const t4 = t2 * t2;
		s4 += t4; s3 += t3; s2 += t2; s1 += t; s0 += 1;
		sy2 += y * t2; sy1 += y * t; sy0 += y;
	}

	const M = [[s4, s3, s2], [s3, s2, s1], [s2, s1, s0]];
	const v = [sy2, sy1, sy0];
	const sol = solve3x3(M, v);
	if (!sol) return null;
	if (!Number.isFinite(sol[0]) || !Number.isFinite(sol[1]) || !Number.isFinite(sol[2])) return null;
	return { a: sol[0], b: sol[1], c: sol[2] };
}

export function generateParabolaPoints(fit, count) {
	const pts = [];
	const n = Math.max(30, count || 140);
	for (let i = 0; i <= n; i++) {
		const t = fit.tMin + ((fit.tMax - fit.tMin) * (i / n));
		if (fit.mode === 'yOfX') {
			pts.push({ x: fit.origin + t, y: fit.a * t * t + fit.b * t + fit.c, pressure: 0.5 });
		} else {
			pts.push({ x: fit.a * t * t + fit.b * t + fit.c, y: fit.origin + t, pressure: 0.5 });
		}
	}
	return pts;
}

export function generateCirclePoints(cx, cy, r, count) {
	const pts = [];
	for (let i = 0; i <= count; i++) {
		const t = (i / count) * Math.PI * 2;
		pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r, pressure: 0.5 });
	}
	return pts;
}

function circleFrom3(p1, p2, p3) {
	const x1 = p1.x, y1 = p1.y;
	const x2 = p2.x, y2 = p2.y;
	const x3 = p3.x, y3 = p3.y;

	const a = x1 - x2, b = y1 - y2, c = x1 - x3, d = y1 - y3;
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
	let sxx = 0, syy = 0, sxy = 0, sx = 0, sy = 0, sxz = 0, syz = 0, sz = 0;
	for (const p of points) {
		const x = p.x, y = p.y, z = x * x + y * y;
		sxx += x * x; syy += y * y; sxy += x * y;
		sx += x; sy += y;
		sxz += x * z; syz += y * z; sz += z;
	}
	const n = points.length;
	const M = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]];
	const v = [sxz, syz, sz];
	const sol = solve3x3(M, v);
	if (!sol) return null;

	const A = sol[0], B = sol[1], C = sol[2];
	const cx = A / 2, cy = B / 2;
	const r2 = (A * A + B * B) / 4 + C;
	if (r2 <= 0) return null;
	const r = Math.sqrt(r2);
	if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r)) return null;
	return { cx, cy, r };
}

function solve3x3(M, v) {
	const A = [
		[M[0].slice(), [v[0]]],
		[M[1].slice(), [v[1]]],
		[M[2].slice(), [v[2]]]
	];

	for (let col = 0; col < 3; col++) {
		let pivotRow = col, pivotVal = Math.abs(A[col][0][col]);
		for (let r = col + 1; r < 3; r++) {
			const val = Math.abs(A[r][0][col]);
			if (val > pivotVal) { pivotVal = val; pivotRow = r; }
		}
		if (pivotVal < 1e-9) return null;
		if (pivotRow !== col) { const tmp = A[col]; A[col] = A[pivotRow]; A[pivotRow] = tmp; }

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
	for (const p of points) angles.push(Math.atan2(p.y - cy, p.x - cx));
	angles.sort((a, b) => a - b);
	let maxGap = 0;
	for (let i = 1; i < angles.length; i++) maxGap = Math.max(maxGap, angles[i] - angles[i - 1]);
	maxGap = Math.max(maxGap, (angles[0] + Math.PI * 2) - angles[angles.length - 1]);
	return Math.PI * 2 - maxGap;
}

function circleErrorStats(points, cx, cy, r) {
	let sumAbs = 0, sum = 0, sum2 = 0;
	for (const p of points) {
		const d = Math.hypot(p.x - cx, p.y - cy);
		const err = d - r;
		sumAbs += Math.abs(err); sum += err; sum2 += err * err;
	}
	const n = points.length;
	const mean = sum / n;
	const variance = Math.max(0, sum2 / n - mean * mean);
	return { meanAbs: sumAbs / n, std: Math.sqrt(variance) };
}

export function clamp01(x) {
	return Math.max(0, Math.min(1, x));
}

export function clampInt(value, min, max) {
	const v = parseInt(value, 10);
	if (!Number.isFinite(v)) return min;
	return Math.max(min, Math.min(max, v));
}

// ============ Debug logging ============

export function downsamplePoints(points, maxPoints) {
	if (!points || points.length <= maxPoints) return points;
	const out = [];
	const n = points.length;
	for (let i = 0; i < maxPoints; i++) {
		const idx = Math.floor((i / (maxPoints - 1)) * (n - 1));
		out.push(points[idx]);
	}
	return out;
}

export function maybeLogSmartShapeProgress(stroke) {
	const now = Date.now();
	if (now - getLastSmartShapeDebugAt() < SMART_SHAPE_DEBUG_THROTTLE_MS) return;
	if (!stroke || !stroke.points || stroke.points.length < SMART_SHAPE_MIN_POINTS) return;

	const rawPoints = simplifyStrokePoints(stroke.points, Math.max(1.5, stroke.width * 0.5));
	if (rawPoints.length < SMART_SHAPE_MIN_POINTS) return;
	const pts = downsamplePoints(rawPoints, 120);
	const bounds = getBounds(pts);
	const diag = Math.max(1, Math.hypot(bounds.w, bounds.h));
	if (diag < 12) return;

	const settings = getSmartShapeSettings();
	const params = getSmartShapeParams(settings.sensitivity);
	const line = detectLine(pts, diag, stroke.width, params, true);
	const circle = detectCircle(pts, diag, stroke.width, params, true);
	const parabola = detectParabola(pts, diag, stroke.width, params, true);

	const summarize = (name, obj) => {
		if (!obj) return `${name}:n/a`;
		if (obj.rejected) {
			return `${name}:reject(${obj.reason || 'rejected'}) s=${(obj.score ?? 0).toFixed(2)}`;
		}
		return `${name}:ok s=${(obj.score ?? 0).toFixed(2)}`;
	};

	const best = [
		{ t: 'line', o: line },
		{ t: 'circle', o: circle },
		{ t: 'parabola', o: parabola }
	].filter(x => x.o && !x.o.rejected).sort((a, b) => (b.o.score ?? 0) - (a.o.score ?? 0))[0];

	const bestStr = best ? `${best.t} ${(best.o.score ?? 0).toFixed(2)}` : 'none';
	const key = `${settings.sensitivity}|${bestStr}|${(circle && circle.reason) || ''}|${(parabola && parabola.reason) || ''}`;
	if (key === getLastSmartShapeDebugKey() && now - getLastSmartShapeDebugAt() < 1000) return;
	setLastSmartShapeDebugKey(key);
	setLastSmartShapeDebugAt(now);

	console.groupCollapsed(`[SmartShapes] drawing… sens=${settings.sensitivity} accept=${params.acceptScore.toFixed(2)} best=${bestStr}`);
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

export function logSmartShapeFinalDecision(originalStroke, finalStroke) {
	try {
		const rawPoints = simplifyStrokePoints(originalStroke.points, Math.max(1.5, originalStroke.width * 0.5));
		const pts = downsamplePoints(rawPoints, 160);
		const bounds = getBounds(pts);
		const diag = Math.max(1, Math.hypot(bounds.w, bounds.h));
		const settings = getSmartShapeSettings();
		const params = getSmartShapeParams(settings.sensitivity);
		const line = detectLine(pts, diag, originalStroke.width, params, true);
		const circle = detectCircle(pts, diag, originalStroke.width, params, true);
		const parabola = detectParabola(pts, diag, originalStroke.width, params, true);
		const snapped = finalStroke && finalStroke.shape ? finalStroke.shape.type : 'none';

		console.group(`[SmartShapes] pointerup sens=${settings.sensitivity} accept=${params.acceptScore.toFixed(2)} snapped=${snapped}`);
		console.log('line', line);
		console.log('circle', circle);
		console.log('parabola', parabola);
		if (finalStroke && finalStroke.shape) console.log('final.shape', finalStroke.shape);
		console.groupEnd();
	} catch (err) {
		console.warn('[SmartShapes] debug logging failed', err);
	}
}
