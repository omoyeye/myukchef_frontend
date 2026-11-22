import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowRight, BadgeCheck, CalendarCheck, CalendarDays, Check, ChefHat, HeartHandshake, MessageCircle, PauseCircle, Percent, Play,
    Repeat, ShieldCheck, SkipForward, Sparkles, Star, Users, UtensilsCrossed, Wallet,
} from "lucide-react";
import SEO from "@/components/common/SEO";
import { Layout } from "@/components/layout/Layout";
import { LocationPicker } from "@/components/location/LocationPicker";
import { RatingPill } from "@/components/reviews/Stars";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { Reveal } from "@/components/motion/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { thumb } from "@/lib/images";
import { chefsPath, formatMiles, useUserLocation } from "@/lib/location";
import { PlanConfig } from "@/lib/mealPlans";
import { heroDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/menu";
import heroChef from "@/assets/hero-chef.jpg";
import { BannerAds } from "@/components/banners/BannerAds";

// Keyed by weeks. Any length from 1 to 26 weeks can be chosen in the builder.
const PLAN_COPY: Record<number, { title: string; blurb: string; tint: string }> = {
    1: { title: "Try it out", blurb: "One week to taste the food and meet your chef. No commitment.", tint: "from-sky-500/15 to-sky-500/0" },
    4: { title: "Get to know your chef", blurb: "A month to find your favourites, with a menu that settles into your week.", tint: "from-emerald-500/15 to-emerald-500/0" },
    13: { title: "Build the habit", blurb: "A full season of dinners, with a menu that changes as you do.", tint: "from-primary/25 to-primary/0" },
    26: { title: "Sorted for months", blurb: "Half a year with no more wondering what's for dinner.", tint: "from-violet-500/15 to-violet-500/0" },
};

const FAQS = (cutoffHours: number) => [
    { q: "Do I pay for the whole plan up front?", a: "No. You pay for each delivery you receive, and skipped or paused weeks cost nothing. The total you see is an estimate of all your deliveries, not a charge." },
    { q: "Will my plan renew by itself?", a: "Never. Your plan ends on the date you agreed. We remind you two weeks before, and you can renew it in one tap if you want to carry on." },
    { q: "Can I change my mind?", a: `Yes. You can change dishes, skip a week, pause for up to 12 weeks or cancel, as long as it's at least ${cutoffHours} hours before that delivery. After that, your chef has already bought ingredients, so that delivery still goes ahead.` },
    { q: "What if I want something that isn't on the menu?", a: "Add it to your request, or message your chef. They can tell you what's possible, and you agree any changes between you." },
    { q: "How do you handle allergies?", a: "Tell us what you avoid and we only offer dishes whose chef has confirmed the allergen list. Home kitchens may still handle allergens, so if you have a severe allergy, please speak to your chef before you start." },
    { q: "How do I know a chef is any good?", a: "We review every chef and dish before they go live. Ratings only come from customers the chef has actually cooked for, so you can trust what you read." },
];

// Warm colour blocks stand in for dish photos until chefs have added theirs.
const SWATCHES = ["from-orange-400 to-rose-500", "from-amber-300 to-orange-500", "from-emerald-400 to-teal-600", "from-rose-400 to-fuchsia-600", "from-lime-300 to-emerald-500", "from-sky-400 to-indigo-500"];
const SAMPLE_DISHES = ["Jollof rice and chicken", "Egusi with pounded yam", "Honey beans and plantain", "Pepper soup", "Suya and salad", "Efo riro and rice"];

type Dish = { name: string; image?: string; chef?: string };
interface PlanChef {
    id: number; displayName: string; specialty?: string | null; avatar?: string | null; coverImage?: string | null;
    rating?: number | null; reviewCount?: number; distanceMiles?: number | null; inServiceArea?: boolean;
    acceptsMealPlans?: boolean; planHouseholds?: number; hygieneVerified?: boolean;
}

/** A dish picture, or a warm colour block with its first letter when there's no photo. */
function DishImage({ dish, i, className }: { dish: Dish; i: number; className?: string }) {
    return dish.image
        ? <img src={thumb(dish.image, 480) ?? dish.image} alt="" loading="lazy" className={cn("h-full w-full object-cover", className)} />
        : <span className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br font-display text-2xl font-extrabold text-white/90", SWATCHES[i % SWATCHES.length], className)}>{dish.name.charAt(0)}</span>;
}

/** A small, working example of a plan: skip, swap or bring back a week to see how it behaves. */
function PlanDemo({ dishes, cutoffHours }: { dishes: Dish[]; cutoffHours: number }) {
    const [weeks, setWeeks] = useState(() => [0, 1, 2, 3].map((w) => ({ dish: w % dishes.length, skipped: w === 2 })));
    const toggleSkip = (w: number) => setWeeks((all) => all.map((x, i) => (i === w ? { ...x, skipped: !x.skipped } : x)));
    const swap = (w: number) => setWeeks((all) => all.map((x, i) => (i === w ? { ...x, dish: (x.dish + 1 + w) % dishes.length } : x)));
    const paid = weeks.filter((w) => !w.skipped).length;
    return (
        <div className="relative rounded-[2rem] border bg-card p-4 shadow-warm-lg sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Try it</p>
                    <p className="font-display text-lg font-extrabold">Your next four weeks</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{paid} {paid === 1 ? "delivery" : "deliveries"} to pay</span>
            </div>
            <ul className="space-y-2.5">
                {weeks.map((w, i) => {
                    const dish = dishes[w.dish];
                    return (
                        <li key={i} className={cn("flex items-center gap-3 rounded-2xl border p-2.5 transition-all duration-300", w.skipped ? "border-dashed bg-muted/40" : "bg-background")}>
                            <span className={cn("h-14 w-14 shrink-0 overflow-hidden rounded-xl transition-all duration-300", w.skipped && "scale-90 opacity-30 grayscale")}>
                                <DishImage dish={dish} i={w.dish} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Week {i + 1}</p>
                                <p className={cn("truncate font-semibold transition-colors", w.skipped && "text-muted-foreground line-through")}>{w.skipped ? "Skipped: away this week" : dish.name}</p>
                            </div>
                            {!w.skipped && <Button type="button" variant="ghost" size="sm" className="h-9 px-2.5" onClick={() => swap(i)} aria-label={`Swap the dish in week ${i + 1}`}><Repeat className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Swap</span></Button>}
                            <Button type="button" variant={w.skipped ? "default" : "outline"} size="sm" className="h-9 px-2.5" onClick={() => toggleSkip(i)} aria-pressed={w.skipped}>
                                {w.skipped ? <><Play className="mr-1.5 h-4 w-4" />Bring back</> : <><SkipForward className="mr-1.5 h-4 w-4" />Skip</>}
                            </Button>
                        </li>
                    );
                })}
            </ul>
            <p className="mt-4 text-center text-xs text-muted-foreground">An example. In your plan, changes are open until {cutoffHours} hours before each delivery.</p>
        </div>
    );
}

const MealPlans = () => {
    const { isAuthenticated } = useAuth();
    const { location } = useUserLocation();
    const { data: config } = useQuery<PlanConfig>({ queryKey: ["plan-config"], queryFn: () => api.get("/meal-plans/config") });
    const { data: chefs = [] } = useQuery<PlanChef[]>({
        queryKey: ["public-chefs", location?.lat, location?.lng],
        queryFn: () => api.get(chefsPath(location)).catch(() => []),
    });
    const { data: chefDishes = [] } = useQuery<MenuItem[]>({ queryKey: ["public-chef-products"], queryFn: () => api.get("/chefs/products/public").catch(() => []) });
    const planChefs = chefs.filter((c) => c.acceptsMealPlans && (!location || c.inServiceArea || c.distanceMiles == null)).slice(0, 3);
    const bestDiscount = Math.max(0, ...(config?.durations.map((d) => d.discountPercent) ?? [0]));
    const cutoff = config?.cutoffHours ?? 48;
    const faqs = FAQS(cutoff);

    // Real dishes from chefs who take plans, when there are any; otherwise examples with colour blocks.
    const realDishes: Dish[] = chefDishes.filter((d) => d.image && !d.isSoldOut).slice(0, 12).map((d) => ({ name: d.name, image: d.image, chef: d.chef?.displayName }));
    const dishes: Dish[] = realDishes.length >= 3 ? realDishes : SAMPLE_DISHES.map((name) => ({ name }));
    const presets = (config?.presets ?? []).filter((d) => PLAN_COPY[d.weeks]);

    return (
        <Layout fullBleed>
            <SEO
                title="Meal Plans from Local Chefs, 1 Week to 6 Months"
                description="Plan anything from 1 week to 6 months of home-cooked meals with a local chef you choose. Pick your dishes, skip any week, and pay only for what you receive."
                jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }}
            />

            {/* HERO: the photos fill the right and fade under the words, like the home page */}
            <section className="relative flex flex-col overflow-hidden bg-ink pb-14 pt-28 text-ink-foreground md:pb-24 md:pt-36">
                <div aria-hidden className="hero-glow absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/25 blur-[120px]" />
                <div aria-hidden className="hero-glow hero-glow-slow absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
                <div className="relative order-last mx-4 mt-10 aspect-[4/5] sm:mx-auto sm:aspect-[16/10] sm:w-full sm:max-w-2xl lg:absolute lg:inset-y-0 lg:right-0 lg:m-0 lg:aspect-auto lg:w-[58%] lg:max-w-none">
                    <div className="hero-frame hero-fade absolute inset-0 overflow-hidden rounded-[2rem] ring-1 ring-ink-foreground/10 lg:rounded-none lg:ring-0">
                        <HeroSlideshow first={heroChef} firstAlt="A chef plating a freshly cooked meal" dishes={realDishes.filter((d): d is Dish & { image: string } => !!d.image).map((d) => ({ image: d.image, name: d.name }))} imgProps={{ width: 1280, height: 1280 }} dotsClassName="lg:bottom-12" />
                    </div>
                    {/* An illustration of a plan, not real customer data */}
                    <div aria-hidden className="hero-chip absolute inset-x-3 bottom-4 rounded-3xl bg-ink/85 p-4 shadow-2xl ring-1 ring-ink-foreground/10 backdrop-blur-md sm:inset-x-auto sm:-left-6 sm:bottom-10 sm:w-80 lg:left-auto lg:right-16 lg:bottom-24">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-ink-foreground/60">This week</p>
                            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-bold text-emerald-300">Week 3 of 13</span>
                        </div>
                        <ul className="space-y-2.5">
                            {dishes.slice(0, 3).map((d, i) => (
                                <li key={d.name + i} className="flex items-center gap-3">
                                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl"><DishImage dish={d} i={i} className="text-base" /></span>
                                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{d.name}</span>
                                    <span className="text-xs text-ink-foreground/60">× {i === 0 ? 2 : 1}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-foreground/10"><div className="h-full w-[23%] rounded-full bg-primary" /></div>
                    </div>
                    {bestDiscount > 0 && (
                        <Link to="/meal-plans/new?weeks=26" className="hero-chip hero-chip-late absolute right-3 top-4 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-xl sm:-right-4 sm:top-10 lg:right-12 lg:top-32">
                            <Percent className="h-4 w-4" />Save up to {bestDiscount}% on longer plans
                        </Link>
                    )}
                </div>

                <div className="container relative z-10 grid grid-cols-1 items-center gap-10 lg:min-h-[34rem] lg:grid-cols-12">
                    <div className="hero-copy space-y-6 lg:col-span-7">
                        <span style={heroDelay(0)} className="hero-rise inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-4 py-2 text-sm font-semibold backdrop-blur"><CalendarDays className="h-4 w-4 text-primary" />Meal plans</span>
                        <h1 className="font-display text-4xl font-extrabold leading-[0.98] sm:text-5xl md:text-7xl">
                            <span style={heroDelay(100)} className="hero-rise block">Your chef.</span>
                            <span style={heroDelay(220)} className="hero-rise block">Your menu.</span>
                            <span style={heroDelay(340)} className="hero-rise block"><span className="hero-underline text-primary">Every week.</span></span>
                        </h1>
                        <p style={heroDelay(500)} className="hero-rise max-w-xl text-lg text-ink-foreground/75 md:text-xl">Choose a local chef, pick the food you love, and have it cooked and delivered for as long as you like, from 1 week to 6 months.</p>
                        <div style={heroDelay(620)} className="hero-rise flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="group h-14 rounded-full px-8 text-base font-bold shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5">
                                <Link to="/meal-plans/new">Build my plan <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
                            </Button>
                            {isAuthenticated && (
                                <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-ink-foreground/30 bg-transparent px-8 text-base font-bold text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
                                    <Link to="/my-plans">My plans</Link>
                                </Button>
                            )}
                        </div>
                        <ul style={heroDelay(740)} className="hero-rise flex flex-wrap gap-2 text-sm">
                            {["No payment up front", "Never renews by itself", "Skip any week"].map((t) => (
                                <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-ink-foreground/10 px-3 py-1.5 backdrop-blur"><BadgeCheck className="h-4 w-4 text-primary" />{t}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ON THE MENU: a slow strip of real dishes, when chefs have added them */}
            {realDishes.length >= 4 && (
                <section aria-label="Dishes from chefs who take meal plans" className="overflow-hidden border-b bg-background py-6">
                    <div className="plan-marquee flex w-max gap-4 hover:[animation-play-state:paused]">
                        {[...realDishes, ...realDishes].map((d, i) => (
                            <div key={i} aria-hidden={i >= realDishes.length} className="flex w-64 shrink-0 items-center gap-3 rounded-2xl border bg-card p-2 pr-4">
                                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"><DishImage dish={d} i={i} /></span>
                                <span className="min-w-0"><span className="block truncate text-sm font-bold">{d.name}</span>{d.chef && <span className="block truncate text-xs text-muted-foreground">by {d.chef}</span>}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* DURATIONS */}
            <section className="relative py-16 md:py-24">
                <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-primary/[0.06] to-transparent" />
                <div className="container">
                    <BannerAds placement="meal_plans" className="mb-10" />
                    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Choose your length</p>
                        <h2 className="font-display text-3xl font-extrabold md:text-5xl">Pick how far ahead you'd like to plan</h2>
                        <p className="mt-3 text-muted-foreground md:text-lg">{bestDiscount > 0 ? `The longer you plan, the more you save, up to ${bestDiscount}% off every dish.` : "Plans are flexible, whichever length you choose."}</p>
                    </Reveal>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                        {presets.map((d, i) => {
                            const featured = d.weeks === 13;
                            const copy = PLAN_COPY[d.weeks];
                            const [num, unit] = d.label.split(" ");
                            return (
                                <Reveal key={d.weeks} delay={i * 90} className="h-full">
                                    <Link
                                        to={`/meal-plans/new?weeks=${d.weeks}`}
                                        className={cn(
                                            "group relative flex h-full flex-col overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-warm-lg md:p-7",
                                            featured ? "border-primary/40 bg-ink text-ink-foreground shadow-warm-lg ring-2 ring-primary/60" : "bg-card",
                                        )}
                                    >
                                        <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b", copy.tint)} />
                                        {featured && <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"><Star className="h-3 w-3 fill-current" />Most chosen</span>}
                                        {d.discountPercent > 0 && !featured && <span className="absolute right-5 top-5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">Save {d.discountPercent}%</span>}
                                        <p className="relative font-display text-6xl font-extrabold leading-none md:text-7xl">{num}</p>
                                        <p className="relative font-display text-xl font-bold">{unit}</p>
                                        {/* One square per weekly delivery */}
                                        <div aria-hidden className="relative mt-4 flex flex-wrap gap-1">
                                            {Array.from({ length: d.weeks }).map((_, w) => (
                                                <span key={w} className={cn("h-2.5 w-2.5 rounded-[3px] transition-colors duration-300", featured ? "bg-primary/80 group-hover:bg-primary" : "bg-primary/25 group-hover:bg-primary/70")} style={{ transitionDelay: `${w * 15}ms` }} />
                                            ))}
                                        </div>
                                        <p className="relative mt-4 text-lg font-bold">{copy.title}</p>
                                        <p className={cn("relative mt-1 flex-1", featured ? "text-ink-foreground/70" : "text-muted-foreground")}>{copy.blurb}</p>
                                        <dl className={cn("relative mt-5 space-y-1.5 border-t pt-4 text-sm", featured && "border-ink-foreground/15")}>
                                            <div className="flex justify-between"><dt>Weekly deliveries</dt><dd className="font-bold">{d.weeks}</dd></div>
                                            <div className="flex justify-between"><dt>Off every dish</dt><dd className="font-bold text-primary">{d.discountPercent > 0 ? `${d.discountPercent}%` : "Standard price"}</dd></div>
                                        </dl>
                                        <span className={cn("relative mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full font-bold transition-colors", featured ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground")}>
                                            Start this plan <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </Link>
                                </Reveal>
                            );
                        })}
                    </div>
                    <p className="mt-8 text-center text-muted-foreground">Want something else? Choose <Link to="/meal-plans/new" className="font-semibold text-primary underline-offset-4 hover:underline">any length from 1 week to 6 months</Link> when you build your plan.</p>
                </div>
            </section>

            {/* HOW IT WORKS: a timeline on the dark background */}
            <section className="relative overflow-hidden bg-ink py-16 text-ink-foreground md:py-24">
                <div aria-hidden className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
                <div className="container relative">
                    <Reveal className="mb-10 max-w-2xl md:mb-14">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">How it works</p>
                        <h2 className="font-display text-3xl font-extrabold md:text-5xl">From request to doorstep</h2>
                    </Reveal>
                    <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
                        <span aria-hidden className="absolute left-7 top-7 hidden h-0.5 w-[calc(100%-3.5rem)] bg-gradient-to-r from-primary via-primary/50 to-primary/10 md:block" />
                        {[
                            { icon: ChefHat, t: "Choose your chef", d: "See who delivers to you, what they cook and what customers say." },
                            { icon: UtensilsCrossed, t: "Pick your food", d: "Choose your favourite dishes and how many meals you'd like each week." },
                            { icon: MessageCircle, t: "Agree with your chef", d: "They confirm your plan. Message them about anything you'd like changed." },
                            { icon: CalendarCheck, t: "Eat well, week after week", d: "Change, skip or pause any week before its cut-off." },
                        ].map((step, i) => (
                            <Reveal as="li" key={step.t} delay={i * 120} className="relative flex gap-4 md:block">
                                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-ink">
                                    <step.icon className="h-6 w-6" />
                                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink-foreground text-xs font-extrabold text-ink">{i + 1}</span>
                                </span>
                                <div className="md:mt-5">
                                    <h3 className="font-display text-lg font-bold">{step.t}</h3>
                                    <p className="mt-1 text-sm text-ink-foreground/65">{step.d}</p>
                                </div>
                            </Reveal>
                        ))}
                    </ol>
                </div>
            </section>

            {/* CONTROL: a working example beside the features */}
            <section className="py-16 md:py-24">
                <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <Reveal>
                        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">You're in charge</p>
                        <h2 className="font-display text-3xl font-extrabold md:text-5xl">A plan that bends around your life</h2>
                        <p className="mt-3 text-muted-foreground md:text-lg">Going on holiday? Tired of jollof? Everything can change, right up to {cutoff} hours before each delivery.</p>
                        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                            {[
                                { icon: Repeat, t: "Swap any dish", d: "A different menu each week.", c: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
                                { icon: SkipForward, t: "Skip a week", d: "No charge, no explaining.", c: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
                                { icon: PauseCircle, t: "Pause", d: "Up to 12 weeks, then carry on.", c: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                                { icon: Wallet, t: "Pay as you go", d: "Per delivery, never up front.", c: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                                { icon: ShieldCheck, t: "Allergy aware", d: "Your chef sees your needs every time.", c: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
                                { icon: Sparkles, t: "Earn rewards", d: "Cashback on every delivery.", c: "bg-primary/10 text-primary" },
                            ].map((item) => (
                                <li key={item.t} className="flex gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary/60">
                                    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", item.c)}><item.icon className="h-5 w-5" /></span>
                                    <div><p className="font-bold">{item.t}</p><p className="text-sm text-muted-foreground">{item.d}</p></div>
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                    <Reveal delay={150}><PlanDemo dishes={dishes} cutoffHours={cutoff} /></Reveal>
                </div>
            </section>

            {/* CHEFS */}
            <section className="bg-secondary/50 py-16 md:py-24">
                <div className="container">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
                        <Reveal className="max-w-xl">
                            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Meet the cooks</p>
                            <h2 className="font-display text-3xl font-extrabold md:text-5xl">{location ? "Chefs who deliver to you" : "Chefs taking meal plans"}</h2>
                        </Reveal>
                        <div className="w-full max-w-md"><LocationPicker heading="Find chefs near you" /></div>
                    </div>
                    {planChefs.length > 0 ? (
                        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
                            {planChefs.map((c, i) => (
                                <Reveal key={c.id} delay={i * 100} className="h-full">
                                    <div className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-warm-lg">
                                        <div className="relative h-36 overflow-hidden">
                                            {c.coverImage
                                                ? <img src={thumb(c.coverImage, 640) ?? c.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                : <div className={cn("h-full w-full bg-gradient-to-br", SWATCHES[i % SWATCHES.length])}><ChefHat aria-hidden className="absolute -right-4 -top-4 h-36 w-36 text-white/15" /></div>}
                                            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                            {(c.planHouseholds ?? 0) > 0 && <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur"><Users className="h-3.5 w-3.5" />Cooking for {c.planHouseholds} {c.planHouseholds === 1 ? "household" : "households"}</span>}
                                        </div>
                                        <div className="relative flex flex-1 flex-col px-5 pb-5">
                                            <div className="-mt-9 mb-3 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border-4 border-card bg-primary/10 shadow-md">
                                                {c.avatar ? <img src={thumb(c.avatar, 160) ?? c.avatar} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="font-display text-2xl font-extrabold text-primary">{String(c.displayName).charAt(0).toUpperCase()}</span>}
                                            </div>
                                            <Link to={`/chefs/${c.id}`} className="block break-words font-display text-lg font-bold hover:text-primary">{c.displayName}</Link>
                                            <p className="text-sm text-muted-foreground">{c.specialty || "Home cooking"}</p>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <RatingPill rating={c.rating} count={c.reviewCount} />
                                                {c.distanceMiles != null && <span className="text-sm text-muted-foreground">{formatMiles(c.distanceMiles)}</span>}
                                                {c.hygieneVerified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" />Hygiene checked</span>}
                                            </div>
                                            <Button asChild className="mt-5 h-11 w-full rounded-full"><Link to={`/meal-plans/new?chef=${c.id}`}>Plan with {String(c.displayName).split(" ")[0]} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[2rem] border border-dashed bg-card p-10 text-center">
                            <ChefHat className="mx-auto mb-3 h-10 w-10 text-primary" />
                            <p className="font-bold">{location ? "No chefs deliver to this area yet." : "Our first chefs are joining now."}</p>
                            <p className="text-sm text-muted-foreground">Try another postcode, or check back soon.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24">
                <div className="container grid grid-cols-1 gap-10 lg:grid-cols-12">
                    <Reveal className="lg:col-span-4">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Questions</p>
                        <h2 className="font-display text-3xl font-extrabold md:text-4xl">Good to know</h2>
                        <div className="mt-6 rounded-3xl bg-primary/10 p-6">
                            <HeartHandshake className="mb-3 h-8 w-8 text-primary" />
                            <p className="font-bold">Still deciding?</p>
                            <p className="mt-1 text-sm text-muted-foreground">Start with one week. There's nothing to pay up front, and nothing renews.</p>
                            <Button asChild variant="outline" className="mt-4 h-11 rounded-full"><Link to="/meal-plans/new?weeks=1">Try one week</Link></Button>
                        </div>
                    </Reveal>
                    <Reveal delay={100} className="lg:col-span-8">
                        <Accordion type="single" collapsible className="space-y-3">
                            {faqs.map((f) => (
                                <AccordionItem key={f.q} value={f.q} className="rounded-2xl border bg-card px-5 data-[state=open]:shadow-warm">
                                    <AccordionTrigger className="min-h-14 text-left font-bold hover:no-underline">{f.q}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </Reveal>
                </div>
            </section>

            {/* CLOSING */}
            <section className="container pb-16 md:pb-24">
                <Reveal>
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-orange-500 to-rose-500 px-6 py-14 text-center text-primary-foreground md:px-12 md:py-20">
                        <img src={heroChef} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-multiply" />
                        <div aria-hidden className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
                        <div className="relative mx-auto max-w-2xl">
                            <h2 className="font-display text-4xl font-extrabold md:text-6xl">Let's sort out dinner.</h2>
                            <p className="mt-3 text-lg text-primary-foreground/85">Pick a chef and your dishes in a few minutes. Your first delivery can be in {config?.leadDays ?? 3} days.</p>
                            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                                <Button asChild size="lg" className="h-14 rounded-full bg-white px-10 text-base font-bold text-primary hover:bg-white/90"><Link to="/meal-plans/new">Build my plan <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
                            </div>
                            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-primary-foreground/90">
                                {["Pay per delivery", "Skip any week", "Cancel any time before the cut-off"].map((t) => <li key={t} className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" />{t}</li>)}
                            </ul>
                        </div>
                    </div>
                </Reveal>
            </section>
        </Layout>
    );
};

export default MealPlans;
