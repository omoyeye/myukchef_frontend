import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Download, Loader2, Repeat, Users } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL, authHeaders, api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MiniBarChart } from '@/components/reports/MiniBarChart';

interface Report {
    from: string;
    to: string;
    totals: { revenue: number; orders: number; averageOrder: number; tips: number; commission: number; paidToChefs: number; owedToChefs: number; customers: number; guestOrders: number; repeatCustomers: number; repeatRate: number; newCustomers: number };
    byDay: { date: string; revenue: number; orders: number; commission: number }[];
    topChefs: { chefId: number; name: string; sales: number; commission: number; paid: number; invoices: number }[];
}
interface ErrorLog { errors: { at: string; source: string; message: string; where: string; count: number }[]; since: string }

const money = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const PRESETS = [{ days: 7, label: '7 days' }, { days: 30, label: '30 days' }, { days: 90, label: '90 days' }, { days: 365, label: '12 months' }];

/** Sales, commission and customers over time, top chefs, spreadsheet exports, and recent errors. */
const Reports = () => {
    const [to, setTo] = useState(iso(new Date()));
    const [from, setFrom] = useState(iso(new Date(Date.now() - 29 * 86400_000)));
    const { data, isLoading } = useQuery<Report>({ queryKey: ['admin-report', from, to], queryFn: () => api.get(`/reports/admin?from=${from}&to=${to}`) });
    const { data: errors } = useQuery<ErrorLog>({ queryKey: ['admin-errors'], queryFn: () => api.get('/health/errors'), refetchInterval: 60_000 });
    const [downloading, setDownloading] = useState<string | null>(null);

    const preset = (days: number) => { setTo(iso(new Date())); setFrom(iso(new Date(Date.now() - (days - 1) * 86400_000))); };
    const download = async (type: 'orders' | 'invoices') => {
        setDownloading(type);
        try {
            const res = await fetch(`${API_URL}/reports/admin/export?type=${type}&from=${from}&to=${to}`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Export failed');
            const url = URL.createObjectURL(await res.blob());
            const a = document.createElement('a');
            a.href = url;
            a.download = `myukchef-${type}-${from}-to-${to}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) { toast.error((e as Error).message); } finally { setDownloading(null); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reports</h1>
                <p className="text-muted-foreground">Paid, live orders only. Unpaid and cancelled orders aren't counted.</p>
            </div>

            <Card>
                <CardContent className="flex flex-wrap items-end gap-3 pt-6">
                    <div className="flex flex-wrap gap-1" role="group" aria-label="Quick periods">
                        {PRESETS.map((p) => (
                            <Button key={p.days} variant="outline" size="sm" className="h-10" onClick={() => preset(p.days)}>{p.label}</Button>
                        ))}
                    </div>
                    <div className="grid gap-1"><Label htmlFor="rep-from">From</Label><Input id="rep-from" type="date" className="h-10" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
                    <div className="grid gap-1"><Label htmlFor="rep-to">To</Label><Input id="rep-to" type="date" className="h-10" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
                    <div className="ml-auto flex flex-wrap gap-2">
                        <Button variant="outline" className="h-10" disabled={!!downloading} onClick={() => download('orders')}>{downloading === 'orders' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Orders CSV</Button>
                        <Button variant="outline" className="h-10" disabled={!!downloading} onClick={() => download('invoices')}>{downloading === 'invoices' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Chef invoices CSV</Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading || !data ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Stat label="Revenue" value={money(data.totals.revenue)} hint={`${data.totals.orders} orders`} strong />
                        <Stat label="MYUKCHEF commission" value={money(data.totals.commission)} hint="from chef invoices" />
                        <Stat label="Average order" value={money(data.totals.averageOrder)} hint={`${money(data.totals.tips)} in tips`} />
                        <Stat label="Owed to chefs" value={money(data.totals.owedToChefs)} hint={`${money(data.totals.paidToChefs)} paid`} />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card><CardContent className="pt-6"><MiniBarChart label="Revenue each day" data={data.byDay.map((d) => ({ date: d.date, value: d.revenue }))} format={money} /></CardContent></Card>
                        <Card><CardContent className="pt-6"><MiniBarChart label="Commission each day" data={data.byDay.map((d) => ({ date: d.date, value: d.commission }))} format={money} /></CardContent></Card>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Customers</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <Line label="Ordered in this period" value={String(data.totals.customers)} />
                                <Line label="Guest orders" value={String(data.totals.guestOrders)} />
                                <Line label="New sign-ups" value={String(data.totals.newCustomers)} />
                                <Line label={<span className="flex items-center gap-1"><Repeat className="h-3.5 w-3.5" />Came back again</span>} value={`${data.totals.repeatCustomers} (${data.totals.repeatRate}%)`} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base">Top chefs</CardTitle><CardDescription>By sales on invoices raised in this period.</CardDescription></CardHeader>
                            <CardContent>
                                {data.topChefs.length === 0 ? <p className="text-sm text-muted-foreground">No invoices in this period.</p> : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[28rem] text-sm">
                                            <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Chef</th><th className="py-2 text-right">Sales</th><th className="py-2 text-right">Commission</th><th className="py-2 text-right">Paid</th></tr></thead>
                                            <tbody>
                                                {data.topChefs.map((c) => (
                                                    <tr key={c.chefId} className="border-b last:border-0"><td className="py-2 font-medium">{c.name}</td><td className="py-2 text-right">{money(c.sales)}</td><td className="py-2 text-right">{money(c.commission)}</td><td className="py-2 text-right">{money(c.paid)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            <Card id="health">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-primary" />Recent errors</CardTitle>
                    <CardDescription>Problems from the server and from people's browsers and phones since {errors ? new Date(errors.since).toLocaleString('en-GB') : 'the last restart'}. You get one notification per new kind of error.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!errors?.errors.length ? <p className="text-sm text-muted-foreground">No errors. All good.</p> : (
                        <ul className="space-y-2 text-sm">
                            {errors.errors.slice(0, 20).map((e, i) => (
                                <li key={i} className="rounded-xl bg-muted/50 p-3">
                                    <p className="flex flex-wrap items-center gap-2">
                                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', e.source === 'server' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900')}>{e.source}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString('en-GB')}{e.count > 1 ? ` · ${e.count} times` : ''}</span>
                                    </p>
                                    <p className="mt-1 break-words font-mono text-xs">{e.message}</p>
                                    {e.where && <p className="text-xs text-muted-foreground">{e.where}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const Stat = ({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) => (
    <Card className={strong ? 'border-primary/40 bg-primary/5' : ''}>
        <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </CardContent>
    </Card>
);
const Line = ({ label, value }: { label: React.ReactNode; value: string }) => (
    <div className="flex justify-between gap-2"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>
);

export default Reports;
