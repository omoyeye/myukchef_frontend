import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChefHat, Leaf, Loader2, MapPin, Minus, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";
import { Layout } from "@/components/layout/Layout";
import { LocationPicker } from "@/components/location/LocationPicker";
import { RatingPill } from "@/components/reviews/Stars";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { chefsPath, formatMiles, useUserLocation } from "@/lib/location";
import { ALLERGENS, allergenLabel, allergenSummary } from "@/lib/allergens";
import { DIETARY_OPTIONS, discountForWeeks, money, PlanConfig, planDate, planLength, WINDOWS } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "meal-plan-draft";
const STEPS = ["Chef", "Plan", "Food", "Delivery", "Review"];

const initialDraft = {
    chefId: null as number | null,
    durationWeeks: 13,
    mealsPerWeek: 5,
    servings: 2,
    dietary: [] as string[],
    avoidAllergens: [] as string[],
    rotation: [] as string[],
    requests: "",
    startDate: "",
    deliveryWindow: "afternoon",
    address: { street: "", city: "", postcode: "", phone: "" },
};
type Draft = typeof initialDraft;

const readDraft = (): Draft | null => {
    try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        return saved ? { ...initialDraft, ...JSON.parse(saved) } : null;
    } catch {
        return null;
    }
};

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

const Chip = ({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={cn("min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary", className)}
    >
        {children}
    </button>
);

const Stepper = ({ label, value, options, onChange, unit }: { label: string; value: number; options: number[]; onChange: (n: number) => void; unit: string }) => {
    const index = options.indexOf(value);
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4">
            <div>
                <p className="font-bold">{label}</p>
                <p className="text-sm text-muted-foreground">{value} {unit}</p>
            </div>
            <div className="flex items-center gap-3">
                <Button type="button" size="icon" variant="outline" aria-label={`Fewer: ${label}`} className="h-11 w-11 rounded-full" disabled={index <= 0} onClick={() => onChange(options[index - 1])}><Minus className="h-4 w-4" /></Button>
                <span className="w-6 text-center font-display text-2xl font-extrabold" aria-live="polite">{value}</span>
                <Button type="button" size="icon" variant="outline" aria-label={`More: ${label}`} className="h-11 w-11 rounded-full" disabled={index >= options.length - 1} onClick={() => onChange(options[index + 1])}><Plus className="h-4 w-4" /></Button>
            </div>
        </div>
    );
};

const MealPlanBuilder = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const qc = useQueryClient();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { location } = useUserLocation();

    const presetChef = Number(params.get("chef")) || null;
    // ?weeks=6, or ?months=3 from older links.
    const MONTH_WEEKS: Record<number, number> = { 1: 4, 3: 13, 6: 26 };
    const presetWeeks = Number(params.get("weeks")) || MONTH_WEEKS[Number(params.get("months"))] || null;
    const [draft, setDraft] = useState<Draft>(() => {
        const saved = readDraft();
        const base = saved && (!presetChef || saved.chefId === presetChef) ? saved : initialDraft;
        // Drafts saved before flexible lengths have months instead of weeks.
        const savedWeeks = (base as Partial<Draft> & { durationMonths?: number }).durationWeeks ?? MONTH_WEEKS[(base as { durationMonths?: number }).durationMonths ?? 3] ?? 13;
        return { ...base, chefId: presetChef ?? base.chefId, durationWeeks: Math.min(26, Math.max(1, presetWeeks ?? savedWeeks)) };
    });
    const [step, setStep] = useState(() => (params.get("resume") ? 4 : presetChef || draft.chefId ? 1 : 0));
    const [agreed, setAgreed] = useState(false);
    const [healthConsent, setHealthConsent] = useState(false);
    const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

    useEffect(() => {
        try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* A saved draft is only a convenience. */ }
    }, [draft]);

    useEffect(() => { window.scrollTo(0, 0); }, [step]);

    const { data: config } = useQuery<PlanConfig>({ queryKey: ["plan-config"], queryFn: () => api.get("/meal-plans/config") });
    const { data: chefs = [], isLoading: chefsLoading } = useQuery<any[]>({
        queryKey: ["public-chefs", location?.lat, location?.lng],
        queryFn: () => api.get(chefsPath(location)),
    });
    const { data: chefProfile } = useQuery<any>({
        queryKey: ["chef", String(draft.chefId)],
        queryFn: () => api.get(`/chefs/${draft.chefId}`),
        enabled: !!draft.chefId,
        retry: false,
    });
    const { data: addresses = [] } = useQuery<any[]>({ queryKey: ["addresses"], queryFn: () => api.get("/addresses"), enabled: isAuthenticated });

    const dishQuery = new URLSearchParams();
    if (draft.dietary.length) dishQuery.set("dietary", draft.dietary.join(","));
    if (draft.avoidAllergens.length) dishQuery.set("avoid", draft.avoidAllergens.join(","));
    const { data: dishes = [], isLoading: dishesLoading } = useQuery<any[]>({
        queryKey: ["plan-dishes", draft.chefId, dishQuery.toString()],
        queryFn: () => api.get(`/meal-plans/chefs/${draft.chefId}/dishes?${dishQuery}`),
        enabled: !!draft.chefId,
    });

    // Changing dietary needs can rule out dishes that were already chosen.
    useEffect(() => {
        if (dishesLoading || !draft.rotation.length) return;
        const allowed = draft.rotation.filter((id) => dishes.some((d) => d.id === id));
        if (allowed.length !== draft.rotation.length) update({ rotation: allowed });
    }, [dishes, dishesLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
        if (preferred && !draft.address.street) update({ address: { ...draft.address, street: preferred.street, city: preferred.city, postcode: preferred.postcode } });
    }, [addresses]); // eslint-disable-line react-hooks/exhaustive-deps

    const weeks = draft.durationWeeks;
    const discount = discountForWeeks(weeks, config);
    const nextSaving = [...(config?.discountTiers ?? [])].sort((a, b) => a.fromWeeks - b.fromWeeks).find((t) => t.fromWeeks > weeks && t.discountPercent > discount);
    const chosen = dishes.filter((d) => draft.rotation.includes(d.id));
    const averagePrice = chosen.length ? chosen.reduce((sum, d) => sum + d.price, 0) / chosen.length : 0;
    const portions = draft.mealsPerWeek * draft.servings;
    const foodPerWeek = averagePrice * portions;
    const fee = config?.deliveryFee ?? 0;
    const weeklyTotal = chosen.length ? foodPerWeek * (1 - discount / 100) + fee : 0;
    const savingPerWeek = foodPerWeek * (discount / 100);

    const earliest = addDays(new Date(), config?.leadDays ?? 3);
    const dateChoices = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(earliest, i)), [config?.leadDays]); // eslint-disable-line react-hooks/exhaustive-deps
    const addressComplete = !!(draft.address.street.trim() && draft.address.city.trim() && draft.address.postcode.trim() && draft.address.phone.trim());

    const hasHealthDetails = draft.dietary.length > 0 || draft.avoidAllergens.length > 0;
    const canContinue = [!!draft.chefId, true, chosen.length > 0 && (!hasHealthDetails || healthConsent), !!draft.startDate && addressComplete, agreed][step];

    const submit = useMutation({
        mutationFn: () => api.post("/meal-plans", { ...draft, durationMonths: undefined, chefId: draft.chefId, healthConsent }),
        onSuccess: (plan: any) => {
            try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* Nothing to clear. */ }
            qc.invalidateQueries({ queryKey: ["my-plans"] });
            toast.success("Request sent to your chef");
            navigate(`/my-plans/${plan.id}`);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const handleNext = () => {
        if (step < STEPS.length - 1) return setStep(step + 1);
        if (user?.role !== "customer") return navigate(`/login?redirect=${encodeURIComponent("/meal-plans/new?resume=1")}`);
        submit.mutate();
    };

    const planChefs = chefs.filter((c) => c.acceptsMealPlans);
    const chefFirstName = chefProfile?.displayName?.split(" ")[0] ?? "your chef";
    const isCustomer = user?.role === "customer";

    const summary = (
        <div className="rounded-3xl border bg-card p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                    {chefProfile?.avatar ? <img src={chefProfile.avatar} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-5 w-5 text-primary" />}
                </div>
                <div className="min-w-0">
                    <p className="truncate font-bold">{chefProfile?.displayName ?? "Choose a chef"}</p>
                    <p className="text-sm text-muted-foreground">{planLength(weeks)} · {weeks} {weeks === 1 ? "delivery" : "deliveries"}</p>
                </div>
            </div>
            <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Each week</dt><dd className="text-right font-medium">{draft.mealsPerWeek} meals for {draft.servings} ({portions} portions)</dd></div>
                {chosen.length > 0 ? (
                    <>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Food</dt><dd>{money(foodPerWeek)}</dd></div>
                        {discount > 0 && <div className="flex justify-between text-primary"><dt>{discount}% plan saving</dt><dd>-{money(savingPerWeek)}</dd></div>}
                        <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{money(fee)}</dd></div>
                        <div className="flex items-baseline justify-between border-t pt-3"><dt className="font-bold">About, per week</dt><dd className="font-display text-2xl font-extrabold">{money(weeklyTotal)}</dd></div>
                        <p className="text-xs text-muted-foreground">Around {money(weeklyTotal * weeks)} across the plan if you take every delivery. Prices depend on your dishes each week. Nothing to pay today.</p>
                    </>
                ) : (
                    <p className="pt-1 text-muted-foreground">Choose your dishes to see your price.</p>
                )}
            </dl>
        </div>
    );

    return (
        <Layout hideFooter>
            <SEO title="Build Your Meal Plan" description="Choose your chef, your dishes and your delivery day." noindex />
            <div className="container max-w-6xl px-4 pb-44 md:pb-16">
                {/* Progress */}
                <nav aria-label="Plan steps" className="mb-6">
                    <ol className="flex items-center gap-1.5">
                        {STEPS.map((name, i) => (
                            <li key={name} className="min-w-0 flex-1">
                                <button
                                    type="button"
                                    disabled={i > step}
                                    aria-current={i === step ? "step" : undefined}
                                    onClick={() => setStep(i)}
                                    className="w-full text-left disabled:cursor-default"
                                >
                                    <span className={cn("block h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
                                    <span className={cn("mt-1.5 block truncate text-xs font-semibold", i === step ? "text-primary" : "text-muted-foreground")}>{name}</span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
                    <div className="min-w-0">
                        {/* STEP: CHEF */}
                        {step === 0 && (
                            <section>
                                <h1 className="font-display text-3xl font-extrabold md:text-4xl">Who's cooking?</h1>
                                <p className="mt-1 text-muted-foreground">Choose the chef you'd like to plan your meals with.</p>
                                <div className="my-5"><LocationPicker heading="Find chefs who deliver to you" /></div>
                                {chefsLoading ? (
                                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : planChefs.length === 0 ? (
                                    <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">No chefs are taking meal plans right now. Please check back soon.</p>
                                ) : (
                                    <ul className="grid gap-3 sm:grid-cols-2">
                                        {planChefs.map((c) => {
                                            const selected = draft.chefId === c.id;
                                            const outside = location && c.distanceMiles != null && !c.inServiceArea;
                                            return (
                                                <li key={c.id}>
                                                    <button
                                                        type="button"
                                                        aria-pressed={selected}
                                                        disabled={!!outside}
                                                        onClick={() => { update({ chefId: c.id, rotation: selected ? draft.rotation : [] }); setStep(1); }}
                                                        className={cn("flex w-full items-center gap-4 rounded-3xl border-2 bg-card p-4 text-left transition-all", selected ? "border-primary" : "border-transparent shadow-sm hover:border-primary/40", outside && "opacity-50")}
                                                    >
                                                        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                                            {c.avatar ? <img src={c.avatar} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ChefHat className="h-7 w-7 text-primary" />}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block break-words font-bold">{c.displayName}</span>
                                                            <span className="block truncate text-sm text-muted-foreground">{c.specialty || "Home cooking"}</span>
                                                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2">
                                                                <RatingPill rating={c.rating} count={c.reviewCount} />
                                                                {c.distanceMiles != null && <span className="text-sm text-muted-foreground">{formatMiles(c.distanceMiles)}</span>}
                                                            </span>
                                                            {outside && <span className="text-xs text-muted-foreground">Doesn't deliver to you yet</span>}
                                                        </span>
                                                        {selected && <Check className="h-5 w-5 shrink-0 text-primary" />}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>
                        )}

                        {/* STEP: PLAN */}
                        {step === 1 && (
                            <section className="space-y-6">
                                <div>
                                    <h1 className="font-display text-3xl font-extrabold md:text-4xl">How long, and how much?</h1>
                                    <p className="mt-1 text-muted-foreground">You can skip or pause any week later on.</p>
                                </div>
                                <fieldset>
                                    <legend className="mb-1 font-bold">Plan length</legend>
                                    <p className="mb-3 text-sm text-muted-foreground">Anything from 1 week to 6 months. Longer plans save more.</p>
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                        {config?.presets.map((d) => {
                                            const selected = weeks === d.weeks;
                                            return (
                                                <button
                                                    key={d.weeks}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    onClick={() => update({ durationWeeks: d.weeks })}
                                                    className={cn("rounded-2xl border-2 p-2.5 text-center transition-all", selected ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40")}
                                                >
                                                    <span className="block font-display text-2xl font-extrabold">{d.label.split(" ")[0]}</span>
                                                    <span className="block text-xs font-semibold">{d.label.split(" ")[1]}</span>
                                                    <span className={cn("mt-1 block text-[11px] font-bold", d.discountPercent > 0 ? "text-primary" : "text-muted-foreground")}>{d.discountPercent > 0 ? `${d.discountPercent}% off` : "No saving"}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 rounded-2xl border bg-card p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <label htmlFor="plan-weeks" className="text-sm font-semibold">Or choose any length</label>
                                            <span className="font-display text-xl font-extrabold" aria-live="polite">{planLength(weeks)}</span>
                                        </div>
                                        <input
                                            id="plan-weeks"
                                            type="range"
                                            min={config?.minWeeks ?? 1}
                                            max={config?.maxWeeks ?? 26}
                                            step={1}
                                            value={weeks}
                                            onChange={(e) => update({ durationWeeks: Number(e.target.value) })}
                                            aria-valuetext={`${planLength(weeks)}, ${weeks} deliveries`}
                                            className="mt-3 w-full accent-primary"
                                        />
                                        <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>1 week</span><span>6 months</span></div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {weeks} weekly {weeks === 1 ? "delivery" : "deliveries"}
                                            {discount > 0 ? <span className="font-semibold text-primary"> · {discount}% off</span> : null}
                                            {nextSaving ? <> · Choose {planLength(nextSaving.fromWeeks)} or more to save {nextSaving.discountPercent}%</> : null}
                                        </p>
                                    </div>
                                </fieldset>
                                <div className="space-y-3">
                                    <Stepper label="Meals each week" unit={draft.mealsPerWeek === 1 ? "meal" : "meals"} value={draft.mealsPerWeek} options={config?.mealOptions ?? [draft.mealsPerWeek]} onChange={(mealsPerWeek) => update({ mealsPerWeek })} />
                                    <Stepper label="People to feed" unit={draft.servings === 1 ? "person" : "people"} value={draft.servings} options={config?.servingOptions ?? [draft.servings]} onChange={(servings) => update({ servings })} />
                                </div>
                            </section>
                        )}

                        {/* STEP: FOOD */}
                        {step === 2 && (
                            <section className="space-y-6">
                                <div>
                                    <h1 className="font-display text-3xl font-extrabold md:text-4xl">Choose your food</h1>
                                    <p className="mt-1 text-muted-foreground">We'll rotate your favourites across the weeks. You can choose a different menu for any week later.</p>
                                </div>
                                <fieldset>
                                    <legend className="mb-2 font-bold">Dietary needs</legend>
                                    <div className="flex flex-wrap gap-2">
                                        {DIETARY_OPTIONS.map((d) => <Chip key={d.id} selected={draft.dietary.includes(d.id)} onClick={() => update({ dietary: toggle(draft.dietary, d.id) })}>{d.label}</Chip>)}
                                    </div>
                                </fieldset>
                                <fieldset>
                                    <legend className="mb-2 font-bold">Allergens to avoid</legend>
                                    <div className="flex flex-wrap gap-2">
                                        {ALLERGENS.map(({ id: a, short, label }) => <Chip key={a} selected={draft.avoidAllergens.includes(a)} onClick={() => update({ avoidAllergens: toggle(draft.avoidAllergens, a) })}>{short ?? label}</Chip>)}
                                    </div>
                                    {draft.avoidAllergens.length > 0 && (
                                        <p className="mt-2 flex gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" />We only show dishes with a confirmed allergen list. Home kitchens can still handle allergens, so if your allergy is severe, please speak to {chefFirstName} first.</p>
                                    )}
                                </fieldset>

                                <div>
                                    <div className="mb-3 flex items-baseline justify-between gap-3">
                                        <h2 className="font-bold">Your favourites from {chefFirstName}</h2>
                                        <span className="shrink-0 text-sm font-semibold text-primary">{chosen.length} chosen</span>
                                    </div>
                                    {dishesLoading ? (
                                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                    ) : dishes.length === 0 ? (
                                        <div className="rounded-3xl border border-dashed p-8 text-center">
                                            <p className="font-bold">No dishes match these needs yet</p>
                                            <p className="mt-1 text-sm text-muted-foreground">Try changing your filters, or <Link to="/meal-plans/new" className="underline" onClick={() => setStep(0)}>choose another chef</Link>.</p>
                                        </div>
                                    ) : (
                                        <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                                            {dishes.map((dish) => {
                                                const selected = draft.rotation.includes(dish.id);
                                                return (
                                                    <li key={dish.id}>
                                                        <button
                                                            type="button"
                                                            aria-pressed={selected}
                                                            onClick={() => update({ rotation: toggle(draft.rotation, dish.id) })}
                                                            className={cn("group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border-2 bg-card text-left transition-all", selected ? "border-primary" : "border-transparent shadow-sm hover:border-primary/40")}
                                                        >
                                                            <span className="relative block aspect-[4/3] w-full overflow-hidden bg-muted">
                                                                <img src={dish.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                                <span className={cn("absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full", selected ? "bg-primary text-primary-foreground" : "bg-background/90")}>
                                                                    {selected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                                                </span>
                                                            </span>
                                                            <span className="flex flex-1 flex-col p-3">
                                                                <span className="font-bold leading-tight">{dish.name}</span>
                                                                <span className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{dish.description}</span>
                                                                <span className="mt-2 flex flex-wrap items-center justify-between gap-1">
                                                                    <span className="font-bold">{money(dish.price)}<span className="text-xs font-normal text-muted-foreground"> a portion</span></span>
                                                                    {dish.isVegan ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Leaf className="h-3 w-3" />Vegan</span> : dish.isHalal ? <span className="text-xs font-semibold text-muted-foreground">Halal</span> : null}
                                                                </span>
                                                                <span className="mt-1 text-xs text-muted-foreground">{allergenSummary(dish.allergens)}</span>
                                                            </span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                                {hasHealthDetails && (
                                    <label htmlFor="health-consent" className="flex items-start gap-3 rounded-2xl border-2 border-primary/40 bg-card p-4 text-sm">
                                        <Checkbox id="health-consent" className="mt-0.5" checked={healthConsent} onCheckedChange={(v) => setHealthConsent(!!v)} />
                                        <span>I agree to MYUKCHEF and my chef using my dietary and allergy details to find suitable food and prepare it. <Link to="/privacy" target="_blank" className="underline">How we use them</Link>.</span>
                                    </label>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="plan-requests" className="font-bold">Anything else you'd love?</Label>
                                    <Textarea id="plan-requests" rows={3} maxLength={1000} placeholder={`A dish you miss, less salt, smaller portions for a child... ${chefFirstName} will see this.`} value={draft.requests} onChange={(e) => update({ requests: e.target.value })} />
                                </div>
                            </section>
                        )}

                        {/* STEP: DELIVERY */}
                        {step === 3 && (
                            <section className="space-y-6">
                                <div>
                                    <h1 className="font-display text-3xl font-extrabold md:text-4xl">When and where?</h1>
                                    <p className="mt-1 text-muted-foreground">Your first delivery sets your weekly delivery day.</p>
                                </div>
                                <fieldset>
                                    <legend className="mb-2 font-bold">First delivery</legend>
                                    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
                                        {dateChoices.map((date) => {
                                            const iso = format(date, "yyyy-MM-dd");
                                            const selected = draft.startDate === iso;
                                            return (
                                                <button
                                                    key={iso}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    aria-label={format(date, "EEEE d MMMM")}
                                                    onClick={() => update({ startDate: iso })}
                                                    className={cn("flex h-24 w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border-2 transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40")}
                                                >
                                                    <span className="text-xs font-semibold uppercase">{format(date, "EEE")}</span>
                                                    <span className="font-display text-3xl font-extrabold">{format(date, "d")}</span>
                                                    <span className="text-xs">{format(date, "MMM")}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {draft.startDate && <p className="mt-2 text-sm font-semibold text-primary">Delivered every {format(new Date(`${draft.startDate}T00:00:00`), "EEEE")}</p>}
                                </fieldset>
                                <fieldset>
                                    <legend className="mb-2 font-bold">Delivery time</legend>
                                    <div className="grid grid-cols-3 gap-2">
                                        {WINDOWS.map((w) => (
                                            <button key={w.id} type="button" aria-pressed={draft.deliveryWindow === w.id} onClick={() => update({ deliveryWindow: w.id })} className={cn("min-h-16 rounded-2xl border-2 p-2 text-center transition-colors", draft.deliveryWindow === w.id ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40")}>
                                                <span className="block text-sm font-bold">{w.label}</span>
                                                <span className="block text-xs text-muted-foreground">{w.hint}</span>
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>
                                <fieldset className="space-y-3">
                                    <legend className="mb-2 font-bold">Delivery address</legend>
                                    {addresses.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {addresses.map((a) => (
                                                <Chip key={a.id} selected={draft.address.street === a.street && draft.address.postcode === a.postcode} onClick={() => update({ address: { ...draft.address, street: a.street, city: a.city, postcode: a.postcode } })}>{a.name}</Chip>
                                            ))}
                                        </div>
                                    )}
                                    <div className="space-y-2"><Label htmlFor="plan-street">Street address</Label><Input id="plan-street" autoComplete="street-address" className="h-11" value={draft.address.street} onChange={(e) => update({ address: { ...draft.address, street: e.target.value } })} /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2"><Label htmlFor="plan-city">Town or city</Label><Input id="plan-city" autoComplete="address-level2" className="h-11" value={draft.address.city} onChange={(e) => update({ address: { ...draft.address, city: e.target.value } })} /></div>
                                        <div className="space-y-2"><Label htmlFor="plan-postcode">Postcode</Label><Input id="plan-postcode" autoComplete="postal-code" className="h-11 uppercase" value={draft.address.postcode} onChange={(e) => update({ address: { ...draft.address, postcode: e.target.value } })} /></div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="plan-phone">Mobile number</Label>
                                        <Input id="plan-phone" type="tel" inputMode="tel" autoComplete="tel" className="h-11" value={draft.address.phone} onChange={(e) => update({ address: { ...draft.address, phone: e.target.value } })} />
                                        <p className="text-xs text-muted-foreground">Only the MYUKCHEF team sees your number. Your chef sees your address once they've accepted your plan.</p>
                                    </div>
                                </fieldset>
                            </section>
                        )}

                        {/* STEP: REVIEW */}
                        {step === 4 && (
                            <section className="space-y-5">
                                <div>
                                    <h1 className="font-display text-3xl font-extrabold md:text-4xl">Happy with your plan?</h1>
                                    <p className="mt-1 text-muted-foreground">{chefFirstName} needs to confirm it before your first delivery. Nothing is charged today.</p>
                                </div>
                                <div className="rounded-3xl border bg-card p-5">
                                    <h2 className="mb-3 font-bold">Your dishes</h2>
                                    <ul className="flex flex-wrap gap-3">
                                        {chosen.map((dish) => (
                                            <li key={dish.id} className="flex min-w-0 items-center gap-2 rounded-full bg-secondary py-1 pl-1 pr-3 text-sm font-medium">
                                                <img src={dish.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                <span className="min-w-0 break-words">{dish.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {draft.requests.trim() && <p className="mt-3 rounded-2xl bg-secondary/70 p-3 text-sm"><span className="font-semibold">Your request:</span> {draft.requests}</p>}
                                    {(draft.dietary.length > 0 || draft.avoidAllergens.length > 0) && (
                                        <p className="mt-3 flex items-start gap-2 text-sm"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><span>{[...draft.dietary.map((d) => DIETARY_OPTIONS.find((o) => o.id === d)?.label), ...draft.avoidAllergens.map((a) => `No ${allergenLabel(a).toLowerCase()}`)].join(" · ")}</span></p>
                                    )}
                                </div>
                                <div className="rounded-3xl border bg-card p-5">
                                    <h2 className="mb-2 font-bold">Delivery</h2>
                                    <p className="text-sm">{draft.startDate && `Every ${format(new Date(`${draft.startDate}T00:00:00`), "EEEE")}, starting ${planDate(draft.startDate, "d MMMM yyyy")}`}, {WINDOWS.find((w) => w.id === draft.deliveryWindow)?.label.toLowerCase()}</p>
                                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{draft.address.street}, {draft.address.city}, {draft.address.postcode.toUpperCase()}</p>
                                </div>
                                <div className="rounded-3xl bg-ink p-5 text-ink-foreground">
                                    <h2 className="mb-3 flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-primary" />The important bits</h2>
                                    <ul className="space-y-2 text-sm text-ink-foreground/85">
                                        <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />You pay for each delivery you receive. We'll confirm how to pay when your chef accepts.</li>
                                        <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />Change, skip or cancel a delivery up to {config?.cutoffHours ?? 48} hours before it. After that it goes ahead.</li>
                                        <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />Your plan ends after {weeks} {weeks === 1 ? "delivery" : "deliveries"} and never renews by itself. You can order it again in one tap.</li>
                                    </ul>
                                </div>
                                <label className="flex min-h-11 items-start gap-3 rounded-2xl border bg-card p-4">
                                    <Checkbox className="mt-0.5" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                                    <span className="text-sm">I understand how my plan works and agree to the <Link to="/terms" target="_blank" className="underline">terms</Link>.</span>
                                </label>
                                {isAuthenticated && !isCustomer && <p className="text-sm text-muted-foreground">Meal plans need a customer account. You'll sign in with one next.</p>}
                                {!authLoading && !isAuthenticated && <p className="text-sm text-muted-foreground">You'll sign in or create an account next. Your plan is saved.</p>}
                            </section>
                        )}
                    </div>

                    <aside className="hidden lg:block">
                        <div className="sticky top-28 space-y-3">
                            {summary}
                            {step > 0 && (
                                <div className="flex gap-2">
                                    <Button variant="outline" className="h-12 rounded-full" onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span></Button>
                                    <Button className="h-12 flex-1 rounded-full font-bold" disabled={!canContinue || submit.isPending} onClick={handleNext}>
                                        {step === 4 ? (isCustomer ? (submit.isPending ? "Sending..." : "Send to chef") : "Continue to sign in") : "Continue"}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* Phones: price and next step stay in reach, above the bottom navigation */}
            {step > 0 && (
                <div className="fixed inset-x-0 z-40 border-t bg-background/95 p-3 backdrop-blur bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden">
                    <div className="mx-auto flex max-w-2xl items-center gap-2">
                        <Button variant="outline" size="icon" aria-label="Back" className="h-12 w-12 shrink-0 rounded-full" onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" /></Button>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-muted-foreground">{chosen.length ? "About, per week" : `${planLength(weeks, true)} plan`}</p>
                            <p className="truncate font-display text-lg font-extrabold leading-tight">{chosen.length ? money(weeklyTotal) : `${portions} portions a week`}</p>
                        </div>
                        <Button className="h-12 shrink-0 rounded-full px-5 font-bold" disabled={!canContinue || submit.isPending} onClick={handleNext}>
                            {step === 4 ? (isCustomer ? (submit.isPending ? "Sending..." : "Send to chef") : "Sign in") : "Continue"}
                        </Button>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default MealPlanBuilder;
