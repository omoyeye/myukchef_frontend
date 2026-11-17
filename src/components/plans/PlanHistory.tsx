import { peopleLabel } from "@/lib/area";
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChefHat, History, RefreshCw, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { money, PLAN_STATUS, planDate, planName, PlanHistoryItem, ReorderSuggestion } from '@/lib/mealPlans';
import { cn } from '@/lib/utils';

const Avatar = ({ src }: { src: string | null }) => (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-5 w-5 text-primary" />}
    </span>
);

/** "Order it again" cards for plans the customer enjoyed. Shows nothing when there's nothing to suggest. */
export function ReorderSuggestions({ className }: { className?: string }) {
    const { isAuthenticated, user } = useAuth();
    const { data = [] } = useQuery<ReorderSuggestion[]>({
        queryKey: ['plan-suggestions'],
        queryFn: () => api.get('/meal-plans/suggestions'),
        enabled: isAuthenticated && (!user?.role || user.role === 'customer'),
    });
    if (!data.length) return null;
    return (
        <section className={cn('space-y-3', className)} aria-labelledby="reorder-heading">
            <h2 id="reorder-heading" className="flex items-center gap-2 font-display text-xl font-bold"><Sparkles className="h-5 w-5 text-primary" />Order a plan again</h2>
            <div className="grid gap-4 md:grid-cols-2">
                {data.map((s) => (
                    <article key={s.planId} className="flex flex-col gap-3 rounded-3xl border border-primary/30 bg-primary/5 p-5">
                        <div className="flex items-center gap-3">
                            <Avatar src={s.chef.avatar} />
                            <div className="min-w-0">
                                <p className="truncate font-bold">{s.chef.displayName}</p>
                                <p className="text-sm text-muted-foreground">{s.reason}</p>
                            </div>
                        </div>
                        {s.favouriteDishes.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {s.favouriteDishes.map((d) => <img key={d.name} src={d.image} alt="" className="h-9 w-9 rounded-full border-2 border-background object-cover" />)}
                                </div>
                                <p className="min-w-0 truncate text-sm">Your favourites: {s.favouriteDishes.map((d) => d.name).join(', ')}</p>
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {s.length} · {s.mealsPerWeek} meals a week for {peopleLabel(s, s.servings)}{s.weeklyPrice ? ` · about ${money(s.weeklyPrice)} a week` : ''}
                        </p>
                        <Button asChild className="mt-auto h-11 rounded-full font-bold">
                            <Link to={`/my-plans/${s.planId}?reorder=1`}><RefreshCw className="mr-2 h-4 w-4" />Order again</Link>
                        </Button>
                    </article>
                ))}
            </div>
        </section>
    );
}

/** Every finished plan, with what was delivered and paid. */
export function CustomerPlanHistory() {
    const { data } = useQuery<{ plans: PlanHistoryItem[]; totals: { plans: number; meals: number; paid: number } }>({
        queryKey: ['plan-history'],
        queryFn: () => api.get('/meal-plans/history'),
    });
    if (!data || data.plans.length === 0) return null;
    return (
        <section className="space-y-3" aria-labelledby="history-heading">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 id="history-heading" className="flex items-center gap-2 font-display text-xl font-bold"><History className="h-5 w-5 text-primary" />Plan history</h2>
                <p className="text-sm text-muted-foreground">{data.totals.meals} meals from {data.totals.plans} plan{data.totals.plans === 1 ? '' : 's'} · {money(data.totals.paid)} paid</p>
            </div>
            <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
                {data.plans.map((p) => {
                    const status = PLAN_STATUS[p.status] ?? PLAN_STATUS.completed;
                    return (
                        <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                            <Link to={`/my-plans/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:underline">
                                <Avatar src={p.chef.avatar} />
                                <div className="min-w-0">
                                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                                        {planName(p)} with {p.chef.displayName}
                                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', status?.className)}>{status?.label}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {planDate(p.startDate, 'd MMM yyyy')} to {planDate(p.lastDelivery ?? p.endDate, 'd MMM yyyy')} · {p.weeksDelivered} of {p.weeksTotal} delivered · {p.mealsDelivered} meals · {money(p.paidTotal)}
                                    </p>
                                    {p.favouriteDishes.length > 0 && <p className="truncate text-xs text-muted-foreground">Most loved: {p.favouriteDishes.map((d) => d.name).join(', ')}</p>}
                                </div>
                            </Link>
                            {p.canReorder ? (
                                <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full"><Link to={`/my-plans/${p.id}?reorder=1`}><RefreshCw className="mr-1.5 h-4 w-4" />Order again</Link></Button>
                            ) : p.nextPlanId ? (
                                <Button asChild variant="ghost" size="sm" className="shrink-0"><Link to={`/my-plans/${p.nextPlanId}`}>See the new plan</Link></Button>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
