// OpenMathBoard — privacy-safe frontend operational telemetry.
// Disabled unless an endpoint is configured at build time or before app init.
let endpoint = '';
let release = 'dev';
let initialized = false;

function cleanProperties(properties = {}) {
	const clean = {};
	for (const [key, value] of Object.entries(properties).slice(0, 20)) {
		if (!/^[a-zA-Z0-9_.-]{1,48}$/.test(key)) continue;
		if (typeof value === 'boolean' || typeof value === 'number') clean[key] = value;
		else if (typeof value === 'string') clean[key] = value.slice(0, 160);
	}
	return clean;
}

function sourceName(filename) {
	if (!filename) return 'unknown';
	try {
		const url = new URL(filename, location.href);
		return url.origin === location.origin ? url.pathname.split('/').pop() || 'app' : 'cross-origin';
	} catch {
		return 'unknown';
	}
}

export function trackEvent(name, properties = {}, level = 'info') {
	if (!endpoint || !/^[a-zA-Z0-9_.-]{1,64}$/.test(name)) return false;
	const payload = JSON.stringify({
		schema: 'omb.telemetry.v1',
		name,
		level,
		release,
		timestamp: new Date().toISOString(),
		path: location.pathname,
		properties: cleanProperties(properties)
	});
	try {
		if (typeof window.__OMB_TELEMETRY_TRANSPORT === 'function') {
			window.__OMB_TELEMETRY_TRANSPORT(payload);
			return true;
		}
		if (navigator.sendBeacon) {
			const sent = navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
			if (sent) return true;
		}
		fetch(endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: payload,
			keepalive: true,
			credentials: 'omit'
		}).catch(() => {});
		return true;
	} catch {
		return false;
	}
}

export function initTelemetry() {
	if (initialized) return;
	initialized = true;
	endpoint = window.__OMB_TELEMETRY_ENDPOINT || import.meta.env.VITE_TELEMETRY_ENDPOINT || '';
	release = window.__OMB_RELEASE || import.meta.env.VITE_APP_RELEASE || 'dev';
	window.addEventListener('error', event => {
		trackEvent('client_error', {
			errorType: event.error?.name || 'Error',
			source: sourceName(event.filename),
			line: event.lineno || 0,
			column: event.colno || 0
		}, 'error');
	});
	window.addEventListener('unhandledrejection', event => {
		trackEvent('unhandled_rejection', {
			errorType: event.reason?.name || typeof event.reason
		}, 'error');
	});
	trackEvent('app_loaded', { secureContext: window.isSecureContext });
}
