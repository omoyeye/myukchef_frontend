import { useEffect, useState } from 'react';
import { DocumentButton } from '@/components/common/DocumentButton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Banknote, Eye, Loader2, PauseCircle, PlayCircle, RefreshCw, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InvoiceStatus, type Invoice } from './InvoiceStatus';

interface Delivery {
    id: number;
    orderId: number;
    orderStatus: string;
    paymentStatus: string;
    chefName: string;
    deliveryProof: string | null;
    deliveredAt: string | null;
    customerConfirmedAt: string | null;
    customerIssue: string | null;
    grossAmount: number;
    payoutAmount: number;
}
interface AdminPayoutData { invoices: Invoice[]; deliveries: Delivery[]; rules: { percent: number; autoConfirmHours: number } }

const money = (n: number) => `£${Number(n).toFixed(2)}`;
const FILTERS = [
    { id: 'todo', label: 'To pay', match: (i: Invoice) => ['submitted', 'processing'].includes(i.status) },
    { id: 'held', label: 'On hold', match: (i: Invoice) => i.status === 'held' },
    { id: 'paid', label: 'Paid', match: (i: Invoice) => i.status === 'paid' },
    { id: 'all', label: 'All', match: () => true },
] as const;

/**
 * The Super Admin's view of chef payments: deliveries waiting for the customer, problems to sort out,
 * invoices chefs have submitted, and every receipt. Automatic Stripe payouts happen without anyone here;
 * bank transfers are recorded by hand.
 */
export function AdminPayouts() {
    const qc = useQueryClient();
    const { data, isLoading, refetch, isRefetching } = useQuery<AdminPayoutData>({ queryKey: ['admin-payouts'], queryFn: () => api.get('/payouts/admin'), refetchInterval: 60_000 });
    const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('todo');
    const [paying, setPaying] = useState<Invoice | null>(null);
    const [holding, setHolding] = useState<Invoice | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);

    const done = (message: string) => () => { qc.invalidateQueries({ queryKey: ['admin-payouts'] }); toast.success(message); };
    const action = useMutation({
        mutationFn: ({ path, body }: { path: string; body?: unknown; message: string }) => api.post(path, body ?? {}),
        onSuccess: (_r, v) => done(v.message)(),
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading || !data) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    const { invoices, deliveries, rules } = data;
    const problems = deliveries.filter((d) => d.customerIssue);
    const waiting = deliveries.filter((d) => !d.customerIssue && !d.customerConfirmedAt);
    const shown = invoices.filter(FILTERS.find((f) => f.id === filter)!.match);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="max-w-3xl text-sm text-muted-foreground">
                    When a delivery is confirmed (or {rules.autoConfirmHours} hours pass without a problem), the chef gets an invoice for their sales less {rules.percent}% commission.
                    It's paid straight away by Stripe if they've connected it. Otherwise it waits here for you to pay by bank transfer, and goes by Stripe on its own once they connect. Hold any invoice you need to check first.
                </p>
                <Button variant="outline" className="h-10" onClick={() => refetch()} disabled={isRefetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            </div>

            <RulesCard rules={rules} />

            {problems.length > 0 && (
                <section aria-labelledby="problems-heading" className="space-y-2">
                    <h3 id="problems-heading" className="flex items-center gap-2 font-bold text-destructive"><AlertTriangle className="h-4 w-4" />Problems reported ({problems.length})</h3>
                    {problems.map((d) => (
                        <Card key={d.id} className="border-destructive/40">
                            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                                <div className="min-w-0 space-y-1">
                                    <p className="font-semibold">Order #{d.orderId} · {d.chefName} · {money(d.grossAmount)}</p>
                                    <p className="text-destructive">"{d.customerIssue}"</p>
                                    <p className="text-xs text-muted-foreground">Delivered {d.deliveredAt ? format(new Date(d.deliveredAt), 'd MMM, HH:mm') : ''}. Refund by cancelling the order under Live orders, or let the chef's invoice go ahead.</p>
                                </div>
                                <div className="flex gap-2">
                                    {d.deliveryProof && <Button variant="outline" size="sm" className="h-10" onClick={() => setPhoto(d.deliveryProof)}>Photo</Button>}
                                    <Button size="sm" className="h-10" disabled={action.isPending} onClick={() => action.mutate({ path: `/payouts/admin/deliveries/${d.id}/release`, message: 'Invoice raised for the chef' })}>Pay the chef anyway</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>
            )}

            <section aria-labelledby="invoices-heading" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="invoices-heading" className="font-bold">Chef invoices</h3>
                    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter invoices">
                        {FILTERS.map((f) => (
                            <button
                                key={f.id}
                                role="tab"
                                aria-selected={filter === f.id}
                                onClick={() => setFilter(f.id)}
                                className={cn('h-9 rounded-full border px-3 text-sm', filter === f.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary')}
                            >
                                {f.label} ({invoices.filter(f.match).length})
                            </button>
                        ))}
                    </div>
                </div>
                {shown.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing here.</p>}
                {shown.map((invoice) => (
                    <Card key={invoice.id}>
                        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                            <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold">{invoice.number}</span>
                                    <InvoiceStatus status={invoice.status} />
                                    {invoice.status !== 'paid' && <span className="text-xs text-muted-foreground">{invoice.stripeConnected ? 'Stripe connected' : 'Pays by bank transfer'}</span>}
                                </div>
                                <p>{invoice.chefName} · {invoice.description} · {format(new Date(invoice.createdAt), 'd MMM yyyy')}</p>
                                <p className="text-muted-foreground">{money(invoice.grossAmount)} − {money(invoice.commissionAmount)} ({invoice.commissionPercent}%) = <strong className="text-foreground">{money(invoice.netAmount)}</strong></p>
                                {invoice.payoutError && invoice.status === 'submitted' && <p className="text-amber-700">{invoice.payoutError}</p>}
                                {invoice.status === 'held' && invoice.holdReason && <p className="text-amber-700">On hold: {invoice.holdReason}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="ghost" size="sm" className="h-10"><Link to={`/admin/invoices/${invoice.id}`}><Eye className="mr-1 h-4 w-4" />{invoice.status === 'paid' ? 'Receipt' : 'Invoice'}</Link></Button>
                                <DocumentButton path={`payouts/${invoice.id}`} variant="ghost" size="sm" className="h-10" label="PDF" />
                                {invoice.status === 'submitted' && (
                                    <>
                                        {invoice.stripeConnected && <Button variant="outline" size="sm" className="h-10" disabled={action.isPending} onClick={() => action.mutate({ path: `/payouts/admin/invoices/${invoice.id}/retry`, message: 'Payout tried again' })}><RefreshCw className="mr-1 h-4 w-4" />Retry Stripe</Button>}
                                        <Button size="sm" className="h-10" onClick={() => setPaying(invoice)}><Banknote className="mr-1 h-4 w-4" />Record bank transfer</Button>
                                    </>
                                )}
                                {['awaiting_chef', 'submitted'].includes(invoice.status) && <Button variant="ghost" size="sm" className="h-10" onClick={() => setHolding(invoice)}><PauseCircle className="mr-1 h-4 w-4" />Hold</Button>}
                                {invoice.status === 'held' && <Button variant="outline" size="sm" className="h-10" disabled={action.isPending} onClick={() => action.mutate({ path: `/payouts/admin/invoices/${invoice.id}/release`, message: 'Released' })}><PlayCircle className="mr-1 h-4 w-4" />Release</Button>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            {waiting.length > 0 && (
                <section aria-labelledby="waiting-heading" className="space-y-2">
                    <h3 id="waiting-heading" className="font-bold">Waiting for the customer to confirm ({waiting.length})</h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {waiting.map((d) => (
                            <Card key={d.id}>
                                <CardContent className="space-y-1 p-3 text-sm">
                                    <p className="font-semibold">Order #{d.orderId} · {d.chefName}</p>
                                    <p className="text-muted-foreground">Delivered {d.deliveredAt ? format(new Date(d.deliveredAt), 'd MMM, HH:mm') : ''} · {money(d.grossAmount)}</p>
                                    {d.deliveryProof && <Button variant="link" className="h-auto p-0" onClick={() => setPhoto(d.deliveryProof)}>See delivery photo</Button>}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            <Dialog open={!!paying} onOpenChange={(open) => !open && setPaying(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record a bank transfer</DialogTitle>
                        <DialogDescription>
                            Only do this after you've sent {paying ? money(paying.netAmount) : ''} to {paying?.chefName}
                            {paying?.chefDetails?.bankAccountEnding ? ` (account ending ${paying.chefDetails.bankAccountEnding})` : ''}. The chef gets a receipt straight away.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaying(null)}>Cancel</Button>
                        <Button disabled={action.isPending} onClick={() => { action.mutate({ path: `/payouts/admin/invoices/${paying!.id}/pay`, message: 'Recorded. The chef has their receipt.' }); setPaying(null); }}>I've paid {paying ? money(paying.netAmount) : ''}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <HoldDialog invoice={holding} onClose={() => setHolding(null)} onHold={(reason) => { action.mutate({ path: `/payouts/admin/invoices/${holding!.id}/hold`, body: { reason }, message: 'Payout on hold. The chef has been told.' }); setHolding(null); }} />

            <Dialog open={!!photo} onOpenChange={(open) => !open && setPhoto(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delivery photo</DialogTitle></DialogHeader>
                    {photo && <img src={photo} alt="Food being handed over" className="max-h-[70vh] w-full rounded-xl object-contain" />}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function HoldDialog({ invoice, onClose, onHold }: { invoice: Invoice | null; onClose: () => void; onHold: (reason: string) => void }) {
    const [reason, setReason] = useState('');
    useEffect(() => setReason(''), [invoice]);
    return (
        <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Put {invoice?.number} on hold</DialogTitle>
                    <DialogDescription>The chef won't be paid until you release it. They'll see your reason.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                    <Label htmlFor="hold-reason">Reason</Label>
                    <Textarea id="hold-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button disabled={!reason.trim()} onClick={() => onHold(reason.trim())}>Put on hold</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** The Super Admin sets MYUKCHEF's commission and how long customers have to confirm a delivery. */
function RulesCard({ rules }: { rules: { percent: number; autoConfirmHours: number } }) {
    const qc = useQueryClient();
    const [percent, setPercent] = useState(String(rules.percent));
    const [hours, setHours] = useState(String(rules.autoConfirmHours));
    useEffect(() => { setPercent(String(rules.percent)); setHours(String(rules.autoConfirmHours)); }, [rules]);
    const save = useMutation({
        mutationFn: () => api.put('/payouts/admin/rules', { percent: Number(percent), autoConfirmHours: Number(hours) }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-payouts'] }); toast.success('Saved. New deliveries use these rules.'); },
        onError: (e: Error) => toast.error(e.message),
    });
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Payout rules</CardTitle>
                <CardDescription>Changes apply to deliveries from now on. Invoices already raised keep their rate.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
                <div className="grid gap-1">
                    <Label htmlFor="commission">MYUKCHEF commission (%)</Label>
                    <Input id="commission" type="number" min="0" max="50" step="0.5" className="w-36" value={percent} onChange={(e) => setPercent(e.target.value)} />
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="confirm-hours">Customer has to confirm within (hours)</Label>
                    <Input id="confirm-hours" type="number" min="1" max="336" className="w-36" value={hours} onChange={(e) => setHours(e.target.value)} />
                </div>
                <Button className="h-10" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
            </CardContent>
        </Card>
    );
}
