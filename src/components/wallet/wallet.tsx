import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDownToLine, Clock, Gift, Loader2, Sparkles, Users, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface WalletEntry { id: number; type: string; amount: number; status: string; orderId: number | null; note: string | null; createdAt: string; decidedAt: string | null }
export interface WalletData {
    available: number;
    pending: number;
    entries: WalletEntry[];
    rules: { maxPercent: number; minOrder: number; referral: { enabled: boolean; newCustomer: number; referrer: number }; loyalty: { enabled: boolean; percent: number } };
    withdraw: { allowed: boolean; minAmount: number; stripeReady: boolean };
}

export const pounds = (n: number) => `£${Number(n).toFixed(2)}`;

export const useWallet = () => {
    const { isAuthenticated } = useAuth();
    return useQuery<WalletData>({ queryKey: ['wallet'], queryFn: () => api.get('/wallet'), enabled: isAuthenticated, staleTime: 30_000 });
};

const TYPE: Record<string, string> = { referral: 'Referral reward', loyalty: 'Cashback', bonus: 'Gift from MYUKCHEF', adjustment: 'Correction', converted: 'Old reward points', spend: 'Used on an order', withdrawal: 'Withdrawal' };
const STATUS: Record<string, { label: string; className: string }> = {
    pending: { label: 'On its way', className: 'bg-amber-100 text-amber-900' },
    released: { label: 'Added', className: 'bg-emerald-100 text-emerald-900' },
    cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
    applied: { label: 'Used', className: 'bg-secondary text-foreground' },
    returned: { label: 'Given back', className: 'bg-muted text-muted-foreground' },
    requested: { label: 'Being paid', className: 'bg-amber-100 text-amber-900' },
    paid: { label: 'Paid out', className: 'bg-emerald-100 text-emerald-900' },
    rejected: { label: 'Not paid', className: 'bg-muted text-muted-foreground' },
};

export function WalletHistory({ entries }: { entries: WalletEntry[] }) {
    if (!entries.length) return <p className="py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>;
    return (
        <ul className="divide-y">
            {entries.map((e) => {
                const s = STATUS[e.status] ?? STATUS.pending;
                const faded = ['cancelled', 'returned', 'rejected'].includes(e.status);
                return (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                {TYPE[e.type] ?? e.type}
                                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', s.className)}>{s.label}</span>
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {e.note} · {new Date(e.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                        <span className={cn('shrink-0 font-bold', e.amount > 0 ? 'text-emerald-700' : 'text-foreground', faded && 'line-through opacity-50')}>
                            {e.amount > 0 ? '+' : '−'}{pounds(Math.abs(e.amount))}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

/** The wallet: for customers on /wallet and Profile, for chefs on their Payouts tab (with withdrawals). */
export function WalletPanel() {
    const qc = useQueryClient();
    const { data, isLoading } = useWallet();
    const [withdrawing, setWithdrawing] = useState(false);
    const [amount, setAmount] = useState('');
    const withdraw = useMutation({
        mutationFn: () => api.post('/wallet/withdraw', { amount: Number(amount) }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallet'] }); setWithdrawing(false); setAmount(''); toast.success("Withdrawal requested. MYUKCHEF will send it and let you know."); },
        onError: (e: Error) => toast.error(e.message),
    });
    if (isLoading || !data) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    const waiting = data.entries.find((e) => e.type === 'withdrawal' && e.status === 'requested');

    return (
        <div className="space-y-6">
            <Card className="relative overflow-hidden border-0 bg-ink text-ink-foreground">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
                <CardContent className="relative space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-foreground/70"><Wallet className="h-4 w-4" />Your MYUKCHEF wallet</p>
                            <p className="mt-1 font-display text-5xl font-extrabold">{pounds(data.available)}</p>
                            <p className="text-sm text-ink-foreground/70">ready to use</p>
                        </div>
                        {data.pending > 0 && (
                            <div className="rounded-2xl bg-ink-foreground/10 px-3 py-2 text-right">
                                <p className="flex items-center justify-end gap-1 text-xs text-ink-foreground/70"><Clock className="h-3 w-3" />On its way</p>
                                <p className="text-lg font-bold">{pounds(data.pending)}</p>
                            </div>
                        )}
                    </div>
                    {data.pending > 0 && <p className="text-sm text-ink-foreground/75">Rewards on their way are checked by MYUKCHEF first. We'll tell you the moment they're added.</p>}
                    <div className="flex flex-wrap gap-2">
                        <Button asChild className="rounded-full font-bold"><Link to="/menu">Use it on an order</Link></Button>
                        {data.withdraw.allowed && (
                            <Button variant="outline" className="rounded-full border-ink-foreground/30 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
                                disabled={!!waiting || data.available < data.withdraw.minAmount} onClick={() => { setAmount(data.available.toFixed(2)); setWithdrawing(true); }}>
                                <ArrowDownToLine className="mr-2 h-4 w-4" />{waiting ? 'Withdrawal being paid' : 'Withdraw'}
                            </Button>
                        )}
                    </div>
                    {data.withdraw.allowed && !waiting && data.available < data.withdraw.minAmount && (
                        <p className="text-xs text-ink-foreground/60">You can withdraw once you have {pounds(data.withdraw.minAmount)} or more.</p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
                {data.rules.referral.enabled && (
                    <Link to="/refer" className="flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary">
                        <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span><span className="block font-semibold">Refer a friend: {pounds(data.rules.referral.referrer)} for you</span><span className="block text-sm text-muted-foreground">They get {pounds(data.rules.referral.newCustomer)} too, after their first order.</span></span>
                    </Link>
                )}
                {data.rules.loyalty.enabled && data.rules.loyalty.percent > 0 && (
                    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
                        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span><span className="block font-semibold">{data.rules.loyalty.percent}% back on every order</span><span className="block text-sm text-muted-foreground">Added to your wallet after your food arrives.</span></span>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">Your wallet can pay for up to {data.rules.maxPercent}% of an order{data.rules.minOrder > 0 ? ` of ${pounds(data.rules.minOrder)} or more` : ''}. The tip is always paid in full.</p>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-lg">History</CardTitle></CardHeader>
                <CardContent><WalletHistory entries={data.entries} /></CardContent>
            </Card>

            <Dialog open={withdrawing} onOpenChange={setWithdrawing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Withdraw from your wallet</DialogTitle>
                        <DialogDescription>
                            {data.withdraw.stripeReady ? 'MYUKCHEF sends it to your connected Stripe account.' : 'MYUKCHEF pays it by bank transfer to the details in your payout settings.'} We'll tell you when it's sent.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1">
                        <Label htmlFor="withdraw-amount">Amount (£)</Label>
                        <Input id="withdraw-amount" type="number" inputMode="decimal" min={data.withdraw.minAmount} max={data.available} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Between {pounds(data.withdraw.minAmount)} and {pounds(data.available)}.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWithdrawing(false)}>Cancel</Button>
                        <Button disabled={withdraw.isPending || !(Number(amount) >= data.withdraw.minAmount && Number(amount) <= data.available)} onClick={() => withdraw.mutate()}>
                            {withdraw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Request {Number(amount) > 0 ? pounds(Number(amount)) : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** At checkout: "use £X from your wallet". Works out what will come off, using the same rules as the server. */
export function WalletAtCheckout({ orderTotalBeforeTip, use, onChange }: { orderTotalBeforeTip: number; use: boolean; onChange: (v: boolean) => void }) {
    const { data } = useWallet();
    if (!data || data.available <= 0) return null;
    const tooSmall = orderTotalBeforeTip < data.rules.minOrder;
    const off = Math.round(Math.min(data.available, orderTotalBeforeTip * (data.rules.maxPercent / 100), orderTotalBeforeTip) * 100) / 100;
    return (
        <div className={cn('flex items-center justify-between gap-3 rounded-2xl border p-4', use && !tooSmall ? 'border-primary bg-primary/5' : '')}>
            <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4 text-primary" />Use your wallet</p>
                <p className="text-sm text-muted-foreground">
                    {tooSmall ? `You have ${pounds(data.available)}. Wallets can be used on orders of ${pounds(data.rules.minOrder)} or more.` : `You have ${pounds(data.available)}. Take ${pounds(off)} off this order.`}
                </p>
            </div>
            <Switch checked={use && !tooSmall} disabled={tooSmall} onCheckedChange={onChange} aria-label="Use your wallet on this order" />
        </div>
    );
}

/** What will come off at checkout, for the totals. */
export function walletDiscount(data: WalletData | undefined, orderTotalBeforeTip: number, use: boolean) {
    if (!use || !data || data.available <= 0 || orderTotalBeforeTip < data.rules.minOrder) return 0;
    return Math.round(Math.min(data.available, orderTotalBeforeTip * (data.rules.maxPercent / 100), orderTotalBeforeTip) * 100) / 100;
}

/** A friendly nudge on the home page and elsewhere: "You have £X to spend". Nothing when the wallet is empty. */
export function WalletNudge({ className }: { className?: string }) {
    const { user } = useAuth();
    const { data } = useWallet();
    if (!data || (data.available <= 0 && data.pending <= 0) || (user?.role && user.role !== 'customer')) return null;
    return (
        <Link to={data.available > 0 ? '/menu' : '/wallet'} className={cn('flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10', className)}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
                <span className="block font-bold">{data.available > 0 ? `You have ${pounds(data.available)} in your wallet` : `${pounds(data.pending)} is on its way to your wallet`}</span>
                <span className="block text-sm text-muted-foreground">{data.available > 0 ? 'Use it on your next order: switch it on at checkout.' : "We'll tell you as soon as it's ready to use."}</span>
            </span>
        </Link>
    );
}

