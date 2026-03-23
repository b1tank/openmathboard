// OpenMathBoard — Performance instrumentation (dev-only)
// Tracks drawing metrics per stroke. Enable via console: window.__OMB_PERF = true

const perf = {
	samplesReceived: 0,
	samplesCommitted: 0,
	frameDurations: [],
	sceneRedraws: 0,
	cancelCount: 0,
	_frameStart: 0,
};

export function perfReset() {
	perf.samplesReceived = 0;
	perf.samplesCommitted = 0;
	perf.frameDurations = [];
	perf.sceneRedraws = 0;
}

export function perfSampleReceived() {
	if (!window.__OMB_PERF) return;
	perf.samplesReceived++;
}

export function perfSampleCommitted() {
	if (!window.__OMB_PERF) return;
	perf.samplesCommitted++;
}

export function perfFrameStart() {
	if (!window.__OMB_PERF) return;
	perf._frameStart = performance.now();
}

export function perfFrameEnd() {
	if (!window.__OMB_PERF) return;
	if (perf._frameStart > 0) {
		perf.frameDurations.push(performance.now() - perf._frameStart);
		perf._frameStart = 0;
	}
}

export function perfSceneRedraw() {
	if (!window.__OMB_PERF) return;
	perf.sceneRedraws++;
}

export function perfCancel() {
	if (!window.__OMB_PERF) return;
	perf.cancelCount++;
}

export function perfLogSummary() {
	if (!window.__OMB_PERF) return;
	const avg = perf.frameDurations.length > 0
		? (perf.frameDurations.reduce((a, b) => a + b, 0) / perf.frameDurations.length).toFixed(2)
		: 'N/A';
	console.log(
		`[OMB Perf] samples: ${perf.samplesReceived} received, ${perf.samplesCommitted} committed | ` +
		`frames: ${perf.frameDurations.length} (avg ${avg}ms) | ` +
		`scene redraws during draw: ${perf.sceneRedraws} | ` +
		`cancels: ${perf.cancelCount}`
	);
}
