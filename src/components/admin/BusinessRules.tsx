import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Gift, KeyRound, Loader2, Percent, Save, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Settings = Record<string, unknown>;

/** Who can sell, VAT on MYUKCHEF's commission, and the refer-a-friend reward. */
export function BusinessRules() {
    const qc = useQueryClient();
    const { data: settings = {} } = useQuery<Settings>({ queryKey: ['admin-settings'], queryFn: () => api.get('/settings') });
    const selling = (settings.selling_rules ?? {}) as { requireHygiene?: boolean };
    const vat = (settings.vat_config ?? {}) as { registered?: boolean; rate?: number; number?: string };
    const referral = (settings.referral_config ?? {}) as { enabled?: boolean; points?: number };
    const codeRules = (settings.delivery_code_config ?? {}) as { mode?: string; overAmount?: number };

    const [requireHygiene, setRequireHygiene] = useState(true);
    const [vatOn, setVatOn] = useState(false);
    const [vatRate, setVatRate] = useState('20');
    const [vatNumber, setVatNumber] = useState('');
    const [refOn, setRefOn] = useState(true);
    const [refPoints, setRefPoints] = useState('500');
    const [codeMode, setCodeMode] = useState('first');
    const [codeOver, setCodeOver] = useState('50');
    useEffect(() => {
        setCodeMode(codeRules.mode ?? 'first'); setCodeOver(String(codeRules.overAmount ?? 50));
        setRequireHygiene(selling.requireHygiene !== false);
        setVatOn(vat.registered === true); setVatRate(String(vat.rate ?? 20)); setVatNumber(vat.number ?? '');
        setRefOn(referral.enabled !== false); setRefPoints(String(referral.points ?? 500));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    const save = useMutation({
        mutationFn: ({ key, value }: { key: string; value: unknown }) => api.post('/settings', { key, value }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-settings'] }); qc.invalidateQueries({ queryKey: ['site-settings'] }); toast.success('Saved'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const saveButton = (key: string, value: unknown) => (
        <CardFooter className="border-t bg-muted/50 px-6 py-4">
            <Button onClick={() => save.mutate({ key, value })} disabled={save.isPending}>
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
            </Button>
        </CardFooter>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Delivery codes</CardTitle>
                    <CardDescription>
                        Like Uber Eats: the customer gets a 4-digit code on their order page and in their messages, and gives it to whoever hands over the food.
                        The chef can't mark the order delivered or collected without it. After five wrong tries the order locks and you're told.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <fieldset className="space-y-2" aria-label="Which orders need a code">
                        {[
                            ['first', "A customer's first order", 'Recommended. Protects new customers and chefs when they don\'t know each other yet.'],
                            ['over', 'First orders, and orders over an amount', 'Also asks for a code on bigger orders.'],
                            ['all', 'Every order', 'The most secure, with one extra step at every handover.'],
                            ['off', 'Never', 'No delivery codes.'],
                        ].map(([value, label, hint]) => (
                            <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <input type="radio" name="code-mode" value={value} checked={codeMode === value} onChange={() => setCodeMode(value)} className="mt-1 accent-primary" />
                                <span><span className="block font-semibold">{label}</span><span className="block text-sm text-muted-foreground">{hint}</span></span>
                            </label>
                        ))}
                    </fieldset>
                    {codeMode === 'over' && (
                        <div className="grid max-w-xs gap-1"><Label htmlFor="code-over">Orders of at least (£)</Label><Input id="code-over" type="number" min="1" step="0.01" value={codeOver} onChange={(e) => setCodeOver(e.target.value)} /></div>
                    )}
                </CardContent>
                {saveButton('delivery_code_config', { mode: codeMode, overAmount: Number(codeOver) })}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Who can sell</CardTitle>
                    <CardDescription>Keeps customers safe and protects MYUKCHEF.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
                        <div>
                            <Label htmlFor="require-hygiene" className="font-semibold">Only sell from chefs with a verified food hygiene certificate</Label>
                            <p className="text-sm text-muted-foreground">Recommended. An approved chef's dishes stay off the menu until you verify their certificate under Chefs, Certificates.</p>
                        </div>
                        <Switch id="require-hygiene" checked={requireHygiene} onCheckedChange={setRequireHygiene} />
                    </div>
                </CardContent>
                {saveButton('selling_rules', { requireHygiene })}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-primary" />VAT</CardTitle>
                    <CardDescription>Ask your accountant. Once MYUKCHEF is VAT registered, chef invoices show the VAT included in the commission.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="vat-registered">MYUKCHEF is VAT registered</Label>
                        <Switch id="vat-registered" checked={vatOn} onCheckedChange={setVatOn} />
                    </div>
                    {vatOn && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1"><Label htmlFor="vat-rate">VAT rate (%)</Label><Input id="vat-rate" type="number" min="0" max="30" value={vatRate} onChange={(e) => setVatRate(e.target.value)} /></div>
                            <div className="grid gap-1"><Label htmlFor="vat-number">VAT number</Label><Input id="vat-number" maxLength={20} placeholder="GB123456789" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} /></div>
                        </div>
                    )}
                </CardContent>
                {saveButton('vat_config', { registered: vatOn, rate: Number(vatRate), number: vatNumber.trim() })}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" />Refer a friend and loyalty</CardTitle>
                    <CardDescription>Rewards are now wallet credit in pounds, which you release. Set the amounts under Marketing, Wallets &amp; rewards.</CardDescription>
                </CardHeader>
                <CardContent><Button asChild variant="outline"><a href="/admin/wallets?tab=rules">Open Wallets &amp; rewards</a></Button></CardContent>
            </Card>
        </div>
    );
}
