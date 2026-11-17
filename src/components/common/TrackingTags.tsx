import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useConsent } from '@/lib/consent';
import { usePublicSeo } from '@/lib/tracking';

/* eslint-disable @typescript-eslint/no-explicit-any */
type W = Window & { dataLayer?: any[]; gtag?: (...args: any[]) => void; fbq?: any; _fbq?: any; ttq?: any; clarity?: any };
const w = () => window as W;

function addScript(id: string, src: string) {
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
}

/** Google's consent mode: everything denied until the person agrees. */
function gtag(...args: any[]) {
    const win = w();
    win.dataLayer = win.dataLayer || [];
    // gtag must push the arguments object itself.
    // eslint-disable-next-line prefer-rest-params
    win.dataLayer.push(arguments);
}

/**
 * Loads Google Tag Manager, Google Analytics 4, Microsoft Clarity, the Meta Pixel and the TikTok Pixel,
 * but only the ones the Super Admin has set up, and only after the visitor agrees to analytics
 * (Google, Clarity) or marketing (Meta, TikTok) cookies. Never inside the admin or chef portals.
 */
export function TrackingTags() {
    const consent = useConsent();
    const { data } = usePublicSeo();
    const { pathname, search } = useLocation();
    const started = useRef({ google: false, clarity: false, meta: false, tiktok: false });
    const t = data?.tracking;
    const portal = /^\/(admin|chef\/dashboard)(\/|$)/.test(pathname);
    const analytics = !!consent?.analytics && !portal;
    const marketing = !!consent?.marketing && !portal;

    // Google: consent mode first, then GTM and/or GA4.
    useEffect(() => {
        if (!t || (!t.gtmId && !t.ga4Id)) return;
        const win = w();
        if (!started.current.google) {
            if (!analytics) return;
            win.gtag = gtag;
            gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
            gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: marketing ? 'granted' : 'denied', ad_user_data: marketing ? 'granted' : 'denied', ad_personalization: marketing ? 'granted' : 'denied' });
            if (t.gtmId) {
                win.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
                addScript('gtm-script', `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(t.gtmId)}`);
            }
            if (t.ga4Id) {
                gtag('js', new Date());
                // Page views are sent on each route change below, as this is a single-page site.
                gtag('config', t.ga4Id, { send_page_view: false, anonymize_ip: true });
                addScript('ga4-script', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(t.ga4Id)}`);
            }
            started.current.google = true;
        } else {
            gtag('consent', 'update', { analytics_storage: analytics ? 'granted' : 'denied', ad_storage: marketing ? 'granted' : 'denied', ad_user_data: marketing ? 'granted' : 'denied', ad_personalization: marketing ? 'granted' : 'denied' });
        }
    }, [t, analytics, marketing]);

    // Microsoft Clarity
    useEffect(() => {
        if (!t?.clarityId || !analytics || started.current.clarity) return;
        const win = w();
        win.clarity = win.clarity || function (...args: any[]) { (win.clarity.q = win.clarity.q || []).push(args); };
        addScript('clarity-script', `https://www.clarity.ms/tag/${encodeURIComponent(t.clarityId)}`);
        started.current.clarity = true;
    }, [t, analytics]);

    // Meta Pixel
    useEffect(() => {
        if (!t?.metaPixelId) return;
        const win = w();
        if (!started.current.meta) {
            if (!marketing) return;
            const fbq: any = function (...args: any[]) { if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue.push(args); };
            fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
            win.fbq = win._fbq = fbq;
            addScript('meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js');
            win.fbq('init', t.metaPixelId);
            started.current.meta = true;
        } else {
            win.fbq?.('consent', marketing ? 'grant' : 'revoke');
        }
    }, [t, marketing]);

    // TikTok Pixel
    useEffect(() => {
        if (!t?.tiktokPixelId || !marketing || started.current.tiktok) return;
        const win = w();
        const q: any[] = [];
        const ttq: any = { _q: q, page: (...a: any[]) => q.push(['page', ...a]), track: (...a: any[]) => q.push(['track', ...a]) };
        win.ttq = win.ttq || ttq;
        addScript('tiktok-pixel', `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(t.tiktokPixelId)}&lib=ttq`);
        started.current.tiktok = true;
    }, [t, marketing]);

    // A page view for each page, as the site changes pages without reloading.
    useEffect(() => {
        if (!t || portal) return;
        const win = w();
        if (analytics && t.ga4Id && win.gtag) win.gtag('event', 'page_view', { page_path: pathname + search, page_location: window.location.href, page_title: document.title });
        if (analytics && t.gtmId) win.dataLayer?.push({ event: 'page_view', page_path: pathname + search });
        if (marketing && t.metaPixelId) win.fbq?.('track', 'PageView');
        if (marketing && t.tiktokPixelId) win.ttq?.page?.();
    }, [pathname, search, t, analytics, marketing, portal]);

    return null;
}
