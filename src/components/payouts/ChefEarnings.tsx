import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniBarChart } from '@/components/reports/MiniBarChart';

interface Earnings {
    totals: { sales: number; commission: number; tips: number; earned: number; orders: number; paid: number; waiting: number };
    last7Days: number;
    last30Days: number;
    allTime: number;
    byDay: { date: string; sales: number; earned: number }[];
    bestSellers: { name: string; quantity: number; sales: number }[];
}

const money = (n: number) => `£${n.toFixed(2)}`;
const RANGES = [{ days: 7, label: '7 days' }, { days: 30, label: '30 days' }, { days: 90, label: '90 days' }];

/** The chef's earnings at a glance: totals, a daily chart and their best-selling dishes. */
export function ChefEarnings() {
    const [days, setDays] = useState(30);
    const from = new Date(Date.now() - (days - 1) * 86400_000).toISOString().slice(0, 10);
    const { data, isLoading } = useQuery<Earnings>({ queryKey: ['chef-earnings', days], queryFn: () => api.get(`/reports/chef?from=${from}`) });

    return (
        <section aria-labelledby="earnings-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="earnings-heading" className="flex items-center gap-2 text-2xl font-bold"><TrendingUp className="h-6 w-6 text-primary" />Earnings</h2>
                <div className="flex gap-1" role="tablist" aria-label="Period">
                    {RANGES.map((r) => (
                        <button key={r.days} role="tab" aria-selected={days === r.days} onClick={() => setDays(r.days)}
                            className={cn('h-9 rounded-full border px-3 text-sm', days === r.days ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary')}>
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>
            {isLoading || !data ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Stat label="You earned" value={money(data.totals.earned)} strong />
                        <Stat label="Sales" value={money(data.totals.sales)} />
                        <Stat label="Tips" value={money(data.totals.tips)} />
                        <Stat label="Orders" value={String(data.totals.orders)} />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                        <Card>
                            <CardContent className="pt-6">
                                <MiniBarChart label="Earned each day" data={data.byDay.map((d) => ({ date: d.date, value: d.earned }))} format={money} />
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Last 7 days {money(data.last7Days)} · last 30 days {money(data.last30Days)} · all time {money(data.allTime)}. {money(data.totals.waiting)} of this period is still to be paid.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4 text-primary" />Best sellers</CardTitle></CardHeader>
                            <CardContent>
                                {data.bestSellers.length === 0 ? <p className="text-sm text-muted-foreground">No sales in this period yet.</p> : (
                                    <ol className="space-y-2 text-sm">
                                        {data.bestSellers.map((d, i) => (
                                            <li key={d.name} className="flex items-center justify-between gap-2">
                                                <span className="min-w-0 truncate"><span className="mr-2 text-muted-foreground">{i + 1}.</span>{d.name}</span>
                                                <span className="shrink-0 font-semibold">{d.quantity} sold</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </section>
    );
}

const Stat = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <Card className={strong ? 'border-primary/40 bg-primary/5' : ''}>
        <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </CardContent>
    </Card>
);
