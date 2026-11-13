import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
    orderId: number;
    paymentStatus: string;
    total: number;
    refundedAt?: string | null;
    token: string | null;
    /** Back from Stripe after paying (?paid=1) or after backing out (?payment=cancelled). */
    returnedPaid: boolean;
    returnedCancelled: boolean;
}

const money = (n: number) => `£${n.toFixed(2)}`;

/** Shows where the card payment stands, confirms it on the way back from Stripe, and lets the customer pay if they haven't. */
export function PaymentStatusBanner({ orderId, paymentStatus, total, refundedAt, token, returnedPaid, returnedCancelled }: Props) {
    const queryClient = useQueryClient();
    const [checking, setChecking] = useState(returnedPaid && paymentStatus === 'awaiting');
    const [opening, setOpening] = useState(false);
    const announced = useRef(false);

    // Coming back from Stripe: ask the server to check, a few times, in case the payment is still settling.
    useEffect(() => {
        if (!returnedPaid || paymentStatus !== 'awaiting') { setChecking(false); return; }
        let tries = 0;
        let stopped = false;
        const check = async () => {
            tries += 1;
            try {
                const result = await api.post(`/orders/${orderId}/payment-status`, { t: token }) as { paymentStatus: string } | null;
                if (result && result.paymentStatus !== 'awaiting') {
                    queryClient.invalidateQueries({ queryKey: ['order-tracking'] });
                    return;
                }
            } catch { /* try again */ }
            if (!stopped && tries < 10) setTimeout(check, 3000);
            else setChecking(false);
        };
        check();
        return () => { stopped = true; };
    }, [returnedPaid, paymentStatus, orderId, token, queryClient]);

    useEffect(() => {
        if (returnedPaid && paymentStatus === 'paid' && !announced.current) {
            announced.current = true;
            toast.success('Payment received', { description: `Order #${orderId} is on its way to the kitchen.` });
        }
    }, [returnedPaid, paymentStatus, orderId]);

    const payNow = async () => {
        setOpening(true);
        try {
            const { checkoutUrl } = await api.post(`/orders/${orderId}/pay`, { t: token });
            window.location.assign(checkoutUrl);
        } catch (e) {
            toast.error((e as Error).message || "Couldn't open the payment page");
            setOpening(false);
        }
    };

    if (paymentStatus === 'awaiting') {
        if (checking) {
            return (
                <Card role="status" className="p-5 mb-6 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="font-semibold">Confirming your payment…</p>
                </Card>
            );
        }
        return (
            <Card className="p-5 mb-6 border-amber-300 bg-amber-50 dark:bg-amber-900/10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div className="flex gap-3">
                        <CreditCard className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold">{returnedCancelled ? "You didn't finish paying" : 'Waiting for payment'}</p>
                            <p className="text-sm text-muted-foreground">Your order goes to the chefs once it's paid. Unpaid orders are released after an hour.</p>
                        </div>
                    </div>
                    <Button onClick={payNow} disabled={opening} className="shrink-0">
                        {opening && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pay {money(total)}
                    </Button>
                </div>
            </Card>
        );
    }
    if (paymentStatus === 'failed') {
        return (
            <Card className="p-5 mb-6 flex gap-3 border-destructive/40">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold">This order wasn't paid for</p>
                    <p className="text-sm text-muted-foreground">No money was taken. You're welcome to order again.</p>
                </div>
            </Card>
        );
    }
    if (paymentStatus === 'refunded') {
        return (
            <Card className="p-5 mb-6 flex gap-3">
                <RotateCcw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold">Refunded {money(total)}</p>
                    <p className="text-sm text-muted-foreground">
                        {refundedAt ? `On ${new Date(refundedAt).toLocaleDateString('en-GB')}. ` : ''}It can take 5 to 10 days to show on your card.
                    </p>
                </div>
            </Card>
        );
    }
    if (paymentStatus === 'paid' && returnedPaid) {
        return (
            <Card role="status" className="p-5 mb-6 flex items-center gap-3 border-green-300 bg-green-50 dark:bg-green-900/10">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
                <p className="font-semibold">Paid {money(total)}. Thank you!</p>
            </Card>
        );
    }
    return null;
}
