import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { whenLabel } from '@/lib/when';

interface Props {
    order: { id: number; status: string; scheduledFor?: string | null; paymentStatus?: string; total: number; deliveryAddress?: { method?: string } | null; chefProgress?: { status: string }[] };
    token: string | null;
}

/** When the food is due, and (until a chef starts cooking) a button to cancel with a full refund. */
export function OrderTiming({ order, token }: Props) {
    const qc = useQueryClient();
    const [confirming, setConfirming] = useState(false);
    const notStarted = ['received', 'awaiting_payment'].includes(order.status) && (order.chefProgress ?? []).every((p) => p.status === 'received');
    const paid = order.paymentStatus === 'paid';
    const cancel = useMutation({
        mutationFn: () => api.post(`/orders/${order.id}/cancel`, { t: token }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['order-tracking'] }); toast.success(paid ? 'Cancelled. Your refund is on its way.' : 'Order cancelled.'); },
        onError: (e: Error) => toast.error(e.message),
    });
    if (!order.scheduledFor && !notStarted) return null;
    const pickup = order.deliveryAddress?.method === 'pickup';

    return (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
            {order.scheduledFor ? (
                <p className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    <span><span className="text-sm text-muted-foreground">{pickup ? 'Ready to collect' : 'Due'} </span><strong>{whenLabel(order.scheduledFor)}</strong></span>
                </p>
            ) : <span />}
            {notStarted && order.status !== 'cancelled' && (
                <Button variant="outline" className="h-11 text-destructive" onClick={() => setConfirming(true)} disabled={cancel.isPending}>
                    {cancel.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}Cancel order
                </Button>
            )}
            <AlertDialog open={confirming} onOpenChange={setConfirming}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel order #{order.id}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {paid ? `Your £${order.total.toFixed(2)} goes back to your card. It can take 5 to 10 days to show.` : 'Nothing has been charged.'} You can cancel until a chef starts cooking.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep my order</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => cancel.mutate()}>Cancel order</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
