import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Camera, Check, ChefHat, Loader2, MapPin, PackageCheck, Truck, UtensilsCrossed, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CourierShare } from "@/pages/admin/CourierShare";
import { allergenSummary } from "@/lib/allergens";
import { api, uploadImage } from "@/lib/api";
import { money } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";
import { useChefOrders } from "./ChefPortalSections";

/** Each chef's own part of an order, from new to handed over. */
const STAGE_LABEL: Record<string, { label: string; className: string }> = {
    received: { label: "New", className: "bg-amber-100 text-amber-900" },
    pending: { label: "New", className: "bg-amber-100 text-amber-900" },
    preparing: { label: "Cooking", className: "bg-orange-100 text-orange-900" },
    delivery: { label: "On its way", className: "bg-sky-100 text-sky-900" },
    completed: { label: "Delivered", className: "bg-emerald-100 text-emerald-900" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

const NEXT: Record<string, { status: string; label: string; pickupLabel?: string; icon: typeof ChefHat }> = {
    received: { status: "preparing", label: "Start cooking", icon: ChefHat },
    preparing: { status: "delivery", label: "Out for delivery", pickupLabel: "Ready to collect", icon: Truck },
    delivery: { status: "completed", label: "Mark delivered", pickupLabel: "Mark collected", icon: PackageCheck },
};

const STEPS = ["received", "preparing", "delivery", "completed"];

interface ChefOrder {
    id: number;
    status: string;
    myStatus: string;
    createdAt: string;
    area: string | null;
    method: "delivery" | "pickup";
    customerName: string | null;
    deliveryAddress: { line1?: string; city?: string; postcode?: string; notes?: string } | null;
    otherChefs: number;
    items: { name: string; quantity: number; price: number; notes: string | null; allergens: string[] }[];
    payoutAmount: number | null;
    payoutStatus: string | null;
    customerConfirmedAt: string | null;
    customerIssue: string | null;
}

/** Orders with this chef's dishes. The chef moves each one on, and the customer is told every time. */
export const ChefOrders = ({ enabled }: { enabled: boolean }) => {
    const qc = useQueryClient();
    const { data = [], isLoading } = useChefOrders(enabled);
    const orders = data as ChefOrder[];
    const [delivering, setDelivering] = useState<ChefOrder | null>(null);
    const [proof, setProof] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const move = useMutation({
        mutationFn: ({ id, status, proof }: { id: number; status: string; proof?: string }) => api.patch(`/chef-portal/orders/${id}/status`, { status, proof }),
        onSuccess: (_d, v) => {
            toast.success(v.status === "completed" ? "Delivered. We've asked the customer to confirm, and told our team so you can be paid." : "Updated. The customer has been told.");
            setDelivering(null);
            setProof(null);
            qc.invalidateQueries({ queryKey: ["chef-orders"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading) return <Skeleton className="h-32 w-full rounded-3xl" />;
    if (orders.length === 0) {
        return <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground"><UtensilsCrossed className="mx-auto mb-2 h-8 w-8 text-primary" />No orders for your dishes yet.</p>;
    }

    const open = orders.filter((o) => !["completed", "cancelled"].includes(o.myStatus));
    const done = orders.filter((o) => ["completed", "cancelled"].includes(o.myStatus));

    const card = (order: ChefOrder) => {
        const stage = STAGE_LABEL[order.myStatus] ?? STAGE_LABEL.received;
        const next = NEXT[order.myStatus];
        const pickup = order.method === "pickup";
        const at = STEPS.indexOf(order.myStatus);
        return (
            <li key={order.id} className={cn("space-y-3 rounded-3xl border bg-card p-4", order.myStatus === "received" && "border-2 border-primary")}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-bold">Order #{order.id}{order.customerName ? ` for ${order.customerName}` : ""}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "d MMM, HH:mm")} · {pickup ? "Customer collects" : `${order.area ?? "Delivery"} area`}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", stage.className)}>{stage.label}</span>
                </div>

                {order.myStatus !== "cancelled" && (
                    <ol className="flex gap-1" aria-label="Progress">
                        {STEPS.map((s, i) => <li key={s} className={cn("h-1.5 flex-1 rounded-full", i <= at ? "bg-primary" : "bg-muted")} />)}
                    </ol>
                )}

                <ul className="space-y-1 border-t pt-3 text-sm">
                    {order.items.map((item, i) => (
                        <li key={i}>
                            <span className="flex justify-between gap-3"><span className="min-w-0 break-words">{item.quantity} × {item.name}</span><span className="shrink-0 font-semibold">{money(item.price * item.quantity)}</span></span>
                            <span className="block text-xs text-muted-foreground">{allergenSummary(item.allergens)}</span>
                            {item.notes && <span className="mt-1 block rounded-lg bg-secondary/70 px-2 py-1 text-xs">{item.notes}</span>}
                        </li>
                    ))}
                </ul>

                {order.deliveryAddress && (
                    <p className="flex items-start gap-2 rounded-xl bg-secondary/60 p-2.5 text-sm">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{[order.deliveryAddress.line1, order.deliveryAddress.city, order.deliveryAddress.postcode].filter(Boolean).join(", ")}{order.deliveryAddress.notes ? <span className="block text-muted-foreground">{order.deliveryAddress.notes}</span> : null}</span>
                    </p>
                )}
                {order.otherChefs > 0 && <p className="text-xs text-muted-foreground">This order also has dishes from {order.otherChefs} other chef{order.otherChefs === 1 ? "" : "s"}. You only move your part.</p>}

                {next && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="h-11"
                            disabled={move.isPending}
                            onClick={() => (next.status === "completed" ? setDelivering(order) : move.mutate({ id: order.id, status: next.status }))}
                        >
                            <next.icon className="mr-2 h-4 w-4" />{pickup && next.pickupLabel ? next.pickupLabel : next.label}
                        </Button>
                    </div>
                )}
                {order.myStatus === "delivery" && !pickup && <CourierShare orderId={order.id} />}

                {order.myStatus === "completed" && (
                    <div className="space-y-1.5 rounded-xl bg-secondary/60 p-3 text-sm">
                        <p className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{money(order.payoutAmount ?? 0)} for you: <span className="font-bold">{order.payoutStatus === "paid" ? "paid" : "waiting for our team to check and pay"}</span></p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                            <BadgeCheck className="h-4 w-4" />
                            {order.customerConfirmedAt ? "The customer confirmed they received it." : order.customerIssue ? "The customer reported a problem. Our team will be in touch." : "Waiting for the customer to confirm."}
                        </p>
                    </div>
                )}
            </li>
        );
    };

    const upload = async (file?: File) => {
        if (!file) return;
        setUploading(true);
        try {
            setProof(await uploadImage(file));
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Move each order on as you go. The customer gets an email, a push notification and an in-app message every time.</p>
            {open.length > 0 && <ul className="grid gap-3 md:grid-cols-2">{open.map(card)}</ul>}
            {done.length > 0 && (
                <section>
                    <h3 className="mb-3 font-display text-lg font-bold">Finished</h3>
                    <ul className="grid gap-3 md:grid-cols-2">{done.map(card)}</ul>
                </section>
            )}

            <Dialog open={!!delivering} onOpenChange={(o) => { if (!o) { setDelivering(null); setProof(null); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{delivering?.method === "pickup" ? "Collected" : "Delivered"}: order #{delivering?.id}</DialogTitle>
                        <DialogDescription>Add a photo of the food being handed over or left at the door. Our team checks it before paying you, and we'll ask the customer to confirm.</DialogDescription>
                    </DialogHeader>
                    <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed p-3 text-sm text-muted-foreground hover:border-primary">
                        {proof ? <img src={proof} alt="Delivery evidence" className="max-h-56 rounded-xl object-contain" /> : uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Camera className="h-7 w-7 text-primary" />Take or choose a photo</>}
                        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
                    </label>
                    <DialogFooter>
                        <Button className="h-11" disabled={!proof || move.isPending} onClick={() => delivering && proof && move.mutate({ id: delivering.id, status: "completed", proof })}>
                            <Check className="mr-2 h-4 w-4" />{move.isPending ? "Saving..." : "Confirm delivery"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
