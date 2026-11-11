import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, Heart, Loader2 } from "lucide-react";
import SEO from "@/components/common/SEO";
import { CustomerPortal } from "@/components/layout/CustomerPortal";
import { RatingPill } from "@/components/reviews/Stars";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const SavedChefs = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate(`/login?redirect=${encodeURIComponent("/saved-chefs")}`, { replace: true });
    }, [authLoading, isAuthenticated, navigate]);

    const { data: chefs = [], isLoading } = useQuery<any[]>({ queryKey: ["favourite-chefs"], queryFn: () => api.get("/chefs/favourites"), enabled: isAuthenticated });

    return (
        <CustomerPortal>
            <SEO title="Saved Chefs" description="The chefs you've saved." noindex />
            <h1 className="mb-4 font-display text-3xl font-extrabold md:text-4xl">Saved chefs</h1>
            {isLoading || authLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : chefs.length === 0 ? (
                <div className="rounded-3xl border border-dashed p-10 text-center">
                    <Heart className="mx-auto mb-3 h-9 w-9 text-primary" />
                    <p className="font-bold">No saved chefs yet</p>
                    <p className="mb-4 text-sm text-muted-foreground">Tap the heart on a chef's page to keep them here.</p>
                    <Button asChild className="h-11 rounded-full"><Link to="/chefs">Find a chef</Link></Button>
                </div>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                    {chefs.map((c) => (
                        <li key={c.id} className="flex items-center gap-3 rounded-3xl border bg-card p-4">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                {c.avatar ? <img src={c.avatar} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-6 w-6 text-primary" />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <Link to={`/chefs/${c.id}`} className="block truncate font-bold hover:text-primary">{c.displayName}</Link>
                                <RatingPill rating={c.rating} count={c.reviewCount} />
                            </div>
                            {c.acceptsMealPlans && <Button asChild variant="outline" className="h-11 shrink-0 px-3"><Link to={`/meal-plans/new?chef=${c.id}`}>Plan</Link></Button>}
                        </li>
                    ))}
                </ul>
            )}
        </CustomerPortal>
    );
};

export default SavedChefs;
