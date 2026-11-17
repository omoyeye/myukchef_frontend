import { peopleLabel, waitLabel } from "@/lib/area";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, CalendarDays, Check, ChefHat, ClipboardList, History, Inbox, MapPin, MessageCircle, RefreshCw, Truck, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { dietaryLabel, money, PLAN_STATUS, PlanDetail, planDate, planName, PlanSummary, WEEK_STATUS, WINDOWS } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";
import { allergenLabel, allergenSummary } from "@/lib/allergens";
import { PlanChat } from "./PlanChat";

const NeedsLine = ({ plan }: { plan: { dietary?: string[]; avoidAllergens?: string[] } }) => {
    if (!plan.dietary?.length && !plan.avoidAllergens?.length) return null;
    return (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-sm font-medium text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {[...(plan.dietary ?? []).map(dietaryLabel), ...(plan.avoidAllergens ?? []).map((a) => `No ${allergenLabel(a).toLowerCase()}`)].join(" · ")}
        </p>
    );
};

const PlanDialog = ({ planId, onClose }: { planId: number | null; onClose: () => void }) => {
    const { data: plan } = useQuery<PlanDetail>({
        queryKey: ["meal-plan", planId],
        queryFn: () => api.get(`/meal-plans/${planId}`),
        enabled: planId !== null,
        refetchInterval: planId !== null ? 30_000 : false,
    });
    return (
        <Dialog open={planId !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                {plan ? (
                    <div className="min-w-0 space-y-4">
                        <DialogHeader>
                            <DialogTitle>{plan.customerName}'s {planName(plan).toLowerCase()}</DialogTitle>
                            <DialogDescription>{plan.mealsPerWeek} meals for {peopleLabel(plan, plan.servings)}, every {planDate(plan.startDate, "EEEE")} until {planDate(plan.endDate, "d MMM yyyy")}</DialogDescription>
                        </DialogHeader>
                        <NeedsLine plan={plan} />
                        {plan.requests && <p className="rounded-xl bg-secondary p-3 text-sm"><span className="font-semibold">Request:</span> {plan.requests}</p>}
                        <ul className="divide-y rounded-2xl border">
                            {plan.weeks.map((w) => (
                                <li key={w.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                                    <span className="min-w-0"><span className="font-semibold">{planDate(w.deliveryDate)}</span><span className="block truncate text-muted-foreground">{w.items.map((i) => `${i.meals} × ${i.name}`).join(", ")}</span></span>
                                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", WEEK_STATUS[w.status]?.className)}>{WEEK_STATUS[w.status]?.label}</span>
                                </li>
                            ))}
                        </ul>
                        <div>
                            <h3 className="mb-2 flex items-center gap-2 font-bold"><MessageCircle className="h-4 w-4 text-primary" />Messages</h3>
                            <PlanChat postPath={`/meal-plans/${plan.id}/messages`} invalidateKey={["meal-plan", plan.id]} messages={plan.messages} viewerRole="chef" otherName={plan.customerName.split(" ")[0]} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3"><DialogTitle className="sr-only">Loading plan</DialogTitle><Skeleton className="h-6 w-2/3" /><Skeleton className="h-40 w-full" /></div>
                )}
            </DialogContent>
        </Dialog>
    );
};

const NEXT_STEP: Record<string, { status: string; label: string; icon: typeof Check }> = {
    scheduled: { status: "preparing", label: "Start cooking", icon: ChefHat },
    preparing: { status: "out_for_delivery", label: "Out for delivery", icon: Truck },
    out_for_delivery: { status: "delivered", label: "Mark delivered", icon: Check },
};

/** The chef's working view: new requests, what to cook and deliver, and every plan they run. */
export const ChefPlansPanel = () => {
    const qc = useQueryClient();
    const [responding, setResponding] = useState<{ plan: PlanSummary; action: "accept" | "decline" } | null>(null);
    const [note, setNote] = useState("");
    const [openPlan, setOpenPlan] = useState<number | null>(null);

    const { data: plans = [], isLoading } = useQuery<PlanSummary[]>({ queryKey: ["chef-plans"], queryFn: () => api.get("/meal-plans/chef") });
    const { data: sheet = [] } = useQuery<any[]>({ queryKey: ["chef-cook-sheet"], queryFn: () => api.get("/meal-plans/chef/cook-sheet") });

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ["chef-plans"] });
        qc.invalidateQueries({ queryKey: ["chef-cook-sheet"] });
    };

    const respond = useMutation({
        mutationFn: () => api.patch(`/meal-plans/${responding!.plan.id}/respond`, { action: responding!.action, note }),
        onSuccess: () => {
            toast.success(responding!.action === "accept" ? "Plan accepted. The customer has been told." : "Request declined");
            setResponding(null);
            setNote("");
            refresh();
        },
        onError: (e: Error) => toast.error(e.message),
    });
    const advance = useMutation({
        mutationFn: ({ planId, weekId, status }: { planId: number; weekId: number; status: string }) => api.patch(`/meal-plans/${planId}/weeks/${weekId}/status`, { status }),
        onSuccess: refresh,
        onError: (e: Error) => toast.error(e.message),
    });

    const requests = plans.filter((p) => p.status === "requested");
    const running = plans.filter((p) => ["active", "paused"].includes(p.status));
    const { data: history } = useQuery<{ plans: (PlanSummary & { customerName: string; mealsDelivered: number; paidTotal: number; renewed: boolean; favouriteDishes: { name: string }[]; lastDelivery: string | null })[]; totals: { plans: number; meals: number; paid: number; returnRate: number } }>({
        queryKey: ["chef-plan-history"],
        queryFn: () => api.get("/meal-plans/chef/history"),
    });

    // Shopping and prep list: the same dish across customers, added together per day.
    const days = useMemo(() => {
        const byDate = new Map<string, any[]>();
        for (const delivery of sheet) byDate.set(delivery.deliveryDate, [...(byDate.get(delivery.deliveryDate) ?? []), delivery]);
        return [...byDate.entries()].map(([date, deliveries]) => {
            const dishes = new Map<string, number>();
            for (const d of deliveries) for (const item of d.items) dishes.set(item.name, (dishes.get(item.name) ?? 0) + item.meals * d.servings);
            return { date, deliveries, dishes: [...dishes.entries()] };
        });
    }, [sheet]);

    if (isLoading) return <div className="space-y-3"><Skeleton className="h-32 w-full rounded-3xl" /><Skeleton className="h-32 w-full rounded-3xl" /></div>;

    return (
        <div className="space-y-8">
            <section aria-labelledby="requests-heading">
                <h2 id="requests-heading" className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><Inbox className="h-5 w-5 text-primary" />New requests {requests.length > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-sm text-primary-foreground">{requests.length}</span>}</h2>
                {requests.length === 0 ? (
                    <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">No new requests. Customers can find you from your profile and the Meal Plans page.</p>
                ) : (
                    <ul className="grid gap-4 md:grid-cols-2">
                        {requests.map((plan) => (
                            <li key={plan.id} className="space-y-3 rounded-3xl border-2 border-primary/30 bg-card p-5">
                                <div>
                                    <p className="font-display text-lg font-bold">{plan.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{planName(plan)} · {plan.mealsPerWeek} meals for {peopleLabel(plan, plan.servings)}</p>
                                    {plan.farAway?.length ? <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Outside your usual area ({plan.farAway[0].miles} miles). They agreed to wait {waitLabel(plan.farAway[0].extraHours)} longer.</p> : null}
                                </div>
                                <ul className="space-y-1 text-sm">
                                    <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Every {planDate(plan.startDate, "EEEE")} from {planDate(plan.startDate, "d MMM")}, {WINDOWS.find((w) => w.id === plan.deliveryWindow)?.label.toLowerCase()}</li>
                                    <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{plan.deliveryAddress.postcode} area</li>
                                    <li className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />About {money(plan.nextDelivery?.total ?? 0)} a week, including the customer's discount and delivery</li>
                                </ul>
                                <NeedsLine plan={plan} />
                                {plan.nextDelivery && <p className="text-sm"><span className="font-semibold">First week:</span> {plan.nextDelivery.items.map((i) => `${i.meals} × ${i.name}`).join(", ")}</p>}
                                {plan.requests && <p className="rounded-xl bg-secondary p-3 text-sm"><span className="font-semibold">Request:</span> {plan.requests}</p>}
                                <div className="flex gap-2">
                                    <Button variant="outline" className="h-11 flex-1" onClick={() => { setNote(""); setResponding({ plan, action: "decline" }); }}><X className="mr-1.5 h-4 w-4" />Decline</Button>
                                    <Button className="h-11 flex-1" onClick={() => { setNote(""); setResponding({ plan, action: "accept" }); }}><Check className="mr-1.5 h-4 w-4" />Accept</Button>
                                </div>
                                <Button variant="link" className="h-auto w-full p-0" onClick={() => setOpenPlan(plan.id)}>Ask a question first</Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="sheet-heading">
                <h2 id="sheet-heading" className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><ClipboardList className="h-5 w-5 text-primary" />Cook sheet: next 2 weeks</h2>
                {days.length === 0 ? (
                    <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing to cook yet. Accepted plans appear here automatically.</p>
                ) : (
                    <div className="space-y-4">
                        {days.map((day) => (
                            <article key={day.date} className="rounded-3xl border bg-card p-4 md:p-5">
                                <h3 className="font-display text-lg font-bold">{planDate(day.date, "EEEE d MMMM")}</h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {day.dishes.map(([name, portions]) => <span key={name} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{portions} × {name}</span>)}
                                </div>
                                <ul className="mt-3 space-y-3">
                                    {day.deliveries.map((d: any) => {
                                        const next = NEXT_STEP[d.status];
                                        const Icon = next?.icon;
                                        return (
                                            <li key={d.id} className="space-y-2 rounded-2xl bg-secondary/50 p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="font-bold">{d.customerName} <span className="font-normal text-muted-foreground">· {WINDOWS.find((w) => w.id === d.deliveryWindow)?.label}</span></p>
                                                    <span className="flex flex-wrap gap-1.5">
                                                        {d.awaitingPayment !== undefined && (d.awaitingPayment
                                                            ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Waiting for payment: don't cook yet</span>
                                                            : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">Paid: go ahead and cook</span>)}
                                                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", WEEK_STATUS[d.status]?.className)}>{d.locked || d.status !== "scheduled" ? WEEK_STATUS[d.status]?.label : "Customer can still change"}</span>
                                                    </span>
                                                </div>
                                                <p className="text-sm">{d.items.map((i: any) => `${i.meals} × ${i.name}`).join(", ")} <span className="text-muted-foreground">(for {d.people ?? d.servings})</span></p>
                                                <ul className="rounded-xl bg-background p-2 text-xs">
                                                    <li className="font-semibold">Allergen label to include with delivery:</li>
                                                    {d.items.map((i: any) => <li key={i.dishId}>{i.name}: {allergenSummary(i.allergens)}</li>)}
                                                </ul>
                                                <NeedsLine plan={d} />
                                                {d.note && <p className="rounded-xl bg-background p-2 text-sm"><span className="font-semibold">This week:</span> {d.note}</p>}
                                                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                                                    <span className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{d.deliveryAddress.street}, {d.deliveryAddress.city}, {d.deliveryAddress.postcode}</span>
                                                </div>
                                                {next && d.locked && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button className="h-11" disabled={advance.isPending} onClick={() => advance.mutate({ planId: d.planId, weekId: d.id, status: next.status })}><Icon className="mr-1.5 h-4 w-4" />{next.label}</Button>
                                                        <Button variant="ghost" className="h-11 text-muted-foreground" disabled={advance.isPending} onClick={() => { if (confirm("Mark this delivery as not delivered? The customer won't be charged.")) advance.mutate({ planId: d.planId, weekId: d.id, status: "missed" }); }}>Couldn't deliver</Button>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section aria-labelledby="running-heading">
                <h2 id="running-heading" className="mb-3 font-display text-xl font-bold">Your plans</h2>
                {running.length === 0 ? (
                    <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">Plans you accept will appear here.</p>
                ) : (
                    <ul className="grid gap-3 md:grid-cols-2">
                        {running.map((plan) => (
                            <li key={plan.id}>
                                <button type="button" onClick={() => setOpenPlan(plan.id)} className="w-full rounded-3xl border bg-card p-4 text-left transition-colors hover:border-primary">
                                    <span className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="font-bold">{plan.customerName}</span>
                                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", PLAN_STATUS[plan.status]?.className)}>{PLAN_STATUS[plan.status]?.label}</span>
                                    </span>
                                    <span className="block text-sm text-muted-foreground">{planName(plan)} · {plan.weeksDelivered} of {plan.weeksTotal} delivered</span>
                                    {plan.nextDelivery && ["active", "paused"].includes(plan.status) && <span className="block text-sm">Next: {planDate(plan.nextDelivery.deliveryDate)}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {history && history.plans.length > 0 && (
                <section aria-labelledby="history-heading">
                    <h2 id="history-heading" className="mb-1 flex items-center gap-2 font-display text-xl font-bold"><History className="h-5 w-5 text-primary" />Plan history</h2>
                    <p className="mb-3 text-sm text-muted-foreground">
                        {history.totals.meals} meals cooked across {history.totals.plans} plan{history.totals.plans === 1 ? "" : "s"} · {money(history.totals.paid)} paid by customers · {history.totals.returnRate}% came back for another plan
                    </p>
                    <ul className="divide-y overflow-hidden rounded-3xl border bg-card">
                        {history.plans.map((plan) => (
                            <li key={plan.id}>
                                <button type="button" onClick={() => setOpenPlan(plan.id)} className="flex w-full flex-col gap-1 p-4 text-left hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="min-w-0">
                                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                                            {plan.customerName} · {planName(plan)}
                                            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", PLAN_STATUS[plan.status]?.className)}>{PLAN_STATUS[plan.status]?.label}</span>
                                            {plan.renewed && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"><RefreshCw className="h-3 w-3" />Came back</span>}
                                        </span>
                                        <span className="block text-sm text-muted-foreground">
                                            {planDate(plan.startDate, "d MMM yyyy")} to {planDate(plan.lastDelivery ?? plan.endDate, "d MMM yyyy")} · {plan.weeksDelivered} of {plan.weeksTotal} delivered · {plan.mealsDelivered} meals
                                        </span>
                                        {plan.favouriteDishes.length > 0 && <span className="block truncate text-xs text-muted-foreground">Most ordered: {plan.favouriteDishes.map((d) => d.name).join(", ")}</span>}
                                    </span>
                                    <span className="shrink-0 text-sm font-semibold">{money(plan.paidTotal)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <Dialog open={!!responding} onOpenChange={(open) => !open && setResponding(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{responding?.action === "accept" ? "Accept this plan?" : "Decline this request?"}</DialogTitle>
                        <DialogDescription>
                            {responding?.action === "accept"
                                ? `You'll cook ${responding.plan.mealsPerWeek} meals for ${peopleLabel(responding.plan, responding.plan.servings)} every ${planDate(responding.plan.startDate, "EEEE")} for ${responding.plan.weeksTotal} weeks. You'll then see their delivery address. Keep all contact in the plan's messages.`
                                : "The customer will be told, and they can choose another chef."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="respond-note">Add a note for {responding?.plan.customerName?.split(" ")[0]} (optional)</Label>
                        <Textarea id="respond-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={responding?.action === "accept" ? "Looking forward to cooking for you!" : "Sorry, I'm fully booked until the spring."} />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="h-11" onClick={() => setResponding(null)}>Back</Button>
                        <Button variant={responding?.action === "accept" ? "default" : "destructive"} className="h-11" disabled={respond.isPending} onClick={() => respond.mutate()}>{respond.isPending ? "Sending..." : responding?.action === "accept" ? "Accept plan" : "Decline request"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <PlanDialog planId={openPlan} onClose={() => setOpenPlan(null)} />
        </div>
    );
};

export const ChefReviewsPanel = () => {
    const qc = useQueryClient();
    const [drafts, setDrafts] = useState<Record<number, string>>({});
    const { data: reviews = [], isLoading } = useQuery<any[]>({ queryKey: ["chef-received-reviews"], queryFn: () => api.get("/chef-reviews/received") });
    const reply = useMutation({
        mutationFn: ({ id, text }: { id: number; text: string }) => api.post(`/chef-reviews/${id}/reply`, { reply: text }),
        onSuccess: () => { toast.success("Reply posted"); qc.invalidateQueries({ queryKey: ["chef-received-reviews"] }); },
        onError: (e: Error) => toast.error(e.message),
    });
    const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    if (isLoading) return <Skeleton className="h-32 w-full rounded-3xl" />;
    if (reviews.length === 0) return <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">No reviews yet. Customers can rate you once you've cooked for them.</p>;

    return (
        <div className="space-y-4">
            <p className="rounded-3xl bg-ink p-5 text-ink-foreground"><span className="font-display text-4xl font-extrabold">{average.toFixed(1)}</span> <span className="text-ink-foreground/70">average from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span></p>
            <ul className="grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                    <li key={r.id} className="space-y-2 rounded-3xl border bg-card p-5">
                        <div className="flex items-center justify-between gap-3"><p className="font-bold">{r.author}</p><time className="text-xs text-muted-foreground">{format(new Date(r.createdAt), "d MMM yyyy")}</time></div>
                        <p className="font-semibold text-primary" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-muted-foreground/40">{"★".repeat(5 - r.rating)}</span></p>
                        {r.comment && <p className="break-words">{r.comment}</p>}
                        <Label htmlFor={`reply-${r.id}`} className="block pt-1 text-sm">Your public reply</Label>
                        <Textarea id={`reply-${r.id}`} rows={2} maxLength={500} value={drafts[r.id] ?? r.chefReply ?? ""} onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })} placeholder="Thank them, or explain what you'll do differently" />
                        <Button variant="outline" className="h-11" disabled={reply.isPending || drafts[r.id] === undefined} onClick={() => reply.mutate({ id: r.id, text: drafts[r.id] })}>{r.chefReply ? "Update reply" : "Post reply"}</Button>
                    </li>
                ))}
            </ul>
        </div>
    );
};
