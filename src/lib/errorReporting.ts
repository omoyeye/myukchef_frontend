import { API_URL } from './api';

/**
 * Sends crashes from people's browsers to the server, so the Super Admin sees them under Reports
 * instead of only hearing about them from customers. Each error is only sent once per page load.
 */
const sent = new Set<string>();

export function reportError(error: unknown, where = window.location.pathname) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    // Ignore noise that isn't ours to fix.
    if (!message || /ResizeObserver loop|Loading chunk|Failed to fetch dynamically imported|NetworkError|Load failed/i.test(message)) return;
    const key = `${message}@${where}`;
    if (sent.has(key) || sent.size > 20) return;
    sent.add(key);
    fetch(`${API_URL}/health/client-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.slice(0, 500), where: where.slice(0, 200), source: 'browser' }),
        keepalive: true,
    }).catch(() => undefined);
}

export function startErrorReporting() {
    window.addEventListener('error', (e) => reportError(e.error ?? e.message));
    window.addEventListener('unhandledrejection', (e) => reportError(e.reason));
}
