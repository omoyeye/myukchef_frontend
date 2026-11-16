import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Globe, ImagePlus, Loader2, Megaphone, Pencil, Plus, Smartphone, Trash2 } from 'lucide-react';
import { api, uploadImage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BannerCard } from '@/components/banners/BannerAds';

interface Banner {
    id: number;
    title: string;
    message: string | null;
    image: string | null;
    ctaLabel: string | null;
    link: string | null;
    placement: 'home' | 'menu' | 'meal_plans' | 'everywhere';
    audience: 'everyone' | 'customers' | 'chefs' | 'signed_out';
    theme: 'brand' | 'dark' | 'light';
    showOnWebsite: boolean;
    showOnApp: boolean;
    active: boolean;
    startsAt: string | null;
    endsAt: string | null;
    sortOrder: number;
    views: number;
    clicks: number;
}
type Draft = Omit<Banner, 'id' | 'views' | 'clicks'> & { id?: number };

const PLACEMENT: Record<Banner['placement'], string> = { home: 'Home page', menu: 'Menu', meal_plans: 'Meal plans', everywhere: 'All three pages' };
const AUDIENCE: Record<Banner['audience'], string> = { everyone: 'Everyone', customers: 'Signed-in customers', chefs: 'Chefs', signed_out: 'Visitors not signed in' };
const THEME: Record<Banner['theme'], string> = { brand: 'Orange', dark: 'Dark', light: 'Light' };
const EMPTY: Draft = { title: '', message: '', image: null, ctaLabel: '', link: '', placement: 'home', audience: 'everyone', theme: 'brand', showOnWebsite: true, showOnApp: true, active: true, startsAt: null, endsAt: null, sortOrder: 0 };

/** For <input type="datetime-local">: local time without seconds. */
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);
const status = (b: Banner) => {
    const now = Date.now();
    if (!b.active) return { label: 'Off', variant: 'secondary' as const };
    if (b.startsAt && Date.parse(b.startsAt) > now) return { label: 'Scheduled', variant: 'outline' as const };
    if (b.endsAt && Date.parse(b.endsAt) < now) return { label: 'Ended', variant: 'secondary' as const };
    return { label: 'Live', variant: 'default' as const };
};
const select = 'h-10 w-full rounded-md border bg-background px-3 text-sm';

/** Super Admins create banner adverts and choose where they show: the website, the app, or both. */
const BannerManagement = () => {
    const qc = useQueryClient();
    const { data = [], isLoading } = useQuery<Banner[]>({ queryKey: ['admin-banners'], queryFn: () => api.get('/banners/admin') });
    const [draft, setDraft] = useState<Draft | null>(null);
    const [deleting, setDeleting] = useState<Banner | null>(null);
    const [uploading, setUploading] = useState(false);
    const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-banners'] }); qc.invalidateQueries({ queryKey: ['banners'] }); };

    const save = useMutation({
        mutationFn: (d: Draft) => (d.id ? api.put(`/banners/admin/${d.id}`, d) : api.post('/banners/admin', d)),
        onSuccess: () => { refresh(); setDraft(null); toast.success('Banner saved'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const toggle = useMutation({
        mutationFn: (b: Banner) => api.put(`/banners/admin/${b.id}`, { active: !b.active }),
        onSuccess: refresh,
        onError: (e: Error) => toast.error(e.message),
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/banners/admin/${id}`),
        onSuccess: () => { refresh(); toast.success('Banner deleted'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

    return (
        <div className="max-w-5xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
                    <p className="mt-1 text-muted-foreground">Adverts and offers shown at the top of the home, menu and meal plan pages. Choose for each one whether it shows on the website, in the app, or both.</p>
                </div>
                <Button onClick={() => setDraft({ ...EMPTY })}><Plus className="mr-2 h-4 w-4" />New banner</Button>
            </div>

            {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                : data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-10 text-center">
                        <Megaphone className="mx-auto mb-3 h-9 w-9 text-primary" />
                        <p className="font-bold">No banners yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">Promote an offer, a new chef or a seasonal menu.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.map((b) => {
                            const s = status(b);
                            const ctr = b.views ? `${((b.clicks / b.views) * 100).toFixed(1)}%` : '–';
                            return (
                                <Card key={b.id}>
                                    <CardContent className="grid gap-4 p-4 md:grid-cols-[1.2fr_1fr]">
                                        <BannerCard banner={b} preview />
                                        <div className="space-y-2 text-sm">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant={s.variant}>{s.label}</Badge>
                                                {b.showOnWebsite && <Badge variant="outline"><Globe className="mr-1 h-3 w-3" />Website</Badge>}
                                                {b.showOnApp && <Badge variant="outline"><Smartphone className="mr-1 h-3 w-3" />App</Badge>}
                                            </div>
                                            <p className="text-muted-foreground">{PLACEMENT[b.placement]} · {AUDIENCE[b.audience]}</p>
                                            <p className="text-muted-foreground">
                                                {b.startsAt ? `From ${new Date(b.startsAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : 'From now'}
                                                {b.endsAt ? ` until ${new Date(b.endsAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : ', no end date'}
                                            </p>
                                            <p>{b.views} views · {b.clicks} clicks · {ctr} clicked</p>
                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                <label className="flex items-center gap-2"><Switch checked={b.active} onCheckedChange={() => toggle.mutate(b)} aria-label={`Show ${b.title}`} />On</label>
                                                <Button size="sm" variant="outline" onClick={() => setDraft({ ...b })}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(b)}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

            <Sheet open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                    {draft && (
                        <form className="space-y-5 pb-6" onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }}>
                            <SheetHeader>
                                <SheetTitle>{draft.id ? 'Edit banner' : 'New banner'}</SheetTitle>
                                <SheetDescription>A preview is at the bottom.</SheetDescription>
                            </SheetHeader>

                            <div className="space-y-1.5"><Label htmlFor="b-title">Headline</Label><Input id="b-title" value={draft.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="20% off your first meal plan" required /></div>
                            <div className="space-y-1.5"><Label htmlFor="b-msg">Message (optional)</Label><Textarea id="b-msg" rows={2} value={draft.message ?? ''} maxLength={300} onChange={(e) => set({ message: e.target.value })} /></div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5"><Label htmlFor="b-cta">Button text (optional)</Label><Input id="b-cta" value={draft.ctaLabel ?? ''} maxLength={40} onChange={(e) => set({ ctaLabel: e.target.value })} placeholder="Find out more" /></div>
                                <div className="space-y-1.5"><Label htmlFor="b-link">Link (optional)</Label><Input id="b-link" value={draft.link ?? ''} maxLength={500} onChange={(e) => set({ link: e.target.value })} placeholder="/meal-plans or https://..." /></div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Image (optional)</Label>
                                <div className="flex items-center gap-3">
                                    {draft.image && <img src={draft.image} alt="" className="h-14 w-24 rounded-md object-cover" />}
                                    <Label htmlFor="b-image" className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{draft.image ? 'Change image' : 'Upload image'}
                                    </Label>
                                    <input id="b-image" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        e.target.value = '';
                                        if (!file) return;
                                        setUploading(true);
                                        try { set({ image: await uploadImage(file) }); } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed'); } finally { setUploading(false); }
                                    }} />
                                    {draft.image && <Button type="button" size="sm" variant="ghost" onClick={() => set({ image: null })}>Remove</Button>}
                                </div>
                                <p className="text-xs text-muted-foreground">Landscape works best. Shown beside the text on wider screens.</p>
                            </div>

                            <fieldset className="space-y-2 rounded-xl border p-3">
                                <legend className="px-1 text-sm font-semibold">Show on</legend>
                                <label className="flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2"><Globe className="h-4 w-4" />Website</span><Switch checked={draft.showOnWebsite} onCheckedChange={(v) => set({ showOnWebsite: v })} /></label>
                                <label className="flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2"><Smartphone className="h-4 w-4" />App</span><Switch checked={draft.showOnApp} onCheckedChange={(v) => set({ showOnApp: v })} /></label>
                            </fieldset>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1.5"><Label htmlFor="b-place">Page</Label><select id="b-place" className={select} value={draft.placement} onChange={(e) => set({ placement: e.target.value as Banner['placement'] })}>{Object.entries(PLACEMENT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                                <div className="space-y-1.5"><Label htmlFor="b-aud">Who sees it</Label><select id="b-aud" className={select} value={draft.audience} onChange={(e) => set({ audience: e.target.value as Banner['audience'] })}>{Object.entries(AUDIENCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                                <div className="space-y-1.5"><Label htmlFor="b-theme">Colour</Label><select id="b-theme" className={select} value={draft.theme} onChange={(e) => set({ theme: e.target.value as Banner['theme'] })}>{Object.entries(THEME).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1.5"><Label htmlFor="b-start">Starts (optional)</Label><Input id="b-start" type="datetime-local" value={toLocal(draft.startsAt)} onChange={(e) => set({ startsAt: fromLocal(e.target.value) })} /></div>
                                <div className="space-y-1.5"><Label htmlFor="b-end">Ends (optional)</Label><Input id="b-end" type="datetime-local" value={toLocal(draft.endsAt)} onChange={(e) => set({ endsAt: fromLocal(e.target.value) })} /></div>
                                <div className="space-y-1.5"><Label htmlFor="b-order">Order</Label><Input id="b-order" type="number" value={draft.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} /><p className="text-xs text-muted-foreground">Lower shows first.</p></div>
                            </div>
                            <label className="flex items-center gap-2 text-sm"><Switch checked={draft.active} onCheckedChange={(v) => set({ active: v })} />Switched on</label>

                            <div className="space-y-2">
                                <p className="text-sm font-semibold">Preview</p>
                                <BannerCard banner={{ id: 0, title: draft.title || 'Your headline', message: draft.message, image: draft.image, ctaLabel: draft.ctaLabel, link: draft.link || null, theme: draft.theme }} preview />
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
                                <Button type="submit" disabled={save.isPending || !draft.title.trim()}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save banner</Button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
                        <AlertDialogDescription>"{deleting?.title}" and its view and click counts will be deleted. To keep it for later, switch it off instead.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleting && remove.mutate(deleting.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default BannerManagement;
