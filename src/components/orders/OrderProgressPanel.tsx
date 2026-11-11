import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChefHat, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChefProgress {
    chefName: string;
    status: string;
    updatedAt: string;
    deliveredAt?: string | null;
    deliveryProof?: string | null;
    customerConfirmedAt?: string | null;
    customerIssue?: string | null;
    awaitingConfirmation?: boolean;
}

const STAGE: Record<string, { label: string; icon: typeof ChefHat }> = {
    received: { label: "Order received", icon: CheckCircle2 },
    preparing: { label: "Cooking", icon: ChefHat },
    delivery: { label: "On its way", icon: Truck },
    completed: { label: "Delivered", icon: PackageCheck },
};

/**
 * Each chef's progress on the order, the photo they took when they handed it over,
 * and the customer's chance to confirm it arrived.
 */
export const OrderProgressPanel = ({ orderId, progress, token, pickup, highlightConfirm }: {
    orderId: number;
    progress: ChefProgress[];
    token?: string | null;
    pickup?: boolean;
    highlightConfirm?: boolean;
}) => {
    const qc = useQueryClient();
    const [problem, setProblem] = useState(false);
    const [issue, setIssue] = useState("");
    const waiting = progress.filter((p) => p.awaitingConfirmation);

    const confirm = useMutation({
        mutationFn: (received: boolean) => api.post(`/orders/${orderId}/confirm-delivery`, { received, issue: received ? undefined : issue, t: token ?? undefined }),
        onSuccess: (_d, received) => {
            toast.success(received ? "Thanks for confirming. Enjoy your meal!" : "Thanks for telling us. Our team will be in touch.");
            setProblem(false);
            qc.invalidateQueries({ queryKey: ["order-tracking"] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    if (progress.length === 0) return null;
    return (
        <div className="mb-6 space-y-4">
            {waiting.length > 0 && (
                <Card className={cn("space-y-3 p-5", highlightConfirm && "border-2 border-primary")}>
                    <h3 className="font-display text-lg font-bold">Did your food arrive?</h3>
                    <p className="text-sm text-muted-foreground">{waiting.map((p) => p.chefName).join(" and ")} marked your food as {pickup ? "collected" : "delivered"}. Please let us know it reached you.</p>
                    {!problem ? (
                        <div className="flex flex-wrap gap-2">
                            <Button className="h-11" disabled={confirm.isPending} onClick={() => confirm.mutate(true)}><CheckCircle2 className="mr-2 h-4 w-4" />Yes, I received it</Button>
                            <Button variant="outline" className="h-11" onClick={() => setProblem(true)}>There's a problem</Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Textarea rows={3} maxLength={1000} placeholder="What went wrong? Missing items, didn't arrive, something else..." value={issue} onChange={(e) => setIssue(e.target.value)} aria-label="What went wrong" />
                            <div className="flex gap-2">
                                <Button className="h-11" disabled={!issue.trim() || confirm.isPending} onClick={() => confirm.mutate(false)}>Send to our team</Button>
                                <Button variant="ghost" className="h-11" onClick={() => setProblem(false)}>Back</Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
            {progress.length > 1 && (
                <Card className="p-5">
                    <h3 className="mb-3 font-semibold">Your chefs</h3>
                    <ul className="space-y-2">
                        {progress.map((p) => {
                            const s = STAGE[p.status] ?? STAGE.received;
                            return (
                                <li key={p.chefName} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium">{p.chefName}</span>
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground"><s.icon className="h-4 w-4 text-primary" />{s.label}</span>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            )}
            {progress.filter((p) => p.deliveryProof).map((p) => (
                <Card key={p.chefName} className="space-y-2 p-5">
                    <h3 className="font-semibold">{pickup ? "Collected" : "Delivered"} by {p.chefName}</h3>
                    <img src={p.deliveryProof!} alt={`Photo ${p.chefName} took when handing over your food`} className="max-h-72 w-full rounded-xl object-cover" loading="lazy" />
                    {p.customerConfirmedAt && <p className="text-sm text-emerald-700">You confirmed you received it. Thank you!</p>}
                    {p.customerIssue && <p className="text-sm text-muted-foreground">You reported a problem. Our team will be in touch.</p>}
                </Card>
            ))}
        </div>
    );
};
