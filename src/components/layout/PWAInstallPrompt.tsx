import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Download, MapPin, Share, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallApp } from '@/lib/pwa';

const DISMISS_KEY = 'pwa-prompt-dismissed-at';
const DISMISS_DAYS = 14;
const recentlyDismissed = () => {
    try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_DAYS * 86400_000; } catch { return true; }
};

/**
 * A friendly "install the app" card, a few seconds into a visit. Chrome, Edge and Android get an
 * install button; iPhones get the Share, then "Add to Home Screen" hint. Hidden for 14 days once closed,
 * never shown inside the installed app, on the Get the app page, or in the admin and chef portals.
 */
export const PWAInstallPrompt = () => {
    const { installed, canInstall, install, iosSafari } = useInstallApp();
    const { pathname } = useLocation();
    const [visible, setVisible] = useState(false);
    const eligible = !installed && (canInstall || iosSafari) && !/^\/(app|admin|chef)(\/|$)/.test(pathname);

    useEffect(() => {
        if (!eligible || recentlyDismissed()) return;
        const t = setTimeout(() => setVisible(true), 6000);
        return () => clearTimeout(t);
    }, [eligible]);

    const close = () => {
        setVisible(false);
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
    };
    if (!visible || !eligible) return null;

    return (
        <div role="dialog" aria-labelledby="install-title" className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500 md:bottom-6 md:left-auto md:right-6 md:max-w-md">
            <div className="relative overflow-hidden rounded-3xl bg-ink text-ink-foreground shadow-2xl">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/40 blur-2xl" />
                <button type="button" onClick={close} aria-label="Not now" className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-ink-foreground/70 hover:bg-ink-foreground/10 hover:text-ink-foreground">
                    <X className="h-4 w-4" />
                </button>
                <div className="relative flex gap-4 p-5">
                    <img src="/app/screen-order.webp" alt="" className="hidden h-28 w-16 shrink-0 rounded-xl object-cover sm:block" />
                    <div className="min-w-0 space-y-3">
                        <div className="flex items-center gap-2">
                            <img src="/pwa-192x192.png" alt="" className="h-9 w-9 rounded-xl" />
                            <h3 id="install-title" className="font-display text-lg font-extrabold leading-tight">Get the MYUKCHEF app</h3>
                        </div>
                        <ul className="space-y-1 text-sm text-ink-foreground/80">
                            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Order in two taps from your home screen</li>
                            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Track deliveries live</li>
                            <li className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Know the moment dinner's on its way</li>
                        </ul>
                        {canInstall ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <Button className="h-11 rounded-full font-bold" onClick={async () => { if (await install()) setVisible(false); }}><Download className="mr-2 h-4 w-4" />Install, it's free</Button>
                                <Link to="/app" onClick={() => setVisible(false)} className="text-sm font-semibold text-ink-foreground/80 underline-offset-4 hover:underline">Learn more</Link>
                            </div>
                        ) : (
                            <p className="rounded-2xl bg-ink-foreground/10 p-3 text-sm">
                                Tap <Share className="mx-0.5 inline h-4 w-4" aria-label="Share" /> below, then <strong>Add to Home Screen</strong>. <Link to="/app" onClick={() => setVisible(false)} className="font-semibold underline">Show me</Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
