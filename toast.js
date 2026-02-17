// OpenMathBoard — Toast notifications

let toastEl = null;

export function initToast(el) {
	toastEl = el;
}

export function showToast(message, type = '') {
	if (!toastEl) toastEl = document.getElementById('toast');
	if (!toastEl) return;

	toastEl.textContent = message;
	toastEl.className = 'toast show ' + type;

	setTimeout(() => {
		toastEl.classList.remove('show');
	}, 2000);
}
