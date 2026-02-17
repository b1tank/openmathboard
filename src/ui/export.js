// OpenMathBoard — Export (copy to clipboard, save image)
import { getStrokes, getCanvasRect, getDomRefs, getCamera } from '../core/state.js';
import { renderFreehand } from '../shapes/freehand.js';
import { t } from '../i18n/i18n.js';
import { showToast } from './toast.js';

export async function copyToClipboard() {
	try {
		if (!window.isSecureContext) {
			showToast(t('toastCopyFailed'), 'error');
			return;
		}

		if (navigator.clipboard && window.ClipboardItem) {
			try {
				await navigator.clipboard.write([
					new ClipboardItem({ 'image/png': getCanvasBlob() })
				]);
				showToast(t('toastCopied'), 'success');
				return;
			} catch (clipboardErr) {
				console.error('Clipboard API failed:', clipboardErr.name, clipboardErr.message);
			}
		}

		const blob = await getCanvasBlob();

		if (navigator.canShare && navigator.share) {
			const file = new File([blob], 'openmathboard.png', { type: 'image/png' });
			if (navigator.canShare({ files: [file] })) {
				await navigator.share({ files: [file], title: 'OpenMathBoard' });
				showToast(t('toastShared') || 'Shared!', 'success');
				return;
			}
		}

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'openmathboard-' + Date.now() + '.png';
		a.click();
		URL.revokeObjectURL(url);
		showToast(t('toastImageDownloaded'), 'success');
	} catch (err) {
		console.error('Copy failed:', err);
		showToast(t('toastCopyFailed'), 'error');
	}
}

export async function saveImage() {
	try {
		const blob = await getCanvasBlob();

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

export async function getCanvasBlob() {
	const canvasRect = getCanvasRect();
	const refs = getDomRefs();
	const strokes = getStrokes();
	const camera = getCamera();

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
	if (refs.imagesLayer) {
		const images = refs.imagesLayer.querySelectorAll('.imported-image');
		for (const wrapper of images) {
			const img = wrapper.querySelector('img');
			const left = wrapper.offsetLeft;
			const top = wrapper.offsetTop;
			const width = wrapper.offsetWidth;
			const height = img.offsetHeight;
			tempCtx.drawImage(img, left, top, width, height);
		}
	}

	// Apply camera transform
	tempCtx.save();
	tempCtx.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
	tempCtx.scale(camera.zoom, camera.zoom);

	// Draw strokes
	for (const stroke of strokes) {
		if (!stroke || !stroke.points || stroke.points.length < 2) continue;

		tempCtx.strokeStyle = stroke.color;
		tempCtx.lineWidth = stroke.width;
		tempCtx.lineCap = 'round';
		tempCtx.lineJoin = 'round';

		if (stroke.dash) {
			tempCtx.setLineDash([8, 6]);
		} else {
			tempCtx.setLineDash([]);
		}

		if (stroke.shape && stroke.shape.type === 'line') {
			tempCtx.beginPath();
			tempCtx.moveTo(stroke.shape.x1, stroke.shape.y1);
			tempCtx.lineTo(stroke.shape.x2, stroke.shape.y2);
			tempCtx.stroke();
			continue;
		}

		if (stroke.shape && stroke.shape.type === 'circle') {
			tempCtx.beginPath();
			tempCtx.arc(stroke.shape.cx, stroke.shape.cy, stroke.shape.r, 0, Math.PI * 2);
			tempCtx.stroke();
			continue;
		}

		if (stroke.shape && stroke.shape.type === 'parabola') {
			tempCtx.beginPath();
			const points = stroke.points;
			tempCtx.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				tempCtx.lineTo(points[i].x, points[i].y);
			}
			tempCtx.stroke();
			continue;
		}

		// Freehand
		renderFreehand(tempCtx, stroke);
	}

	tempCtx.restore();

	return new Promise(resolve => {
		tempCanvas.toBlob(resolve, 'image/png');
	});
}
