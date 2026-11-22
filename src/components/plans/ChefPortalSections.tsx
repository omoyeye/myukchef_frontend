import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CalendarHeart, ClipboardList, Flame, Inbox, Send, ShoppingBag, Star, UtensilsCrossed } from "lucide-react";
import { ActionTile, rise } from "@/components/portal/PortalBits";
import { useChefQuotes } from "./ChefQuotes";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { money, planDate, PlanSummary } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";
import { allergenSummary } from "@/lib/allergens";

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
    received: { label: "New", className: "bg-amber-100 text-amber-900" },
    pending: { label: "New", className: "bg-amber-100 text-amber-900" },
    preparing: { label: "Being cooked", className: "bg-amber-100 text-amber-900" },
    delivery: { label: "On its way", className: "bg-sky-100 text-sky-900" },
    completed: { label: "Delivered", className: "bg-emerald-100 text-emerald-900" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};
const Pill = ({ status }: { status?: { label: string; className: string } }) => <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", status?.className)}>{status?.label}</span>;

export const useChefOrders = (enabled: boolean) => useQuery<any[]>({ queryKey: ["chef-orders"], queryFn: () => api.get("/chef-portal/orders"), enabled });

/** What needs the chef's attention today, with real counts only. */
export const ChefOverview = ({ enabled }: { enabled: boolean }) => {
    const { data: plans = [] } = useQuery<PlanSummary[]>({ queryKey: ["chef-plans"], queryFn: () => api.get("/meal-plans/chef"), enabled });
    const { data: sheet = [] } = useQuery<any[]>({ queryKey: ["chef-cook-sheet"], queryFn: () => api.get("/meal-plans/chef/cook-sheet"), enabled });
    const { data: reviews = [] } = useQuery<any[]>({ queryKey: ["chef-received-reviews"], queryFn: () => api.get("/chef-reviews/received"), enabled });
    const { data: orders = [] } = useChefOrders(enabled);
    const { data: quoteData } = useChefQuotes(enabled);

    const requests = plans.filter((p) => p.status === "requested").length;
    const activePlans = plans.filter((p) => p.status === "active").length;
    const openOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.myStatus ?? o.status)).length;
    const eventQuotes = quoteData?.quotes ?? [];
    const quotesNeeded = eventQuotes.filter((q) => q.status === "requested" && ["quoting", "pending", "quotes_ready"].includes(q.event.status)).length;
    const upcomingEvents = eventQuotes.filter((q) => q.status === "accepted" && ["awaiting_payment", "confirmed", "in_progress"].includes(q.event.status)).length;
    const average = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "New";
    const next = sheet[0];

    const tiles = [
        { label: "Plan requests", value: requests, icon: Inbox, to: "?tab=plans", highlight: requests > 0, tint: "bg-primary/15 text-primary" },
        { label: "Open orders", value: openOrders, icon: ShoppingBag, to: "?tab=orders", highlight: openOrders > 0, tint: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
        { label: "Event quotes to send", value: quotesNeeded, icon: Send, to: "?tab=bookings", highlight: quotesNeeded > 0, tint: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
        { label: "Upcoming events", value: upcomingEvents, icon: CalendarHeart, to: "?tab=bookings", tint: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
        { label: "Active plans", value: activePlans, icon: CalendarDays, to: "?tab=plans", tint: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
        { label: reviews.length ? `Your rating (${reviews.length})` : "Your rating", value: average, icon: Star, to: "?tab=reviews", tint: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    ];

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {tiles.map((tile, i) => (
                    <ActionTile key={tile.label} to={tile.to} icon={tile.icon} label={tile.label} value={typeof tile.value === "number" ? tile.value : tile.value} tint={tile.tint} alert={tile.highlight} delay={80 + i * 60} />
                ))}
            </div>
            <Link to="?tab=plans" className="portal-lift hero-rise relative block overflow-hidden rounded-3xl bg-ink p-5 text-ink-foreground md:p-6" style={rise(460)}>
                <div aria-hidden className="hero-glow pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-primary/35 blur-3xl" />
                <div aria-hidden className="portal-sheen" />
                <div className="relative">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary"><Flame className="h-4 w-4 text-white" /></span>Next to cook</h2>
                {next ? (
                    <>
                        <p className="mt-2 font-display text-2xl font-extrabold">{planDate(next.deliveryDate, "EEEE d MMMM")}</p>
                        <p className="mt-1 text-ink-foreground/75">{next.customerName}: {next.items.map((i: any) => `${i.meals} × ${i.name}`).join(", ")}</p>
                    </>
                ) : (
                    <p className="mt-2 text-ink-foreground/70">Nothing in the next two weeks yet.</p>
                )}
                <span className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-primary">Open your cook sheet <ArrowRight className="h-4 w-4" /></span>
                </div>
            </Link>
        </div>
    );
};

