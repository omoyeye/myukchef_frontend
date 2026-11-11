import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CalendarHeart, ClipboardList, Inbox, Send, ShoppingBag, Star, UtensilsCrossed } from "lucide-react";
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
        { label: "Plan requests", value: requests, icon: Inbox, to: "?tab=plans", highlight: requests > 0 },
        { label: "Active plans", value: activePlans, icon: CalendarDays, to: "?tab=plans" },
        { label: "Open orders", value: openOrders, icon: ShoppingBag, to: "?tab=orders", highlight: openOrders > 0 },
        { label: "Event quotes to send", value: quotesNeeded, icon: Send, to: "?tab=bookings", highlight: quotesNeeded > 0 },
        { label: "Upcoming events", value: upcomingEvents, icon: CalendarHeart, to: "?tab=bookings" },
        { label: "Your rating", value: average, icon: Star, to: "?tab=reviews" },
    ];

    return (
        <div className="space-y-5">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {tiles.map((tile) => (
                    <li key={tile.label}>
                        <Link to={tile.to} className={cn("block h-full rounded-2xl border bg-card p-4 transition-colors hover:border-primary", tile.highlight && "border-primary bg-primary/5")}>
                            <tile.icon className="h-5 w-5 text-primary" />
                            <p className="mt-2 font-display text-3xl font-extrabold">{tile.value}</p>
                            <p className="text-sm text-muted-foreground">{tile.label}</p>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="rounded-3xl bg-ink p-5 text-ink-foreground md:p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ClipboardList className="h-5 w-5 text-primary" />Next to cook</h2>
                {next ? (
                    <>
                        <p className="mt-2 font-display text-2xl font-extrabold">{planDate(next.deliveryDate, "EEEE d MMMM")}</p>
                        <p className="mt-1 text-ink-foreground/75">{next.customerName}: {next.items.map((i: any) => `${i.meals} × ${i.name}`).join(", ")}</p>
                    </>
                ) : (
                    <p className="mt-2 text-ink-foreground/70">Nothing in the next two weeks yet.</p>
                )}
                <Link to="?tab=plans" className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-primary">Open your cook sheet <ArrowRight className="h-4 w-4" /></Link>
            </div>
        </div>
    );
};

