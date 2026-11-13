import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, CreditCard, FileText, Loader2, Receipt, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvoiceStatus, type Invoice } from './InvoiceStatus';

interface PayoutData {
    invoices: Invoice[];
    payoutAccount: { connected: boolean; payoutsEnabled: boolean; stripeReady: boolean; needsMoreInfo?: boolean };
    rules: { percent: number; autoConfirmHours: number };
}

const money = (n: number) => `£${Number(n).toFixed(2)}`;

/** The chef's invoices: check and submit each one, get paid, and keep the receipts. */
export function ChefPayouts() {
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const { data, isLoading, refetch, isRefetching } = useQuery<PayoutData>({ queryKey: ['chef-payouts'], queryFn: () => api.get('/payouts/me') });
    const [submitting, setSubmitting] = useState<Invoice | null>(null);

    // Back from Stripe's sign-up: the status is refreshed when the data loads.
    useEffect(() => {
        const back = params.get('stripe');
        if (!back) return;
        if (back === 'done') toast.success('Thanks. Stripe is checking your details.');
        const next = new URLSearchParams(params);
        next.delete('stripe');
        setParams(next, { replace: true });
    }, [params, setParams]);

    const connect = useMutation({
        mutationFn: () => api.post('/payouts/me/connect', {}) as Promise<{ url: string }>,
        onSuccess: ({ url }) => window.location.assign(url),
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading || !data) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    const { invoices, payoutAccount: acct, rules } = data;
    const toSubmit = invoices.filter((i) => i.status === 'awaiting_chef');
    const paidTotal = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.netAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold">Payouts</h2>
                    <p className="text-muted-foreground">
                        Once your food is delivered and the customer confirms (or {rules.autoConfirmHours} hours pass without a problem), we raise an invoice for your sales less MYUKCHEF's {rules.percent}% commission.
                        Check it and submit it, and we pay you with a receipt for your records.
                    </p>
                </div>
                <Button variant="outline" className="h-11" onClick={() => refetch()} disabled={isRefetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            </div>

            <Card className={acct.payoutsEnabled ? 'border-green-300' : 'border-amber-300'}>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5 text-primary" />How we pay you</CardTitle>
                    <CardDescription>
                        {acct.payoutsEnabled
                            ? 'Your Stripe account is connected. Submitted invoices are paid to it automatically.'
                            : acct.stripeReady
                                ? "Connect a Stripe account to be paid automatically as soon as you submit an invoice. Until then, we pay you by bank transfer to the account under Safety and payouts."
                                : 'We pay you by bank transfer to the account under Safety and payouts.'}
                    </CardDescription>
                </CardHeader>
                {acct.stripeReady && !acct.payoutsEnabled && (
                    <CardContent>
                        {acct.needsMoreInfo && <p className="mb-3 flex items-center gap-2 text-sm text-amber-700"><AlertCircle className="h-4 w-4" />Stripe needs a few more details from you.</p>}
                        <Button className="h-11" onClick={() => connect.mutate()} disabled={connect.isPending}>
                            {connect.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{acct.connected ? 'Finish Stripe set-up' : 'Connect Stripe for automatic payouts'}
                        </Button>
                    </CardContent>
                )}
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Invoices to submit" value={String(toSubmit.length)} />
                <Stat label="Waiting to be paid" value={money(invoices.filter((i) => ['submitted', 'processing'].includes(i.status)).reduce((s, i) => s + i.netAmount, 0))} />
                <Stat label="Paid to you" value={money(paidTotal)} />
            </div>

            {invoices.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No invoices yet. They appear here once your deliveries are confirmed.</CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <Card key={invoice.id}>
                            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                                <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">{invoice.number}</span>
                                        <InvoiceStatus status={invoice.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{invoice.description} · {format(new Date(invoice.createdAt), 'd MMM yyyy')}</p>
                                    <p className="text-sm">
                                        {money(invoice.grossAmount)} sales − {money(invoice.commissionAmount)} commission ({invoice.commissionPercent}%) = <strong>{money(invoice.netAmount)}</strong>
                                    </p>
                                    {invoice.status === 'held' && invoice.holdReason && <p className="text-sm text-amber-700">On hold: {invoice.holdReason}</p>}
                                    {invoice.status === 'void' && invoice.holdReason && <p className="text-sm text-muted-foreground">{invoice.holdReason}</p>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {invoice.status === 'awaiting_chef' && <Button className="h-11" onClick={() => setSubmitting(invoice)}><FileText className="mr-2 h-4 w-4" />Check and submit</Button>}
                                    <Button asChild variant="outline" className="h-11">
                                        <Link to={`/chef/receipts/${invoice.id}`}>
                                            {invoice.status === 'paid' ? <><Receipt className="mr-2 h-4 w-4" />Receipt</> : <><FileText className="mr-2 h-4 w-4" />View invoice</>}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <SubmitInvoiceDialog
                invoice={submitting}
                legalName={submitting?.chefDetails?.legalName ?? ''}
                onClose={() => setSubmitting(null)}
                onDone={(paid) => {
                    setSubmitting(null);
                    qc.invalidateQueries({ queryKey: ['chef-payouts'] });
                    toast.success(paid ? 'Submitted and paid. Your receipt is ready.' : "Submitted. We'll pay you shortly.");
                }}
            />
        </div>
    );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></CardContent></Card>
);

function SubmitInvoiceDialog({ invoice, legalName, onClose, onDone }: { invoice: Invoice | null; legalName: string; onClose: () => void; onDone: (paid: boolean) => void }) {
    const [confirm, setConfirm] = useState(false);
    const [name, setName] = useState('');
    useEffect(() => { setConfirm(false); setName(legalName); }, [invoice, legalName]);
    const submit = useMutation({
        mutationFn: () => api.post(`/payouts/me/invoices/${invoice!.id}/submit`, { confirm: true, name }) as Promise<Invoice>,
        onSuccess: (result) => onDone(result.status === 'paid'),
        onError: (e: Error) => toast.error(e.message),
    });
    return (
        <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit {invoice?.number}</DialogTitle>
                    <DialogDescription>Check the figures. Once you submit, MYUKCHEF pays you this amount and issues a receipt.</DialogDescription>
                </DialogHeader>
                {invoice && (
                    <div className="space-y-4">
                        <dl className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
                            <Row label="For" value={invoice.description} />
                            <Row label="Your sales" value={money(invoice.grossAmount)} />
                            <Row label={`MYUKCHEF commission (${invoice.commissionPercent}%)`} value={`− ${money(invoice.commissionAmount)}`} />
                            <Row label="You receive" value={money(invoice.netAmount)} strong />
                        </dl>
                        <div className="flex items-start gap-3">
                            <Checkbox id="invoice-confirm" checked={confirm} onCheckedChange={(v) => setConfirm(v === true)} className="mt-0.5" />
                            <Label htmlFor="invoice-confirm" className="font-normal leading-snug">
                                I confirm I prepared and handed over this food, and that this invoice is correct.
                            </Label>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="invoice-name">Your full name</Label>
                            <Input id="invoice-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Not now</Button>
                    <Button onClick={() => submit.mutate()} disabled={!confirm || name.trim().length < 2 || submit.isPending}>
                        {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Submit invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className={`flex justify-between gap-4 ${strong ? 'border-t pt-2 font-bold' : ''}`}><dt>{label}</dt><dd>{value}</dd></div>
);
