import { useEffect, useState } from 'react';

/**
 * Installing MYUKCHEF as an app from the website. Chrome, Edge and Android offer an install button
 * (the "beforeinstallprompt" event, kept here so any page can use it). iPhones and iPads don't, so
 * there we show the Share, then "Add to Home Screen" steps instead.
 */

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Called once at start-up, before React, so the browser's offer is never missed. */
export function captureInstallPrompt() {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferred = e as InstallEvent;
        notify();
    });
    window.addEventListener('appinstalled', () => {
        deferred = null;
        try { localStorage.setItem('pwa-installed', '1'); } catch { /* private mode */ }
        notify();
    });
}

export const isStandalone = () =>
    typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export const deviceKind = (): 'ios' | 'android' | 'desktop' => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent;
    // iPadOS reports itself as a Mac; touch points give it away.
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
};

/** Safari on iPhone is the only browser there that can add a web app to the Home Screen. */
export const isIosSafari = () => deviceKind() === 'ios' && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);

export function useInstallApp() {
    const [, force] = useState(0);
    useEffect(() => {
        const update = () => force((n) => n + 1);
        listeners.add(update);
        const media = window.matchMedia?.('(display-mode: standalone)');
        media?.addEventListener?.('change', update);
        return () => { listeners.delete(update); media?.removeEventListener?.('change', update); };
    }, []);
    const installed = isStandalone();
    return {
        installed,
        /** The browser can show its own install window. */
        canInstall: !!deferred && !installed,
        device: deviceKind(),
        iosSafari: isIosSafari(),
        async install() {
            if (!deferred) return false;
            await deferred.prompt();
            const { outcome } = await deferred.userChoice;
            deferred = null;
            notify();
            return outcome === 'accepted';
        },
    };
}
