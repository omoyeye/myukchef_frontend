import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { PayByCardButton } from '@/components/orders/PayByCardButton';
import { planDate } from '@/lib/mealPlans';
import { cn } from '@/lib/utils';

export interface PaymentDue { weekId: number; weekNumber: number; deliveryDate: string; amount: number; payBy: string; late: boolean; unpaidCount: number }

/**
 * The "pay now" card on a meal plan: shown once the chef has accepted and a delivery is waiting to be
 * paid by card. The chef starts cooking as soon as it's paid.
 */
export function PaymentDueCard({ planId, chefName, due, highlight }: { planId: number; chefName: string; due: PaymentDue; highlight?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    // Arriving from the "please pay" email or push: bring the card into view.
    useEffect(() => { if (highlight) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [highlight]);
    const first = due.weekNumber === 1;
    const later = due.unpaidCount - 1;
    return (
        <div ref={ref} id="pay" className={cn('relative overflow-hidden rounded-3xl border-2 p-5 md:p-6', due.late ? 'border-destructive/50 bg-destructive/5' : 'border-primary/40 bg-primary/5', highlight && 'ring-4 ring-primary/30')}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><CreditCard className="h-6 w-6" /></span>
                <div className="min-w-0 flex-1">
                    <p className="font-display text-xl font-extrabold">
                        {due.late ? `Week ${due.weekNumber} isn't paid yet` : first ? `${chefName} accepted your plan. Pay to start` : `Week ${due.weekNumber} is ready to pay`}
                    </p>
                    <p className="mt-1 text-sm">
                        {due.late
                            ? <>The cut-off for your delivery on <strong>{planDate(due.deliveryDate, 'EEEE d MMMM')}</strong> has passed, so {chefName} won't cook it until it's paid. Pay now, or message {chefName} to agree a new day.</>
                            : <>Pay <strong>£{due.amount.toFixed(2)}</strong> for your delivery on <strong>{planDate(due.deliveryDate, 'EEEE d MMMM')}</strong> by <strong>{format(new Date(due.payBy), "EEE d MMM 'at' HH:mm")}</strong>. {chefName} starts cooking as soon as it's paid.</>}
                    </p>
                    <ol className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
                        <li><span className="font-semibold text-foreground">1.</span> Tap Pay now</li>
                        <li><span className="font-semibold text-foreground">2.</span> Pay on Stripe's secure page</li>
                        <li><span className="font-semibold text-foreground">3.</span> We tell {chefName} to cook</li>
                    </ol>
                    {later > 0 && <p className="mt-2 text-xs text-muted-foreground">You pay for each delivery as you go. {later} more {later === 1 ? 'delivery' : 'deliveries'} to pay for later, and we'll remind you before each one.</p>}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-1.5 md:items-end">
                    <PayByCardButton
                        className="h-12 px-6 text-base"
                        payPath={`/meal-plans/${planId}/weeks/${due.weekId}/pay`}
                        statusPath={`/meal-plans/${planId}/weeks/${due.weekId}/payment-status`}
                        amount={due.amount}
                        refreshKey={['meal-plan', planId]}
                        label="Pay now"
                    />
                    <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />Card details stay with Stripe</span>
                </div>
            </div>
        </div>
    );
}
