import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, CalendarCheck, CalendarDays, ChefHat, MessageCircle, PauseCircle, Repeat, ShieldCheck, SkipForward, Sparkles, UtensilsCrossed, Wallet } from "lucide-react";
import SEO from "@/components/common/SEO";
import { Layout } from "@/components/layout/Layout";
import { LocationPicker } from "@/components/location/LocationPicker";
import { RatingPill } from "@/components/reviews/Stars";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { chefsPath, formatMiles, useUserLocation } from "@/lib/location";
import { PlanConfig } from "@/lib/mealPlans";
import { heroDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import heroChef from "@/assets/hero-chef.jpg";
import { BannerAds } from "@/components/banners/BannerAds";

// Keyed by weeks. Any length from 1 to 26 weeks can be chosen in the builder.
const PLAN_COPY: Record<number, { title: string; blurb: string }> = {
    1: { title: "Try it out", blurb: "One week to taste the food and meet your chef. No commitment." },
    4: { title: "Get to know your chef", blurb: "A month to find your favourites, with a menu that settles into your week." },
    13: { title: "Build the habit", blurb: "A full season of dinners, with a menu that changes as you do." },
    26: { title: "Sorted for months", blurb: "Half a year with no more wondering what's for dinner." },
};

const WEEK_PREVIEW = [
    { day: "Week 1", state: "Delivered", tone: "bg-emerald-400" },
    { day: "Week 2", state: "Your menu is set", tone: "bg-primary" },
    { day: "Week 3", state: "Skipped, away", tone: "bg-ink-foreground/30" },
    { day: "Week 4", state: "Choose your dishes", tone: "bg-primary/50" },
];

const FAQS = (cutoffHours: number) => [
    { q: "Do I pay for the whole plan up front?", a: "No. You pay for each delivery you receive, and skipped or paused weeks cost nothing. The total you see is an estimate of all your deliveries, not a charge." },
    { q: "Will my plan renew by itself?", a: "Never. Your plan ends on the date you agreed. We remind you two weeks before, and you can renew it in one tap if you want to carry on." },
    { q: "Can I change my mind?", a: `Yes. You can change dishes, skip a week, pause for up to 12 weeks or cancel, as long as it's at least ${cutoffHours} hours before that delivery. After that, your chef has already bought ingredients, so that delivery still goes ahead.` },
    { q: "What if I want something that isn't on the menu?", a: "Add it to your request, or message your chef. They can tell you what's possible, and you agree any changes between you." },
    { q: "How do you handle allergies?", a: "Tell us what you avoid and we only offer dishes whose chef has confirmed the allergen list. Home kitchens may still handle allergens, so if you have a severe allergy, please speak to your chef before you start." },
    { q: "How do I know a chef is any good?", a: "We review every chef and dish before they go live. Ratings only come from customers the chef has actually cooked for, so you can trust what you read." },
];

const MealPlans = () => {
    const { isAuthenticated } = useAuth();
    const { location } = useUserLocation();
    const { data: config } = useQuery<PlanConfig>({ queryKey: ["plan-config"], queryFn: () => api.get("/meal-plans/config") });
    const { data: chefs = [] } = useQuery<any[]>({
        queryKey: ["public-chefs", location?.lat, location?.lng],
        queryFn: () => api.get(chefsPath(location)).catch(() => []),
    });
    const planChefs = chefs.filter((c) => c.acceptsMealPlans && (!location || c.inServiceArea || c.distanceMiles == null)).slice(0, 3);
    const bestDiscount = Math.max(0, ...(config?.durations.map((d) => d.discountPercent) ?? [0]));
    const faqs = FAQS(config?.cutoffHours ?? 48);

    return (
        <Layout fullBleed>
            <SEO
                title="Meal Plans from Local Chefs, 1 Week to 6 Months"
                description="Plan anything from 1 week to 6 months of home-cooked meals with a local chef you choose. Pick your dishes, skip any week, and pay only for what you receive."
                jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }}
            />

            {/* HERO */}
            <section className="relative overflow-hidden bg-ink pb-14 pt-28 text-ink-foreground md:pb-24 md:pt-36">
                <div aria-hidden className="hero-glow absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/25 blur-[120px]" />
                <div aria-hidden className="hero-glow hero-glow-slow absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
                <div className="container relative grid items-center gap-10 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-7">
                        <span style={heroDelay(0)} className="hero-rise inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-4 py-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-primary" />Meal plans</span>
                        <h1 className="font-display text-4xl font-extrabold leading-[0.98] sm:text-5xl md:text-7xl">
                            <span style={heroDelay(100)} className="hero-rise block">Your chef.</span>
                            <span style={heroDelay(220)} className="hero-rise block">Your menu.</span>
                            <span style={heroDelay(340)} className="hero-rise block"><span className="hero-underline text-primary">Every week.</span></span>
                        </h1>
                        <p style={heroDelay(500)} className="hero-rise max-w-xl text-lg text-ink-foreground/70 md:text-xl">Choose a local chef, pick the food you love, and have it cooked and delivered for as long as you like, from 1 week to 6 months.</p>
                        <div style={heroDelay(620)} className="hero-rise flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="group h-14 rounded-full px-8 text-base font-bold transition-transform hover:-translate-y-0.5">
                                <Link to="/meal-plans/new">Build my plan <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
                            </Button>
                            {isAuthenticated && (
                                <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-ink-foreground/30 bg-transparent px-8 text-base font-bold text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
                                    <Link to="/my-plans">My plans</Link>
                                </Button>
                            )}
                        </div>
                        <ul style={heroDelay(740)} className="hero-rise flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-foreground/70">
                            <li className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" />No payment up front</li>
                            <li className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" />Never renews by itself</li>
                            <li className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" />Skip any week</li>
                        </ul>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="relative">
                            <div className="hero-frame aspect-[5/4] overflow-hidden rounded-[2rem] ring-1 ring-ink-foreground/10 lg:aspect-[4/5]">
                                <img src={heroChef} alt="A chef plating a freshly cooked meal" width={1280} height={1280} className="hero-zoom h-full w-full object-cover" />
                            </div>
                            {/* An illustration of the plan calendar, not real customer data */}
                            <div aria-hidden className="hero-chip absolute inset-x-3 bottom-3 rounded-2xl bg-ink/90 p-4 backdrop-blur sm:inset-x-auto sm:-left-6 sm:w-72">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-foreground/60">How a plan looks</p>
                                <ul className="space-y-2">
                                    {WEEK_PREVIEW.map((w) => (
                                        <li key={w.day} className="flex items-center gap-3 text-sm">
                                            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", w.tone)} />
                                            <span className="font-bold">{w.day}</span>
                                            <span className="truncate text-ink-foreground/70">{w.state}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* DURATIONS */}
            <section className="py-14 md:py-20">
                <div className="container">
                    <BannerAds placement="meal_plans" className="mb-10" />
                    <div className="mb-8 max-w-2xl">
                        <h2 className="font-display text-3xl font-extrabold md:text-5xl">Pick how far ahead you'd like to plan</h2>
                        <p className="mt-2 text-muted-foreground md:text-lg">{bestDiscount > 0 ? `The longer you plan, the more you save, up to ${bestDiscount}% off every dish.` : "Plans are flexible, whichever length you choose."}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                        {(config?.presets ?? []).filter((d) => PLAN_COPY[d.weeks]).map((d) => {
                            const featured = d.weeks === 13;
                            return (
                                <Link
                                    key={d.weeks}
                                    to={`/meal-plans/new?weeks=${d.weeks}`}
                                    className={cn("group relative flex flex-col rounded-[2rem] border p-6 transition-all hover:-translate-y-1 hover:shadow-warm-lg md:p-8", featured ? "bg-ink text-ink-foreground" : "bg-card")}
                                >
                                    {featured && <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">A good place to start</span>}
                                    <p className="font-display text-6xl font-extrabold md:text-7xl">{d.label.split(" ")[0]}</p>
                                    <p className="font-display text-xl font-bold">{d.label.split(" ")[1]}</p>
                                    <p className={cn("mt-4 text-lg font-bold", featured && "text-ink-foreground")}>{PLAN_COPY[d.weeks]?.title}</p>
                                    <p className={cn("mt-1 flex-1", featured ? "text-ink-foreground/70" : "text-muted-foreground")}>{PLAN_COPY[d.weeks]?.blurb}</p>
                                    <dl className={cn("mt-5 space-y-1.5 border-t pt-4 text-sm", featured && "border-ink-foreground/15")}>
                                        <div className="flex justify-between"><dt>Weekly deliveries</dt><dd className="font-bold">{d.weeks}</dd></div>
                                        <div className="flex justify-between"><dt>Off every dish</dt><dd className="font-bold text-primary">{d.discountPercent > 0 ? `${d.discountPercent}%` : "Standard price"}</dd></div>
                                    </dl>
                                    <span className="mt-5 inline-flex items-center gap-2 font-bold text-primary">Start this plan <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                                </Link>
                            );
                        })}
                    </div>
                    <p className="mt-6 text-center text-muted-foreground">Want something else? Choose <Link to="/meal-plans/new" className="font-semibold text-primary underline-offset-4 hover:underline">any length from 1 week to 6 months</Link> when you build your plan.</p>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="bg-secondary/60 py-14 md:py-20">
                <div className="container">
                    <h2 className="mb-8 font-display text-3xl font-extrabold md:mb-12 md:text-5xl">From request to doorstep</h2>
                    <ol className="grid gap-4 md:grid-cols-4">
                        {[
                            { icon: ChefHat, t: "Choose your chef", d: "See who delivers to you, what they cook and what customers say." },
                            { icon: UtensilsCrossed, t: "Pick your food", d: "Choose your favourite dishes and how many meals you'd like each week." },
                            { icon: MessageCircle, t: "Agree with your chef", d: "They confirm your plan. Message them about anything you'd like changed." },
                            { icon: CalendarCheck, t: "Eat well, week after week", d: "Change, skip or pause any week before its cut-off." },
                        ].map((step, i) => (
                            <li key={step.t} className="rounded-3xl border bg-card p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <step.icon className="h-8 w-8 text-primary" />
                                    <span className="font-display text-4xl font-extrabold text-primary/15">{i + 1}</span>
                                </div>
                                <h3 className="font-display text-lg font-bold">{step.t}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{step.d}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* CONTROL */}
            <section className="py-14 md:py-20">
                <div className="container grid gap-8 lg:grid-cols-2 lg:gap-14">
                    <div>
                        <h2 className="font-display text-3xl font-extrabold md:text-5xl">A plan that bends around your life</h2>
                        <p className="mt-3 text-muted-foreground md:text-lg">Going on holiday? Tired of jollof? Everything can change, right up to {config?.cutoffHours ?? 48} hours before each delivery.</p>
                    </div>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {[
                            { icon: Repeat, t: "Swap any dish", d: "Choose a different menu each week." },
                            { icon: SkipForward, t: "Skip a week", d: "No charge, and no explaining." },
                            { icon: PauseCircle, t: "Pause", d: "Stop for up to 12 weeks, then pick up where you left off." },
                            { icon: Wallet, t: "Pay as you go", d: "Pay per delivery, never for the whole plan up front." },
                            { icon: ShieldCheck, t: "Allergy aware", d: "Your chef sees your needs on every delivery." },
                            { icon: Sparkles, t: "Earn rewards", d: "Collect points on every delivery." },
                        ].map((item) => (
                            <li key={item.t} className="flex gap-3 rounded-2xl border bg-card p-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><item.icon className="h-5 w-5 text-primary" /></span>
                                <div><p className="font-bold">{item.t}</p><p className="text-sm text-muted-foreground">{item.d}</p></div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* CHEFS */}
            <section className="pb-14 md:pb-20">
                <div className="container">
                    <h2 className="mb-2 font-display text-3xl font-extrabold md:text-5xl">{location ? "Chefs who deliver to you" : "Chefs taking meal plans"}</h2>
                    <div className="mb-6 mt-4 max-w-2xl"><LocationPicker heading="Find chefs near you" /></div>
                    {planChefs.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
                            {planChefs.map((c) => (
                                <div key={c.id} className="overflow-hidden rounded-3xl border bg-card">
                                    <div className="flex items-center gap-4 p-5">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                            {c.avatar ? <img src={c.avatar} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ChefHat className="h-7 w-7 text-primary" />}
                                        </div>
                                        <div className="min-w-0">
                                            <Link to={`/chefs/${c.id}`} className="block break-words font-bold hover:text-primary">{c.displayName}</Link>
                                            <p className="truncate text-sm text-muted-foreground">{c.specialty || "Home cooking"}</p>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
                                                <RatingPill rating={c.rating} count={c.reviewCount} />
                                                {c.distanceMiles != null && <span className="text-sm text-muted-foreground">{formatMiles(c.distanceMiles)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 pb-5">
                                        <Button asChild className="h-11 w-full"><Link to={`/meal-plans/new?chef=${c.id}`}>Plan with {c.displayName.split(" ")[0]}</Link></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed p-10 text-center">
                            <ChefHat className="mx-auto mb-3 h-10 w-10 text-primary" />
                            <p className="font-bold">{location ? "No chefs deliver to this area yet." : "Our first chefs are joining now."}</p>
                            <p className="text-sm text-muted-foreground">Try another postcode, or check back soon.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-secondary/60 py-14 md:py-20">
                <div className="container max-w-3xl">
                    <h2 className="mb-6 font-display text-3xl font-extrabold md:text-4xl">Good to know</h2>
                    <Accordion type="single" collapsible>
                        {faqs.map((f) => (
                            <AccordionItem key={f.q} value={f.q}>
                                <AccordionTrigger className="min-h-12 text-left">{f.q}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            <section className="py-16 text-center">
                <div className="container max-w-2xl">
                    <h2 className="mb-6 font-display text-4xl font-extrabold md:text-5xl">Let's sort out dinner.</h2>
                    <Button asChild size="lg" className="h-14 rounded-full px-10 text-base font-bold"><Link to="/meal-plans/new">Build my plan <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
                </div>
            </section>
        </Layout>
    );
};

export default MealPlans;
