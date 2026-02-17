// Yummy Jars - Shared i18n (Internationalization) Utility
// Usage:
//   import { initI18n, t, setLanguage, getCurrentLang } from './i18n/i18n.js';
//   initI18n({ storageKey: 'app.lang.v1', defaultLang: 'en', translations: TRANSLATIONS });

let currentLang = 'en';
let translations = {};
let defaultLang = 'en';
let storageKey = 'yummyjars.lang.v1';

/**
 * Initialize i18n with configuration
 * @param {Object} config
 * @param {string} config.storageKey - localStorage key for persistence
 * @param {string} config.defaultLang - default language ('en' or 'zh')
 * @param {Object} config.translations - { en: {...}, zh: {...} }
 */
export function initI18n(config) {
	storageKey = config.storageKey || storageKey;
	defaultLang = config.defaultLang || defaultLang;
	translations = config.translations || {};
	currentLang = defaultLang;
	loadLanguage();
}

/**
 * Get translation for a key
 * @param {string} key - translation key
 * @param {...any} args - arguments for {0}, {1}, etc. placeholders
 * @returns {string}
 */
export function t(key, ...args) {
	const lang = translations[currentLang] || translations[defaultLang] || {};
	const fallback = translations[defaultLang] || {};
	let text = lang[key] || fallback[key] || key;
	// Replace {0}, {1}, etc. with args
	args.forEach((arg, i) => {
		text = text.replace(`{${i}}`, arg);
	});
	return text;
}

/**
 * Get current language
 * @returns {string}
 */
export function getCurrentLang() {
	return currentLang;
}

/**
 * Set language and persist to localStorage
 * @param {string} lang
 */
export function setLanguage(lang) {
	if (!translations[lang]) return;
	currentLang = lang;
	saveLanguage();
}

/**
 * Load language from URL query, localStorage, or use default
 * Priority: URL ?lang=xx > localStorage > app default
 */
function loadLanguage() {
	try {
		// Check URL query parameter first
		const urlParams = new URLSearchParams(window.location.search);
		const urlLang = urlParams.get('lang');
		if (urlLang && translations[urlLang]) {
			currentLang = urlLang;
			saveLanguage(); // Persist URL choice to localStorage
			return;
		}

		// Then check localStorage
		const saved = localStorage.getItem(storageKey);
		if (saved && translations[saved]) {
			currentLang = saved;
		}
		// Note: We don't auto-detect from browser here because initI18n
		// already set currentLang to the app's defaultLang. The app knows
		// its intended default better than the browser language.
	} catch {
		// ignore localStorage errors
	}
}

/**
 * Save language to localStorage
 */
function saveLanguage() {
	try {
		localStorage.setItem(storageKey, currentLang);
	} catch {
		// ignore localStorage errors
	}
}

/**
 * Apply translations to DOM elements with data-i18n and data-i18n-title attributes
 */
export function applyTranslations() {
	// Update elements with data-i18n attribute (text content)
	document.querySelectorAll('[data-i18n]').forEach(el => {
		const key = el.dataset.i18n;
		el.textContent = t(key);
	});

	// Update elements with data-i18n-title attribute (title/tooltip)
	document.querySelectorAll('[data-i18n-title]').forEach(el => {
		const key = el.dataset.i18nTitle;
		el.title = t(key);
	});

	// Update page title if translation exists
	const pageTitle = t('pageTitle');
	if (pageTitle && pageTitle !== 'pageTitle') {
		document.title = pageTitle;
	}

	// Update HTML lang attribute
	document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

/**
 * Setup language picker dropdown
 * @param {Object} options
 * @param {string} options.btnId - button element ID (default: 'langBtn')
 * @param {string} options.dropdownId - dropdown element ID (default: 'langDropdown')
 * @param {Function} options.onLanguageChange - callback after language change
 * @param {Function} options.closeOtherDropdowns - callback to close other dropdowns
 */
export function setupLanguagePicker(options = {}) {
	const btnId = options.btnId || 'langBtn';
	const dropdownId = options.dropdownId || 'langDropdown';
	const onLanguageChange = options.onLanguageChange || (() => {});
	const closeOtherDropdowns = options.closeOtherDropdowns || (() => {});

	const langBtn = document.getElementById(btnId);
	const langDropdown = document.getElementById(dropdownId);

	if (!langBtn || !langDropdown) return;

	// Set initial active state
	document.querySelectorAll('.lang-option').forEach(btn => {
		btn.classList.toggle('active', btn.dataset.lang === currentLang);
	});

	langBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		closeOtherDropdowns();
		langDropdown.classList.toggle('show');
	});

	document.querySelectorAll('.lang-option').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const lang = e.target.dataset.lang;
			setLanguage(lang);
			applyTranslations();
			onLanguageChange(lang);

			// Update picker UI
			document.querySelectorAll('.lang-option').forEach(b => {
				b.classList.toggle('active', b.dataset.lang === lang);
			});

			langDropdown.classList.remove('show');
		});
	});

	// Close dropdown when clicking elsewhere
	document.addEventListener('click', () => {
		langDropdown.classList.remove('show');
	});
}
