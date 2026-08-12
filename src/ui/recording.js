// OpenMathBoard — course recording (visible board + microphone + optional face camera)
import {
	getCanvas, getCanvasRect, getCamera, getCurrentStroke, getDomRefs
} from '../core/state.js';
import { drawStroke } from '../canvas/renderer.js';
import { closeShapePaletteWithUI } from './palette.js';
import { hidePropertyPanel, updatePropertyPanel } from './property-panel.js';
import { t } from '../i18n/i18n.js';
import { makeBottomSheetDismissible } from './bottom-sheet.js';
import { trackEvent } from '../core/telemetry.js';

const MIME_CANDIDATES_WITH_AUDIO = [
	'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
	'video/mp4',
	'video/webm;codecs=vp8,opus',
	'video/webm'
];
const MIME_CANDIDATES_VIDEO_ONLY = [
	'video/mp4;codecs=avc1.42E01E',
	'video/mp4',
	'video/webm;codecs=vp8',
	'video/webm'
];
const FACE_SIZES = { small: 0.18, medium: 0.25, large: 0.32 };
const FACE_CORNERS = {
	'top-left': { x: 0, y: 0 }, 'top-right': { x: 1, y: 0 },
	'bottom-left': { x: 0, y: 1 }, 'bottom-right': { x: 1, y: 1 }
};

let menu;
let outputCanvas;
let outputCtx;
let facePreview;
let recorder = null;
let mediaStream = null;
let cameraPreviewStream = null;
let cameraRequest = null;
let recordingStream = null;
let chunks = [];
let compositorFrame = null;
let timerId = null;
let startedAt = 0;
let pausedAt = null;
let totalPausedMs = 0;
let discardRequested = false;
let resultUrl = null;
let facePosition = { ...FACE_CORNERS['bottom-right'] };
let faceCorner = 'bottom-right';
let faceSize = 'medium';
let faceAspect = matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
let faceAspectManual = false;
let draggingFace = false;
let faceDragOffset = { x: 0, y: 0 };

function elements() {
	return {
		buttons: [document.getElementById('recordBtn'), document.getElementById('recordBtnMobile')].filter(Boolean),
		toolbarStopButtons: [
			document.getElementById('recordStopToolbarBtn'),
			document.getElementById('recordStopToolbarBtnMobile')
		].filter(Boolean),
		menuTimer: document.getElementById('recordingMenuTimer'),
		micToggle: document.getElementById('recordMicToggle'),
		faceToggle: document.getElementById('recordFaceToggle'),
		faceSettings: document.getElementById('recordFaceSettings'),
		livePreviewToggle: document.getElementById('recordLivePreviewToggle'),
		startBtn: document.getElementById('recordStartBtn'),
		activeControls: document.getElementById('recordActiveControls'),
		pauseBtn: document.getElementById('recordPauseBtn'),
		stopBtn: document.getElementById('recordStopBtn'),
		discardBtn: document.getElementById('recordDiscardBtn'),
		result: document.getElementById('recordResult'),
		resultPreview: document.getElementById('recordResultPreview'),
		resultDiscardBtn: document.getElementById('recordResultDiscardBtn'),
		download: document.getElementById('recordDownloadLink'),
		status: document.getElementById('recordingStatus')
	};
}

function closeOtherMenus() {
	closeShapePaletteWithUI();
	hidePropertyPanel();
	document.getElementById('penStylePanelMobile')?.classList.remove('show');
	document.getElementById('menuDropdown')?.classList.remove('show');
	document.querySelectorAll('.color-dropdown, .stroke-dropdown').forEach(el => el.classList.remove('show'));
}

function toggleMenu() {
	const opening = !menu.classList.contains('show');
	if (opening) closeOtherMenus();
	menu.classList.toggle('show', opening);
	requestAnimationFrame(applyFacePreviewPosition);
	if (!opening && !recorder) updatePropertyPanel();
}

function setStatus(message, error = false) {
	const { status } = elements();
	status.textContent = message;
	status.classList.toggle('error', error);
}

function updateFaceSettings() {
	const { faceToggle, faceSettings } = elements();
	faceSettings.hidden = !faceToggle.checked;
	facePreview.style.width = `${FACE_SIZES[faceSize] * 100}%`;
	menu.querySelectorAll('[data-corner]').forEach(btn => btn.classList.toggle('active', btn.dataset.corner === faceCorner));
	menu.querySelectorAll('[data-size]').forEach(btn => btn.classList.toggle('active', btn.dataset.size === faceSize));
	menu.querySelectorAll('[data-aspect]').forEach(btn => btn.classList.toggle('active', btn.dataset.aspect === faceAspect));
	facePreview.classList.toggle('face-landscape', faceAspect === 'landscape');
	updateLivePreview();
	applyFacePreviewPosition();
}

function updateLivePreview() {
	const enabled = elements().livePreviewToggle.checked;
	facePreview.classList.toggle('live-preview-off', !enabled);
}

async function startCameraPreview() {
	if (cameraPreviewStream?.getVideoTracks().some(track => track.readyState === 'live')) return cameraPreviewStream;
	if (cameraRequest) return cameraRequest;
	cameraRequest = (async () => {
		const getUserMedia = window.__OMB_GET_USER_MEDIA || navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
		const portrait = faceAspect === 'portrait';
		const stream = await getUserMedia({
			audio: false,
			video: {
				facingMode: 'user',
				width: { ideal: portrait ? 480 : 640 },
				height: { ideal: portrait ? 640 : 480 },
				aspectRatio: { ideal: portrait ? 3 / 4 : 4 / 3 }
			}
		});
		if (!stream.getVideoTracks().length) throw new Error(t('recordCameraUnavailable'));
		cameraPreviewStream = stream;
		facePreview.srcObject = stream;
		// Position while invisible before play() yields to Safari. Revealing first
		// lets one frame paint at the absolute element's fallback top-left origin.
		facePreview.style.visibility = 'hidden';
		facePreview.hidden = false;
		updateLivePreview();
		applyFacePreviewPosition();
		await facePreview.play();
		applyFacePreviewPosition();
		await new Promise(resolve => requestAnimationFrame(resolve));
		facePreview.style.visibility = '';
		return stream;
	})();
	try {
		return await cameraRequest;
	} finally {
		cameraRequest = null;
	}
}

function stopCameraPreview() {
	cameraPreviewStream?.getTracks().forEach(track => track.stop());
	cameraPreviewStream = null;
	facePreview.srcObject = null;
	facePreview.hidden = true;
	facePreview.style.visibility = '';
}

async function handleFaceToggle() {
	const { faceToggle } = elements();
	updateFaceSettings();
	if (!faceToggle.checked) {
		stopCameraPreview();
		return;
	}
	if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
		faceToggle.checked = false;
		updateFaceSettings();
		setStatus(t('recordHttpsRequired'), true);
		return;
	}
	setStatus(t('recordCameraRequesting'));
	try {
		await startCameraPreview();
		setStatus('');
	} catch (error) {
		faceToggle.checked = false;
		updateFaceSettings();
		stopCameraPreview();
		setStatus(`${t('recordCameraUnavailable')} ${error?.message || ''}`, true);
	}
}

function setRecordingUi(recording) {
	const {
		buttons, toolbarStopButtons, micToggle, faceToggle,
		startBtn, activeControls, result
	} = elements();
	buttons.forEach(button => button.classList.toggle('recording', recording));
	document.body.classList.toggle('recording-active', recording);
	toolbarStopButtons.forEach(button => { button.hidden = !recording; });
	// An acquired microphone can be muted/unmuted during recording. If the
	// session started without one, enabling it would require a new permission
	// flow and cannot be added to the active MediaRecorder stream safely.
	micToggle.disabled = recording && !mediaStream?.getAudioTracks().length;
	faceToggle.disabled = recording;
	startBtn.hidden = recording;
	activeControls.hidden = !recording;
	if (recording) result.hidden = true;
}

function updateTimer() {
	const now = pausedAt || Date.now();
	const elapsed = Math.floor((now - startedAt - totalPausedMs) / 1000);
	const value = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
	const { buttons, menuTimer } = elements();
	buttons.forEach(button => {
		const time = button.querySelector('.record-time');
		if (time) time.textContent = value;
	});
	menuTimer.textContent = value;
}

function chooseRecorder(stream) {
	const candidates = stream.getAudioTracks().length
		? MIME_CANDIDATES_WITH_AUDIO
		: MIME_CANDIDATES_VIDEO_ONLY;
	for (const mimeType of candidates) {
		if (!MediaRecorder.isTypeSupported(mimeType)) continue;
		try {
			return new MediaRecorder(stream, {
				mimeType, videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 96_000
			});
		} catch { /* Try the next Safari-supported format. */ }
	}
	return new MediaRecorder(stream);
}

function roundedRectPath(ctx, x, y, width, height, radius) {
	const r = Math.min(radius, width / 2, height / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + r);
	ctx.lineTo(x + width, y + height - r);
	ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
	ctx.lineTo(x + r, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - r);
	ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function drawVideoCover(ctx, video, width, height) {
	const sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
	if (!sourceWidth || !sourceHeight) return;
	const sourceRatio = sourceWidth / sourceHeight;
	const targetRatio = width / height;
	let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
	if (sourceRatio > targetRatio) {
		sw = sourceHeight * targetRatio; sx = (sourceWidth - sw) / 2;
	} else {
		sh = sourceWidth / targetRatio; sy = (sourceHeight - sh) / 2;
	}
	ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
}

function drawImportedImages(scaleX, scaleY) {
	const refs = getDomRefs();
	if (!refs.imagesLayer) return;
	for (const wrapper of refs.imagesLayer.querySelectorAll('.imported-image')) {
		const image = wrapper.querySelector('img');
		if (!image?.complete) continue;
		outputCtx.drawImage(
			image, wrapper.offsetLeft * scaleX, wrapper.offsetTop * scaleY,
			wrapper.offsetWidth * scaleX, image.offsetHeight * scaleY
		);
	}
}

function drawFace() {
	if (facePreview.hidden || facePreview.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
	const baseWidth = Math.round(outputCanvas.width * FACE_SIZES[faceSize]);
	const width = faceAspect === 'portrait' ? Math.round(baseWidth * 0.75) : baseWidth;
	const height = faceAspect === 'portrait' ? Math.round(width * 4 / 3) : Math.round(width * 3 / 4);
	const margin = Math.round(outputCanvas.width * 0.018);
	const x = margin + facePosition.x * (outputCanvas.width - width - margin * 2);
	const y = margin + facePosition.y * (outputCanvas.height - height - margin * 2);
	outputCtx.save();
	roundedRectPath(outputCtx, x, y, width, height, 22);
	outputCtx.clip();
	outputCtx.translate(x + width, y);
	outputCtx.scale(-1, 1);
	drawVideoCover(outputCtx, facePreview, width, height);
	outputCtx.restore();
	outputCtx.save();
	roundedRectPath(outputCtx, x, y, width, height, 22);
	outputCtx.strokeStyle = '#ffffff'; outputCtx.lineWidth = 5; outputCtx.stroke();
	outputCtx.restore();
}

function compositeFrame() {
	const rect = getCanvasRect();
	const scene = getCanvas();
	if (!rect || !scene) return;
	const scaleX = outputCanvas.width / rect.width;
	const scaleY = outputCanvas.height / rect.height;
	outputCtx.fillStyle = '#ffffff';
	outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
	drawImportedImages(scaleX, scaleY);
	outputCtx.drawImage(scene, 0, 0, outputCanvas.width, outputCanvas.height);

	const currentStroke = getCurrentStroke();
	if (currentStroke) {
		const camera = getCamera();
		outputCtx.save();
		outputCtx.scale(scaleX, scaleY);
		outputCtx.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
		outputCtx.scale(camera.zoom, camera.zoom);
		drawStroke(outputCtx, currentStroke, camera);
		outputCtx.restore();
	}
	drawFace();
	compositorFrame = requestAnimationFrame(compositeFrame);
}

function configureOutputCanvas() {
	const rect = getCanvasRect();
	const maxDimension = 1280;
	const scale = Math.min(1, maxDimension / Math.max(rect.width, rect.height));
	outputCanvas.width = Math.max(2, Math.round(rect.width * scale / 2) * 2);
	outputCanvas.height = Math.max(2, Math.round(rect.height * scale / 2) * 2);
}

async function requestMedia() {
	const { micToggle, faceToggle } = elements();
	const tracks = [];
	const failures = [];
	if (faceToggle.checked) {
		try {
			const camera = await startCameraPreview();
			tracks.push(...camera.getVideoTracks());
		} catch {
			faceToggle.checked = false;
			failures.push(t('recordCameraUnavailable'));
			updateFaceSettings();
			stopCameraPreview();
		}
	}
	if (micToggle.checked) {
		try {
			const getUserMedia = window.__OMB_GET_USER_MEDIA || navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
			const mic = await getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false
			});
			tracks.push(...mic.getAudioTracks());
		} catch {
			micToggle.checked = false;
			failures.push(t('recordMicUnavailable'));
		}
	}
	if (tracks.length === 0 && failures.length > 0) throw new Error(failures.join(' '));
	return { stream: new MediaStream(tracks), warning: failures.join(' ') };
}

async function startRecording() {
	if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia ||
		typeof MediaRecorder === 'undefined' || typeof outputCanvas.captureStream !== 'function') {
		setStatus(t('recordHttpsRequired'), true);
		return;
	}
	const { faceToggle, startBtn } = elements();
	startBtn.disabled = true;
	setStatus(t('recordRequesting'));
	try {
		const media = await requestMedia();
		mediaStream = media.stream;
		if (faceToggle.checked) applyFacePreviewPosition();
		configureOutputCanvas();
		compositeFrame();
		const canvasStream = outputCanvas.captureStream(30);
		recordingStream = new MediaStream([...canvasStream.getVideoTracks(), ...mediaStream.getAudioTracks()]);
		recorder = chooseRecorder(recordingStream);
		chunks = [];
		recorder.addEventListener('dataavailable', event => { if (event.data?.size) chunks.push(event.data); });
		recorder.addEventListener('stop', finishRecording, { once: true });
		recorder.addEventListener('error', event => failRecording(event.error || new Error('MediaRecorder error')), { once: true });
		recorder.start(1000);
		startedAt = Date.now();
		pausedAt = null;
		totalPausedMs = 0;
		discardRequested = false;
		setRecordingUi(true);
		updateTimer();
		timerId = setInterval(updateTimer, 1000);
		setStatus(media.warning || t('recordRecording'));
		// Permission is resolved and recording is live; return the full canvas to
		// the teacher. The timer button reopens controls when needed.
		menu.classList.remove('show');
		requestAnimationFrame(applyFacePreviewPosition);
	} catch (error) {
		failRecording(error);
	} finally {
		startBtn.disabled = false;
	}
}

function togglePause() {
	if (!recorder) return;
	const { pauseBtn, buttons } = elements();
	if (recorder.state === 'recording') {
		recorder.pause();
		pausedAt = Date.now();
		clearInterval(timerId); timerId = null;
		pauseBtn.textContent = t('recordResume');
		buttons.forEach(button => button.classList.add('paused'));
		setStatus(t('recordPaused'));
	} else if (recorder.state === 'paused') {
		recorder.resume();
		totalPausedMs += Date.now() - pausedAt;
		pausedAt = null;
		pauseBtn.textContent = t('recordPause');
		buttons.forEach(button => button.classList.remove('paused'));
		updateTimer();
		timerId = setInterval(updateTimer, 1000);
		setStatus(t('recordRecording'));
		menu.classList.remove('show');
		requestAnimationFrame(applyFacePreviewPosition);
	}
}

function stopRecording() {
	if (!recorder || recorder.state === 'inactive') return;
	elements().stopBtn.disabled = true;
	setStatus(t('recordPreparing'));
	recorder.stop();
}

function discardRecording() {
	if (!recorder || !confirm(t('recordDiscardConfirm'))) return;
	discardRequested = true;
	elements().discardBtn.disabled = true;
	recorder.stop();
}

function acceptResultDownload() {
	// Let Safari start consuming the Blob URL before returning to idle state.
	setTimeout(() => {
		const { result, startBtn } = elements();
		result.hidden = true;
		startBtn.hidden = false;
		menu.classList.remove('show');
	}, 0);
}

function discardResult() {
	if (!resultUrl || !confirm(t('recordDiscardConfirm'))) return;
	const { result, resultPreview, download, startBtn } = elements();
	resultPreview.pause();
	resultPreview.removeAttribute('src');
	resultPreview.load();
	URL.revokeObjectURL(resultUrl);
	resultUrl = null;
	download.removeAttribute('href');
	result.hidden = true;
	startBtn.hidden = false;
	setStatus(t('recordDiscarded'));
	menu.classList.remove('show');
}

function releaseMedia() {
	if (compositorFrame !== null) cancelAnimationFrame(compositorFrame);
	compositorFrame = null;
	clearInterval(timerId); timerId = null;
	recordingStream?.getTracks().forEach(track => track.stop());
	mediaStream?.getAudioTracks().forEach(track => track.stop());
	recordingStream = null; mediaStream = null;
	if (!elements().faceToggle.checked) stopCameraPreview();
}

function failRecording(error) {
	trackEvent('recording_failed', { errorType: error?.name || 'Error' }, 'error');
	releaseMedia();
	setRecordingUi(false);
	elements().stopBtn.disabled = false;
	setStatus(`${t('recordFailed')}: ${error?.message || error}`, true);
	recorder = null;
}

function finishRecording() {
	const {
		download, result, resultPreview, stopBtn, discardBtn,
		pauseBtn, buttons, menuTimer
	} = elements();
	if (discardRequested) {
		releaseMedia();
		setRecordingUi(false);
		stopBtn.disabled = false;
		discardBtn.disabled = false;
		pauseBtn.textContent = t('recordPause');
		buttons.forEach(button => {
			button.classList.remove('paused');
			button.querySelector('.record-time').textContent = '';
		});
		menuTimer.textContent = '';
		result.hidden = !resultUrl;
		setStatus(t('recordDiscarded'));
		recorder = null; chunks = []; discardRequested = false;
		menu.classList.remove('show');
		requestAnimationFrame(applyFacePreviewPosition);
		return;
	}
	const type = recorder?.mimeType || chunks[0]?.type || 'video/webm';
	const blob = new Blob(chunks, { type });
	releaseMedia();
	setRecordingUi(false);
	if (resultUrl) URL.revokeObjectURL(resultUrl);
	resultUrl = URL.createObjectURL(blob);
	resultPreview.src = resultUrl;
	resultPreview.currentTime = 0;
	download.href = resultUrl;
	elements().startBtn.hidden = true;
	download.download = `openmathboard-${new Date().toISOString().replace(/[:.]/g, '-')}.${type.includes('mp4') ? 'mp4' : 'webm'}`;
	result.hidden = false;
	download.hidden = false;
	stopBtn.disabled = false;
	discardBtn.disabled = false;
	pauseBtn.textContent = t('recordPause');
	buttons.forEach(button => {
		button.classList.remove('paused');
		button.querySelector('.record-time').textContent = '';
	});
	menuTimer.textContent = '';
	setStatus(t('recordReady'));
	recorder = null; chunks = [];
	menu.classList.add('show');
	requestAnimationFrame(applyFacePreviewPosition);
}

function getFacePlacementBounds() {
	const container = getDomRefs().canvasContainer;
	const containerRect = container.getBoundingClientRect();
	const padding = 12;
	let usableHeight = container.clientHeight;
	if (menu.classList.contains('show')) {
		const menuRect = menu.getBoundingClientRect();
		// The bottom sheet is UI, not drawable canvas. Keep bottom-corner camera
		// placement inside the visible canvas area above it.
		usableHeight = Math.min(usableHeight, menuRect.top - containerRect.top - 8);
	}
	return {
		container,
		containerRect,
		padding,
		maxLeft: Math.max(1, container.clientWidth - facePreview.offsetWidth - padding * 2),
		maxTop: Math.max(1, usableHeight - facePreview.offsetHeight - padding * 2)
	};
}

function applyFacePreviewPosition() {
	if (!facePreview || facePreview.hidden) return;
	const { padding, maxLeft, maxTop } = getFacePlacementBounds();
	facePreview.style.left = `${padding + facePosition.x * maxLeft}px`;
	facePreview.style.top = `${padding + facePosition.y * maxTop}px`;
}

function startFaceDrag(event) {
	if (facePreview.hidden) return;
	draggingFace = true;
	facePreview.setPointerCapture(event.pointerId);
	const rect = facePreview.getBoundingClientRect();
	faceDragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
	event.preventDefault();
}

function moveFaceDrag(event) {
	if (!draggingFace) return;
	const { containerRect, padding, maxLeft, maxTop } = getFacePlacementBounds();
	const left = Math.max(padding, Math.min(event.clientX - containerRect.left - faceDragOffset.x, padding + maxLeft));
	const top = Math.max(padding, Math.min(event.clientY - containerRect.top - faceDragOffset.y, padding + maxTop));
	facePosition = { x: (left - padding) / maxLeft, y: (top - padding) / maxTop };
	applyFacePreviewPosition();
	event.preventDefault();
}

function stopFaceDrag() {
	if (!draggingFace) return;
	draggingFace = false;
	facePosition = { x: facePosition.x < 0.5 ? 0 : 1, y: facePosition.y < 0.5 ? 0 : 1 };
	faceCorner = Object.keys(FACE_CORNERS).find(key => FACE_CORNERS[key].x === facePosition.x && FACE_CORNERS[key].y === facePosition.y);
	updateFaceSettings();
}

export function initRecording() {
	menu = document.getElementById('recordingMenu');
	outputCanvas = document.getElementById('recordingOutputCanvas');
	outputCtx = outputCanvas.getContext('2d');
	facePreview = document.getElementById('recordingFacePreview');
	makeBottomSheetDismissible(menu, () => {
		menu.classList.remove('show');
		requestAnimationFrame(applyFacePreviewPosition);
		if (!recorder) updatePropertyPanel();
	});
	const {
		buttons, toolbarStopButtons, faceToggle, livePreviewToggle,
		startBtn, pauseBtn, stopBtn, discardBtn, resultDiscardBtn, download
	} = elements();
	buttons.forEach(button => button.addEventListener('click', event => {
		event.stopPropagation();
		toggleMenu();
	}));
	toolbarStopButtons.forEach(button => button.addEventListener('click', event => {
		event.stopPropagation();
		stopRecording();
	}));
	faceToggle.addEventListener('change', handleFaceToggle);
	livePreviewToggle.addEventListener('change', updateLivePreview);
	elements().micToggle.addEventListener('change', event => {
		if (!recorder) return;
		mediaStream?.getAudioTracks().forEach(track => { track.enabled = event.target.checked; });
	});
	menu.querySelectorAll('[data-corner]').forEach(button => button.addEventListener('click', () => {
		faceCorner = button.dataset.corner; facePosition = { ...FACE_CORNERS[faceCorner] }; updateFaceSettings();
	}));
	menu.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
		faceSize = button.dataset.size; updateFaceSettings();
	}));
	menu.querySelectorAll('[data-aspect]').forEach(button => button.addEventListener('click', () => {
		faceAspect = button.dataset.aspect;
		faceAspectManual = true;
		updateFaceSettings();
	}));
	startBtn.addEventListener('click', startRecording);
	pauseBtn.addEventListener('click', togglePause);
	stopBtn.addEventListener('click', stopRecording);
	discardBtn.addEventListener('click', discardRecording);
	resultDiscardBtn.addEventListener('click', discardResult);
	download.addEventListener('click', acceptResultDownload);
	facePreview.addEventListener('pointerdown', startFaceDrag);
	facePreview.addEventListener('pointermove', moveFaceDrag);
	facePreview.addEventListener('pointerup', stopFaceDrag);
	facePreview.addEventListener('pointercancel', stopFaceDrag);
	window.addEventListener('resize', () => {
		if (!faceAspectManual) {
			faceAspect = matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
			updateFaceSettings();
		} else applyFacePreviewPosition();
	});
	window.addEventListener('beforeunload', event => {
		if (recorder && recorder.state !== 'inactive') {
			event.preventDefault();
			event.returnValue = '';
		}
	});
	window.addEventListener('pagehide', () => {
		releaseMedia();
		stopCameraPreview();
	});
	document.addEventListener('click', event => {
		if (!menu.contains(event.target) && !event.target.closest('.record-toolbar-btn') && menu.classList.contains('show')) {
			menu.classList.remove('show');
			requestAnimationFrame(applyFacePreviewPosition);
			if (!recorder) updatePropertyPanel();
		}
	});
	updateFaceSettings();
}

export function isRecording() {
	return !!recorder && recorder.state !== 'inactive';
}
