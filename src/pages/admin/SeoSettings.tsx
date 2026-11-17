import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BarChart3, Check, Globe, ImagePlus, Loader2, Save, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { api, uploadImage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface PageText { title?: string; description?: string; keywords?: string }
interface Config {
    tracking: { gtmId: string; ga4Id: string; metaPixelId: string; tiktokPixelId: string; clarityId: string };
    verification: { google: string; bing: string; pinterest: string };
    defaults: { description: string; keywords: string; ogImage: string };
    pages: Record<string, PageText>;
    allowIndexing: boolean;
    updatedAt?: string;
}
interface SeoPage { path: string; name: string; purpose: string }
interface Draft { title: string; description: string; keywords: string[]; notes: string }

const SITE = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://myukchef.com';

const TAGS: { key: keyof Config['tracking']; label: string; placeholder: string; help: string; kind: 'Analytics' | 'Marketing' }[] = [
    { key: 'gtmId', label: 'Google Tag Manager', placeholder: 'GTM-ABC1234', help: 'tagmanager.google.com, the ID at the top of your container.', kind: 'Analytics' },
    { key: 'ga4Id', label: 'Google Analytics 4', placeholder: 'G-ABC123DEF4', help: 'Analytics, Admin, Data streams, your web stream: Measurement ID. Not needed if GA4 is set up inside Tag Manager.', kind: 'Analytics' },
    { key: 'clarityId', label: 'Microsoft Clarity', placeholder: 'abcd1234ef', help: 'clarity.microsoft.com, Settings, Setup: Project ID.', kind: 'Analytics' },
    { key: 'metaPixelId', label: 'Meta Pixel (Facebook, Instagram)', placeholder: '1234567890123456', help: 'Meta Events Manager, Data sources: the Pixel ID (numbers only).', kind: 'Marketing' },
    { key: 'tiktokPixelId', label: 'TikTok Pixel', placeholder: 'C1A2B3C4D5E6F7G8H9I0', help: 'TikTok Ads Manager, Assets, Events, Web events: Pixel ID.', kind: 'Marketing' },
];

/** How a page looks in Google's results, so length problems are obvious. */
function SearchPreview({ path, title, description }: { path: string; title: string; description: string }) {
    const shortTitle = title.length > 60 ? `${title.slice(0, 58)}…` : title;
    const shortDesc = description.length > 155 ? `${description.slice(0, 153)}…` : description;
    return (
        <div className="rounded-xl border bg-white p-3 text-left dark:bg-neutral-950" aria-label="Search result preview">
            <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">{SITE.replace(/^https?:\/\//, '')}{path === '/' ? '' : ` › ${path.slice(1).replace(/\//g, ' › ')}`}</p>
            <p className="truncate text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{shortTitle || 'Page title'}</p>
            <p className="line-clamp-2 text-sm text-neutral-700 dark:text-neutral-300">{shortDesc || 'The description people see under the title in search results.'}</p>
        </div>
    );
}

const Count = ({ n, ideal, max }: { n: number; ideal: [number, number]; max: number }) => (
    <span className={cn('text-xs', n === 0 ? 'text-muted-foreground' : n > max ? 'font-semibold text-red-600' : n < ideal[0] || n > ideal[1] ? 'text-amber-600' : 'text-green-600')}>{n}/{max}</span>
);

function PageEditor({ page, value, onChange, aiReady }: { page: SeoPage; value: PageText; onChange: (v: PageText) => void; aiReady: boolean }) {
    const [focus, setFocus] = useState('');
    const [draft, setDraft] = useState<Draft | null>(null);
    const ai = useMutation({
        mutationFn: () => api.post('/seo/ai', { path: page.path, focus }),
        onSuccess: (d: Draft) => setDraft(d),
        onError: (e: Error) => toast.error(e.message),
    });
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{page.name} <span className="font-mono text-xs font-normal text-muted-foreground">{page.path}</span></CardTitle>
                    {(value.title || value.description) ? <Badge variant="secondary">Custom</Badge> : <Badge variant="outline">Built-in text</Badge>}
                </div>
                <CardDescription>{page.purpose}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between"><Label htmlFor={`t-${page.path}`}>Title</Label><Count n={(value.title ?? '').length} ideal={[30, 60]} max={60} /></div>
                        <Input id={`t-${page.path}`} value={value.title ?? ''} maxLength={70} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Leave empty to use the built-in title" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between"><Label htmlFor={`d-${page.path}`}>Description</Label><Count n={(value.description ?? '').length} ideal={[120, 155]} max={155} /></div>
                        <Textarea id={`d-${page.path}`} rows={3} value={value.description ?? ''} maxLength={170} onChange={(e) => onChange({ ...value, description: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`k-${page.path}`}>Keywords (optional)</Label>
                        <Input id={`k-${page.path}`} value={value.keywords ?? ''} maxLength={300} onChange={(e) => onChange({ ...value, keywords: e.target.value })} placeholder="home cooked food, local chefs, London" />
                    </div>
                </div>
                <div className="space-y-3">
                    <SearchPreview path={page.path} title={value.title || `${page.name} | MYUKCHEF`} description={value.description ?? ''} />
                    <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                        <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />Write with Claude</p>
                        {aiReady ? (
                            <>
                                <Input value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={300} placeholder="Optional focus, e.g. 'Nigerian food in London' or 'office lunches'" aria-label="What to focus on" />
                                <Button size="sm" onClick={() => ai.mutate()} disabled={ai.isPending}>
                                    {ai.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}{draft ? 'Try again' : 'Suggest wording'}
                                </Button>
                                {draft && (
                                    <div className="space-y-2 rounded-lg bg-background p-3 text-sm">
                                        <p><span className="text-muted-foreground">Title:</span> {draft.title}</p>
                                        <p><span className="text-muted-foreground">Description:</span> {draft.description}</p>
                                        <p><span className="text-muted-foreground">Keywords:</span> {draft.keywords.join(', ')}</p>
                                        {draft.notes && <p className="text-xs text-muted-foreground">{draft.notes}</p>}
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => { onChange({ title: draft.title, description: draft.description, keywords: draft.keywords.join(', ') }); setDraft(null); toast.success('Added. Check it, then save.'); }}><Check className="mr-1.5 h-4 w-4" />Use this</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>Discard</Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Add a Claude API key under <Link to="/admin/payments-email" className="font-semibold text-primary underline">Payments & keys</Link> to get suggested wording.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/** Super Admin: search engine text, verification and tracking tags (Google Tag Manager, GA4, pixels). */
const SeoSettings = () => {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery<{ config: Config; pages: SeoPage[]; aiReady: boolean }>({ queryKey: ['admin-seo'], queryFn: () => api.get('/seo') });
    const [config, setConfig] = useState<Config | null>(null);
    const [uploading, setUploading] = useState(false);
    useEffect(() => { if (data && !config) setConfig(data.config); }, [data, config]);

    const save = useMutation({
        mutationFn: () => api.put('/seo', config),
        onSuccess: (r: { config: Config }) => {
            setConfig(r.config);
            qc.setQueryData(['admin-seo'], (old: typeof data) => (old ? { ...old, config: r.config } : old));
            qc.invalidateQueries({ queryKey: ['seo-public'] });
            toast.success('SEO settings saved. Pages update within a few minutes.');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading || !data || !config) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    const set = (patch: Partial<Config>) => setConfig((c) => (c ? { ...c, ...patch } : c));
    const tagCount = Object.values(config.tracking).filter(Boolean).length;

    return (
        <div className="max-w-5xl space-y-6 pb-24">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">SEO and tracking</h1>
                <p className="mt-1 text-muted-foreground">How MYUKCHEF appears in Google and other search engines, and the analytics and advertising tags on the website. Tags only load for visitors who agree to cookies.</p>
            </div>

            <Tabs defaultValue="pages">
                <TabsList className="flex h-auto flex-wrap justify-start">
                    <TabsTrigger value="pages"><Search className="mr-1.5 h-4 w-4" />Page titles</TabsTrigger>
                    <TabsTrigger value="tracking"><BarChart3 className="mr-1.5 h-4 w-4" />Tracking tags{tagCount ? ` (${tagCount})` : ''}</TabsTrigger>
                    <TabsTrigger value="verify"><ShieldCheck className="mr-1.5 h-4 w-4" />Verification</TabsTrigger>
                    <TabsTrigger value="site"><Globe className="mr-1.5 h-4 w-4" />Whole site</TabsTrigger>
                </TabsList>

                <TabsContent value="pages" className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">Leave a page empty to keep its built-in text. Titles work best at 30 to 60 characters and descriptions at 120 to 155. Dish and chef pages use their own names and descriptions automatically.</p>
                    {data.pages.map((p) => (
                        <PageEditor key={p.path} page={p} aiReady={data.aiReady} value={config.pages[p.path] ?? {}} onChange={(v) => set({ pages: { ...config.pages, [p.path]: v } })} />
                    ))}
                </TabsContent>

                <TabsContent value="tracking" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Analytics and advertising tags</CardTitle>
                            <CardDescription>
                                Paste the IDs; there's no code to add. Analytics tags load only for visitors who allow analytics cookies, and advertising pixels only for those who allow marketing cookies, as UK law requires.
                                Once a tag is added, the cookie banner lists it and asks visitors again.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            {TAGS.map((tag) => (
                                <div key={tag.key} className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor={`tag-${tag.key}`}>{tag.label}</Label>
                                        <Badge variant="outline" className="text-[10px]">{tag.kind}</Badge>
                                    </div>
                                    <Input id={`tag-${tag.key}`} value={config.tracking[tag.key]} placeholder={tag.placeholder} autoComplete="off" spellCheck={false}
                                        onChange={(e) => set({ tracking: { ...config.tracking, [tag.key]: e.target.value.trim() } })} />
                                    <p className="text-xs text-muted-foreground">{tag.help}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <p className="text-sm text-muted-foreground">Tip: if you use Google Tag Manager, add GA4 and other tags inside Tag Manager and leave their boxes here empty, so nothing is counted twice. Custom HTML tags in Tag Manager may be blocked by the site's security policy; use Google's built-in tag types.</p>
                </TabsContent>

                <TabsContent value="verify" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search engine verification</CardTitle>
                            <CardDescription>Proves to Google, Bing and Pinterest that you own the site. Choose the "HTML tag" method there, then paste the code or the whole tag.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {([['google', 'Google Search Console'], ['bing', 'Bing Webmaster Tools'], ['pinterest', 'Pinterest']] as const).map(([key, label]) => (
                                <div key={key} className="space-y-1">
                                    <Label htmlFor={`v-${key}`}>{label}</Label>
                                    <Input id={`v-${key}`} value={config.verification[key]} spellCheck={false} placeholder={'<meta name="..." content="..." />'} onChange={(e) => set({ verification: { ...config.verification, [key]: e.target.value } })} />
                                </div>
                            ))}
                            <p className="text-xs text-muted-foreground">Your sitemap for Search Console: <span className="font-mono">{SITE}/sitemap.xml</span></p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="site" className="pt-4">
                    <Card>
                        <CardHeader><CardTitle>Whole site</CardTitle></CardHeader>
                        <CardContent className="space-y-5">
                            <label className="flex items-start justify-between gap-4 rounded-xl border p-3">
                                <span>
                                    <span className="block font-semibold">Show the site in search engines</span>
                                    <span className="block text-sm text-muted-foreground">Turn off only while the site isn't ready (for example on a test copy). Pages then ask search engines not to list them.</span>
                                </span>
                                <Switch checked={config.allowIndexing} onCheckedChange={(allowIndexing) => set({ allowIndexing })} />
                            </label>
                            <div className="space-y-1">
                                <div className="flex justify-between"><Label htmlFor="def-desc">Home page description</Label><Count n={config.defaults.description.length} ideal={[120, 155]} max={155} /></div>
                                <Textarea id="def-desc" rows={2} maxLength={170} value={config.defaults.description} onChange={(e) => set({ defaults: { ...config.defaults, description: e.target.value } })} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="def-kw">Keywords for every page (optional)</Label>
                                <Input id="def-kw" maxLength={300} value={config.defaults.keywords} onChange={(e) => set({ defaults: { ...config.defaults, keywords: e.target.value } })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Sharing image</Label>
                                <p className="text-xs text-muted-foreground">Shown when someone shares a MYUKCHEF link on WhatsApp, Facebook or X. 1200 × 630 pixels works best.</p>
                                <div className="flex items-center gap-3">
                                    <img src={config.defaults.ogImage || '/og-image.jpg'} alt="" className="h-16 w-32 rounded-md border object-cover" />
                                    <Label htmlFor="og-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}Change image
                                    </Label>
                                    <input id="og-upload" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        e.target.value = '';
                                        if (!file) return;
                                        setUploading(true);
                                        try { set({ defaults: { ...config.defaults, ogImage: await uploadImage(file) } }); } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed'); } finally { setUploading(false); }
                                    }} />
                                    {config.defaults.ogImage && <Button size="sm" variant="ghost" onClick={() => set({ defaults: { ...config.defaults, ogImage: '' } })}>Use the default</Button>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 pr-24 backdrop-blur md:left-64 md:pr-3">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{config.updatedAt ? `Last saved ${new Date(config.updatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Not saved yet'}</p>
                    <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save changes</Button>
                </div>
            </div>
        </div>
    );
};

export default SeoSettings;
