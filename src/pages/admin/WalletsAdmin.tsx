import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDownToLine, Check, Clock, Gift, Loader2, PiggyBank, Search, Settings2, Users, Wallet, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { pounds, WalletHistory, type WalletData } from '@/components/wallet/wallet';
import { cn } from '@/lib/utils';

interface Rules {
    release: 'manual' | 'auto';
    autoDays: number;
    referral: { enabled: boolean; newCustomer: number; referrer: number };
    loyalty: { enabled: boolean; percent: number };
    spend: { maxPercent: number; minOrder: number };
    withdraw: { minAmount: number };
}
interface Summary { pending: number; pendingCount: number; balances: number; spentLast30Days: number; withdrawalsWaiting: number; withdrawalCount: number; rules: Rules }
interface Entry {
    id: number; userId: number; name: string; email: string; role: string; type: string; amount: number; status: string;
    orderId: number | null; note: string | null; releaseAt: string | null; createdAt: string; payoutMethod: string | null; payoutReference: string | null;
}
interface Person { userId: number; name: string; email: string; role: string; available: number; pending: number }

const TYPE: Record<string, string> = { referral: 'Referral', loyalty: 'Cashback', bonus: 'Gift', adjustment: 'Correction', converted: 'Old points', spend: 'Spent', withdrawal: 'Withdrawal' };
const date = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const roleLabel = (r: string) => (r === 'admin' ? 'Super Admin' : r === 'chef' ? 'Chef' : 'Customer');

function Stat({ icon: Icon, label, value, hint, onClick }: { icon: typeof Wallet; label: string; value: string; hint?: string; onClick?: () => void }) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Card className={cn(onClick && 'transition-colors hover:border-primary')}>
            <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="block w-full p-4 text-left">
                <span className="flex items-center justify-between text-sm text-muted-foreground">{label}<Icon className="h-4 w-4" /></span>
                <span className="mt-1 block text-2xl font-bold">{value}</span>
                {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
            </Tag>
        </Card>
    );
}

/** Rewards waiting for a decision: select and release in one go, or cancel with a reason. */
function ToRelease() {
    const qc = useQueryClient();
    const [type, setType] = useState('');
    const { data = [], isLoading } = useQuery<Entry[]>({ queryKey: ['wallet-admin', 'pending', type], queryFn: () => api.get(`/wallet/admin/entries?status=pending${type ? `&type=${type}` : ''}`) });
    const [picked, setPicked] = useState<number[]>([]);
    const [cancelling, setCancelling] = useState(false);
    const [reason, setReason] = useState('');
    useEffect(() => setPicked([]), [type]);
    const refresh = () => { qc.invalidateQueries({ queryKey: ['wallet-admin'] }); setPicked([]); };
    const release = useMutation({
        mutationFn: (ids: number[]) => api.post('/wallet/admin/release', { ids }),
        onSuccess: (r: { released: number }) => { refresh(); toast.success(`${r.released} released. Each person has been told.`); },
        onError: (e: Error) => toast.error(e.message),
    });
    const cancel = useMutation({
        mutationFn: () => api.post('/wallet/admin/cancel', { ids: picked, reason }),
        onSuccess: (r: { cancelled: number }) => { refresh(); setCancelling(false); setReason(''); toast.success(`${r.cancelled} cancelled`); },
        onError: (e: Error) => toast.error(e.message),
    });
    const total = data.filter((e) => picked.includes(e.id)).reduce((s, e) => s + e.amount, 0);
    const all = data.length > 0 && picked.length === data.length;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {[['', 'All'], ['referral', 'Referrals'], ['loyalty', 'Cashback'], ['converted', 'Old points']].map(([v, l]) => (
                    <Button key={v} size="sm" variant={type === v ? 'default' : 'outline'} onClick={() => setType(v)}>{l}</Button>
                ))}
            </div>
            {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : data.length === 0 ? <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">Nothing waiting. New rewards appear here when someone earns them.</p>
                : (
                    <Card>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
                            <label className="flex items-center gap-2 text-sm"><Checkbox checked={all} onCheckedChange={(v) => setPicked(v ? data.map((e) => e.id) : [])} />Select all ({data.length})</label>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" disabled={!picked.length || release.isPending} onClick={() => release.mutate(picked)}><Check className="mr-1.5 h-4 w-4" />Release {picked.length ? `${picked.length} (${pounds(total)})` : ''}</Button>
                                <Button size="sm" variant="outline" disabled={!picked.length} onClick={() => setCancelling(true)}><X className="mr-1.5 h-4 w-4" />Cancel</Button>
                            </div>
                        </div>
                        <ul className="divide-y">
                            {data.map((e) => (
                                <li key={e.id} className="flex items-center gap-3 p-3">
                                    <Checkbox checked={picked.includes(e.id)} onCheckedChange={(v) => setPicked((p) => (v ? [...p, e.id] : p.filter((x) => x !== e.id)))} aria-label={`Select reward for ${e.name}`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{e.name}<Badge variant="secondary">{roleLabel(e.role)}</Badge><Badge variant="outline">{TYPE[e.type] ?? e.type}</Badge></p>
                                        <p className="truncate text-xs text-muted-foreground">{e.note} · earned {date(e.createdAt)}{e.releaseAt ? ` · releases ${date(e.releaseAt)}` : ''}</p>
                                    </div>
                                    <span className="font-bold text-emerald-700">+{pounds(e.amount)}</span>
                                    <Button size="sm" variant="ghost" onClick={() => release.mutate([e.id])} disabled={release.isPending}>Release</Button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            <Dialog open={cancelling} onOpenChange={setCancelling}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel {picked.length} reward{picked.length === 1 ? '' : 's'}?</DialogTitle>
                        <DialogDescription>They won't reach anyone's wallet. Your reason is kept with each one.</DialogDescription>
                    </DialogHeader>
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="e.g. The order was refunded" aria-label="Reason" />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelling(false)}>Keep them</Button>
                        <Button variant="destructive" disabled={!reason.trim() || cancel.isPending} onClick={() => cancel.mutate()}>Cancel rewards</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** Chef withdrawals: pay through Stripe or record a bank transfer, or say why not. */
function Withdrawals() {
    const qc = useQueryClient();
    const [show, setShow] = useState<'requested' | 'paid' | 'rejected'>('requested');
    const { data = [], isLoading } = useQuery<Entry[]>({ queryKey: ['wallet-admin', 'withdrawals', show], queryFn: () => api.get(`/wallet/admin/entries?type=withdrawal&status=${show}`) });
    const [paying, setPaying] = useState<Entry | null>(null);
    const [rejecting, setRejecting] = useState<Entry | null>(null);
    const [text, setText] = useState('');
    const done = (msg: string) => { qc.invalidateQueries({ queryKey: ['wallet-admin'] }); setPaying(null); setRejecting(null); setText(''); toast.success(msg); };
    const pay = useMutation({
        mutationFn: ({ id, method }: { id: number; method: 'stripe' | 'bank' }) => api.post(`/wallet/admin/withdrawals/${id}/pay`, { method, reference: text }),
        onSuccess: () => done('Paid. The chef has been told.'),
        onError: (e: Error) => toast.error(e.message),
    });
    const reject = useMutation({
        mutationFn: (id: number) => api.post(`/wallet/admin/withdrawals/${id}/reject`, { reason: text }),
        onSuccess: () => done('Not paid. The money is back in their wallet and they know why.'),
        onError: (e: Error) => toast.error(e.message),
    });
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {([['requested', 'To pay'], ['paid', 'Paid'], ['rejected', 'Not paid']] as const).map(([v, l]) => <Button key={v} size="sm" variant={show === v ? 'default' : 'outline'} onClick={() => setShow(v)}>{l}</Button>)}
            </div>
            {isLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : data.length === 0 ? <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">{show === 'requested' ? 'No withdrawals waiting.' : 'Nothing here.'}</p>
                : (
                    <Card><ul className="divide-y">
                        {data.map((e) => (
                            <li key={e.id} className="flex flex-wrap items-center gap-3 p-3">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold">{e.name} <span className="text-sm font-normal text-muted-foreground">{e.email}</span></p>
                                    <p className="text-xs text-muted-foreground">Asked {date(e.createdAt)}{e.payoutReference ? ` · ${e.payoutMethod === 'stripe' ? 'Stripe' : 'Bank'} ${e.payoutReference}` : ''}{e.status === 'rejected' ? ` · ${e.note}` : ''}</p>
                                </div>
                                <span className="text-lg font-bold">{pounds(-e.amount)}</span>
                                {e.status === 'requested' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => { setText(''); setPaying(e); }}><ArrowDownToLine className="mr-1.5 h-4 w-4" />Pay</Button>
                                        <Button size="sm" variant="outline" onClick={() => { setText(''); setRejecting(e); }}>Don't pay</Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul></Card>
                )}
            <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pay {paying ? pounds(-paying.amount) : ''} to {paying?.name}</DialogTitle>
                        <DialogDescription>Send it through Stripe to the chef's connected account, or pay it from your bank and record the reference here.</DialogDescription>
                    </DialogHeader>
                    <Button onClick={() => paying && pay.mutate({ id: paying.id, method: 'stripe' })} disabled={pay.isPending}>{pay.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Send through Stripe</Button>
                    <div className="space-y-2 border-t pt-4">
                        <Label htmlFor="bank-ref">Or, paid by bank transfer: reference</Label>
                        <Input id="bank-ref" value={text} onChange={(e) => setText(e.target.value)} maxLength={120} placeholder="e.g. BACS 17/11 MYUK-W2" />
                        <Button variant="outline" className="w-full" disabled={!text.trim() || pay.isPending} onClick={() => paying && pay.mutate({ id: paying.id, method: 'bank' })}>Record bank transfer</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Don't pay this withdrawal?</DialogTitle>
                        <DialogDescription>The money goes back into {rejecting?.name}'s wallet, and they see your reason.</DialogDescription>
                    </DialogHeader>
                    <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="e.g. Please add your bank details first" aria-label="Reason" />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejecting(null)}>Back</Button>
                        <Button variant="destructive" disabled={!text.trim() || reject.isPending} onClick={() => rejecting && reject.mutate(rejecting.id)}>Don't pay</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** Everyone with a wallet; open one to see its history and add a gift or correction. */
function People() {
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const [q, setQ] = useState('');
    const [search, setSearch] = useState('');
    const openId = Number(params.get('user')) || null;
    const { data = [], isLoading } = useQuery<Person[]>({ queryKey: ['wallet-admin', 'people', search], queryFn: () => api.get(`/wallet/admin/wallets?q=${encodeURIComponent(search)}`) });
    const { data: wallet } = useQuery<WalletData>({ queryKey: ['wallet-admin', 'user', openId], queryFn: () => api.get(`/wallet/admin/users/${openId}`), enabled: !!openId });
    const person = data.find((p) => p.userId === openId);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [kind, setKind] = useState<'bonus' | 'adjustment'>('bonus');
    const give = useMutation({
        mutationFn: () => api.post('/wallet/admin/credit', { userId: openId, amount: Number(amount), note, kind }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallet-admin'] }); setAmount(''); setNote(''); toast.success(Number(amount) > 0 ? 'Added. They\'ve been told.' : 'Correction saved.'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const open = (id: number | null) => { const next = new URLSearchParams(params); if (id) next.set('user', String(id)); else next.delete('user'); setParams(next, { replace: true }); };

    return (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(q); }}>
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find anyone by name or email" className="pl-9" aria-label="Find a person" /></div>
                    <Button type="submit">Find</Button>
                </form>
                {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : (
                    <Card><ul className="divide-y">
                        {data.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">{search ? 'Nobody found.' : 'No wallets yet. Search to give someone a gift.'}</li>}
                        {data.map((p) => (
                            <li key={p.userId}>
                                <button type="button" onClick={() => open(p.userId)} className={cn('flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-muted/50', openId === p.userId && 'bg-primary/5')}>
                                    <span className="min-w-0"><span className="block truncate font-semibold">{p.name}</span><span className="block truncate text-xs text-muted-foreground">{roleLabel(p.role)} · {p.email}</span></span>
                                    <span className="shrink-0 text-right"><span className="block font-bold">{pounds(p.available)}</span>{p.pending > 0 && <span className="block text-xs text-amber-700">+{pounds(p.pending)} waiting</span>}</span>
                                </button>
                            </li>
                        ))}
                    </ul></Card>
                )}
            </div>
            <div>
                {!openId ? <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">Choose someone to see their wallet.</p> : !wallet ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : (
                    <Card>
                        <CardHeader>
                            <CardTitle>{person?.name ?? `Account #${openId}`}</CardTitle>
                            <CardDescription>{pounds(wallet.available)} to use{wallet.pending > 0 ? ` · ${pounds(wallet.pending)} waiting for release` : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 rounded-xl border p-3">
                                <p className="text-sm font-semibold">Give a gift or make a correction</p>
                                <div className="flex gap-2">
                                    <Button size="sm" type="button" variant={kind === 'bonus' ? 'default' : 'outline'} onClick={() => setKind('bonus')}><Gift className="mr-1.5 h-4 w-4" />Gift</Button>
                                    <Button size="sm" type="button" variant={kind === 'adjustment' ? 'default' : 'outline'} onClick={() => setKind('adjustment')}>Correction (+ or −)</Button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="£" aria-label="Amount" />
                                    <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Note they'll see, e.g. Sorry your order was late" aria-label="Note" />
                                </div>
                                <Button size="sm" disabled={!Number(amount) || !note.trim() || give.isPending} onClick={() => give.mutate()}>Save</Button>
                                <p className="text-xs text-muted-foreground">Gifts and corrections take effect straight away, without waiting for release.</p>
                            </div>
                            <WalletHistory entries={wallet.entries} />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function RulesForm({ initial }: { initial: Rules }) {
    const qc = useQueryClient();
    const [r, setR] = useState<Rules>(initial);
    const save = useMutation({
        mutationFn: () => api.put('/wallet/admin/rules', r),
        onSuccess: (saved: Rules) => { setR(saved); qc.invalidateQueries({ queryKey: ['wallet-admin'] }); qc.invalidateQueries({ queryKey: ['wallet'] }); toast.success('Rules saved'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const n = (v: string) => (v === '' ? 0 : Number(v));
    return (
        <Card>
            <CardHeader><CardTitle>How rewards work</CardTitle><CardDescription>Changes apply to rewards earned from now on.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <fieldset className="space-y-2">
                    <legend className="mb-1 font-semibold">Releasing rewards</legend>
                    {([['manual', 'I release every reward myself', 'Recommended while you\'re getting started. Nothing reaches a wallet until you say so.'], ['auto', 'Release automatically after a few days', 'You can still release early, or cancel, before then.']] as const).map(([v, l, h]) => (
                        <label key={v} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input type="radio" name="release" checked={r.release === v} onChange={() => setR({ ...r, release: v })} className="mt-1 accent-primary" />
                            <span><span className="block font-semibold">{l}</span><span className="block text-sm text-muted-foreground">{h}</span></span>
                        </label>
                    ))}
                    {r.release === 'auto' && <div className="grid max-w-xs gap-1"><Label htmlFor="auto-days">Days to wait</Label><Input id="auto-days" type="number" min={0} max={90} value={r.autoDays} onChange={(e) => setR({ ...r, autoDays: n(e.target.value) })} /></div>}
                </fieldset>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-xl border p-4">
                        <label className="flex items-center justify-between font-semibold">Refer a friend<Switch checked={r.referral.enabled} onCheckedChange={(enabled) => setR({ ...r, referral: { ...r.referral, enabled } })} /></label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-1"><Label htmlFor="ref-new">New person gets (£)</Label><Input id="ref-new" type="number" step="0.5" min={0} value={r.referral.newCustomer} onChange={(e) => setR({ ...r, referral: { ...r.referral, newCustomer: n(e.target.value) } })} /></div>
                            <div className="grid gap-1"><Label htmlFor="ref-ref">Friend who referred (£)</Label><Input id="ref-ref" type="number" step="0.5" min={0} value={r.referral.referrer} onChange={(e) => setR({ ...r, referral: { ...r.referral, referrer: n(e.target.value) } })} /></div>
                        </div>
                        <p className="text-xs text-muted-foreground">Earned when the new person's first order is delivered. Chefs who refer people earn it too.</p>
                    </div>
                    <div className="space-y-3 rounded-xl border p-4">
                        <label className="flex items-center justify-between font-semibold">Cashback on orders<Switch checked={r.loyalty.enabled} onCheckedChange={(enabled) => setR({ ...r, loyalty: { ...r.loyalty, enabled } })} /></label>
                        <div className="grid max-w-[10rem] gap-1"><Label htmlFor="loyalty-pc">Cashback (%)</Label><Input id="loyalty-pc" type="number" step="0.5" min={0} max={25} value={r.loyalty.percent} onChange={(e) => setR({ ...r, loyalty: { ...r.loyalty, percent: n(e.target.value) } })} /></div>
                        <p className="text-xs text-muted-foreground">Of what the customer paid (not the tip), after delivery. Meal plan deliveries count too.</p>
                    </div>
                    <div className="space-y-3 rounded-xl border p-4">
                        <p className="font-semibold">Spending at checkout</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-1"><Label htmlFor="max-pc">Up to (% of order)</Label><Input id="max-pc" type="number" min={1} max={100} value={r.spend.maxPercent} onChange={(e) => setR({ ...r, spend: { ...r.spend, maxPercent: n(e.target.value) } })} /></div>
                            <div className="grid gap-1"><Label htmlFor="min-order">Orders of at least (£)</Label><Input id="min-order" type="number" min={0} value={r.spend.minOrder} onChange={(e) => setR({ ...r, spend: { ...r.spend, minOrder: n(e.target.value) } })} /></div>
                        </div>
                        <p className="text-xs text-muted-foreground">Keeps every order partly paid, so wallets can't cover whole orders.</p>
                    </div>
                    <div className="space-y-3 rounded-xl border p-4">
                        <p className="font-semibold">Chef withdrawals</p>
                        <div className="grid max-w-[10rem] gap-1"><Label htmlFor="min-wd">Smallest withdrawal (£)</Label><Input id="min-wd" type="number" min={1} value={r.withdraw.minAmount} onChange={(e) => setR({ ...r, withdraw: { minAmount: n(e.target.value) } })} /></div>
                        <p className="text-xs text-muted-foreground">Customers can't withdraw; their credit is for orders.</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-4"><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save rules</Button></CardFooter>
        </Card>
    );
}

/** Super Admin: every reward, wallet and chef withdrawal, and the rules behind them. */
const WalletsAdmin = () => {
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') ?? 'release';
    const { data: s } = useQuery<Summary>({ queryKey: ['wallet-admin', 'summary'], queryFn: () => api.get('/wallet/admin/summary') });
    const go = (t: string) => { const next = new URLSearchParams(params); next.set('tab', t); setParams(next, { replace: true }); };
    const tabs = useMemo(() => [
        { v: 'release', l: 'To release', icon: Clock, n: s?.pendingCount },
        { v: 'withdrawals', l: 'Withdrawals', icon: ArrowDownToLine, n: s?.withdrawalCount },
        { v: 'people', l: 'People', icon: Users },
        { v: 'rules', l: 'Rules', icon: Settings2 },
    ], [s]);

    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Wallets and rewards</h1>
                <p className="mt-1 text-muted-foreground">Referral rewards and cashback wait here until you release them. Released credit appears in the person's wallet, where customers spend it at checkout and chefs can also withdraw it.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={Clock} label="Waiting for release" value={s ? pounds(s.pending) : '…'} hint={s ? `${s.pendingCount} rewards` : undefined} onClick={() => go('release')} />
                <Stat icon={ArrowDownToLine} label="Withdrawals to pay" value={s ? pounds(s.withdrawalsWaiting) : '…'} hint={s ? `${s.withdrawalCount} chefs` : undefined} onClick={() => go('withdrawals')} />
                <Stat icon={Wallet} label="In wallets now" value={s ? pounds(s.balances) : '…'} hint="What MYUKCHEF owes in credit" />
                <Stat icon={PiggyBank} label="Spent, last 30 days" value={s ? pounds(s.spentLast30Days) : '…'} hint="Taken off orders" />
            </div>
            <Tabs value={tab} onValueChange={go}>
                <TabsList className="flex h-auto w-full justify-start overflow-x-auto">
                    {tabs.map((t) => <TabsTrigger key={t.v} value={t.v}><t.icon className="mr-1.5 h-4 w-4" />{t.l}{t.n ? <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{t.n}</span> : null}</TabsTrigger>)}
                </TabsList>
                <TabsContent value="release" className="pt-4"><ToRelease /></TabsContent>
                <TabsContent value="withdrawals" className="pt-4"><Withdrawals /></TabsContent>
                <TabsContent value="people" className="pt-4"><People /></TabsContent>
                <TabsContent value="rules" className="pt-4">{s ? <RulesForm key={JSON.stringify(s.rules)} initial={s.rules} /> : <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />}</TabsContent>
            </Tabs>
        </div>
    );
};

export default WalletsAdmin;
