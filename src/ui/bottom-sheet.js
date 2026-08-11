// Reusable pull-to-dismiss behavior for mobile bottom sheets.
// Add this once to any future panel instead of implementing custom gestures.
const initializedSheets = new WeakMap();

export function makeBottomSheetDismissible(sheet, onDismiss) {
	if (!sheet) return;
	const existingHandle = initializedSheets.get(sheet);
	if (existingHandle) {
		if (!existingHandle.isConnected) sheet.prepend(existingHandle);
		return;
	}
	sheet.classList.add('mobile-bottom-sheet');

	const handle = document.createElement('button');
	handle.type = 'button';
	handle.className = 'bottom-sheet-handle';
	handle.setAttribute('aria-label', 'Pull down to close');
	handle.innerHTML = '<span></span>';
	sheet.prepend(handle);
	initializedSheets.set(sheet, handle);

	let startY = 0;
	let lastY = 0;
	let startTime = 0;
	let dragging = false;

	function resetPosition(animate = false) {
		sheet.classList.toggle('bottom-sheet-snapping', animate);
		sheet.classList.remove('bottom-sheet-dragging');
		sheet.style.transform = '';
		if (animate) {
			setTimeout(() => sheet.classList.remove('bottom-sheet-snapping'), 220);
		}
	}

	function onPointerDown(event) {
		if (!matchMedia('(max-width: 600px)').matches) return;
		dragging = true;
		startY = lastY = event.clientY;
		startTime = performance.now();
		handle.setPointerCapture(event.pointerId);
		sheet.classList.add('bottom-sheet-dragging');
		sheet.classList.remove('bottom-sheet-snapping');
		event.preventDefault();
	}

	function onPointerMove(event) {
		if (!dragging) return;
		lastY = event.clientY;
		const distance = Math.max(0, lastY - startY);
		sheet.style.transform = `translateY(${distance}px)`;
		event.preventDefault();
	}

	function onPointerEnd(event) {
		if (!dragging) return;
		dragging = false;
		const distance = Math.max(0, lastY - startY);
		const elapsed = Math.max(1, performance.now() - startTime);
		const velocity = distance / elapsed;
		const threshold = Math.min(120, sheet.offsetHeight * 0.24);
		if (distance >= threshold || (distance > 36 && velocity > 0.55)) {
			sheet.classList.remove('bottom-sheet-dragging');
			sheet.classList.add('bottom-sheet-snapping');
			sheet.style.transform = `translateY(${sheet.offsetHeight + 24}px)`;
			setTimeout(() => {
				onDismiss?.();
				resetPosition(false);
			}, 190);
		} else {
			resetPosition(true);
		}
		if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
	}

	handle.addEventListener('pointerdown', onPointerDown);
	handle.addEventListener('pointermove', onPointerMove);
	handle.addEventListener('pointerup', onPointerEnd);
	handle.addEventListener('pointercancel', onPointerEnd);

	// A sheet reopened after dismissal must always start at its resting position.
	let wasShown = sheet.classList.contains('show');
	new MutationObserver(() => {
		const shown = sheet.classList.contains('show');
		if (shown && !wasShown) resetPosition(false);
		wasShown = shown;
	}).observe(sheet, { attributes: true, attributeFilter: ['class'] });
}
