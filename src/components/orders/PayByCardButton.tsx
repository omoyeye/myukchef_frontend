import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

/**
 * "Pay by card" for an event booking or a meal plan delivery. Sends the customer to Stripe, and on the
 * way back (?paid=1) asks the server to check so the page updates straight away.
 */
export function PayByCardButton({ payPath, statusPath, amount, refreshKey, label = 'Pay by card', className }: {
    payPath: string;
    statusPath: string;
    amount: number;
    refreshKey: unknown[];
    label?: string;
    className?: string;
}) {
    const qc = useQueryClient();
    const [opening, setOpening] = useState(false);
    const checked = useRef(false);
    const { data: config } = useQuery<{ cardPayments: boolean }>({ queryKey: ['payment-config'], queryFn: () => api.get('/orders/payment-config'), staleTime: 60_000 });

    useEffect(() => {
        if (checked.current || new URLSearchParams(window.location.search).get('paid') !== '1') return;
        checked.current = true;
        api.post(statusPath, {}).then(() => qc.invalidateQueries({ queryKey: refreshKey })).catch(() => undefined);
    }, [statusPath, qc, refreshKey]);

    if (!config?.cardPayments) return null;
    const pay = async () => {
        setOpening(true);
        try {
            const { checkoutUrl } = await api.post(payPath, {});
            window.location.assign(checkoutUrl);
        } catch (e) {
            toast.error((e as Error).message);
            setOpening(false);
        }
    };
    return (
        <Button className={className ?? 'h-11'} onClick={pay} disabled={opening}>
            {opening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}{label} · £{amount.toFixed(2)}
        </Button>
    );
}
