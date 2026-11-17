import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { saveConsent, useConsent } from '@/lib/consent';
import { hasAnalytics, hasMarketing, usePublicSeo } from '@/lib/tracking';

/**
 * Asks once which optional cookies are OK. "Reject" is as easy as "Accept", nothing optional is set
 * before a choice, and the footer's "Cookie settings" brings this back. Analytics and marketing
 * choices only appear once the Super Admin has added those tags (Super Admin, SEO); people who chose
 * before then are asked again.
 */
export function CookieConsent() {
    const consent = useConsent();
    const { data: seo } = usePublicSeo();
    const analyticsOn = hasAnalytics(seo?.tracking);
    const marketingOn = hasMarketing(seo?.tracking);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [choice, setChoice] = useState({ maps: false, analytics: false, marketing: false });

    useEffect(() => {
        const open = () => { setChoice({ maps: consent?.maps ?? false, analytics: consent?.analytics ?? false, marketing: consent?.marketing ?? false }); setSettingsOpen(true); };
        window.addEventListener('myukchef:cookie-settings', open);
        return () => window.removeEventListener('myukchef:cookie-settings', open);
    }, [consent]);

    // New kinds of cookie since they last chose: ask again.
    const needsAsking = !consent || (analyticsOn && consent.analytics === undefined) || (marketingOn && consent.marketing === undefined);
    const all = { maps: true, analytics: analyticsOn, marketing: marketingOn };
    const none = { maps: false, analytics: false, marketing: false };
    const extras = [analyticsOn && 'analytics to see how the site is used', marketingOn && 'advertising pixels to measure our ads'].filter(Boolean) as string[];

    return (
        <>
            {needsAsking && !settingsOpen && (
                <div role="region" aria-label="Cookie choices" className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 print:hidden">
                    <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border bg-card p-4 shadow-2xl sm:flex-row sm:items-center">
                        <Cookie className="hidden h-6 w-6 shrink-0 text-primary sm:block" aria-hidden />
                        <p className="flex-1 text-sm">
                            We use essential storage to keep you signed in and remember your basket. With your permission we also load Google Maps
                            {extras.length ? `, ${extras.join(' and ')}` : ', which may set Google cookies. No advertising or tracking cookies'}. <Link to="/cookies" className="font-semibold underline">Cookie policy</Link>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" className="h-11 flex-1 sm:flex-none" onClick={() => saveConsent(none)}>Reject optional</Button>
                            <Button variant="outline" className="h-11 flex-1 sm:flex-none" onClick={() => { setChoice({ maps: consent?.maps ?? false, analytics: false, marketing: false }); setSettingsOpen(true); }}>Choose</Button>
                            <Button className="h-11 flex-1 sm:flex-none" onClick={() => saveConsent(all)}>Accept all</Button>
                        </div>
                    </div>
                </div>
            )}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cookie settings</DialogTitle>
                        <DialogDescription>Choose what MYUKCHEF may store or load in your browser. You can change this at any time from the footer.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
                            <div>
                                <p className="font-semibold">Essential</p>
                                <p className="text-sm text-muted-foreground">Sign-in, basket, drafts, your chosen location and this choice. The site doesn't work without them.</p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold text-muted-foreground">Always on</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
                            <div>
                                <Label htmlFor="consent-maps" className="font-semibold">Maps</Label>
                                <p className="text-sm text-muted-foreground">Google Maps for chef locations and live delivery tracking. Google may set cookies and receives your IP address.</p>
                            </div>
                            <Switch id="consent-maps" checked={choice.maps} onCheckedChange={(maps) => setChoice((c) => ({ ...c, maps }))} />
                        </div>
                        {analyticsOn && (
                            <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
                                <div>
                                    <Label htmlFor="consent-analytics" className="font-semibold">Analytics</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {[seo?.tracking.ga4Id || seo?.tracking.gtmId ? 'Google Analytics' : '', seo?.tracking.clarityId ? 'Microsoft Clarity' : ''].filter(Boolean).join(' and ')} to count visits and see which pages help people. They set cookies and receive your IP address.
                                    </p>
                                </div>
                                <Switch id="consent-analytics" checked={choice.analytics} onCheckedChange={(analytics) => setChoice((c) => ({ ...c, analytics }))} />
                            </div>
                        )}
                        {marketingOn && (
                            <div className="flex items-start justify-between gap-4 rounded-xl border p-3">
                                <div>
                                    <Label htmlFor="consent-marketing" className="font-semibold">Marketing</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {[seo?.tracking.metaPixelId ? 'Meta (Facebook and Instagram)' : '', seo?.tracking.tiktokPixelId ? 'TikTok' : ''].filter(Boolean).join(' and ')} pixels, to measure and improve our adverts. They set cookies and may link your visit to your account with them.
                                    </p>
                                </div>
                                <Switch id="consent-marketing" checked={choice.marketing} onCheckedChange={(marketing) => setChoice((c) => ({ ...c, marketing }))} />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { saveConsent(none); setSettingsOpen(false); }}>Reject optional</Button>
                        <Button onClick={() => { saveConsent(choice); setSettingsOpen(false); }}>Save my choice</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
