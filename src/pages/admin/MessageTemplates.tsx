import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, Loader2, Mail, MessageSquareText, RotateCcw, Search, Send, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Channel = 'inApp' | 'push' | 'email' | 'sms';
type Field = 'title' | 'body' | 'pushTitle' | 'pushBody' | 'emailSubject' | 'emailBody' | 'sms';
type Saved = Partial<Record<Field, string>> & { channels?: Partial<Record<Channel, boolean>> };
interface Template {
    key: string;
    group: string;
    audience: 'customer' | 'chef' | 'admin';
    name: string;
    vars: string[];
    title: string;
    body: string;
    sms?: string;
    channels: Record<Channel, boolean>;
    unavailable?: Channel[];
    saved: Saved | null;
}

const CHANNELS: { key: Channel; label: string; icon: typeof Bell }[] = [
    { key: 'inApp', label: 'In-app', icon: Bell },
    { key: 'push', label: 'Push', icon: Smartphone },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'sms', label: 'Text', icon: MessageSquareText },
];
const AUDIENCE: Record<Template['audience'], string> = { customer: 'Customers', chef: 'Chefs', admin: 'Your team' };
const LIMITS: Record<Field, number> = { title: 150, body: 2000, pushTitle: 100, pushBody: 300, emailSubject: 200, emailBody: 8000, sms: 612 };
const FIELDS: Field[] = ['title', 'body', 'pushTitle', 'pushBody', 'emailSubject', 'emailBody', 'sms'];

/** Texts are possible only for customers, where an order gives us their phone number. */
const smsPossible = (t: Template) => !t.unavailable?.includes('sms') && (!!t.sms || t.audience === 'customer');
const channelsOf = (t: Template) => {
    const c = { ...t.channels, ...(t.saved?.channels ?? {}) };
    for (const u of t.unavailable ?? []) c[u] = false;
    if (!smsPossible(t)) c.sms = false;
    return c;
};
const fillSample = (text: string, sample: Record<string, string>) =>
    text.replace(/\{\{\s*([a-zA-Z]\w*)\s*\}\}/g, (_, name: string) => (name === 'siteName' ? 'MYUKCHEF' : sample[name] ?? `{{${name}}}`));

const MessageTemplates = () => {
    const { data, isLoading } = useQuery<{ templates: Template[]; sampleValues: Record<string, string> }>({
        queryKey: ['admin-templates'],
        queryFn: () => api.get('/admin/templates'),
    });
    const [query, setQuery] = useState('');
    const [audience, setAudience] = useState<'all' | Template['audience']>('all');
    const [editing, setEditing] = useState<string | null>(null);

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = (data?.templates ?? []).filter((t) =>
            (audience === 'all' || t.audience === audience)
            && (!q || [t.name, t.title, t.body, t.key, t.saved?.title ?? ''].some((s) => s.toLowerCase().includes(q))));
        const map = new Map<string, Template[]>();
        for (const t of list) map.set(t.group, [...(map.get(t.group) ?? []), t]);
        return [...map.entries()];
    }, [data, query, audience]);

    if (isLoading || !data) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    const edited = data.templates.filter((t) => t.saved).length;
    const current = data.templates.find((t) => t.key === editing) ?? null;

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                <p className="text-muted-foreground mt-1">
                    The wording of every notice MYUKCHEF sends: in the app, as a push notification, by email and by text.
                    Every email uses your branded layout, with the logo, phone number, address and social links from Settings.
                </p>
                <p className="text-sm text-muted-foreground mt-2">{data.templates.length} messages, {edited} changed from the default.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages" className="pl-9" aria-label="Search messages" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {(['all', 'customer', 'chef', 'admin'] as const).map((a) => (
                        <Button key={a} size="sm" variant={audience === a ? 'default' : 'outline'} onClick={() => setAudience(a)}>
                            {a === 'all' ? 'Everyone' : AUDIENCE[a]}
                        </Button>
                    ))}
                </div>
            </div>

            {groups.length === 0 && <p className="text-muted-foreground py-12 text-center">No messages match your search.</p>}

            {groups.map(([group, list]) => (
                <section key={group} className="space-y-2">
                    <h2 className="text-lg font-semibold">{group}</h2>
                    <Card>
                        <CardContent className="p-0 divide-y">
                            {list.map((t) => {
                                const on = channelsOf(t);
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setEditing(t.key)}
                                        className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{t.name}</span>
                                                <Badge variant="secondary">{AUDIENCE[t.audience]}</Badge>
                                                {t.saved && <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Edited</Badge>}
                                            </div>
                                            <p className="truncate text-sm text-muted-foreground">{t.saved?.title || t.title}</p>
                                        </div>
                                        <div className="flex shrink-0 gap-1.5" aria-label="Channels">
                                            {CHANNELS.map(({ key, label, icon: Icon }) => (
                                                <span
                                                    key={key}
                                                    title={`${label}: ${on[key] ? 'on' : 'off'}`}
                                                    className={`flex h-7 w-7 items-center justify-center rounded-full ${on[key] ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground/40'}`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    <span className="sr-only">{label} {on[key] ? 'on' : 'off'}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>
                </section>
            ))}

            <Sheet open={!!current} onOpenChange={(open) => !open && setEditing(null)}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                    {current && <Editor key={current.key} template={current} sample={data.sampleValues} onDone={() => setEditing(null)} />}
                </SheetContent>
            </Sheet>
        </div>
    );
};

function Editor({ template: t, sample, onDone }: { template: Template; sample: Record<string, string>; onDone: () => void }) {
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState<Partial<Record<Field, string>>>(() => Object.fromEntries(FIELDS.map((f) => [f, t.saved?.[f] ?? ''])));
    const [channels, setChannels] = useState(() => channelsOf(t));
    const [confirmReset, setConfirmReset] = useState(false);
    const [tab, setTab] = useState('app');
    const focused = useRef<{ field: Field; el: HTMLInputElement | HTMLTextAreaElement } | null>(null);

    // What each field falls back to when left blank, so the admin can see what will be sent.
    const fallback: Record<Field, string> = {
        title: t.title,
        body: t.body,
        pushTitle: draft.title || t.title,
        pushBody: draft.body || t.body,
        emailSubject: draft.title || t.title,
        emailBody: draft.body || t.body,
        sms: t.sms ?? `MYUKCHEF: ${draft.body || t.body}`,
    };
    const valueOf = (f: Field) => draft[f] || fallback[f];

    const refresh = (saved: Template) => {
        queryClient.setQueryData<{ templates: Template[]; sampleValues: Record<string, string> }>(['admin-templates'], (old) =>
            old ? { ...old, templates: old.templates.map((x) => (x.key === saved.key ? saved : x)) } : old);
    };
    const save = useMutation({
        mutationFn: () => api.put(`/admin/templates/${t.key}`, { ...draft, channels }),
        onSuccess: (saved: Template) => { refresh(saved); toast.success('Message saved'); onDone(); },
        onError: (e: Error) => toast.error(e.message),
    });
    const reset = useMutation({
        mutationFn: () => api.delete(`/admin/templates/${t.key}`),
        onSuccess: (saved: Template) => { refresh(saved); toast.success('Back to the default wording'); onDone(); },
        onError: (e: Error) => toast.error(e.message),
    });
    const sendTest = useMutation({
        mutationFn: () => api.post(`/admin/templates/${t.key}/test`, { emailSubject: valueOf('emailSubject'), emailBody: valueOf('emailBody') }),
        onSuccess: (r: { sentTo: string }) => toast.success(`Test email sent to ${r.sentTo}`),
        onError: (e: Error) => toast.error(e.message),
    });

    // The branded email, refreshed a moment after the admin stops typing.
    const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
    useEffect(() => {
        if (tab !== 'email') return;
        const timer = setTimeout(() => {
            api.post(`/admin/templates/${t.key}/preview`, { emailSubject: draft.emailSubject || draft.title || '', emailBody: draft.emailBody || draft.body || '' })
                .then(setPreview)
                .catch(() => setPreview(null));
        }, 400);
        return () => clearTimeout(timer);
    }, [tab, t.key, draft.emailSubject, draft.emailBody, draft.title, draft.body]);

    const insert = (name: string) => {
        const target = focused.current;
        const token = `{{${name}}}`;
        if (!target) { navigator.clipboard?.writeText(token).catch(() => undefined); toast.message(`Copied ${token}. Click into a box first to insert it.`); return; }
        const { field, el } = target;
        const current = draft[field] ?? '';
        const start = el.selectionStart ?? current.length;
        const end = el.selectionEnd ?? current.length;
        const next = (current || '').slice(0, start) + token + (current || '').slice(end);
        setDraft((d) => ({ ...d, [field]: next.slice(0, LIMITS[field]) }));
        requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
    };

    const box = (field: Field, label: string, multiline: boolean, hint?: string) => (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`f-${field}`}>{label}</Label>
                <span className="text-xs text-muted-foreground">{(draft[field] ?? '').length}/{LIMITS[field]}</span>
            </div>
            {multiline ? (
                <Textarea
                    id={`f-${field}`}
                    rows={field === 'emailBody' ? 7 : 3}
                    value={draft[field] ?? ''}
                    maxLength={LIMITS[field]}
                    placeholder={fallback[field]}
                    onFocus={(e) => { focused.current = { field, el: e.currentTarget }; }}
                    onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                />
            ) : (
                <Input
                    id={`f-${field}`}
                    value={draft[field] ?? ''}
                    maxLength={LIMITS[field]}
                    placeholder={fallback[field]}
                    onFocus={(e) => { focused.current = { field, el: e.currentTarget }; }}
                    onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                />
            )}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );

    const smsText = fillSample(valueOf('sms'), sample);
    const smsParts = Math.max(1, Math.ceil(smsText.length / 153));

    return (
        <div className="space-y-6 pb-6">
            <SheetHeader>
                <SheetTitle>{t.name}</SheetTitle>
                <SheetDescription>
                    Sent to {AUDIENCE[t.audience].toLowerCase()}. Leave a box empty to keep the default wording, shown in grey.
                </SheetDescription>
            </SheetHeader>

            <div className="space-y-2">
                <Label>Send by</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CHANNELS.map(({ key, label, icon: Icon }) => {
                        const possible = key === 'sms' ? smsPossible(t) : !t.unavailable?.includes(key);
                        return (
                            <label key={key} className={`flex items-center justify-between gap-2 rounded-lg border p-3 ${possible ? '' : 'opacity-50'}`}>
                                <span className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4" />{label}</span>
                                <Switch checked={channels[key]} disabled={!possible} onCheckedChange={(v) => setChannels((c) => ({ ...c, [key]: v }))} aria-label={`Send by ${label}`} />
                            </label>
                        );
                    })}
                </div>
                {!smsPossible(t) && <p className="text-xs text-muted-foreground">Texts are only for customer order updates, where we have a phone number.</p>}
            </div>

            <div className="space-y-2">
                <Label>Details you can add</Label>
                <div className="flex flex-wrap gap-1.5">
                    {[...t.vars, 'siteName'].map((v) => (
                        <button key={v} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(v)}
                            className="rounded-md border bg-muted/50 px-2 py-1 font-mono text-xs hover:bg-muted" title={`Example: ${v === 'siteName' ? 'MYUKCHEF' : sample[v] ?? ''}`}>
                            {`{{${v}}}`}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">Click a box, then a detail to add it where your cursor is.</p>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="app">App and push</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="sms" disabled={!smsPossible(t)}>Text</TabsTrigger>
                </TabsList>

                <TabsContent value="app" className="space-y-4 pt-2">
                    {box('title', 'Title', false)}
                    {box('body', 'Message', true)}
                    {box('pushTitle', 'Push notification title', false, 'Optional. Uses the title above if empty.')}
                    {box('pushBody', 'Push notification text', true, 'Optional. Keep it short: phones cut long text.')}
                    <div className="rounded-xl border bg-muted/40 p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">Phone preview</p>
                        <div className="rounded-lg bg-background p-3 shadow-sm">
                            <p className="text-sm font-semibold">{fillSample(valueOf('pushTitle'), sample)}</p>
                            <p className="line-clamp-3 text-sm text-muted-foreground">{fillSample(valueOf('pushBody'), sample)}</p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 pt-2">
                    {box('emailSubject', 'Subject', false, 'Optional. Uses the title if empty.')}
                    {box('emailBody', 'Email text', true, 'Optional. Uses the message if empty. Leave a blank line between paragraphs.')}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Preview, with example details</p>
                            <Button size="sm" variant="outline" onClick={() => sendTest.mutate()} disabled={sendTest.isPending}>
                                {sendTest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Send me a test
                            </Button>
                        </div>
                        {preview ? (
                            <>
                                <p className="text-sm"><span className="text-muted-foreground">Subject:</span> {preview.subject}</p>
                                <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="h-[520px] w-full rounded-lg border bg-white" />
                            </>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-lg border"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4 pt-2">
                    {box('sms', 'Text message', true)}
                    <div className="rounded-xl border bg-muted/40 p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">Preview: {smsText.length} characters, sent as {smsParts} text{smsParts > 1 ? 's' : ''}</p>
                        <p className="max-w-xs rounded-2xl rounded-bl-sm bg-background p-3 text-sm shadow-sm">{smsText}</p>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
                <Button variant="ghost" onClick={() => setConfirmReset(true)} disabled={!t.saved || reset.isPending}>
                    <RotateCcw className="mr-2 h-4 w-4" />Reset to default
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onDone}>Cancel</Button>
                    <Button onClick={() => save.mutate()} disabled={save.isPending}>
                        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                    </Button>
                </div>
            </div>

            <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Go back to the default wording?</AlertDialogTitle>
                        <AlertDialogDescription>Your changes to "{t.name}" will be removed, and its channels set back to normal.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep my changes</AlertDialogCancel>
                        <AlertDialogAction onClick={() => reset.mutate()}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default MessageTemplates;
