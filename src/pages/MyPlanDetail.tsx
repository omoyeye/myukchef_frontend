import { useEffect, useMemo, useState } from "react";
import { PayByCardButton } from "@/components/orders/PayByCardButton";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { AlertTriangle, ArrowLeft, CalendarClock, ChefHat, ChevronDown, Lock, Loader2, MapPin, MessageCircle, Minus, PartyPopper, PauseCircle, Pencil, PlayCircle, Plus, RefreshCw, ShieldCheck, SkipForward, Star, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";
import { Layout } from "@/components/layout/Layout";
import { PageLoader } from "@/components/layout/AppShell";
import { PlanChat } from "@/components/plans/PlanChat";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { Stars } from "@/components/reviews/Stars";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { dietaryLabel, inDays, money, PLAN_STATUS, PlanDetail, planDate, planName, PlanWeek, totalMeals, WEEK_STATUS, WINDOWS } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";
import { allergenLabel, allergenSummary } from "@/lib/allergens";

/** A delivery's menu can be changed until its cut-off. */
const MenuEditor = ({ plan, week, onClose }: { plan: PlanDetail; week: PlanWeek | null; onClose: () => void }) => {
    const qc = useQueryClient();
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [note, setNote] = useState("");

    useEffect(() => {
        if (!week) return;
        setCounts(Object.fromEntries(week.items.map((i) => [i.dishId, i.meals])));
        setNote(week.note ?? "");
    }, [week]);

    const query = new URLSearchParams();
    if (plan.dietary?.length) query.set("dietary", plan.dietary.join(","));
    if (plan.avoidAllergens?.length) query.set("avoid", plan.avoidAllergens.join(","));
    const { data: dishes = [], isLoading } = useQuery<any[]>({
        queryKey: ["plan-dishes", plan.chefId, query.toString()],
        queryFn: () => api.get(`/meal-plans/chefs/${plan.chefId}/dishes?${query}`),
        enabled: !!week,
    });

    // Keep dishes already in this week visible even if the chef has since taken them off the menu.
    const options = useMemo(() => {
        const extras = (week?.items ?? []).filter((i) => !dishes.some((d) => d.id === i.dishId)).map((i) => ({ id: i.dishId, name: i.name, image: i.image, price: i.price }));
        return [...dishes, ...extras];
    }, [dishes, week]);

    const chosen = Object.values(counts).reduce((a, b) => a + b, 0);
    const target = plan.mealsPerWeek;
    const food = options.reduce((sum, d) => sum + d.price * (counts[d.id] ?? 0) * plan.servings, 0);
    const total = food * (1 - plan.discountPercent / 100) + plan.deliveryFee;

    const save = useMutation({
        mutationFn: () => api.put(`/meal-plans/${plan.id}/weeks/${week!.id}/menu`, { items: Object.entries(counts).filter(([, meals]) => meals > 0).map(([dishId, meals]) => ({ dishId, meals })), note }),
        onSuccess: () => {
            toast.success(`Week ${week!.weekNumber} menu saved`);
            qc.invalidateQueries({ queryKey: ["meal-plan", plan.id] });
            onClose();
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <Sheet open={!!week} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="bottom" className="flex max-h-[92dvh] flex-col rounded-t-3xl p-0 sm:mx-auto sm:max-w-2xl">
                <div className="border-b p-5 pb-4">
                    <SheetTitle>Week {week?.weekNumber} menu</SheetTitle>
                    <SheetDescription>{week && planDate(week.deliveryDate, "EEEE d MMMM")}</SheetDescription>
                    <div className="mt-3 flex items-center gap-3">
                        <Progress value={(chosen / target) * 100} className="h-2 flex-1" />
                        <span className={cn("text-sm font-bold", chosen === target ? "text-emerald-700" : chosen > target ? "text-destructive" : "text-primary")} aria-live="polite">{chosen} of {target} meals</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
                    ) : options.map((dish) => {
                        const count = counts[dish.id] ?? 0;
                        return (
                            <div key={dish.id} className={cn("flex items-center gap-3 rounded-2xl border p-2", count > 0 && "border-primary bg-primary/5")}>
                                <img src={dish.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                                <div className="min-w-0 flex-1">
                                    <p className="break-words font-semibold leading-tight">{dish.name}</p>
                                    <p className="text-sm text-muted-foreground">{money(dish.price)} a portion</p>
                                    <p className="text-xs text-muted-foreground">{allergenSummary(dish.allergens)}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <Button type="button" size="icon" variant="outline" aria-label={`Remove a ${dish.name} meal`} className="h-10 w-10 rounded-full" disabled={count === 0} onClick={() => setCounts({ ...counts, [dish.id]: count - 1 })}><Minus className="h-4 w-4" /></Button>
                                    <span className="w-6 text-center font-bold">{count}</span>
                                    <Button type="button" size="icon" aria-label={`Add a ${dish.name} meal`} className="h-10 w-10 rounded-full" disabled={chosen >= target} onClick={() => setCounts({ ...counts, [dish.id]: count + 1 })}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        );
                    })}
                    <div className="space-y-2 pt-2">
                        <Label htmlFor="week-note">Note for your chef this week</Label>
                        <Input id="week-note" className="h-11" maxLength={300} placeholder="Extra spicy, leave with a neighbour..." value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <div>
                        <p className="text-xs text-muted-foreground">This week, with delivery</p>
                        <p className="font-display text-xl font-extrabold">{money(total)}</p>
                    </div>
                    <Button className="h-12 rounded-full px-6 font-bold" disabled={chosen !== target || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving..." : "Save menu"}</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};

const WeekCard = ({ plan, week, isNext, onEdit, onSkip, onUnskip, busy }: { plan: PlanDetail; week: PlanWeek; isNext: boolean; onEdit: () => void; onSkip: () => void; onUnskip: () => void; busy: boolean }) => {
    const status = WEEK_STATUS[week.status] ?? WEEK_STATUS.scheduled;
    const open = ["active", "requested", "paused"].includes(plan.status);
    const canChange = open && !week.locked;
    const off = ["skipped", "paused", "cancelled", "missed"].includes(week.status);
    return (
        <li className={cn("rounded-3xl border bg-card p-4", isNext && "border-primary ring-1 ring-primary", off && "bg-muted/40")}>
            <div className="flex gap-3">
                <span className={cn("flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl", isNext ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                    <span className="text-[11px] font-bold uppercase">{planDate(week.deliveryDate, "MMM")}</span>
                    <span className="font-display text-2xl font-extrabold leading-none">{planDate(week.deliveryDate, "d")}</span>
                    <span className="text-[10px]">{planDate(week.deliveryDate, "EEE")}</span>
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <p className="font-bold">Week {week.weekNumber}</p>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", status.className)}>{status.label}</span>
                    </div>
                    <ul className={cn("mt-1.5 space-y-1", off && "opacity-60")}>
                        {week.items.map((item) => (
                            <li key={item.dishId} className="flex flex-wrap items-center gap-x-2 text-sm">
                                <img src={item.image} alt="" loading="lazy" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                                <span className="min-w-0 flex-1 break-words">{item.name}</span>
                                <span className="shrink-0 font-semibold text-muted-foreground">× {item.meals}</span>
                                {item.allergens && <span className="basis-full pl-9 text-xs text-muted-foreground">{allergenSummary(item.allergens)}</span>}
                            </li>
                        ))}
                    </ul>
                    {week.note && <p className="mt-2 rounded-xl bg-secondary/70 px-3 py-1.5 text-sm">{week.note}</p>}
                </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <div className="min-w-0 text-sm">
                    {!off && <span className="font-bold">{money(week.total)}</span>}
                    {!off && week.isPaid && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">Paid</span>}
                    {off && week.status !== "missed" && <span className="text-muted-foreground">No charge</span>}
                    {week.status === "missed" && <span className="text-muted-foreground">You won't be charged</span>}
                    {!off && !week.isPaid && week.total > 0 && ["scheduled", "preparing", "out_for_delivery", "delivered"].includes(week.status) && (
                        <span className="mt-2 block"><PayByCardButton className="h-10" payPath={`/meal-plans/${plan.id}/weeks/${week.id}/pay`} statusPath={`/meal-plans/${plan.id}/weeks/${week.id}/payment-status`} amount={week.total} refreshKey={["meal-plan", plan.id]} label="Pay this week" /></span>
                    )}
                    {open && week.status === "scheduled" && week.lockAt && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            {week.locked ? <><Lock className="h-3 w-3" />Your chef is preparing this</> : <>Change by {format(new Date(week.lockAt), "EEE d MMM")}</>}
                        </span>
                    )}
                </div>
                {canChange && (
                    <div className="flex gap-2">
                        {week.status === "scheduled" && (
                            <>
                                <Button variant="ghost" className="h-10 px-3" disabled={busy} onClick={onSkip}><SkipForward className="mr-1.5 h-4 w-4" />Skip</Button>
                                <Button variant="outline" className="h-10 px-3" onClick={onEdit}><Pencil className="mr-1.5 h-4 w-4" />Change menu</Button>
                            </>
                        )}
                        {week.status === "skipped" && <Button variant="outline" className="h-10 px-3" disabled={busy} onClick={onUnskip}><Undo2 className="mr-1.5 h-4 w-4" />Bring back</Button>}
                    </div>
                )}
            </div>
        </li>
    );
};

const MyPlanDetail = () => {
    const { id } = useParams<{ id: string }>();
    const planId = Number(id);
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [editing, setEditing] = useState<PlanWeek | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [pauseOpen, setPauseOpen] = useState(false);
    const [pauseUntil, setPauseUntil] = useState(inDays(14));
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [reviewOpen, setReviewOpen] = useState(false);
    const [renewOpen, setRenewOpen] = useState(false);
    const [renewMonths, setRenewMonths] = useState(3);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate(`/login?redirect=${encodeURIComponent(`/my-plans/${id}`)}`, { replace: true });
    }, [authLoading, isAuthenticated, navigate, id]);

    const { data: plan, isLoading, isError } = useQuery<PlanDetail>({
        queryKey: ["meal-plan", planId],
        queryFn: () => api.get(`/meal-plans/${planId}`),
        enabled: isAuthenticated && Number.isInteger(planId),
        retry: false,
        refetchInterval: 30_000,
    });

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ["meal-plan", planId] });
        qc.invalidateQueries({ queryKey: ["my-plans"] });
    };
    const action = (path: string, success: string) => ({
        mutationFn: (body?: object) => api.post(`/meal-plans/${planId}/${path}`, body ?? {}),
        onSuccess: () => { toast.success(success); refresh(); },
        onError: (e: Error) => toast.error(e.message),
    });
    const skip = useMutation({ mutationFn: (weekId: number) => api.post(`/meal-plans/${planId}/weeks/${weekId}/skip`, {}), onSuccess: () => { toast.success("Week skipped. You won't be charged for it."); refresh(); }, onError: (e: Error) => toast.error(e.message) });
    const unskip = useMutation({ mutationFn: (weekId: number) => api.post(`/meal-plans/${planId}/weeks/${weekId}/unskip`, {}), onSuccess: () => { toast.success("Welcome back. This delivery is on again."); refresh(); }, onError: (e: Error) => toast.error(e.message) });
    const pause = useMutation({ ...action("pause", "Plan paused"), onSuccess: () => { toast.success("Plan paused"); setPauseOpen(false); refresh(); } });
    const resume = useMutation(action("resume", "Your plan is back on"));
    const cancel = useMutation({
        ...action("cancel", "Plan cancelled"),
        onSuccess: (result: any) => {
            toast.success(result.stillComing?.length ? `Plan cancelled. Your delivery on ${planDate(result.stillComing[0], "d MMM")} still goes ahead.` : "Plan cancelled");
            setCancelOpen(false);
            refresh();
        },
    });
    const renew = useMutation({
        mutationFn: () => api.post(`/meal-plans/${planId}/renew`, { durationMonths: renewMonths }),
        onSuccess: (next: any) => { toast.success("Renewal sent to your chef"); setRenewOpen(false); refresh(); navigate(`/my-plans/${next.id}`); },
        onError: (e: Error) => toast.error(e.message),
    });

    if (authLoading || isLoading) return <Layout><PageLoader /></Layout>;
    if (isError || !plan) {
        return (
            <Layout>
                <SEO title="Plan not found" noindex />
                <div className="container px-4 py-20 text-center">
                    <h1 className="mb-3 text-2xl font-bold">We couldn't find this plan</h1>
                    <Button asChild className="h-11"><Link to="/my-plans">Back to my plans</Link></Button>
                </div>
            </Layout>
        );
    }

    const status = PLAN_STATUS[plan.status] ?? PLAN_STATUS.active;
    const isOpen = ["requested", "active", "paused"].includes(plan.status);
    const nextId = plan.nextDelivery?.id;
    const daysToEnd = differenceInCalendarDays(parseISO(plan.endDate), new Date());
    const canRenew = plan.status === "completed" || plan.status === "cancelled" || (["active", "paused"].includes(plan.status) && daysToEnd <= 21);
    const upcoming = plan.weeks.filter((w) => w.deliveryDate >= inDays(-1) || !["delivered", "skipped", "cancelled", "missed"].includes(w.status));
    const visible = showAll ? plan.weeks : (upcoming.length ? upcoming : plan.weeks).slice(0, 5);
    const windowLabel = WINDOWS.find((w) => w.id === plan.deliveryWindow)?.label.toLowerCase();
    const percent = (plan.weeksDelivered / Math.max(plan.weeksTotal, 1)) * 100;

    return (
        <Layout>
            <SEO title={planName(plan.durationMonths)} description="Manage your meal plan." noindex />
            <div className="container max-w-6xl px-4 pb-10">
                <Link to="/my-plans" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />My plans</Link>

                {/* OVERVIEW */}
                <header className="relative overflow-hidden rounded-[2rem] bg-ink p-5 text-ink-foreground md:p-8">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
                    <div className="relative">
                        <div className="flex items-start gap-4">
                            <Link to={`/chefs/${plan.chefId}`} className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-foreground/10 md:h-20 md:w-20" aria-label={`View ${plan.chef.displayName}'s profile`}>
                                {plan.chef.avatar ? <img src={plan.chef.avatar} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-8 w-8 text-primary" />}
                            </Link>
                            <div className="min-w-0 flex-1">
                                <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-bold", status.className)}>{status.label}</span>
                                <h1 className="mt-1.5 font-display text-2xl font-extrabold md:text-4xl">{planName(plan.durationMonths)}</h1>
                                <p className="break-words text-ink-foreground/70">with {plan.chef.displayName} · {plan.mealsPerWeek} meals for {plan.servings}</p>
                            </div>
                        </div>
                        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-foreground/15 pt-4 text-sm">
                            <div><dt className="text-ink-foreground/60">Delivered</dt><dd className="font-display text-xl font-extrabold">{plan.weeksDelivered}/{plan.weeksTotal}</dd></div>
                            <div><dt className="text-ink-foreground/60">Saving</dt><dd className="font-display text-xl font-extrabold">{plan.discountPercent > 0 ? `${plan.discountPercent}%` : "None"}</dd></div>
                            <div><dt className="text-ink-foreground/60">Estimated total</dt><dd className="font-display text-xl font-extrabold">{money(plan.estimatedTotal)}</dd></div>
                        </dl>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-foreground/15" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} aria-label="Plan progress"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div>
                    </div>
                </header>

                {/* STATE-SPECIFIC NOTICES */}
                <div className="mt-4 space-y-3">
                    {plan.status === "requested" && (
                        <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950">
                            <CalendarClock className="h-5 w-5 shrink-0" />
                            <div><p className="font-bold">Waiting for {plan.chef.displayName} to confirm</p><p className="text-sm">Nothing is charged yet. If they don't reply before {planDate(plan.startDate, "d MMMM")}, the request ends by itself.</p></div>
                        </div>
                    )}
                    {plan.status === "paused" && plan.pausedUntil && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-50 p-4 text-sky-950">
                            <p className="flex items-center gap-2 font-semibold"><PauseCircle className="h-5 w-5 shrink-0" />Paused until {planDate(plan.pausedUntil, "d MMMM")}</p>
                            <Button className="h-11" disabled={resume.isPending} onClick={() => resume.mutate(undefined)}><PlayCircle className="mr-2 h-4 w-4" />Restart now</Button>
                        </div>
                    )}
                    {plan.status === "declined" && (
                        <div className="rounded-2xl bg-red-50 p-4 text-red-950">
                            <p className="font-bold">{plan.chef.displayName} can't take this plan</p>
                            {plan.chefNote && <p className="mt-1 text-sm">"{plan.chefNote}"</p>}
                            <p className="mt-1 text-sm">Nothing is owed.</p>
                            <Button asChild className="mt-3 h-11"><Link to="/meal-plans/new">Find another chef</Link></Button>
                        </div>
                    )}
                    {plan.status === "active" && plan.chefNote && (
                        <div className="rounded-2xl bg-secondary p-4 text-sm"><span className="font-bold">{plan.chef.displayName.split(" ")[0]} says:</span> {plan.chefNote}</div>
                    )}
                    {plan.status === "completed" && (
                        <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-950"><PartyPopper className="h-5 w-5 shrink-0" /><div><p className="font-bold">That's your plan complete</p><p className="text-sm">Hope it was delicious. It won't renew unless you choose to.</p></div></div>
                    )}
                    {canRenew && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                            <div><p className="font-bold">Keep it going?</p><p className="text-sm text-muted-foreground">Same chef, same dishes, starting after this plan.</p></div>
                            <Button className="h-11" onClick={() => { setRenewMonths(plan.durationMonths); setRenewOpen(true); }}><RefreshCw className="mr-2 h-4 w-4" />Renew plan</Button>
                        </div>
                    )}
                    {plan.canReview && !plan.myReview && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                            <div><p className="font-bold">How is {plan.chef.displayName.split(" ")[0]} doing?</p><p className="text-sm text-muted-foreground">Your rating helps other customers, and helps your chef too.</p></div>
                            <Button className="h-11" onClick={() => setReviewOpen(true)}><Star className="mr-2 h-4 w-4" />Rate your chef</Button>
                        </div>
                    )}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
                    {/* DELIVERIES */}
                    <section aria-labelledby="deliveries-heading" className="min-w-0">
                        <h2 id="deliveries-heading" className="mb-3 font-display text-2xl font-extrabold">{showAll ? "All deliveries" : "Coming up"}</h2>
                        <ul className="space-y-3">
                            {visible.map((week) => (
                                <WeekCard
                                    key={week.id}
                                    plan={plan}
                                    week={week}
                                    isNext={week.id === nextId && isOpen}
                                    busy={skip.isPending || unskip.isPending}
                                    onEdit={() => setEditing(week)}
                                    onSkip={() => skip.mutate(week.id)}
                                    onUnskip={() => unskip.mutate(week.id)}
                                />
                            ))}
                        </ul>
                        {plan.weeks.length > visible.length || showAll ? (
                            <Button variant="outline" className="mt-3 h-11 w-full" onClick={() => setShowAll(!showAll)}>
                                <ChevronDown className={cn("mr-2 h-4 w-4 transition-transform", showAll && "rotate-180")} />{showAll ? "Show fewer" : `Show all ${plan.weeks.length} deliveries`}
                            </Button>
                        ) : null}
                    </section>

                    <aside className="space-y-4">
                        <section className="rounded-3xl border bg-card p-5">
                            <h2 className="mb-3 flex items-center gap-2 font-bold"><MessageCircle className="h-4 w-4 text-primary" />Chat with {plan.chef.displayName.split(" ")[0]}</h2>
                            <PlanChat postPath={`/meal-plans/${plan.id}/messages`} invalidateKey={["meal-plan", plan.id]} messages={plan.messages} viewerRole="customer" otherName={plan.chef.displayName.split(" ")[0]} />
                        </section>

                        <section className="space-y-3 rounded-3xl border bg-card p-5 text-sm">
                            <h2 className="font-bold">Plan details</h2>
                            <p>Every {planDate(plan.startDate, "EEEE")}, {windowLabel}, from {planDate(plan.startDate, "d MMM")} to {planDate(plan.endDate, "d MMM yyyy")}</p>
                            <p className="flex items-start gap-1.5 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{plan.deliveryAddress.street}, {plan.deliveryAddress.city}, {plan.deliveryAddress.postcode}</p>
                            {(plan.dietary?.length > 0 || plan.avoidAllergens?.length > 0) && (
                                <p className="flex items-start gap-1.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{[...plan.dietary.map(dietaryLabel), ...plan.avoidAllergens.map((a) => `No ${allergenLabel(a).toLowerCase()}`)].join(" · ")}</p>
                            )}
                            {plan.requests && <p className="rounded-xl bg-secondary/70 p-3"><span className="font-semibold">Your request:</span> {plan.requests}</p>}
                            <p className="text-muted-foreground">You pay per delivery. Changes close {plan.cutoffHours} hours before each one.</p>
                        </section>

                        {plan.myReview && (
                            <section className="rounded-3xl border bg-card p-5">
                                <h2 className="font-bold">Your review</h2>
                                <Stars value={plan.myReview.rating} className="mt-1" />
                                {plan.myReview.comment && <p className="mt-1 break-words text-sm text-muted-foreground">{plan.myReview.comment}</p>}
                                <Button variant="link" className="h-11 px-0" onClick={() => setReviewOpen(true)}>Edit your review</Button>
                            </section>
                        )}

                        {isOpen && (
                            <section className="space-y-2">
                                {plan.status === "active" && <Button variant="outline" className="h-11 w-full justify-start" onClick={() => setPauseOpen(true)}><PauseCircle className="mr-2 h-4 w-4" />Pause plan</Button>}
                                <Button variant="ghost" className="h-11 w-full justify-start text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)}><XCircle className="mr-2 h-4 w-4" />{plan.status === "requested" ? "Withdraw request" : "Cancel plan"}</Button>
                            </section>
                        )}
                    </aside>
                </div>
            </div>

            <MenuEditor plan={plan} week={editing} onClose={() => setEditing(null)} />
            <ReviewDialog chefId={plan.chefId} chefName={plan.chef.displayName} open={reviewOpen} onOpenChange={setReviewOpen} existing={plan.myReview} />

            <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pause your plan</DialogTitle>
                        <DialogDescription>Deliveries before this date are put on hold at no charge. Any delivery past its cut-off still goes ahead. Your plan's end date stays the same.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="pause-until">Restart on</Label>
                        <Input id="pause-until" type="date" className="h-11" min={inDays(1)} max={inDays(84)} value={pauseUntil} onChange={(e) => setPauseUntil(e.target.value)} />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="h-11" onClick={() => setPauseOpen(false)}>Keep plan running</Button>
                        <Button className="h-11" disabled={pause.isPending} onClick={() => pause.mutate({ until: pauseUntil })}>{pause.isPending ? "Pausing..." : "Pause plan"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{plan.status === "requested" ? "Withdraw your request?" : "Cancel your plan?"}</DialogTitle>
                        <DialogDescription>{plan.status === "requested" ? "Your chef will be told, and nothing is owed." : "Future deliveries stop and you won't pay for them. Any delivery past its cut-off still goes ahead, because your chef has already prepared for it."}</DialogDescription>
                    </DialogHeader>
                    {plan.status !== "requested" && (
                        <p className="flex gap-2 rounded-2xl bg-secondary p-3 text-sm"><AlertTriangle className="h-4 w-4 shrink-0 text-primary" />Just need a break? You could pause or skip a week instead.</p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="cancel-reason">Anything we could do better? (optional)</Label>
                        <Textarea id="cancel-reason" rows={2} maxLength={300} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="h-11" onClick={() => setCancelOpen(false)}>Keep my plan</Button>
                        <Button variant="destructive" className="h-11" disabled={cancel.isPending} onClick={() => cancel.mutate({ reason: cancelReason })}>{cancel.isPending ? "Cancelling..." : plan.status === "requested" ? "Withdraw request" : "Cancel plan"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renew with {plan.chef.displayName}</DialogTitle>
                        <DialogDescription>We'll send your chef a new request with the same dishes and delivery day. This plan isn't affected, and nothing is charged today.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 3, 6].map((months) => (
                            <button key={months} type="button" aria-pressed={renewMonths === months} onClick={() => setRenewMonths(months)} className={cn("min-h-20 rounded-2xl border-2 text-center", renewMonths === months ? "border-primary bg-primary/5" : "hover:border-primary/40")}>
                                <span className="block font-display text-3xl font-extrabold">{months}</span>
                                <span className="text-sm">{months === 1 ? "month" : "months"}</span>
                            </button>
                        ))}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="h-11" onClick={() => setRenewOpen(false)}>Not now</Button>
                        <Button className="h-11" disabled={renew.isPending} onClick={() => renew.mutate()}>{renew.isPending ? "Sending..." : "Send request"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default MyPlanDetail;
