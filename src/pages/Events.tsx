import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarHeart, ChefHat, ChevronDown, Loader2, Lock, MessageSquareQuote, Minus, Plus, Search, Send, Star, Wallet } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";
import { Layout } from "@/components/layout/Layout";
import { RatingPill } from "@/components/reviews/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { chefsPath, formatMiles, useUserLocation } from "@/lib/location";
import { money } from "@/lib/mealPlans";
import { heroDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "event-quote-draft";
const todayIso = () => new Date().toISOString().slice(0, 10);

interface Draft {
    // headcount is always adults + kids. Drafts saved before the split only have headcount.
    form: { eventName: string; eventDate: string; eventTime: string; headcount: number; adults?: number; kids?: number; venue: string; contactPhone: string; specialRequests: string };
    picks: Record<string, number>; // Dish id to portions
    asked: Record<number, boolean>; // Chefs asked without choosing a dish
    preferences: Record<number, string>;
}

const emptyDraft: Draft = {
    form: { eventName: "", eventDate: "", eventTime: "", headcount: 50, adults: 50, kids: 0, venue: "", contactPhone: "", specialRequests: "" },
    picks: {},
    asked: {},
    preferences: {},
};

const readDraft = (): Draft => {
    try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        return saved ? { ...emptyDraft, ...JSON.parse(saved) } : emptyDraft;
    } catch {
        return emptyDraft;
    }
};

const HOW_IT_WORKS = [
    { icon: Send, t: "Ask your chefs", d: "Choose dishes from as many chefs as you like." },
    { icon: MessageSquareQuote, t: "Compare quotes", d: "Each chef prices their part, all in one booking." },
    { icon: Wallet, t: "Confirm and pay once", d: "One payment to MYUKCHEF. We pay your chefs." },
    { icon: Star, t: "Enjoy, then rate", d: "Your chefs come to serve if they can. Rate them after." },
];

const Events = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { location } = useUserLocation();

    const [draft, setDraft] = useState<Draft>(readDraft);
    const [search, setSearch] = useState("");
    const preselected = Number(params.get("chef")) || null;
    const [open, setOpen] = useState<Record<number, boolean>>(() => (preselected ? { [preselected]: true } : {}));
    const { form, picks, asked, preferences } = draft;
    const setForm = (patch: Partial<Draft["form"]>) => setDraft((d) => ({ ...d, form: { ...d.form, ...patch } }));

    useEffect(() => {
        try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* A saved draft is only a convenience. */ }
    }, [draft]);

    const { data: menuProducts = [] } = useQuery<any[]>({ queryKey: ["products"], queryFn: () => api.get("/products") });
    const { data: chefDishes = [] } = useQuery<any[]>({ queryKey: ["public-chef-products"], queryFn: () => api.get("/chefs/products/public") });
    const { data: chefs = [], isLoading } = useQuery<any[]>({ queryKey: ["public-chefs", location?.lat, location?.lng], queryFn: () => api.get(chefsPath(location)) });

    const dishesByChef = useMemo(() => {
        const map = new Map<number, any[]>();
        for (const dish of [...menuProducts, ...chefDishes]) {
            if (!dish.chef?.id || dish.isSoldOut) continue;
            map.set(dish.chef.id, [...(map.get(dish.chef.id) ?? []), dish]);
        }
        return map;
    }, [menuProducts, chefDishes]);

    const eventChefs = chefs.filter((c) => c.isAvailableForEvents);
    const term = search.trim().toLowerCase();
    const shownChefs = eventChefs.filter((c) => !term || `${c.displayName} ${c.specialty ?? ""} ${(dishesByChef.get(c.id) ?? []).map((d) => d.name).join(" ")}`.toLowerCase().includes(term));

    const setPortions = (id: string, portions: number) => setDraft((d) => {
        const next = { ...d.picks };
        if (portions > 0) next[id] = Math.min(Math.floor(portions), 100000); else delete next[id];
        return { ...d, picks: next };
    });

    const chosenFor = (chefId: number) => (dishesByChef.get(chefId) ?? []).filter((dish) => picks[dish.id] > 0);
    const selected = eventChefs.filter((c) => chosenFor(c.id).length > 0 || asked[c.id]);
    const guideTotal = selected.reduce((sum, c) => sum + chosenFor(c.id).reduce((s, dish) => s + dish.price * picks[dish.id], 0), 0);
    const totalPortions = Object.values(picks).reduce((a, b) => a + b, 0);

    const detailsDone = !!(form.eventName.trim() && form.eventDate && form.eventTime && form.headcount > 0 && form.venue.trim() && form.contactPhone.trim());
    const everyChefHasARequest = selected.every((c) => chosenFor(c.id).length > 0 || preferences[c.id]?.trim());
    const ready = detailsDone && selected.length > 0 && everyChefHasARequest;

    const submit = useMutation({
        mutationFn: () => api.post("/events", {
            ...form,
            adults: form.adults ?? form.headcount,
            kids: form.kids ?? 0,
            chefRequests: selected.map((c) => ({
                chefId: c.id,
                preferences: preferences[c.id] ?? "",
                items: chosenFor(c.id).map((dish) => ({ id: dish.id, quantity: picks[dish.id] })),
            })),
        }),
        onSuccess: (booking: any) => {
            try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* Nothing to clear. */ }
            toast.success(`Your request has gone to ${selected.length} chef${selected.length === 1 ? "" : "s"}`);
            navigate(`/my-bookings/${booking.id}`);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const handleSubmit = () => {
        if (user?.role !== "customer") return navigate(`/login?redirect=${encodeURIComponent("/events")}`);
        submit.mutate();
    };
    const buttonLabel = submit.isPending ? "Sending..." : isAuthenticated && user?.role === "customer" ? "Request quotes" : "Sign in to request quotes";
    const hint = !detailsDone ? "Add your event details" : selected.length === 0 ? "Choose at least one chef" : !everyChefHasARequest ? "Tell each chef what you'd like" : null;

    const summary = (
        <div className="rounded-3xl border bg-card p-5">
            <h2 className="font-display text-lg font-bold">Your request</h2>
            {selected.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Chefs you choose will appear here.</p>
            ) : (
                <ul className="mt-3 space-y-3 text-sm">
                    {selected.map((c) => (
                        <li key={c.id}>
                            <p className="font-bold">{c.displayName}</p>
                            {chosenFor(c.id).length > 0
                                ? <p className="text-muted-foreground">{chosenFor(c.id).map((d) => `${picks[d.id]} × ${d.name}`).join(", ")}</p>
                                : <p className="text-muted-foreground">Quoting from your notes</p>}
                        </li>
                    ))}
                </ul>
            )}
            {guideTotal > 0 && (
                <div className="mt-4 border-t pt-3">
                    <div className="flex items-baseline justify-between gap-3"><span className="text-sm font-semibold">Menu guide price</span><span className="font-display text-xl font-extrabold">{money(guideTotal)}</span></div>
                    <p className="mt-1 text-xs text-muted-foreground">Only a guide. Each chef sends their own price for your event.</p>
                </div>
            )}
            <Button className="mt-4 h-12 w-full rounded-full font-bold" disabled={!ready || submit.isPending} onClick={handleSubmit}>{buttonLabel}</Button>
            {hint ? <p className="mt-2 text-center text-xs font-medium text-muted-foreground">{hint}</p> : <p className="mt-2 text-center text-xs text-muted-foreground">Nothing to pay until you've seen your quotes.</p>}
        </div>
    );

    return (
        <Layout fullBleed>
            <SEO
                title="Get Quotes from Chefs for Your Event"
                description="Planning a wedding or party? Choose dishes from several local chefs, compare their quotes in one booking and pay once through MYUKCHEF."
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Service",
                    name: "Private chef and event catering",
                    serviceType: "Catering",
                    areaServed: { "@type": "Country", name: "United Kingdom" },
                    provider: { "@type": "Organization", name: "MYUKCHEF", url: "https://myukchef.com" },
                }}
            />

            <section className="relative overflow-hidden bg-ink pb-10 pt-28 text-ink-foreground md:pb-14 md:pt-36">
                <div aria-hidden className="hero-glow absolute -right-32 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-[110px]" />
                <div aria-hidden className="hero-glow hero-glow-slow absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
                <div className="container relative max-w-6xl px-4">
                    <span style={heroDelay(0)} className="hero-rise inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-4 py-2 text-sm font-semibold"><CalendarHeart className="h-4 w-4 text-primary" />Weddings, parties and big days</span>
                    <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] md:text-6xl">
                        <span style={heroDelay(100)} className="hero-rise block">Many chefs.</span>
                        <span style={heroDelay(240)} className="hero-rise block"><span className="hero-underline text-primary">One booking.</span></span>
                    </h1>
                    <p style={heroDelay(400)} className="hero-rise mt-3 max-w-2xl text-lg text-ink-foreground/70">Pick the dishes you love from different chefs. They each send a quote, you compare them in one place, and you pay MYUKCHEF once.</p>
                    <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {HOW_IT_WORKS.map((step, i) => (
                            <li key={step.t} style={heroDelay(520 + i * 110)} className="hero-rise rounded-2xl bg-ink-foreground/10 p-4">
                                <step.icon className="h-6 w-6 text-primary" />
                                <p className="mt-2 font-bold">{i + 1}. {step.t}</p>
                                <p className="text-sm text-ink-foreground/70">{step.d}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <div className="container max-w-6xl px-4 pb-44 pt-8 lg:pb-16">
                <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
                    <div className="min-w-0 space-y-8">
                        <section aria-labelledby="event-details-heading" className="rounded-3xl border bg-card p-5 md:p-6">
                            <h2 id="event-details-heading" className="mb-4 font-display text-2xl font-extrabold">Tell us about your event</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2"><Label htmlFor="event-name">What's the occasion?</Label><Input id="event-name" className="h-11" autoComplete="off" placeholder="Our wedding" value={form.eventName} onChange={(e) => setForm({ eventName: e.target.value })} /></div>
                                <div className="space-y-2"><Label htmlFor="event-date">Date</Label><Input id="event-date" className="h-11" type="date" min={todayIso()} value={form.eventDate} onChange={(e) => setForm({ eventDate: e.target.value })} /></div>
                                <div className="space-y-2"><Label htmlFor="event-time">Time</Label><Input id="event-time" className="h-11" type="time" value={form.eventTime} onChange={(e) => setForm({ eventTime: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2"><Label htmlFor="event-adults">Adults</Label><Input id="event-adults" className="h-11" type="number" inputMode="numeric" min={0} value={form.adults ?? form.headcount} onChange={(e) => { const adults = Math.max(0, Math.floor(Number(e.target.value) || 0)); setForm({ adults, headcount: adults + (form.kids ?? 0) }); }} /></div>
                                    <div className="space-y-2"><Label htmlFor="event-kids">Children</Label><Input id="event-kids" className="h-11" type="number" inputMode="numeric" min={0} value={form.kids ?? 0} onChange={(e) => { const kids = Math.max(0, Math.floor(Number(e.target.value) || 0)); setForm({ kids, headcount: (form.adults ?? form.headcount) + kids }); }} /></div>
                                    <p className="col-span-2 -mt-1 text-xs text-muted-foreground">{form.headcount} guests in all. Chefs see adults and children, so they can plan portions and the menu.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="event-phone">Your phone number</Label>
                                    <Input id="event-phone" className="h-11" type="tel" inputMode="tel" autoComplete="tel" value={form.contactPhone} onChange={(e) => setForm({ contactPhone: e.target.value })} />
                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3 shrink-0" />Only the MYUKCHEF team sees this.</p>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="event-venue">Venue and address</Label>
                                    <Input id="event-venue" className="h-11" autoComplete="street-address" value={form.venue} onChange={(e) => setForm({ venue: e.target.value })} />
                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3 shrink-0" />Chefs only see this after you've paid.</p>
                                </div>
                                <div className="space-y-2 sm:col-span-2"><Label htmlFor="event-requests">Anything all your chefs should know?</Label><Textarea id="event-requests" rows={2} maxLength={2000} placeholder="Theme, timings, dietary needs of your guests..." value={form.specialRequests} onChange={(e) => setForm({ specialRequests: e.target.value })} /></div>
                            </div>
                        </section>

                        <section aria-labelledby="choose-chefs-heading">
                            <h2 id="choose-chefs-heading" className="font-display text-2xl font-extrabold">Choose your chefs and dishes</h2>
                            <p className="mt-1 text-muted-foreground">Mix and match. Each chef only sees their own part of your event.</p>
                            <div className="relative my-4">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input aria-label="Search chefs and dishes" className="h-11 rounded-full pl-9" placeholder="Search for jollof, Italian, vegan..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            {isLoading ? (
                                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : shownChefs.length === 0 ? (
                                <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">{eventChefs.length === 0 ? "No chefs are taking events right now. Please check back soon." : "No chefs match your search."}</p>
                            ) : (
                                <ul className="space-y-3">
                                    {shownChefs.map((chef) => {
                                        const dishes = dishesByChef.get(chef.id) ?? [];
                                        const chosen = chosenFor(chef.id);
                                        const isOpen = open[chef.id] || !!term;
                                        const isSelected = chosen.length > 0 || !!asked[chef.id];
                                        return (
                                            <li key={chef.id} className={cn("overflow-hidden rounded-3xl border-2 bg-card transition-colors", isSelected ? "border-primary" : "border-transparent shadow-sm")}>
                                                <button type="button" aria-expanded={isOpen} onClick={() => setOpen({ ...open, [chef.id]: !open[chef.id] })} className="flex w-full items-center gap-3 p-4 text-left">
                                                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                                        {chef.avatar ? <img src={chef.avatar} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ChefHat className="h-6 w-6 text-primary" />}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block break-words font-bold">{chef.displayName}</span>
                                                        <span className="block truncate text-sm text-muted-foreground">{chef.specialty || "Home cooking"}</span>
                                                        <span className="flex flex-wrap items-center gap-x-2"><RatingPill rating={chef.rating} count={chef.reviewCount} />{chef.distanceMiles != null && <span className="text-sm text-muted-foreground">{formatMiles(chef.distanceMiles)}</span>}</span>
                                                    </span>
                                                    {isSelected && <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">{chosen.length ? `${chosen.length} dish${chosen.length === 1 ? "" : "es"}` : "Asked"}</span>}
                                                    <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", isOpen && "rotate-180")} />
                                                </button>
                                                {isOpen && (
                                                    <div className="space-y-2 border-t p-3 md:p-4">
                                                        {dishes.length === 0 && <p className="p-2 text-sm text-muted-foreground">No set menu yet. Tell {chef.displayName.split(" ")[0]} what you'd like below.</p>}
                                                        {dishes.map((dish) => {
                                                            const portions = picks[dish.id] ?? 0;
                                                            return (
                                                                <div key={dish.id} className={cn("flex flex-wrap items-center gap-3 rounded-2xl p-2", portions > 0 && "bg-primary/5")}>
                                                                    <img src={dish.image} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                                                                    <div className="min-w-0 flex-1 basis-40">
                                                                        <p className="break-words font-semibold leading-tight">{dish.name}</p>
                                                                        <p className="text-sm text-muted-foreground">Menu price {money(dish.price)}</p>
                                                                    </div>
                                                                    {portions === 0 ? (
                                                                        <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => setPortions(dish.id, form.headcount || 1)}><Plus className="mr-1.5 h-4 w-4" />Add for {form.headcount || 1}</Button>
                                                                    ) : (
                                                                        <div className="flex shrink-0 items-center gap-1">
                                                                            <Button type="button" size="icon" variant="outline" aria-label={`Fewer portions of ${dish.name}`} className="h-11 w-11 rounded-full" onClick={() => setPortions(dish.id, portions - 10)}><Minus className="h-4 w-4" /></Button>
                                                                            <Input aria-label={`Portions of ${dish.name}`} type="number" inputMode="numeric" min={0} className="h-11 w-20 text-center" value={portions} onChange={(e) => setPortions(dish.id, Number(e.target.value))} />
                                                                            <Button type="button" size="icon" variant="outline" aria-label={`More portions of ${dish.name}`} className="h-11 w-11 rounded-full" onClick={() => setPortions(dish.id, portions + 10)}><Plus className="h-4 w-4" /></Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        <div className="space-y-2 pt-2">
                                                            <Label htmlFor={`prefs-${chef.id}`}>Your preferences for {chef.displayName.split(" ")[0]}</Label>
                                                            <Textarea
                                                                id={`prefs-${chef.id}`}
                                                                rows={2}
                                                                maxLength={1000}
                                                                placeholder="Spice level, portion size, dishes that aren't listed, whether you'd like them to serve on the day..."
                                                                value={preferences[chef.id] ?? ""}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    setDraft((d) => ({ ...d, preferences: { ...d.preferences, [chef.id]: value }, asked: { ...d.asked, [chef.id]: !!value.trim() } }));
                                                                }}
                                                            />
                                                            <Link to={`/chefs/${chef.id}`} target="_blank" className="inline-flex min-h-8 items-center text-sm font-semibold text-primary hover:underline">See {chef.displayName.split(" ")[0]}'s profile and reviews</Link>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />To keep everyone safe, all contact happens through MYUKCHEF. Phone numbers, emails and links can't be shared with chefs.</p>
                        </section>
                    </div>

                    <aside className="hidden lg:block"><div className="sticky top-28">{summary}</div></aside>
                </div>
            </div>

            <div className="fixed inset-x-0 z-40 border-t bg-background/95 p-3 backdrop-blur bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden">
                <div className="mx-auto flex max-w-2xl items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-muted-foreground">{hint ?? `${selected.length} chef${selected.length === 1 ? "" : "s"} · ${totalPortions} portions`}</p>
                        <p className="truncate font-display text-lg font-extrabold leading-tight">{guideTotal > 0 ? `Guide ${money(guideTotal)}` : "Free to ask"}</p>
                    </div>
                    <Button className="h-12 shrink-0 rounded-full px-5 font-bold" disabled={!ready || submit.isPending} onClick={handleSubmit}>{submit.isPending ? "Sending..." : "Request quotes"}</Button>
                </div>
            </div>
        </Layout>
    );
};

export default Events;
