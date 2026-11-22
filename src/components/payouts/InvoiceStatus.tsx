import { cn } from '@/lib/utils';

export interface Invoice {
    id: number;
    number: string;
    chefId: number;
    chefName?: string;
    stripeConnected?: boolean;
    kind: 'order' | 'event';
    orderId: number | null;
    quoteId: number | null;
    description: string;
    grossAmount: number;
    commissionPercent: number;
    commissionAmount: number;
    commissionVat?: number;
    tipAmount?: number;
    netAmount: number;
    status: 'awaiting_chef' | 'submitted' | 'processing' | 'paid' | 'held' | 'void';
    holdReason: string | null;
    chefDetails: { displayName?: string; legalName?: string | null; address?: string | null; taxReference?: string | null; bankAccountName?: string | null; bankAccountEnding?: string | null } | null;
    submittedAt: string | null;
    submittedName: string | null;
    paidAt: string | null;
    payMethod: 'stripe' | 'bank' | null;
    stripeTransferId: string | null;
    payoutError: string | null;
    receiptNumber: string | null;
    createdAt: string;
}

const STATUS: Record<Invoice['status'], { label: string; className: string }> = {
    awaiting_chef: { label: 'Being paid', className: 'bg-amber-100 text-amber-900' },
    submitted: { label: 'Waiting to be paid', className: 'bg-sky-100 text-sky-900' },
    processing: { label: 'Paying', className: 'bg-sky-100 text-sky-900' },
    paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-900' },
    held: { label: 'On hold', className: 'bg-orange-100 text-orange-900' },
    void: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
};

export const InvoiceStatus = ({ status }: { status: Invoice['status'] }) => {
    const s = STATUS[status] ?? STATUS.submitted;
    return <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold', s.className)}>{s.label}</span>;
};
