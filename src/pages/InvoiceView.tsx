import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { companyLine, type CompanyInfo } from '@/components/common/CompanyDetails';
import { Button } from '@/components/ui/button';
import { InvoiceStatus, type Invoice } from '@/components/payouts/InvoiceStatus';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const money = (n: number) => `£${Number(n).toFixed(2)}`;
const date = (d: string | null) => (d ? format(new Date(d), 'd MMMM yyyy, HH:mm') : '');

/**
 * An invoice between MYUKCHEF and a chef, which becomes the receipt once paid. Shown to the chef it
 * belongs to and to Super Admins, and laid out to print or save as a PDF.
 */
const InvoiceView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: invoice, isLoading, error } = useQuery<Invoice & { platform: CompanyInfo | null }>({
        queryKey: ['invoice', id],
        queryFn: () => api.get(`/payouts/invoices/${id}`),
        enabled: !!id,
    });
    const back = user?.isAdmin ? '/admin/orders?tab=payouts' : '/chef/dashboard?tab=payouts';

    if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (error || !invoice) {
        return (
            <div className="container py-20 text-center">
                <h1 className="mb-4 text-2xl font-bold">Invoice not found</h1>
                <Button asChild><Link to={back}>Back</Link></Button>
            </div>
        );
    }
    const paid = invoice.status === 'paid';
    const chef = invoice.chefDetails ?? {};
    const platform = companyLine(invoice.platform ?? {});

    return (
        <div className="min-h-screen bg-secondary/30 py-8 print:bg-white print:py-0">
            <SEO noindex title={paid ? `Receipt ${invoice.receiptNumber}` : `Invoice ${invoice.number}`} description="Chef payout record" />
            <div className="mx-auto max-w-2xl px-4">
                <div className="mb-4 flex justify-between gap-2 print:hidden">
                    <Button variant="ghost" className="h-11" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(back))}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                    <Button variant="outline" className="h-11" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print or save as PDF</Button>
                </div>
                <article className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm sm:p-10 print:border-0 print:shadow-none">
                    <header className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <img src="/logo.png" alt="MYUKCHEF" className="mb-2 h-10 w-auto" />
                            <p className="text-xs text-muted-foreground">{platform || 'MYUKCHEF'}</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-black uppercase tracking-tight">{paid ? 'Payout receipt' : 'Payout invoice'}</h1>
                            {paid && <p className="font-semibold">{invoice.receiptNumber}</p>}
                            <p className={paid ? 'text-sm text-muted-foreground' : 'font-semibold'}>Invoice {invoice.number}</p>
                            <div className="mt-1 print:hidden"><InvoiceStatus status={invoice.status} /></div>
                        </div>
                    </header>

                    <section className="grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <h2 className="mb-1 text-xs font-bold uppercase text-muted-foreground">Chef</h2>
                            <p className="font-semibold">{chef.legalName || chef.displayName || invoice.chefName}</p>
                            {chef.legalName && chef.displayName && chef.legalName !== chef.displayName && <p>Trading as {chef.displayName}</p>}
                            {chef.address && <p>{chef.address}</p>}
                            {chef.taxReference && <p>Tax reference on file</p>}
                        </div>
                        <div className="sm:text-right">
                            <h2 className="mb-1 text-xs font-bold uppercase text-muted-foreground">Dates</h2>
                            <p>Raised {date(invoice.createdAt)}</p>
                            {invoice.submittedAt && <p>Submitted {date(invoice.submittedAt)}{invoice.submittedName ? ` by ${invoice.submittedName}` : ''}</p>}
                            {invoice.paidAt && <p>Paid {date(invoice.paidAt)}</p>}
                        </div>
                    </section>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Description</th><th className="py-2 text-right">Amount</th></tr>
                        </thead>
                        <tbody>
                            <tr className="border-b"><td className="py-2">Food sales: {invoice.description}</td><td className="py-2 text-right">{money(invoice.grossAmount)}</td></tr>
                            <tr className="border-b"><td className="py-2">MYUKCHEF commission ({invoice.commissionPercent}%)</td><td className="py-2 text-right">− {money(invoice.commissionAmount)}</td></tr>
                        </tbody>
                        <tfoot>
                            <tr><td className="pt-3 font-bold">{paid ? 'Paid to chef' : 'Due to chef'}</td><td className="pt-3 text-right text-xl font-black">{money(invoice.netAmount)}</td></tr>
                        </tfoot>
                    </table>

                    {paid && (
                        <section className="rounded-xl bg-muted/50 p-4 text-sm">
                            <p>
                                Paid {invoice.payMethod === 'stripe' ? 'to the chef\'s Stripe account' : 'by bank transfer'}
                                {invoice.payMethod === 'bank' && chef.bankAccountEnding ? ` to the account ending ${chef.bankAccountEnding}` : ''}
                                {invoice.stripeTransferId ? ` (Stripe transfer ${invoice.stripeTransferId})` : ''}.
                            </p>
                        </section>
                    )}
                    {invoice.status === 'held' && invoice.holdReason && <p className="rounded-xl bg-orange-50 p-4 text-sm">On hold: {invoice.holdReason}</p>}
                    {invoice.status === 'void' && <p className="rounded-xl bg-muted p-4 text-sm">This invoice was cancelled{invoice.holdReason ? `: ${invoice.holdReason}` : '.'}</p>}

                    <footer className="border-t pt-4 text-xs text-muted-foreground">
                        This is a record of a payment between MYUKCHEF and an independent chef who sells through the platform, under the MYUKCHEF chef agreement.
                        Chefs are responsible for their own tax. Keep this for your records.
                    </footer>
                </article>
            </div>
        </div>
    );
};

export default InvoiceView;
