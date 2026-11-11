import { useRef, useState } from "react";
import { ALLERGENS } from "@/lib/allergens";
import { useMenuPrices } from "@/lib/prices";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CalendarHeart, ChefHat, Loader2, Plus, Sparkles, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import SEO from "@/components/common/SEO";
import { LocationPicker } from "@/components/location/LocationPicker";
import { formatMiles, useUserLocation } from "@/lib/location";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MenuItem } from "@/types/menu";

const DIETARY_OPTIONS = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "gluten_free", label: "Gluten free" },
    { id: "halal", label: "Halal" },
];
const OCCASIONS = [
    { id: "weeknight", label: "Weeknight meal", isEvent: false },
    { id: "date_night", label: "Date night", isEvent: false },
    { id: "family", label: "Family dinner", isEvent: false },
    { id: "celebration", label: "Celebration", isEvent: true },
    { id: "corporate", label: "Corporate event", isEvent: true },
    { id: "wedding", label: "Wedding", isEvent: true },
    { id: "private_dinner", label: "Private dinner", isEvent: true },
];
const BUDGET_PRESETS = [10, 15, 25, 50];

interface RecommendedDish extends MenuItem {
    reason: string;
    chef: { id: number; displayName: string } | null;
}
interface RecommendedChef {
    id: number;
    displayName: string;
    specialty: string | null;
    avatar: string | null;
    location: string | null;
    eventRate: number | null;
    isAvailableForEvents: boolean;
    distanceMiles: number | null;
    reason: string;
}
interface RecommendationResult {
    source: "ai" | "fallback" | "none";
    summary: string;
    dishes: RecommendedDish[];
    chefs: RecommendedChef[];
}

const Chip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={cn(
            "min-h-11 rounded-full border px-4 text-sm font-medium capitalize transition-colors",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"
        )}
    >
        {children}
    </button>
);

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

const Recommend = () => {
    const { addItem } = useCart();
    const { location } = useUserLocation();
    const resultsRef = useRef<HTMLDivElement>(null);

    const [dietary, setDietary] = useState<string[]>([]);
    const [avoidAllergens, setAvoidAllergens] = useState<string[]>([]);
    const [budget, setBudget] = useState("15");
    const [params] = useSearchParams();
    const [occasion, setOccasion] = useState(() => (OCCASIONS.some((o) => o.id === params.get("occasion")) ? params.get("occasion")! : "weeknight"));
    const [headcount, setHeadcount] = useState(params.get("guests") ?? "");
    const [notes, setNotes] = useState("");
    const [aiConsent, setAiConsent] = useState(false);
    const { withFee } = useMenuPrices();

    const isEvent = OCCASIONS.find((o) => o.id === occasion)?.isEvent ?? false;
    const budgetValue = Number(budget);

    const recommend = useMutation<RecommendationResult>({
        mutationFn: () =>
            api.post("/recommendations", {
                dietary,
                avoidAllergens,
                budgetPerPerson: budgetValue,
                occasion,
                headcount: isEvent && headcount ? Number(headcount) : undefined,
                notes: notes.trim() || undefined,
                aiConsent,
                latitude: location?.lat,
                longitude: location?.lng,
            }),
        onSuccess: () => {
            requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        },
        onError: (e) => toast.error(e.message),
    });

    const result = recommend.data;

    return (
        <Layout>
            <SEO title="Find Your Perfect Meal" description="Tell us your dietary needs, budget and occasion, and get dishes and chefs picked for you." />
            <div className="container max-w-3xl px-4 py-6 md:py-10">
                <div className="mb-6 text-center">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold md:text-4xl">Find your perfect meal</h1>
                    <p className="mt-2 text-muted-foreground">Tell us what you need and we'll suggest dishes and chefs.</p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        recommend.mutate();
                    }}
                    className="space-y-6"
                >
                    <Card>
                        <CardContent className="space-y-6 p-4 sm:p-6">
                            <LocationPicker heading="Where are you? (optional, finds nearby chefs)" />

                            <fieldset className="space-y-3">
                                <legend className="font-semibold">What's the occasion?</legend>
                                <div className="flex flex-wrap gap-2">
                                    {OCCASIONS.map((o) => (
                                        <Chip key={o.id} selected={occasion === o.id} onClick={() => setOccasion(o.id)}>{o.label}</Chip>
                                    ))}
                                </div>
                            </fieldset>

                            <fieldset className="space-y-3">
                                <legend className="font-semibold">Budget per person</legend>
                                <div className="flex flex-wrap items-center gap-2">
                                    {BUDGET_PRESETS.map((b) => (
                                        <Chip key={b} selected={budgetValue === b} onClick={() => setBudget(String(b))}>£{b}</Chip>
                                    ))}
                                    <div className="relative w-28">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                                        <Input
                                            aria-label="Custom budget per person in pounds"
                                            type="number"
                                            inputMode="decimal"
                                            min={1}
                                            max={1000}
                                            step="1"
                                            className="h-11 pl-7"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </fieldset>

                            {isEvent && (
                                <div className="space-y-2">
                                    <Label htmlFor="headcount" className="font-semibold">How many guests?</Label>
                                    <Input id="headcount" type="number" inputMode="numeric" min={1} max={5000} className="h-11 max-w-40" value={headcount} onChange={(e) => setHeadcount(e.target.value)} placeholder="e.g. 30" />
                                </div>
                            )}

                            <fieldset className="space-y-3">
                                <legend className="font-semibold">Dietary needs</legend>
                                <div className="flex flex-wrap gap-2">
                                    {DIETARY_OPTIONS.map((d) => (
                                        <Chip key={d.id} selected={dietary.includes(d.id)} onClick={() => setDietary(toggle(dietary, d.id))}>{d.label}</Chip>
                                    ))}
                                </div>
                            </fieldset>

                            <fieldset className="space-y-3">
                                <legend className="font-semibold">Allergens to avoid</legend>
                                <div className="flex flex-wrap gap-2">
                                    {ALLERGENS.map(({ id: a, short, label }) => (
                                        <Chip key={a} selected={avoidAllergens.includes(a)} onClick={() => setAvoidAllergens(toggle(avoidAllergens, a))}>{short ?? label}</Chip>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="font-semibold">Anything else? <span className="font-normal text-muted-foreground">(optional)</span></Label>
                                <Textarea id="notes" rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Love spicy food, kids joining, no pork..." />
                            </div>
                            <label htmlFor="ai-consent" className="flex items-start gap-3 rounded-2xl bg-secondary/70 p-3 text-sm">
                                <Checkbox id="ai-consent" className="mt-0.5" checked={aiConsent} onCheckedChange={(on) => setAiConsent(!!on)} />
                                <span><span className="font-semibold">Use AI to improve my suggestions.</span> This sends your answers above, including dietary and allergy needs, to our AI providers. Leave it unticked and we'll match you without AI.</span>
                            </label>

                            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={recommend.isPending || !(budgetValue > 0)}>
                                {recommend.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Finding your matches...</> : <><Sparkles className="mr-2 h-5 w-5" />Get recommendations</>}
                            </Button>
                        </CardContent>
                    </Card>
                </form>

                <div ref={resultsRef} aria-live="polite" className="scroll-mt-24">
                    {result && (
                        <div className="mt-8 space-y-6 animate-fade-in">
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                                    {result.source === "ai" ? "AI suggestion" : "Your matches"}
                                </p>
                                <p className="mt-1">{result.summary}</p>
                            </div>

                            {result.dishes.length > 0 && (
                                <section className="space-y-3">
                                    <h2 className="flex items-center gap-2 text-xl font-bold"><UtensilsCrossed className="h-5 w-5 text-primary" />Dishes for you</h2>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {result.dishes.map((dish) => (
                                            <Card key={dish.id} className="overflow-hidden">
                                                <div className="flex gap-3 p-3">
                                                    <Link to={`/menu/${dish.id}`} className="shrink-0">
                                                        <img src={dish.image} alt={dish.name} loading="lazy" className="h-24 w-24 rounded-lg object-cover" />
                                                    </Link>
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <Link to={`/menu/${dish.id}`} className="min-w-0 font-semibold leading-tight hover:text-primary">{dish.name}</Link>
                                                            <span className="font-bold text-primary">£{withFee(dish.price).toFixed(2)}</span>
                                                        </div>
                                                        {dish.chef && <p className="mt-0.5 text-xs text-muted-foreground">By {dish.chef.displayName}</p>}
                                                        <p className="mt-1 text-sm text-muted-foreground">{dish.reason}</p>
                                                    </div>
                                                </div>
                                                <div className="px-3 pb-3">
                                                    <Button
                                                        variant="outline"
                                                        className="h-11 w-full"
                                                        onClick={() => {
                                                            addItem(dish);
                                                            toast.success(`Added ${dish.name} to cart`);
                                                        }}
                                                    >
                                                        <Plus className="mr-1 h-4 w-4" />Add to order
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {result.chefs.length > 0 && (
                                <section className="space-y-3">
                                    <h2 className="flex items-center gap-2 text-xl font-bold"><ChefHat className="h-5 w-5 text-primary" />Chefs for you</h2>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {result.chefs.map((chef) => (
                                            <Card key={chef.id}>
                                                <CardContent className="space-y-3 p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                                            {chef.avatar ? <img src={chef.avatar} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-5 w-5 text-primary" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold">{chef.displayName}</p>
                                                            {chef.specialty && <p className="truncate text-sm text-muted-foreground">{chef.specialty}</p>}
                                                            {chef.distanceMiles != null && <p className="text-xs font-medium text-primary">{formatMiles(chef.distanceMiles)}</p>}
                                                        </div>
                                                        {chef.eventRate ? <span className="ml-auto whitespace-nowrap text-sm font-bold text-primary">from £{chef.eventRate}</span> : null}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{chef.reason}</p>
                                                    <div className="flex gap-2">
                                                        <Button asChild variant="outline" className="h-11 flex-1"><Link to={`/chefs/${chef.id}`}>View profile</Link></Button>
                                                        {chef.isAvailableForEvents && (
                                                            <Button asChild className="h-11 flex-1"><Link to={`/events?chef=${chef.id}`}><CalendarHeart className="mr-1 h-4 w-4" />Book</Link></Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {(dietary.length > 0 || avoidAllergens.length > 0 || notes.trim()) && result.source !== "none" && (
                                <p className="text-sm text-muted-foreground">
                                    Matches use the dietary and allergen details on each dish. If you have a severe allergy, please <Link to="/allergens" className="underline">check our allergen information</Link> and confirm with the kitchen before ordering.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Recommend;
