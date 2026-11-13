import { useSyncExternalStore } from 'react';

/**
 * Cookie and storage consent (UK GDPR and PECR). Essential storage needs no consent: sign-in, basket,
 * drafts and this choice itself. Anything optional (today, Google Maps, which loads Google's scripts and
 * may set Google cookies) only runs once the person has agreed, and they can change their mind at any time.
 */
export interface Consent { maps: boolean; decidedAt: string; version: number }

const KEY = 'myukchef-consent';
/** Bump when the list of optional cookies changes, so people are asked again. */
export const CONSENT_VERSION = 1;
const listeners = new Set<() => void>();
let cached: Consent | null | undefined;

function read(): Consent | null {
    if (cached !== undefined) return cached;
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Consent | null;
        cached = parsed && parsed.version === CONSENT_VERSION ? parsed : null;
    } catch {
        cached = null;
    }
    return cached;
}

export function saveConsent(choice: { maps: boolean }) {
    cached = { maps: choice.maps, decidedAt: new Date().toISOString(), version: CONSENT_VERSION };
    try { localStorage.setItem(KEY, JSON.stringify(cached)); } catch { /* private mode: the choice lasts this visit */ }
    listeners.forEach((l) => l());
}

/** Opens the cookie settings again (from the footer link). */
export function openCookieSettings() {
    window.dispatchEvent(new Event('myukchef:cookie-settings'));
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cached = undefined; listener(); } };
    window.addEventListener('storage', onStorage);
    return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
};

/** The person's choice, or null if they haven't chosen yet. */
export const useConsent = () => useSyncExternalStore(subscribe, read, () => null);
