import { categoryLabel, unitNote, type EventDish } from "@/lib/eventMenu";
import { waitLabel } from "@/lib/area";
import { useState } from "react";
import { BestReview, ChefGallery } from "@/components/chefs/ChefHighlights";
import { nextOpenLabel } from "@/lib/images";
import { PageSkeleton } from "@/components/common/Skeletons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, CalendarHeart, ChefHat, Heart, MapPin, Share2, ShieldCheck, Sparkles, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { PageLoader } from "@/components/layout/AppShell";
import SEO from "@/components/common/SEO";
import { ChefReviews } from "@/components/reviews/ChefReviews";
import { RatingPill } from "@/components/reviews/Stars";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuCard } from "@/components/menu/MenuCard";
import { VerifiedCredentials } from "@/components/credentials/VerifiedCredentials";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { shareLink } from "@/lib/share";
import { BRAND_NAME, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { FollowButton, PostCard, type Post } from "@/components/social/social";
import { MenuItem } from "@/types/menu";

const ChefProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { isAuthenticated } = useAuth();
    const [tab, setTab] = useState("dishes");

    const { data: chef, isLoading, isError } = useQuery<any>({
        queryKey: ["chef", id],
        queryFn: () => api.get(`/chefs/${id}`),
        retry: false,
    });
    const { data: dishes = [] } = useQuery<MenuItem[]>({
        queryKey: ["chef-dishes", id],
        queryFn: () => api.get(`/chefs/${id}/products`),
        enabled: !!chef,
    });
    // Party trays, platters and extras this chef offers for events (shown under Dishes).
    const { data: eventItems = [] } = useQuery<EventDish[]>({
        queryKey: ["event-menu", id],
        queryFn: () => api.get(`/events/menu?chef=${id}`),
        enabled: !!chef?.isAvailableForEvents,
    });
    const eventOnly = eventItems.filter((d) => d.eventOnly);

    const favourite = useMutation({
        mutationFn: (on: boolean) => (on ? api.put(`/chefs/${id}/favourite`, {}) : api.delete(`/chefs/${id}/favourite`)),
        onSuccess: (_data, on) => {
            toast.success(on ? "Saved to your chefs" : "Removed from your chefs");
            qc.invalidateQueries({ queryKey: ["chef", id] });
            qc.invalidateQueries({ queryKey: ["favourite-chefs"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading) return <Layout><PageSkeleton /></Layout>;

    if (isError || !chef) {
        return (
            <Layout>
                <SEO title="Chef not found" noindex />
                <div className="container px-4 py-20 text-center">
                    <h1 className="mb-3 text-2xl font-bold">We couldn't find this chef</h1>
                    <Button asChild className="h-11"><Link to="/chefs">See all chefs</Link></Button>
                </div>
            </Layout>
        );
    }

    const firstName = chef.displayName.split(" ")[0];
    const description = chef.bio?.slice(0, 155) || `Plan your meals with ${chef.displayName}, order their dishes or book them for your event on ${BRAND_NAME}.`;
    const pageUrl = `${SITE_URL}/chefs/${chef.id}`;

    return (
        <Layout fullBleed>
            <SEO
                title={`${chef.displayName}${chef.specialty ? `, ${chef.specialty}` : ""}`}
                description={description}
                image={chef.coverImage || chef.avatar || undefined}
                type="profile"
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Person",
                        name: chef.displayName,
                        jobTitle: chef.specialty || "Chef",
                        description: chef.bio || undefined,
                        image: chef.avatar || undefined,
                        url: pageUrl,
                        homeLocation: chef.location ? { "@type": "Place", name: chef.location } : undefined,
                        worksFor: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Chefs", item: `${SITE_URL}/chefs` },
                            { "@type": "ListItem", position: 2, name: chef.displayName, item: pageUrl },
                        ],
                    },
                ]}
            />

            {/* HERO */}
            <section className="relative overflow-hidden bg-ink pb-8 pt-24 text-ink-foreground md:pb-12 md:pt-32">
                {chef.coverImage ? (
                    <img src={chef.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
                ) : (
                    <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-[100px]" />
                )}
                <div className="container relative max-w-5xl px-4">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-foreground/10 ring-4 ring-ink-foreground/15 md:h-32 md:w-32">
                            {chef.avatar ? <img src={chef.avatar} alt={chef.displayName} className="h-full w-full object-cover" /> : <ChefHat className="h-11 w-11 text-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="break-words font-display text-3xl font-extrabold md:text-5xl">{chef.displayName}</h1>
                            {chef.specialty && <p className="mt-1 text-lg text-ink-foreground/75">{chef.specialty}</p>}
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                <button type="button" onClick={() => setTab("reviews")} className="min-h-8"><RatingPill rating={chef.rating} count={chef.reviewCount} className="text-ink-foreground [&>span]:text-ink-foreground/70" /></button>
                                {chef.location && <span className="inline-flex items-center gap-1 text-ink-foreground/75"><MapPin className="h-4 w-4" />{chef.location}</span>}
                                {chef.paused ? <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200">Not taking orders right now</span>
                                    : chef.openNow ? <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">Cooking now</span>
                                    : chef.nextOpen ? <span className="rounded-full bg-ink-foreground/10 px-2.5 py-0.5 text-xs font-semibold">{nextOpenLabel(chef.nextOpen)}</span> : null}
                            </div>
                            <BestReview chefId={chef.id} firstName={firstName} />
                        </div>
                        <div className="flex flex-wrap gap-2 sm:self-start">
                            <FollowButton chefId={chef.id} chefName={chef.displayName} size="default" className="h-11" />
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label={chef.favourite ? `Remove ${chef.displayName} from your chefs` : `Save ${chef.displayName}`}
                                aria-pressed={!!chef.favourite}
                                className="h-11 w-11 border-ink-foreground/30 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
                                disabled={favourite.isPending}
                                onClick={() => (isAuthenticated ? favourite.mutate(!chef.favourite) : navigate(`/login?redirect=${encodeURIComponent(`/chefs/${chef.id}`)}`))}
                            >
                                <Heart className={cn("h-4 w-4", chef.favourite && "fill-primary text-primary")} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label={`Share ${chef.displayName}`}
                                className="h-11 w-11 border-ink-foreground/30 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
                                onClick={async () => {
                                    const result = await shareLink(chef.displayName, description, pageUrl);
                                    if (result === "copied") toast.success("Link copied");
                                }}
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Trust facts, all from real records */}
                    <ul className="mt-6 flex flex-wrap gap-2 text-sm">
                        <li className="inline-flex items-center gap-1.5 rounded-full bg-ink-foreground/10 px-3 py-1.5"><BadgeCheck className="h-4 w-4 text-primary" />Reviewed by {BRAND_NAME}</li>
                        {chef.hygieneRating !== null && chef.hygieneRating !== undefined && <li className="inline-flex items-center gap-1.5 rounded-full bg-ink-foreground/10 px-3 py-1.5"><ShieldCheck className="h-4 w-4 text-primary" />Food hygiene rating {chef.hygieneRating}/5</li>}
                        {chef.hygieneVerified && <li className="inline-flex items-center gap-1.5 rounded-full bg-ink-foreground/10 px-3 py-1.5"><ShieldCheck className="h-4 w-4 text-primary" />Food hygiene certificate verified</li>}
                        {chef.yearsExperience ? <li className="rounded-full bg-ink-foreground/10 px-3 py-1.5">{chef.yearsExperience} years' experience</li> : null}
                        {chef.planHouseholds > 0 && <li className="inline-flex items-center gap-1.5 rounded-full bg-ink-foreground/10 px-3 py-1.5"><Users className="h-4 w-4 text-primary" />Cooking for {chef.planHouseholds} {chef.planHouseholds === 1 ? "household" : "households"}</li>}
                    </ul>
                </div>
            </section>

            <div className="container max-w-5xl px-4 py-6 md:py-10">
                {/* WAYS TO WORK WITH THIS CHEF */}
                <div className="grid gap-3 md:grid-cols-2">
                    {chef.acceptsMealPlans && (
                        <Link to={`/meal-plans/new?chef=${chef.id}`} className="group flex items-center gap-4 rounded-3xl bg-primary p-5 text-primary-foreground transition-transform hover:-translate-y-0.5">
                            <CalendarDays className="h-9 w-9 shrink-0" />
                            <span className="min-w-0">
                                <span className="block font-display text-lg font-extrabold">Plan your meals with {firstName}</span>
                                <span className="block text-sm text-primary-foreground/85">1 week to 6 months of food you choose</span>
                            </span>
                        </Link>
                    )}
                    {chef.isAvailableForEvents && (
                        <Link to={`/events?chef=${chef.id}`} className="flex items-center gap-4 rounded-3xl border bg-card p-5 transition-transform hover:-translate-y-0.5">
                            <CalendarHeart className="h-9 w-9 shrink-0 text-primary" />
                            <span className="min-w-0">
                                <span className="block font-display text-lg font-extrabold">Book {firstName} for an event</span>
                                <span className="block text-sm text-muted-foreground">{chef.eventRate ? `Chef rate from £${chef.eventRate}` : "Tell us about your event"}</span>
                            </span>
                        </Link>
                    )}
                </div>

                {/* WHERE THE FOOD IS MADE */}
                {chef.kitchenVideo && (
                    <section aria-labelledby="kitchen-heading" className="mt-8 grid items-center gap-5 rounded-[2rem] bg-ink p-5 text-ink-foreground md:grid-cols-[1.4fr_1fr] md:p-7">
                        <video src={chef.kitchenVideo} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-black object-contain" aria-label={`A tour of ${chef.displayName}'s kitchen`} />
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1.5 text-sm font-semibold"><Video className="h-4 w-4 text-primary" />Inside my kitchen</p>
                            <h2 id="kitchen-heading" className="mt-3 font-display text-2xl font-extrabold md:text-3xl">See where {firstName} cooks your food</h2>
                            <p className="mt-2 text-ink-foreground/70">A short tour of the kitchen your meals are made in, filmed by {firstName}.</p>
                        </div>
                    </section>
                )}

                <ChefVideosSection chefId={chef.id} firstName={firstName} />

                <VerifiedCredentials credentials={chef.credentials ?? []} firstName={firstName} />
                <ChefGallery dishes={dishes} firstName={firstName} />

                <Tabs value={tab} onValueChange={setTab} className="mt-8">
                    <TabsList className="grid h-11 w-full grid-cols-3 sm:inline-grid sm:w-auto">
                        <TabsTrigger value="dishes" className="h-9 px-4">Dishes</TabsTrigger>
                        <TabsTrigger value="reviews" className="h-9 px-4">Reviews{chef.reviewCount ? ` (${chef.reviewCount})` : ""}</TabsTrigger>
                        <TabsTrigger value="about" className="h-9 px-4">About</TabsTrigger>
                    </TabsList>
                    <TabsContent value="dishes" className="mt-5">
                        {eventOnly.length > 0 && (
                            <section className="mb-8 rounded-3xl border bg-secondary/40 p-5">
                                <div className="flex flex-wrap items-end justify-between gap-3">
                                    <div>
                                        <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold"><CalendarHeart className="h-6 w-6 text-primary" />Event menu</h2>
                                        <p className="text-sm text-muted-foreground">For parties, weddings and big days. Prices are a guide; {chef.displayName.split(" ")[0]} sends a quote for your event.</p>
                                    </div>
                                    <Button asChild className="rounded-full"><Link to={`/events?chef=${chef.id}`}>Get a quote</Link></Button>
                                </div>
                                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {eventOnly.map((d) => (
                                        <li key={d.id} className="flex gap-3 rounded-2xl bg-card p-3">
                                            <img src={d.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                                            <div className="min-w-0">
                                                <p className="break-words font-semibold leading-tight">{d.name}</p>
                                                <p className="text-xs text-muted-foreground">{categoryLabel(d.category)}</p>
                                                <p className="mt-1 text-sm font-bold">£{d.price.toFixed(2)} <span className="font-normal text-muted-foreground">{unitNote(d)}</span></p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {dishes.length > 0 && eventOnly.length > 0 && <h2 className="mb-4 font-display text-2xl font-extrabold">Everyday menu</h2>}
                        {dishes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {dishes.map((dish) => <MenuCard key={dish.id} item={{ ...dish, modifiers: dish.modifiers ?? [], chef: { id: chef.id, displayName: chef.displayName, avatar: chef.avatar } }} />)}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed p-8 text-center">
                                <p className="text-muted-foreground">No dishes listed right now.</p>
                                <Button asChild variant="link" className="mt-1"><Link to="/recommend"><Sparkles className="mr-1 h-4 w-4" />Find something else you'll love</Link></Button>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="reviews" className="mt-5">
                        <ChefReviews chefId={chef.id} chefName={chef.displayName} />
                    </TabsContent>
                    <TabsContent value="about" className="mt-5">
                        <div className="max-w-2xl space-y-3">
                            {chef.bio ? <p className="whitespace-pre-line text-lg">{chef.bio}</p> : !chef.story && <p className="text-muted-foreground">{firstName} hasn't added a bio yet.</p>}
                            {chef.story && (
                                <div className="pt-2">
                                    <h3 className="mb-2 font-display text-xl font-bold">My story</h3>
                                    <p className="whitespace-pre-line text-muted-foreground">{chef.story}</p>
                                </div>
                            )}
                            {chef.location && <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />Based in {chef.location}, delivers up to {chef.serviceRadiusMiles} miles{chef.acceptsFarOrders ? `, and ${chef.farMaxMiles ? `up to ${chef.farMaxMiles} miles` : "further"} if you can wait about ${waitLabel(chef.farExtraHours)} longer` : ""}</p>}
                            {chef.hygieneRating !== null && chef.hygieneRating !== undefined && <p className="text-sm text-muted-foreground">Food hygiene rating checked by {BRAND_NAME}. Ratings run from 0 to 5.</p>}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default ChefProfile;

/** The chef's latest videos (one a week, from YouTube). Hidden when they haven't shared any. */
function ChefVideosSection({ chefId, firstName }: { chefId: number; firstName: string }) {
    const { data } = useQuery<{ posts: Post[] }>({ queryKey: ["posts", "chef", chefId], queryFn: () => api.get(`/posts?chefId=${chefId}`) });
    const posts = data?.posts.slice(0, 4) ?? [];
    if (!posts.length) return null;
    return (
        <section aria-labelledby="videos-heading" className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                    <h2 id="videos-heading" className="font-display text-2xl font-extrabold md:text-3xl">What {firstName}'s cooking</h2>
                    <p className="text-muted-foreground">A short video every week. Follow to hear when there's a new one.</p>
                </div>
                <Link to="/videos" className="shrink-0 text-sm font-semibold text-primary hover:underline">All chef videos</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                {posts.map((p) => <PostCard key={p.id} post={p} showChef={false} />)}
            </div>
        </section>
    );
}
