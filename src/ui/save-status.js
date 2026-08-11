// OpenMathBoard — durable local save status indicator
import { subscribeSaveStatus } from '../core/persistence.js';
import { t } from '../i18n/i18n.js';

const STATUS_UI = {
	saved: { icon: '✓', key: 'saveStatusSaved' },
	saving: { icon: '…', key: 'saveStatusSaving' },
	error: { icon: '!', key: 'saveStatusError' }
};

export function initSaveStatus() {
	const element = document.getElementById('saveStatus');
	if (!element) return;
	const icon = element.querySelector('.save-status-icon');
	const label = element.querySelector('.save-status-label');
	subscribeSaveStatus(status => {
		const ui = STATUS_UI[status] || STATUS_UI.error;
		element.dataset.status = status;
		icon.textContent = ui.icon;
		label.dataset.i18n = ui.key;
		label.textContent = t(ui.key);
		element.title = t(ui.key);
	});
}
