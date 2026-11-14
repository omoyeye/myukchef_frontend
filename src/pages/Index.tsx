import { Link } from 'react-router-dom';
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { Reveal } from "@/components/motion/Reveal";
import { heroDelay } from '@/lib/motion';
import { ArrowRight, Star, Flame, ShieldCheck, Clock, ChefHat, CalendarHeart, CalendarDays, Search, Truck, BadgeCheck, Sparkles, PartyPopper, SkipForward, Wallet, Repeat } from 'lucide-react';
import { RatingPill } from '@/components/reviews/Stars';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { MenuCard } from '@/components/menu/MenuCard';
import { categories } from '@/data/categories';
import { LocationPicker } from '@/components/location/LocationPicker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { chefsPath, formatMiles, useUserLocation } from '@/lib/location';
import { CONTACT_EMAIL } from '@/lib/site';
import { MenuItem } from '@/types/menu';
import { KitchenStatus } from '@/components/home/KitchenStatus';
import { SearchBar } from '@/components/home/SearchBar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import SEO from '@/components/common/SEO';
import heroChef from '@/assets/hero-chef.jpg';

// React 18 only passes this browser setting through in lowercase.
const HERO_IMAGE_PRIORITY = { fetchpriority: 'high' };

const FAQS = [
  { q: 'How does MYUKCHEF work?', a: 'Browse dishes from independent local chefs, place your order, and follow its progress from the kitchen to your door. You can also book a chef or catering for an event.' },
  { q: 'Can I find a chef near me?', a: 'Yes. Share your location or enter a postcode and we will show the chefs who serve your area, nearest first.' },
  { q: 'Can I book chefs for a wedding or party?', a: 'Yes. Choose dishes from as many chefs as you like and each one sends you a quote. You compare them in one booking, confirm the ones you want and pay MYUKCHEF once. We pay your chefs, and they come to serve on the day if they can.' },
  { q: 'Can I plan my meals for weeks ahead?', a: 'Yes. Choose a chef and plan 1, 3 or 6 months of the dishes you love, delivered weekly. You pay per delivery, can skip any week, and your plan never renews by itself.' },
  { q: 'How do you handle dietary needs and allergens?', a: 'Each dish lists its dietary details and allergens, and our recommendation tool filters by what you need. If you have a severe allergy, please confirm with us before ordering.' },
  { q: 'How do I become a chef on MYUKCHEF?', a: 'Apply through our chef sign-up page. Our team reviews every application before a chef or their dishes go live.' },
];

const Index = () => {
  const { location } = useUserLocation();
  const { data: products = [] } = useQuery<MenuItem[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products'),
  });
  const { data: chefDishes = [] } = useQuery<MenuItem[]>({
    queryKey: ['public-chef-products'],
    queryFn: () => api.get('/chefs/products/public'),
  });
  const popularItems = [...products, ...chefDishes].filter((p) => !p.isSoldOut).sort((a, b) => Number(!!b.isPopular) - Number(!!a.isPopular)).slice(0, 4);

  const { data: promoDiscount } = useQuery<any>({
    queryKey: ['promo-discount'],
    queryFn: async () => {
      const all: any[] = await api.get('/discounts/public').catch(() => []);
      return all.find((d) => d.isFirstOrderOnly && d.isActive) ?? null;
    },
  });

  const { data: settings } = useQuery<any>({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/settings'),
  });

  const { data: chefs = [] } = useQuery<any[]>({
    queryKey: ['public-chefs', location?.lat, location?.lng],
    queryFn: () => api.get(chefsPath(location)).catch(() => []),
  });

  const { data: featuredReviews = [] } = useQuery<any[]>({
    queryKey: ['featured-reviews'],
    queryFn: () => api.get('/reviews/featured').catch(() => []),
  });

  const reviews = featuredReviews.slice(0, 3);
  const kitchen = settings?.operational_status ?? {};

  const promoText = promoDiscount
    ? `Use code ${promoDiscount.code} for ${promoDiscount.type === 'percentage' ? promoDiscount.value + '%' : '£' + promoDiscount.value} off your first order`
    : 'Home-cooked food from independent local chefs';

  return (
    <Layout fullBleed={true}>
      <SEO
        title="Book Local Chefs & Order Home-Cooked Food"
        description="MYUKCHEF connects you with independent local chefs across the UK. Order home-cooked meals or book a private chef for your event."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground pt-28 pb-16 md:pt-36 md:pb-24">
        <div aria-hidden className="hero-glow absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-primary/30 blur-[120px]" />
        <div aria-hidden className="hero-glow hero-glow-slow absolute -bottom-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[120px]" />
        <div className="container relative grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="hero-rise" style={heroDelay(0)}><KitchenStatus isOpen={kitchen.isOpen ?? true} deliveryTime={`${kitchen.prepTimeMin ?? 20}-${kitchen.prepTimeMax ?? 40}`} /></div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[0.95]">
              <span className="block hero-rise" style={heroDelay(100)}>Real chefs.</span>
              <span className="block hero-rise" style={heroDelay(220)}>Real food.</span>
              <span className="block hero-rise" style={heroDelay(340)}><span className="hero-underline text-primary">Right to your door.</span></span>
            </h1>
            <p className="text-lg md:text-xl text-ink-foreground/70 max-w-xl hero-rise" style={heroDelay(500)}>
              Order home-cooked dishes tonight, plan months of meals with a chef you love, or book one for your event.
            </p>
            <div className="max-w-xl hero-rise" style={heroDelay(620)}><SearchBar /></div>
            <div className="flex flex-wrap gap-3 hero-rise" style={heroDelay(740)}>
              <Button asChild size="lg" className="group rounded-full h-14 px-8 text-base font-bold transition-transform hover:-translate-y-0.5">
                <Link to="/menu">Order food <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 text-base font-bold bg-transparent border-ink-foreground/30 text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
                <Link to="/meal-plans"><CalendarDays className="mr-2 h-5 w-5" /> Plan my meals</Link>
              </Button>
            </div>
            <Link to="/recommend" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline hero-rise" style={heroDelay(860)}>
              <Sparkles className="h-4 w-4" /> Not sure what to pick? Get recommendations for your diet, budget and occasion
            </Link>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-2xl ring-1 ring-ink-foreground/10 hero-frame">
              <HeroSlideshow first={heroChef} firstAlt="A chef plating a freshly cooked meal" dishes={popularItems.filter((d) => d.image)} imgProps={{ width: 1280, height: 1280, ...HERO_IMAGE_PRIORITY }} />
            </div>
            <Link to="/meal-plans" className="hero-chip hero-chip-late absolute right-3 top-4 sm:-right-4 sm:top-10 flex min-h-11 items-center gap-2 rounded-full bg-ink/90 px-4 text-sm font-bold text-ink-foreground shadow-xl ring-1 ring-ink-foreground/15 backdrop-blur">
              <CalendarDays className="h-4 w-4 text-primary" /> 1, 3 or 6 month plans
            </Link>
            <div className="hero-chip absolute left-3 bottom-4 sm:-left-6 sm:bottom-10 bg-card text-card-foreground rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-[16rem]">
              <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center"><BadgeCheck className="h-6 w-6 text-primary" /></div>
              <div>
                <div className="font-bold text-sm">Every chef reviewed</div>
                <div className="text-xs text-muted-foreground">Before they go live</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMO STRIP */}
      <div className="bg-primary text-primary-foreground">
        <div className="container py-3 flex items-center justify-center gap-2 text-sm font-bold text-center">
          <Sparkles className="h-4 w-4 shrink-0" /> {promoText}
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="py-16">
        <Reveal>
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">What are you craving?</h2>
            <Link to="/menu" className="text-sm font-bold text-primary hover:underline">See all</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x no-scrollbar">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/menu?category=${cat.id}`}
                className="snap-start shrink-0 w-32 group flex flex-col items-center gap-3 rounded-2xl bg-card border p-5 hover:border-primary hover:-translate-y-1 transition-all">
                <span className="text-5xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="font-bold text-sm text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      {/* TRENDING */}
      <section className="pb-20">
        <Reveal>
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold flex items-center gap-2"><Flame className="h-8 w-8 text-primary" /> Popular right now</h2>
              <p className="text-muted-foreground mt-1">Favourites from our kitchens.</p>
            </div>
            <Button asChild variant="outline" className="rounded-full hidden sm:inline-flex">
              <Link to="/menu">Full menu <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          {popularItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularItems.map((item) => <MenuCard key={item.id} item={item} />)}
            </div>
          ) : (
            <p className="rounded-3xl border border-dashed p-10 text-center text-muted-foreground">Our chefs are preparing their menus. Check back soon.</p>
          )}
        </div>
        </Reveal>
      </section>

      {/* MEAL PLANS */}
      <section className="pb-20">
        <Reveal>
        <div className="container">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink p-6 text-ink-foreground md:p-12">
            <div className="absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1.5 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-primary" /> Meal plans</span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight md:text-5xl">Your own chef, for months at a time</h2>
                <p className="mt-3 max-w-lg text-ink-foreground/70 md:text-lg">Pick a local chef and the food you love. They cook it fresh and deliver it every week.</p>
                <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-3">
                  <li className="flex items-center gap-2"><Repeat className="h-4 w-4 shrink-0 text-primary" /> Swap any dish</li>
                  <li className="flex items-center gap-2"><SkipForward className="h-4 w-4 shrink-0 text-primary" /> Skip any week</li>
                  <li className="flex items-center gap-2"><Wallet className="h-4 w-4 shrink-0 text-primary" /> Pay as you go</li>
                </ul>
                <Button asChild size="lg" className="mt-6 h-12 rounded-full font-bold"><Link to="/meal-plans">See how it works <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[1, 3, 6].map((months) => (
                  <Link key={months} to={`/meal-plans/new?months=${months}`} className="rounded-3xl bg-ink-foreground/10 p-3 text-center transition-colors hover:bg-primary sm:p-6">
                    <span className="block font-display text-5xl font-extrabold md:text-7xl">{months}</span>
                    <span className="text-sm font-semibold">{months === 1 ? 'month' : 'months'}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-secondary/60">
        <Reveal>
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-12">Dinner sorted in three taps</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Search, t: 'Pick a dish or chef', d: 'Browse home-cooked menus from chefs near you.' },
              { icon: ChefHat, t: 'They cook it fresh', d: 'Made to order — never sitting under a heat lamp.' },
              { icon: Truck, t: 'Track it', d: 'Follow your order from kitchen to doorstep.' },
            ].map((s, i) => (
              <div key={s.t} className="relative rounded-3xl bg-card p-8 border">
                <span className="absolute top-6 right-8 font-display text-6xl font-extrabold text-primary/10">0{i + 1}</span>
                <s.icon className="h-10 w-10 text-primary mb-5" />
                <h3 className="font-display text-xl font-bold mb-2">{s.t}</h3>
                <p className="text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      {/* CHEFS */}
      <section className="py-20">
        <Reveal>
        <div className="container">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold">{location ? 'Chefs near you' : 'Meet the chefs'}</h2>
              <p className="text-muted-foreground mt-1">Independent cooks bringing their recipes to you.</p>
            </div>
            <Link to="/chefs" className="text-sm font-bold text-primary hover:underline">All chefs</Link>
          </div>
          <div className="mb-6 max-w-2xl"><LocationPicker heading="Find chefs near you" /></div>
          {chefs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {chefs.slice(0, 4).map((c: any) => (
                <Link key={c.id} to={`/chefs/${c.id}`} className="group rounded-3xl overflow-hidden bg-card border hover:shadow-warm-lg transition-all">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {c.avatar || c.coverImage
                      ? <img src={c.avatar || c.coverImage} alt={c.displayName} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      : <div className="h-full w-full flex items-center justify-center"><ChefHat className="h-12 w-12 text-muted-foreground" /></div>}
                  </div>
                  <div className="p-4">
                    <div className="font-bold">{c.displayName}</div>
                    <div className="text-sm text-muted-foreground truncate">{c.specialty || 'Home cooking'}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2"><RatingPill rating={c.rating} count={c.reviewCount} />{c.distanceMiles != null && <span className="text-xs font-semibold text-primary">{formatMiles(c.distanceMiles)}</span>}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed p-10 text-center">
              <ChefHat className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-bold">Our first chefs are joining now.</p>
              <p className="text-muted-foreground text-sm">Are you a chef? Be one of the first on MYUKCHEF.</p>
            </div>
          )}
        </div>
        </Reveal>
      </section>

      {/* EVENTS + CHEF SIGNUP */}
      <section className="pb-20">
        <Reveal>
        <div className="container grid lg:grid-cols-2 gap-6">
          <div className="rounded-[2rem] bg-ink text-ink-foreground p-10 md:p-12 relative overflow-hidden">
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
            <PartyPopper className="h-10 w-10 text-primary mb-6" />
            <h3 className="font-display text-3xl md:text-4xl font-extrabold mb-3">Hosting an event?</h3>
            <p className="text-ink-foreground/70 mb-8 max-w-md">Choose dishes from different chefs, compare their quotes in one booking, and pay once.</p>
            <Button asChild size="lg" className="rounded-full font-bold relative">
              <Link to="/events">Get event quotes <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-[2rem] bg-primary text-primary-foreground p-10 md:p-12 relative overflow-hidden">
            <ChefHat className="h-10 w-10 mb-6" />
            <h3 className="font-display text-3xl md:text-4xl font-extrabold mb-3">Cook for MYUKCHEF</h3>
            <p className="text-primary-foreground/85 mb-8 max-w-md">Sell your dishes and take event bookings, all from one simple dashboard.</p>
            <Button asChild size="lg" variant="secondary" className="rounded-full font-bold">
              <Link to="/chef/register">Join as a chef <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
        </Reveal>
      </section>

      {/* TRUST + REVIEWS */}
      <section className="py-20 bg-secondary/60">
        <Reveal>
        <div className="container">
          <div className="grid md:grid-cols-3 gap-4 mb-14">
            {[
              { icon: ShieldCheck, t: 'Reviewed chefs', d: 'Every chef and dish is reviewed before going live.' },
              { icon: Clock, t: 'Order tracking', d: 'Updates from kitchen to door.' },
              { icon: Star, t: `${settings?.loyalty_config?.earnRatio || 10} points per £1`, d: 'Earn rewards on every order.' },
            ].map((f) => (
              <div key={f.t} className="flex gap-4 items-start">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center"><f.icon className="h-6 w-6 text-primary" /></div>
                <div><div className="font-bold">{f.t}</div><div className="text-sm text-muted-foreground">{f.d}</div></div>
              </div>
            ))}
          </div>
          {reviews.length > 0 && <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-8">What customers say</h2>}
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r: any, i: number) => (
              <figure key={i} className="rounded-3xl bg-card border p-8">
                <div className="flex gap-1 mb-4">{[...Array(r.rating || 5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}</div>
                <blockquote className="text-lg leading-relaxed mb-6">“{r.comment || r.text}”</blockquote>
                <figcaption className="font-bold">{r.userName || r.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <Reveal>
        <div className="container max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-6">Questions, answered</h2>
          <Accordion type="single" collapsible>
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="min-h-12 text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-4 text-sm text-muted-foreground">Still have a question? Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
        </div>
        </Reveal>
      </section>

      {/* FINAL CTA */}
      <section className="py-20">
        <Reveal>
        <div className="container text-center max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold mb-4">Hungry? Find your chef.</h2>
          <p className="text-muted-foreground text-lg mb-8">{promoText}.</p>
          <Button asChild size="lg" className="rounded-full h-14 px-10 text-base font-bold">
            <Link to="/menu">Start your order <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
        </Reveal>
      </section>
    </Layout>
  );
};

export default Index;
