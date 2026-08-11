// OpenMathBoard — Image import, drag/drop, paste
import { getCanvasRect, getDomRefs, setSelectedStrokes } from '../core/state.js';
import { t } from '../i18n/i18n.js';
import { showToast } from './toast.js';
import { hideHeroSection } from './hero.js';
import { hidePropertyPanel } from './property-panel.js';
import { redrawLive } from '../canvas/renderer.js';

export function setupDropZone() {
	const refs = getDomRefs();

	refs.canvasContainer.addEventListener('dragenter', (e) => {
		e.preventDefault();
		refs.dropZone.classList.add('active');
	});

	refs.canvasContainer.addEventListener('dragover', (e) => {
		e.preventDefault();
	});

	refs.canvasContainer.addEventListener('dragleave', (e) => {
		if (!refs.canvasContainer.contains(e.relatedTarget)) {
			refs.dropZone.classList.remove('active');
		}
	});

	refs.canvasContainer.addEventListener('drop', (e) => {
		e.preventDefault();
		refs.dropZone.classList.remove('active');

		const files = e.dataTransfer.files;
		if (files.length > 0 && files[0].type.startsWith('image/')) {
			loadImageFile(files[0]);
		}
	});
}

export function handleFileSelect(e) {
	const file = e.target.files[0];
	if (file && file.type.startsWith('image/')) {
		loadImageFile(file);
	}
	e.target.value = '';
}

function loadImageFile(file) {
	const reader = new FileReader();
	reader.onload = (e) => {
		addImageToCanvas(e.target.result);
	};
	reader.readAsDataURL(file);
}

export function addImageToCanvas(src) {
	hideHeroSection();

	const canvasRect = getCanvasRect();
	const refs = getDomRefs();

	const img = document.createElement('img');
	img.src = src;

	img.onload = () => {
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

		const wrapper = document.createElement('div');
		wrapper.className = 'imported-image';
		wrapper.style.left = '20px';
		wrapper.style.top = '20px';
		wrapper.style.width = width + 'px';

		const imgEl = document.createElement('img');
		imgEl.src = src;
		wrapper.appendChild(imgEl);

		for (const corner of ['nw', 'ne', 'sw', 'se']) {
			const resizeHandle = document.createElement('div');
			resizeHandle.className = `resize-handle resize-${corner}`;
			resizeHandle.dataset.corner = corner;
			wrapper.appendChild(resizeHandle);
		}

		const deleteHandle = document.createElement('div');
		deleteHandle.className = 'delete-handle';
		deleteHandle.textContent = '×';
		deleteHandle.addEventListener('click', (e) => {
			e.stopPropagation();
			wrapper.remove();
			showToast(t('toastImageRemoved'));
		});
		wrapper.appendChild(deleteHandle);

		setupImageInteraction(wrapper);
		refs.imagesLayer.appendChild(wrapper);
		showToast(t('toastImageAdded'));
	};
}

export function selectImportedImage(wrapper) {
	if (!wrapper?.isConnected) return;
	document.querySelectorAll('.imported-image').forEach(el => el.classList.toggle('selected', el === wrapper));
	setSelectedStrokes([]);
	hidePropertyPanel();
	redrawLive();
}

export function findImportedImageAtPoint(screenX, screenY) {
	if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) return null;
	const refs = getDomRefs();
	const images = [...(refs.imagesLayer?.querySelectorAll('.imported-image') || [])];
	for (let i = images.length - 1; i >= 0; i--) {
		const image = images[i];
		if (screenX >= image.offsetLeft && screenX <= image.offsetLeft + image.offsetWidth &&
			screenY >= image.offsetTop && screenY <= image.offsetTop + image.offsetHeight) return image;
	}
	return null;
}

function setupImageInteraction(wrapper) {
	let isDragging = false;
	let startX, startY, startLeft, startTop;

	wrapper.addEventListener('pointerdown', (e) => {
		if (e.target.closest('.resize-handle, .delete-handle')) return;
		selectImportedImage(wrapper);
		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
		startLeft = wrapper.offsetLeft;
		startTop = wrapper.offsetTop;
		wrapper.setPointerCapture(e.pointerId);
		e.preventDefault();
	});

	wrapper.addEventListener('pointermove', (e) => {
		if (!isDragging) return;
		wrapper.style.left = (startLeft + e.clientX - startX) + 'px';
		wrapper.style.top = (startTop + e.clientY - startY) + 'px';
	});

	wrapper.addEventListener('pointerup', () => { isDragging = false; });
	wrapper.addEventListener('pointercancel', () => { isDragging = false; });

	wrapper.querySelectorAll('.resize-handle').forEach(handle => setupResizeHandle(wrapper, handle));

	document.addEventListener('click', (e) => {
		if (wrapper.contains(e.target)) return;
		// Pen-mode tap-to-select is routed through the live canvas underneath the
		// image, so the click target is not the wrapper even though the coordinates
		// are inside it. Preserve the selection for that synthesized tap.
		const rect = wrapper.getBoundingClientRect();
		const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
			e.clientY >= rect.top && e.clientY <= rect.bottom;
		if (!inside) wrapper.classList.remove('selected');
	});
}

function setupResizeHandle(wrapper, handle) {
	let resizing = false;
	let startX, startY, startWidth, startHeight, startLeft, startTop;
	handle.addEventListener('pointerdown', e => {
		e.stopPropagation();
		e.preventDefault();
		selectImportedImage(wrapper);
		resizing = true;
		startX = e.clientX; startY = e.clientY;
		startWidth = wrapper.offsetWidth; startHeight = wrapper.offsetHeight;
		startLeft = wrapper.offsetLeft; startTop = wrapper.offsetTop;
		handle.setPointerCapture(e.pointerId);
	});
	handle.addEventListener('pointermove', e => {
		if (!resizing) return;
		const corner = handle.dataset.corner;
		const directionX = corner.includes('w') ? -1 : 1;
		const directionY = corner.includes('n') ? -1 : 1;
		const scaleX = directionX * (e.clientX - startX) / Math.max(1, startWidth);
		const scaleY = directionY * (e.clientY - startY) / Math.max(1, startHeight);
		const scale = Math.max(40 / startWidth, 1 + (scaleX + scaleY) / 2);
		const width = startWidth * scale;
		const height = startHeight * scale;
		wrapper.style.width = width + 'px';
		if (corner.includes('w')) wrapper.style.left = (startLeft + startWidth - width) + 'px';
		if (corner.includes('n')) wrapper.style.top = (startTop + startHeight - height) + 'px';
		e.preventDefault();
	});
	handle.addEventListener('pointerup', () => { resizing = false; });
	handle.addEventListener('pointercancel', () => { resizing = false; });
}

export function setupClipboard() {
	document.addEventListener('paste', async (e) => {
		const items = e.clipboardData.items;

		for (const item of items) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const blob = item.getAsFile();
				const reader = new FileReader();
				reader.onload = (ev) => addImageToCanvas(ev.target.result);
				reader.readAsDataURL(blob);
				return;
			}
		}
	});
}
