import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Gift, Loader2, Percent, Save, ShieldCheck } from 'lucide-react';
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

    const [requireHygiene, setRequireHygiene] = useState(true);
    const [vatOn, setVatOn] = useState(false);
    const [vatRate, setVatRate] = useState('20');
    const [vatNumber, setVatNumber] = useState('');
    const [refOn, setRefOn] = useState(true);
    const [refPoints, setRefPoints] = useState('500');
    useEffect(() => {
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
                    <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" />Refer a friend</CardTitle>
                    <CardDescription>When someone joins with a friend's code and their first order is delivered, both get these points.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="referral-on">Refer a friend is on</Label>
                        <Switch id="referral-on" checked={refOn} onCheckedChange={setRefOn} />
                    </div>
                    <div className="grid gap-1 sm:max-w-xs">
                        <Label htmlFor="referral-points">Points each</Label>
                        <Input id="referral-points" type="number" min="0" value={refPoints} onChange={(e) => setRefPoints(e.target.value)} />
                    </div>
                </CardContent>
                {saveButton('referral_config', { enabled: refOn, points: Number(refPoints) })}
            </Card>
        </div>
    );
}
