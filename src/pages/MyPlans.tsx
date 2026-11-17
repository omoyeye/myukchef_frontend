import { peopleLabel } from "@/lib/area";
import { useEffect } from "react";
import { ListSkeleton } from "@/components/common/Skeletons";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ChefHat, CreditCard, Loader2, Plus } from "lucide-react";
import SEO from "@/components/common/SEO";
import { CustomerPortal } from "@/components/layout/CustomerPortal";
import { CustomerPlanHistory, ReorderSuggestions } from "@/components/plans/PlanHistory";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { PLAN_STATUS, PlanSummary, money, planDate, planName, totalMeals } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";

const OPEN = ["requested", "active", "paused"];

const PlanCard = ({ plan, cardPayments }: { plan: PlanSummary; cardPayments: boolean }) => {
    const status = PLAN_STATUS[plan.status] ?? PLAN_STATUS.active;
    const next = plan.nextDelivery;
    const due = cardPayments && plan.status === "active" ? plan.nextPayment : null;
    return (
        <Link to={due ? `/my-plans/${plan.id}?pay=${due.weekId}` : `/my-plans/${plan.id}`} className="group block overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-warm-lg">
            <div className="flex items-start gap-3 p-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                    {plan.chef?.avatar ? <img src={plan.chef.avatar} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-6 w-6 text-primary" />}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display text-lg font-bold">{planName(plan)}</p>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", status.className)}>{status.label}</span>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">with {plan.chef?.displayName} · {plan.mealsPerWeek} meals for {peopleLabel(plan, plan.servings)}</p>
                </div>
            </div>
            {due && (
                <div className="mx-5 mb-3 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-3">
                    <CreditCard className="h-5 w-5 shrink-0 text-primary" />
                    <p className="min-w-0 flex-1 text-sm"><span className="font-bold">Payment due: {money(due.amount)}</span> for {planDate(due.deliveryDate, "EEEE d MMM")}. Your chef cooks once it's paid.</p>
                    <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">Pay now</span>
                </div>
            )}
            {OPEN.includes(plan.status) && next && (
                <div className="mx-5 flex items-center gap-3 rounded-2xl bg-secondary/70 p-3">
                    <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-background">
                        <span className="text-[10px] font-bold uppercase text-primary">{planDate(next.deliveryDate, "MMM")}</span>
                        <span className="font-display text-xl font-extrabold leading-none">{planDate(next.deliveryDate, "d")}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">Next: {planDate(next.deliveryDate, "EEEE")}</p>
                        <p className="truncate text-sm text-muted-foreground">{totalMeals(next.items)} meals · {next.items.map((i) => i.name).join(", ")}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold">{money(next.total)}</span>
                </div>
            )}
            <div className="p-5 pt-4">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>{plan.weeksDelivered} of {plan.weeksTotal} delivered</span>
                    <span>Ends {planDate(plan.endDate, "d MMM yyyy")}</span>
                </div>
                <Progress value={(plan.weeksDelivered / Math.max(plan.weeksTotal, 1)) * 100} className="h-2" />
            </div>
        </Link>
    );
};

const MyPlans = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate(`/login?redirect=${encodeURIComponent("/my-plans")}`, { replace: true });
    }, [authLoading, isAuthenticated, navigate]);

    const { data: plans = [], isLoading } = useQuery<PlanSummary[]>({ queryKey: ["my-plans"], queryFn: () => api.get("/meal-plans/mine"), enabled: isAuthenticated });
    const { data: payment } = useQuery<{ cardPayments: boolean }>({ queryKey: ["payment-config"], queryFn: () => api.get("/orders/payment-config"), staleTime: 60_000 });

    const open = plans.filter((p) => OPEN.includes(p.status));

    return (
        <CustomerPortal>
            <SEO title="My Meal Plans" description="Manage your meal plans." noindex />
            <div>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="font-display text-3xl font-extrabold md:text-4xl">My meal plans</h1>
                        <p className="mt-1 text-muted-foreground">Change, skip or pause your deliveries.</p>
                    </div>
                    <Button asChild className="h-11 rounded-full font-bold"><Link to="/meal-plans/new"><Plus className="mr-2 h-4 w-4" />New plan</Link></Button>
                </div>

                {isLoading || authLoading ? (
                    <ListSkeleton />
                ) : plans.length === 0 ? (
                    <div className="rounded-[2rem] bg-ink p-8 text-center text-ink-foreground md:p-14">
                        <CalendarDays className="mx-auto mb-4 h-12 w-12 text-primary" />
                        <h2 className="font-display text-2xl font-extrabold md:text-4xl">No more "what's for dinner?"</h2>
                        <p className="mx-auto mb-6 mt-2 max-w-md text-ink-foreground/70">Plan anything from 1 week to 6 months of food you love with a local chef. No payment up front, and you can skip any week.</p>
                        <Button asChild size="lg" className="h-12 rounded-full font-bold"><Link to="/meal-plans">See how it works <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <ReorderSuggestions />
                        {open.length > 0 && <div className="grid gap-4 md:grid-cols-2">{open.map((p) => <PlanCard key={p.id} plan={p} cardPayments={!!payment?.cardPayments} />)}</div>}
                        <CustomerPlanHistory />
                    </div>
                )}

            </div>
        </CustomerPortal>
    );
};

export default MyPlans;
