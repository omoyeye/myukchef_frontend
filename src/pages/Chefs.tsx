import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, ChefHat, Loader2, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/common/SEO";
import { LocationPicker } from "@/components/location/LocationPicker";
import { GoogleMap, hasGoogleMaps, MapMarker } from "@/components/location/GoogleMap";
import { RatingPill } from "@/components/reviews/Stars";
import { chefsPath, formatMiles, useUserLocation } from "@/lib/location";
import { cn } from "@/lib/utils";

const SORTS = [
    { id: "recommended", label: "Nearest" },
    { id: "rating", label: "Top rated" },
    { id: "reviews", label: "Most reviewed" },
];

const Chefs = () => {
    const { location } = useUserLocation();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("recommended");
    const [plansOnly, setPlansOnly] = useState(false);
    const [eventsOnly, setEventsOnly] = useState(false);

    const { data: chefs = [], isLoading } = useQuery<any[]>({
        queryKey: ["public-chefs", location?.lat, location?.lng],
        queryFn: () => api.get(chefsPath(location)),
    });

    const shown = useMemo(() => {
        const term = search.trim().toLowerCase();
        const list = chefs.filter((c) =>
            (!term || `${c.displayName} ${c.specialty ?? ""} ${c.location ?? ""} ${c.bio ?? ""}`.toLowerCase().includes(term)) &&
            (!plansOnly || c.acceptsMealPlans) &&
            (!eventsOnly || c.isAvailableForEvents));
        if (sort === "rating") return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount);
        if (sort === "reviews") return [...list].sort((a, b) => b.reviewCount - a.reviewCount || (b.rating ?? 0) - (a.rating ?? 0));
        return list;
    }, [chefs, search, sort, plansOnly, eventsOnly]);

    const filterClass = (on: boolean) => cn("min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary");

    return (
        <Layout>
            <SEO title="Our Chefs" description="Meet independent local chefs across the UK. Compare ratings, see their dishes, plan your meals with them or book one for your next event." />
            <div className="container px-4 pb-10">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div className="max-w-2xl">
                        <h1 className="font-display text-3xl font-extrabold md:text-5xl">Find your chef</h1>
                        <p className="mt-2 text-muted-foreground md:text-lg">Independent local chefs, all reviewed by our team and rated only by customers they've cooked for.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild className="h-11 rounded-full"><Link to="/recommend"><Sparkles className="mr-2 h-4 w-4" />Find a chef for me</Link></Button>
                        <Button asChild className="h-11 rounded-full" variant="outline"><Link to="/chef/register">Become a chef</Link></Button>
                    </div>
                </div>

                <div className="mb-4 max-w-2xl"><LocationPicker heading="Find chefs near you" /></div>

                <div className="mb-5 space-y-3">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input aria-label="Search chefs" className="h-11 rounded-full pl-9" placeholder="Search by name, cuisine or area" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
                        <button type="button" aria-pressed={plansOnly} className={filterClass(plansOnly)} onClick={() => setPlansOnly(!plansOnly)}>Takes meal plans</button>
                        <button type="button" aria-pressed={eventsOnly} className={filterClass(eventsOnly)} onClick={() => setEventsOnly(!eventsOnly)}>Available for events</button>
                        <span className="my-2 w-px shrink-0 bg-border" aria-hidden />
                        {SORTS.map((s) => (
                            <button key={s.id} type="button" aria-pressed={sort === s.id} className={filterClass(sort === s.id)} onClick={() => setSort(s.id)}>{s.label}</button>
                        ))}
                    </div>
                </div>

                {hasGoogleMaps && chefs.some((c) => c.approxLat !== null) && (
                    <div className="mb-6">
                        <GoogleMap
                            markers={[
                                ...chefs.filter((c) => c.approxLat !== null).map((c): MapMarker => ({ lat: c.approxLat, lng: c.approxLng, title: c.displayName, kind: "chef", onClick: () => navigate(`/chefs/${c.id}`) })),
                                ...(location ? [{ lat: location.lat, lng: location.lng, title: "You", kind: "you" } as MapMarker] : []),
                            ]}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Chef positions are approximate to protect their privacy.</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : chefs.length === 0 ? (
                    <p className="py-20 text-center text-muted-foreground">No chefs yet. Check back soon!</p>
                ) : shown.length === 0 ? (
                    <div className="rounded-3xl border border-dashed p-10 text-center">
                        <p className="font-bold">No chefs match your search</p>
                        <Button variant="link" onClick={() => { setSearch(""); setPlansOnly(false); setEventsOnly(false); }}>Clear filters</Button>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {shown.map((c) => {
                            const outside = location && c.distanceMiles != null && !c.inServiceArea;
                            return (
                                <li key={c.id} className="group flex flex-col overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-warm-lg">
                                    <Link to={`/chefs/${c.id}`} className="relative block aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5" tabIndex={-1} aria-hidden>
                                        {c.coverImage || c.avatar
                                            ? <img src={c.coverImage || c.avatar} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            : <span className="flex h-full w-full items-center justify-center"><ChefHat className="h-16 w-16 text-primary/30" /></span>}
                                        {c.distanceMiles != null && <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold", outside ? "bg-background/90" : "bg-primary text-primary-foreground")}>{formatMiles(c.distanceMiles)}</span>}
                                    </Link>
                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="flex items-start justify-between gap-2">
                                            <h2 className="min-w-0 break-words font-display text-xl font-bold"><Link to={`/chefs/${c.id}`} className="hover:text-primary">{c.displayName}</Link></h2>
                                            <RatingPill rating={c.rating} count={c.reviewCount} className="shrink-0" />
                                        </div>
                                        {c.specialty && <p className="text-sm text-muted-foreground">{c.specialty}</p>}
                                        {c.bio && <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{c.bio}</p>}
                                        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                                            {c.location && <li className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</li>}
                                            <li className="inline-flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-primary" />Reviewed</li>
                                            {c.hygieneRating !== null && c.hygieneRating !== undefined && <li className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Hygiene {c.hygieneRating}/5</li>}
                                        </ul>
                                        {outside && <p className="mt-2 text-xs text-muted-foreground">Outside their usual delivery area</p>}
                                        <div className="mt-4 flex gap-2">
                                            <Button asChild variant="outline" className="h-11 flex-1 px-2"><Link to={`/chefs/${c.id}`}>View profile</Link></Button>
                                            {c.acceptsMealPlans && !outside ? (
                                                <Button asChild className="h-11 flex-1 px-2"><Link to={`/meal-plans/new?chef=${c.id}`}><CalendarDays className="mr-1.5 h-4 w-4" />Plan meals</Link></Button>
                                            ) : c.isAvailableForEvents ? (
                                                <Button asChild className="h-11 flex-1 px-2"><Link to={`/events?chef=${c.id}`}>Book for event</Link></Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Layout>
    );
};

export default Chefs;
