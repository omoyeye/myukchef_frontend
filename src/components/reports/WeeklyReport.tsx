import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDownRight, ArrowUpRight, Loader2, Mail, Minus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Figure { value: number; previous: number; change: number | null }
type Report = {
    week: { label: string };
    figures: Record<string, Figure>;
    topChefs?: { id: number; name: string; sales: number; orders: number }[];
    toDo?: { videosToCheck: number; chefApplications: number };
    overallRating?: number | null;
    totalReviews?: number;
    followers?: number;
    invoicesToSubmit?: number;
};

const money = (n: number) => `£${n.toFixed(2)}`;
const ADMIN: { key: string; label: string; format?: (n: number) => string; lowerIsBetter?: boolean }[] = [
    { key: 'orders', label: 'Orders' },
    { key: 'revenue', label: 'Order sales', format: money },
    { key: 'averageOrder', label: 'Average order', format: money },
    { key: 'commission', label: 'Commission', format: money },
    { key: 'eventsRevenue', label: 'Event payments', format: money },
    { key: 'planRevenue', label: 'Meal plan payments', format: money },
    { key: 'newCustomers', label: 'New customers' },
    { key: 'newChefs', label: 'New chef sign-ups' },
    { key: 'activeChefs', label: 'Chefs who cooked' },
    { key: 'cancelled', label: 'Cancelled orders', lowerIsBetter: true },
    { key: 'errors', label: 'Errors logged', lowerIsBetter: true },
];
const CHEF: typeof ADMIN = [
    { key: 'orders', label: 'Orders cooked' },
    { key: 'earned', label: 'You earned', format: money },
    { key: 'sales', label: 'Sales', format: money },
    { key: 'tips', label: 'Tips', format: money },
    { key: 'newReviews', label: 'New reviews' },
    { key: 'newFollowers', label: 'New followers' },
    { key: 'videoComments', label: 'Video comments' },
    { key: 'cancelled', label: 'Cancelled orders', lowerIsBetter: true },
];
const WEEKS = [{ value: 0, label: 'This week so far' }, { value: 1, label: 'Last week' }, { value: 2, label: '2 weeks ago' }, { value: 3, label: '3 weeks ago' }];

function Change({ f, lowerIsBetter }: { f: Figure; lowerIsBetter?: boolean }) {
    if (f.change === null) return <span className="text-xs text-muted-foreground">{f.value ? 'new' : '–'}</span>;
    if (f.change === 0) return <span className="inline-flex items-center text-xs text-muted-foreground"><Minus className="mr-0.5 h-3 w-3" />same</span>;
    const good = lowerIsBetter ? f.change < 0 : f.change > 0;
    const Icon = f.change > 0 ? ArrowUpRight : ArrowDownRight;
    return <span className={cn('inline-flex items-center text-xs font-medium', good ? 'text-green-600' : 'text-red-600')}><Icon className="mr-0.5 h-3 w-3" />{Math.abs(f.change)}%</span>;
}

/** The figures in the Monday email, on screen, for any of the last few weeks. */
export function WeeklyReport({ who }: { who: 'admin' | 'chef' }) {
    const [weeksAgo, setWeeksAgo] = useState(1);
    const { data, isLoading } = useQuery<Report>({ queryKey: ['weekly-report', who, weeksAgo], queryFn: () => api.get(`/reports/weekly/${who}?weeksAgo=${weeksAgo}`) });
    const email = useMutation({
        mutationFn: () => api.post(`/reports/weekly/${who}/email`, { weeksAgo }),
        onSuccess: (r: { sentTo: string }) => toast.success(`Sent to ${r.sentTo}`),
        onError: (e: Error) => toast.error(e.message),
    });
    const rows = who === 'admin' ? ADMIN : CHEF;

    return (
        <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div>
                    <CardTitle>Weekly report</CardTitle>
                    <CardDescription>
                        {data ? `${data.week.label}, compared with the week before.` : 'Loading...'} {who === 'admin' ? 'Super Admins' : 'You'} get this by email every Monday morning.
                    </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={weeksAgo}
                        onChange={(e) => setWeeksAgo(Number(e.target.value))}
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        aria-label="Which week"
                    >
                        {WEEKS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>
                    <Button size="sm" variant="outline" onClick={() => email.mutate()} disabled={email.isPending}>
                        {email.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Mail className="mr-1.5 h-4 w-4" />}Email me
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading || !data ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {rows.map((r) => {
                                const f = data.figures[r.key];
                                if (!f) return null;
                                return (
                                    <div key={r.key} className="rounded-xl border p-3">
                                        <p className="text-xs text-muted-foreground">{r.label}</p>
                                        <p className="mt-1 text-xl font-bold">{(r.format ?? String)(f.value)}</p>
                                        <Change f={f} lowerIsBetter={r.lowerIsBetter} />
                                    </div>
                                );
                            })}
                        </div>
                        {who === 'chef' && (
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                <span>Rating: <strong className="text-foreground">{data.overallRating ? `${data.overallRating} / 5` : 'no reviews yet'}</strong> ({data.totalReviews ?? 0} reviews)</span>
                                <span>Followers: <strong className="text-foreground">{data.followers ?? 0}</strong></span>
                                {!!data.invoicesToSubmit && <span className="text-orange-600">Invoices to submit: {money(data.invoicesToSubmit)}</span>}
                            </div>
                        )}
                        {who === 'admin' && data.topChefs && data.topChefs.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-semibold">Top chefs</p>
                                <ol className="space-y-1 text-sm">
                                    {data.topChefs.map((c, i) => <li key={c.id} className="flex justify-between gap-2"><span>{i + 1}. {c.name}</span><span className="text-muted-foreground">{money(c.sales)} · {c.orders} orders</span></li>)}
                                </ol>
                            </div>
                        )}
                        {who === 'admin' && data.toDo && (
                            <p className="text-sm text-muted-foreground">To do: {data.toDo.videosToCheck} chef video{data.toDo.videosToCheck === 1 ? '' : 's'} to check, {data.toDo.chefApplications} chef application{data.toDo.chefApplications === 1 ? '' : 's'} waiting.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
