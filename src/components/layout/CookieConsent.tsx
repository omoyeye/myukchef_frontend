import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { saveConsent, useConsent } from '@/lib/consent';

/**
 * Asks once which optional cookies are OK. "Reject" is as easy as "Accept", nothing optional is set
 * before a choice, and the footer's "Cookie settings" brings this back.
 */
export function CookieConsent() {
    const consent = useConsent();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [maps, setMaps] = useState(false);

    useEffect(() => {
        const open = () => { setMaps(consent?.maps ?? false); setSettingsOpen(true); };
        window.addEventListener('myukchef:cookie-settings', open);
        return () => window.removeEventListener('myukchef:cookie-settings', open);
    }, [consent]);

    return (
        <>
            {!consent && !settingsOpen && (
                <div role="region" aria-label="Cookie choices" className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 print:hidden">
                    <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border bg-card p-4 shadow-2xl sm:flex-row sm:items-center">
                        <Cookie className="hidden h-6 w-6 shrink-0 text-primary sm:block" aria-hidden />
                        <p className="flex-1 text-sm">
                            We use essential storage to keep you signed in and remember your basket. With your permission we also load Google Maps,
                            which may set Google cookies. No advertising or tracking cookies. <Link to="/cookies" className="font-semibold underline">Cookie policy</Link>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" className="h-11 flex-1 sm:flex-none" onClick={() => saveConsent({ maps: false })}>Reject optional</Button>
                            <Button variant="outline" className="h-11 flex-1 sm:flex-none" onClick={() => { setMaps(false); setSettingsOpen(true); }}>Choose</Button>
                            <Button className="h-11 flex-1 sm:flex-none" onClick={() => saveConsent({ maps: true })}>Accept all</Button>
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
                            <Switch id="consent-maps" checked={maps} onCheckedChange={setMaps} />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { saveConsent({ maps: false }); setSettingsOpen(false); }}>Reject optional</Button>
                        <Button onClick={() => { saveConsent({ maps }); setSettingsOpen(false); }}>Save my choice</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
