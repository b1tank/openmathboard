// OpenMathBoard — Image import, drag/drop, paste
import { getCanvasRect, getDomRefs } from './state.js';
import { t } from './lib/i18n.js';
import { showToast } from './toast.js';
import { hideHeroSection } from './hero.js';

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

		const resizeHandle = document.createElement('div');
		resizeHandle.className = 'resize-handle';
		wrapper.appendChild(resizeHandle);

		const deleteHandle = document.createElement('div');
		deleteHandle.className = 'delete-handle';
		deleteHandle.textContent = '×';
		deleteHandle.addEventListener('click', (e) => {
			e.stopPropagation();
			wrapper.remove();
			showToast(t('toastImageRemoved'));
		});
		wrapper.appendChild(deleteHandle);

		setupImageDrag(wrapper);
		refs.imagesLayer.appendChild(wrapper);
		showToast(t('toastImageAdded'));
	};
}

function setupImageDrag(wrapper) {
	let isDragging = false;
	let startX, startY, startLeft, startTop;

	wrapper.addEventListener('pointerdown', (e) => {
		if (e.target.className === 'resize-handle' || e.target.className === 'delete-handle') return;

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

	document.addEventListener('click', (e) => {
		if (!wrapper.contains(e.target)) {
			wrapper.classList.remove('selected');
		}
	});
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
