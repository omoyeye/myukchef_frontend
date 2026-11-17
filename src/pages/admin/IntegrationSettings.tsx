import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Copy, CreditCard, Eye, EyeOff, Loader2, Mail, PlugZap, Sparkles, Trash2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Provider = 'stripe' | 'brevo' | 'claude';
interface Field { label: string; secret: boolean; source: 'saved' | 'server' | 'default' | 'none'; isSet: boolean; value: string }
interface ProviderView {
    provider: Provider;
    updatedAt: string | null;
    unreadable: boolean;
    fields: Record<string, Field>;
    enabled?: boolean;
    switchedOff?: boolean;
    testMode?: boolean;
    webhookUrl?: string;
}
type Integrations = Record<Provider, ProviderView>;

const SOURCE_LABEL: Record<Field['source'], string> = {
    saved: 'Saved here',
    server: 'From server settings',
    default: 'Default',
    none: 'Not set',
};

const HELP: Record<string, string> = {
    'stripe.secretKey': 'Stripe dashboard → Developers → API keys. Starts with sk_test_ or sk_live_.',
    'stripe.publishableKey': 'On the same page. Starts with pk_test_ or pk_live_.',
    'stripe.webhookSecret': 'Stripe dashboard → Developers → Webhooks → add the address below, then copy its signing secret (whsec_…).',
    'brevo.apiKey': 'Brevo → SMTP & API → API keys. Starts with xkeysib-.',
    'brevo.senderEmail': 'Must be a sender you have verified in Brevo.',
    'brevo.supportEmail': 'Where messages from the Support page go.',
    'claude.apiKey': 'console.anthropic.com, API keys: create a key. Starts with sk-ant-. Used only by Super Admins to draft wording.',
    'brevo.smsSender': 'Shown as the sender of text messages. Up to 11 letters or numbers.',
};

const IntegrationSettings = () => {
    const { data, isLoading } = useQuery<Integrations>({ queryKey: ['admin-integrations'], queryFn: () => api.get('/admin/integrations') });

    if (isLoading || !data) {
        return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Payments and keys</h1>
                <p className="text-muted-foreground mt-1">
                    Keys for Stripe (card payments), Brevo (email and text messages) and Claude (AI writing help). Only Super Admins can see this page.
                    Secret keys are stored encrypted and are never shown again in full.
                </p>
            </div>
            <ProviderCard
                view={data.stripe}
                icon={<CreditCard className="h-5 w-5" />}
                title="Stripe card payments"
                description="While Stripe is set up and switched on, customers pay by card before their order reaches the chefs. Cancelling a paid order refunds it."
            />
            <ProviderCard
                view={data.brevo}
                icon={<Mail className="h-5 w-5" />}
                title="Brevo email and SMS"
                description="Sends order updates, sign-up emails, support messages and text messages."
            />
            <ProviderCard
                view={data.claude}
                icon={<Sparkles className="h-5 w-5" />}
                title="Claude AI writing help"
                description="Drafts search engine titles and descriptions on the SEO page. Nothing is published until you check and save it. Uses Anthropic's Claude Opus 5.5, billed to your Claude account."
            />
        </div>
    );
};

function ProviderCard({ view, icon, title, description }: { view: ProviderView; icon: React.ReactNode; title: string; description: string }) {
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [shown, setShown] = useState<Record<string, boolean>>({});
    const [confirmClear, setConfirmClear] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
    const changed = Object.keys(draft).length > 0;

    const refresh = (next: ProviderView) => {
        queryClient.setQueryData<Integrations>(['admin-integrations'], (old) => (old ? { ...old, [view.provider]: next } : old));
        queryClient.invalidateQueries({ queryKey: ['payment-config'] });
    };
    const save = useMutation({
        mutationFn: (body: Record<string, unknown>) => api.put(`/admin/integrations/${view.provider}`, body) as Promise<ProviderView>,
        onSuccess: (next) => { refresh(next); setDraft({}); setTestResult(null); toast.success('Saved'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const clear = useMutation({
        mutationFn: () => api.delete(`/admin/integrations/${view.provider}`) as Promise<ProviderView>,
        onSuccess: (next) => { refresh(next); setDraft({}); setTestResult(null); toast.success('Saved keys removed'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const test = useMutation({
        mutationFn: () => api.post(`/admin/integrations/${view.provider}/test`, {}) as Promise<{ ok: boolean; message: string }>,
        onSuccess: setTestResult,
        onError: (e: Error) => setTestResult({ ok: false, message: e.message }),
    });

    const hasSaved = Object.values(view.fields).some((f) => f.source === 'saved');
    const status = view.provider === 'stripe'
        ? view.enabled ? { label: view.testMode ? 'On · test mode' : 'On · live', tone: 'bg-green-600' } : view.switchedOff ? { label: 'Switched off', tone: 'bg-muted-foreground' } : { label: 'Not set up', tone: 'bg-amber-500' }
        : view.fields.apiKey?.isSet ? { label: 'Set up', tone: 'bg-green-600' } : { label: 'Not set up', tone: 'bg-amber-500' };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription className="mt-1">{description}</CardDescription>
                        </div>
                    </div>
                    <Badge className={`${status.tone} text-white shrink-0`}>{status.label}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {view.unreadable && (
                    <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                        The saved keys can't be read any more, usually because the server's AUTH_SECRET changed. Enter them again.
                    </p>
                )}
                {view.provider === 'stripe' && view.testMode && view.enabled && (
                    <p className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/10 p-3 text-sm">
                        Test mode: no real money is taken. Use Stripe's test card 4242 4242 4242 4242. Swap in live keys when you're ready to launch.
                    </p>
                )}

                {Object.entries(view.fields).map(([name, field]) => {
                    const id = `${view.provider}-${name}`;
                    const editing = name in draft;
                    return (
                        <div key={name} className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor={id}>{field.label}</Label>
                                <span className="text-xs text-muted-foreground">{SOURCE_LABEL[field.source]}</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id={id}
                                        type={field.secret && !shown[name] ? 'password' : 'text'}
                                        autoComplete="off"
                                        spellCheck={false}
                                        placeholder={field.secret ? (field.isSet ? `${field.value} (leave blank to keep)` : 'Paste the key') : field.value || 'Not set'}
                                        value={editing ? draft[name] : field.secret ? '' : field.value}
                                        onChange={(e) => setDraft((d) => ({ ...d, [name]: e.target.value }))}
                                        className="font-mono pr-10"
                                    />
                                    {field.secret && (
                                        <button
                                            type="button"
                                            aria-label={shown[name] ? 'Hide what you typed' : 'Show what you typed'}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShown((s) => ({ ...s, [name]: !s[name] }))}
                                        >
                                            {shown[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    )}
                                </div>
                                {field.source === 'saved' && (
                                    <Button type="button" variant="outline" size="sm" className="h-10" disabled={save.isPending} onClick={() => save.mutate({ [name]: '' })}>
                                        Remove
                                    </Button>
                                )}
                            </div>
                            {HELP[`${view.provider}.${name}`] && <p className="text-xs text-muted-foreground">{HELP[`${view.provider}.${name}`]}</p>}
                        </div>
                    );
                })}

                {view.provider === 'stripe' && view.webhookUrl && (
                    <div className="space-y-2 rounded-xl bg-secondary/40 p-4">
                        <Label>Webhook address for Stripe</Label>
                        <div className="flex gap-2">
                            <Input readOnly value={view.webhookUrl} className="font-mono text-xs" />
                            <Button type="button" variant="outline" size="icon" aria-label="Copy webhook address" onClick={() => { navigator.clipboard?.writeText(view.webhookUrl!); toast.success('Copied'); }}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            In Stripe, add this as a webhook endpoint and pick the events checkout.session.completed, checkout.session.expired,
                            checkout.session.async_payment_succeeded and checkout.session.async_payment_failed.
                        </p>
                    </div>
                )}

                {view.provider === 'stripe' && view.fields.secretKey?.isSet && (
                    <div className="flex items-center justify-between rounded-xl border p-4">
                        <div>
                            <Label htmlFor="stripe-enabled">Take card payments at checkout</Label>
                            <p className="text-xs text-muted-foreground mt-1">Switch off to take orders without payment, for example while fixing a Stripe problem.</p>
                        </div>
                        <Switch id="stripe-enabled" checked={!view.switchedOff} disabled={save.isPending} onCheckedChange={(on) => save.mutate({ enabled: on })} />
                    </div>
                )}

                {testResult && (
                    <p role="status" className={`flex items-start gap-2 rounded-xl p-3 text-sm ${testResult.ok ? 'bg-green-50 text-green-800 dark:bg-green-900/10 dark:text-green-400' : 'bg-destructive/5 text-destructive'}`}>
                        {testResult.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                        {testResult.message}
                    </p>
                )}
                {view.updatedAt && <p className="text-xs text-muted-foreground">Last changed {new Date(view.updatedAt).toLocaleString('en-GB')}</p>}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 justify-between">
                <div className="flex gap-2">
                    <Button disabled={!changed || save.isPending} onClick={() => save.mutate(Object.fromEntries(Object.entries(draft).filter(([, v]) => v.trim() !== '')))}>
                        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                    </Button>
                    {changed && <Button variant="ghost" onClick={() => setDraft({})}>Discard changes</Button>}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled={test.isPending || changed} title={changed ? 'Save first' : undefined} onClick={() => test.mutate()}>
                        {test.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}Test connection
                    </Button>
                    {hasSaved && (
                        <Button variant="outline" className="text-destructive" onClick={() => setConfirmClear(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />Remove saved keys
                        </Button>
                    )}
                </div>
            </CardFooter>

            <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove the saved {view.provider === 'stripe' ? 'Stripe' : view.provider === 'claude' ? 'Claude' : 'Brevo'} keys?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {view.provider === 'stripe'
                                ? "Unless the server has its own Stripe keys, checkout will stop taking card payments and orders will be placed unpaid."
                                : view.provider === 'claude'
                                    ? "AI writing help on the SEO page will stop, unless the server has its own Claude key."
                                    : "Unless the server has its own Brevo key, emails and text messages will stop sending."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep them</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => clear.mutate()}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

export default IntegrationSettings;
