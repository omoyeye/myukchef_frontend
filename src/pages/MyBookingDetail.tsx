import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, Check, ChefHat, Clock, Landmark, Loader2, Lock, MapPin, MessageCircle, Star, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";
import { PageLoader } from "@/components/layout/AppShell";
import { Layout } from "@/components/layout/Layout";
import { PlanChat } from "@/components/plans/PlanChat";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ATTENDANCE_LABEL, BOOKING_STATUS, bookingStage } from "@/lib/eventBookings";
import { money } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";
import { allergenSummary } from "@/lib/allergens";

const STAGES = ["Quotes", "Confirm", "Pay", "Your event", "Rate"];

const Stepper = ({ current }: { current: number }) => (
    <ol className="flex items-start" aria-label="Booking progress">
        {STAGES.map((name, i) => (
            <li key={name} className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                {i > 0 && <span className={cn("absolute right-1/2 top-3.5 h-0.5 w-full", i <= current ? "bg-primary" : "bg-ink-foreground/20")} aria-hidden />}
                <span aria-current={i === current ? "step" : undefined} className={cn("relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", i < current ? "bg-primary text-primary-foreground" : i === current ? "bg-ink-foreground text-ink" : "bg-ink-foreground/20 text-ink-foreground/70")}>
                    {i < current ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={cn("truncate text-[11px] font-semibold sm:text-xs", i === current ? "text-ink-foreground" : "text-ink-foreground/60")}>{name}</span>
            </li>
        ))}
    </ol>
);

const MyBookingDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [chosen, setChosen] = useState<number[] | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [rating, setRating] = useState<any>(null);
    const [chat, setChat] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate(`/login?redirect=${encodeURIComponent(`/my-bookings/${id}`)}`, { replace: true });
    }, [authLoading, isAuthenticated, navigate, id]);

    const { data: booking, isLoading, isError } = useQuery<any>({
        queryKey: ["my-booking", id],
        queryFn: () => api.get(`/events/${id}`),
        enabled: isAuthenticated,
        retry: false,
        refetchInterval: 30_000,
    });

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ["my-booking", id] });
        qc.invalidateQueries({ queryKey: ["my-events"] });
    };
    const fail = (e: Error) => toast.error(e.message);
    const confirm = useMutation({
        mutationFn: (acceptedQuoteIds: number[]) => api.post(`/events/${id}/confirm`, { acceptedQuoteIds }),
        onSuccess: () => { toast.success("Quotes confirmed. Next, your payment."); setConfirmOpen(false); refresh(); window.scrollTo(0, 0); },
        onError: fail,
    });
    const paid = useMutation({
        mutationFn: () => api.post(`/events/${id}/paid`, {}),
        onSuccess: () => { toast.success("Thanks. We'll confirm as soon as your payment arrives."); refresh(); },
        onError: fail,
    });
    const cancel = useMutation({
        mutationFn: () => api.patch(`/events/${id}/cancel`, {}),
        onSuccess: () => { toast.success("Booking cancelled"); refresh(); },
        onError: fail,
    });

    if (authLoading || isLoading) return <Layout><PageLoader /></Layout>;
    if (isError || !booking) {
        return (
            <Layout>
                <SEO title="Booking not found" noindex />
                <div className="container px-4 py-20 text-center">
                    <h1 className="mb-3 text-2xl font-bold">We couldn't find this booking</h1>
                    <Button asChild className="h-11"><Link to="/profile?tab=bookings">Back to my bookings</Link></Button>
                </div>
            </Layout>
        );
    }

    const quotes: any[] = booking.quotes;
    const submitted = quotes.filter((q) => q.status === "submitted");
    const waiting = quotes.filter((q) => q.status === "requested");
    const deciding = ["quoting", "pending", "quotes_ready"].includes(booking.status);
    const selection = chosen ?? submitted.map((q) => q.id);
    const selectionTotal = submitted.filter((q) => selection.includes(q.id)).reduce((sum, q) => sum + (q.total ?? 0), 0);
    const toggle = (quoteId: number) => setChosen(selection.includes(quoteId) ? selection.filter((x) => x !== quoteId) : [...selection, quoteId]);
    const canCancel = !["confirmed", "in_progress", "completed", "cancelled"].includes(booking.status) && booking.paymentStatus !== "paid";
    const status = BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.quoting;
    const visibleQuotes = deciding ? quotes : quotes.filter((q) => q.status === "accepted");
    const chatQuote = quotes.find((q) => q.id === chat);

    return (
        <Layout>
            <SEO title={booking.eventName} description="Your event booking." noindex />
            <div className="container max-w-5xl px-4 pb-44 lg:pb-12">
                <Link to="/profile?tab=bookings" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />My bookings</Link>

                <header className="relative overflow-hidden rounded-[2rem] bg-ink p-5 text-ink-foreground md:p-8">
                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
                    <div className="relative">
                        <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-bold", status.className)}>{status.label}</span>
                        <h1 className="mt-2 break-words font-display text-3xl font-extrabold md:text-4xl">{booking.eventName}</h1>
                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-foreground/75">
                            <li className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{format(new Date(booking.eventDate), "EEE d MMMM yyyy")} at {booking.eventTime}</li>
                            <li className="flex items-center gap-1.5"><Users className="h-4 w-4" />{booking.headcount} guests</li>
                            <li className="flex min-w-0 items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" /><span className="break-words">{booking.venue}</span></li>
                        </ul>
                        {booking.status !== "cancelled" && <div className="mt-5"><Stepper current={bookingStage(booking)} /></div>}
                    </div>
                </header>

                {/* PAYMENT */}
                {booking.status === "awaiting_payment" && (
                    <section aria-labelledby="pay-heading" className="mt-5 rounded-3xl border-2 border-primary bg-card p-5 md:p-6">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 id="pay-heading" className="font-display text-2xl font-extrabold">Pay MYUKCHEF</h2>
                                <p className="text-sm text-muted-foreground">One full payment to us. We pay each of your chefs, so you don't have to.</p>
                            </div>
                            <p className="font-display text-4xl font-extrabold text-primary">{money(booking.finalTotal)}</p>
                        </div>
                        {booking.paymentStatus === "submitted" ? (
                            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-amber-950"><Clock className="h-5 w-5 shrink-0" /><span><span className="font-bold">We're checking your payment.</span> We'll let you know as soon as it arrives, and tell your chefs.</span></p>
                        ) : booking.bankDetails ? (
                            <>
                                <dl className="mt-4 grid gap-3 rounded-2xl bg-secondary/70 p-4 text-sm sm:grid-cols-2">
                                    <div><dt className="text-muted-foreground">Account name</dt><dd className="font-bold">{booking.bankDetails.accountName}</dd></div>
                                    {booking.bankDetails.sortCode && <div><dt className="text-muted-foreground">Sort code</dt><dd className="font-bold">{booking.bankDetails.sortCode}</dd></div>}
                                    <div><dt className="text-muted-foreground">Account number</dt><dd className="font-bold">{booking.bankDetails.accountNumber}</dd></div>
                                    <div><dt className="text-muted-foreground">Payment reference</dt><dd className="font-bold text-primary">{booking.reference}</dd></div>
                                    {booking.bankDetails.instructions && <p className="sm:col-span-2">{booking.bankDetails.instructions}</p>}
                                </dl>
                                <Button className="mt-4 h-12 w-full rounded-full font-bold sm:w-auto sm:px-8" disabled={paid.isPending} onClick={() => paid.mutate()}><Landmark className="mr-2 h-4 w-4" />{paid.isPending ? "Saving..." : "I've made the payment"}</Button>
                            </>
                        ) : (
                            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-secondary p-4"><Landmark className="h-5 w-5 shrink-0 text-primary" />Our team is preparing your payment details and they'll appear here. Your reference is <span className="font-bold">{booking.reference}</span>.</p>
                        )}
                    </section>
                )}

                {booking.paymentStatus === "paid" && booking.status === "confirmed" && (
                    <p className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-950"><Check className="h-5 w-5 shrink-0" /><span><span className="font-bold">Paid in full: {money(booking.finalTotal)}.</span> Your chefs have your venue and time. Message them below about anything on the day.</span></p>
                )}
                {booking.paymentStatus === "refunded" && <p className="mt-5 rounded-2xl bg-secondary p-4 font-semibold">This booking was cancelled and refunded.</p>}
                {booking.status === "cancelled" && booking.paymentStatus !== "refunded" && <p className="mt-5 rounded-2xl bg-secondary p-4 font-semibold">This booking is cancelled. Nothing is owed.</p>}

                {/* QUOTES */}
                <section aria-labelledby="quotes-heading" className="mt-6">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                        <h2 id="quotes-heading" className="font-display text-2xl font-extrabold">{deciding ? "Your quotes" : "Your chefs"}</h2>
                        {deciding && <p className="text-sm font-semibold text-primary">{quotes.length - waiting.length} of {quotes.length} replied</p>}
                    </div>
                    <ul className="space-y-4">
                        {visibleQuotes.map((quote) => {
                            const isChosen = selection.includes(quote.id);
                            const lines = quote.items ?? [];
                            return (
                                <li key={quote.id} className={cn("overflow-hidden rounded-3xl border-2 bg-card", deciding && quote.status === "submitted" && isChosen ? "border-primary" : "border-transparent shadow-sm")}>
                                    <div className="flex items-start gap-3 p-4 md:p-5">
                                        <Link to={`/chefs/${quote.chef.id}`} aria-label={`${quote.chef.displayName}'s profile`} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                            {quote.chef.avatar ? <img src={quote.chef.avatar} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-6 w-6 text-primary" />}
                                        </Link>
                                        <div className="min-w-0 flex-1">
                                            <p className="break-words font-display text-lg font-bold">{quote.chef.displayName}</p>
                                            <p className="truncate text-sm text-muted-foreground">{quote.chef.specialty || "Chef"}</p>
                                        </div>
                                        {quote.total != null && quote.status !== "declined" && <p className="shrink-0 font-display text-2xl font-extrabold">{money(quote.total)}</p>}
                                    </div>

                                    {quote.status === "requested" && <p className="mx-4 mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-950 md:mx-5"><Clock className="h-4 w-4 shrink-0" />Preparing your quote</p>}
                                    {quote.status === "declined" && <p className="mx-4 mb-4 rounded-2xl bg-secondary p-3 text-sm md:mx-5"><span className="font-semibold">Can't take this one.</span> {quote.note}</p>}

                                    {lines.length > 0 && quote.status !== "declined" && (
                                        <ul className="mx-4 space-y-1.5 border-t py-3 text-sm md:mx-5">
                                            {lines.map((line: any) => (
                                                <li key={line.id} className="flex justify-between gap-3">
                                                    <span className="min-w-0 break-words">{line.quantity} × {line.name}{line.allergens && <span className="block text-xs text-muted-foreground">{allergenSummary(line.allergens)}</span>}</span>
                                                    {line.unitPrice != null && <span className="shrink-0 font-semibold">{money(line.unitPrice * line.quantity)}</span>}
                                                </li>
                                            ))}
                                            {quote.serviceFee > 0 && <li className="flex justify-between gap-3"><span>Service and attendance</span><span className="font-semibold">{money(quote.serviceFee)}</span></li>}
                                        </ul>
                                    )}
                                    {quote.preferences && <p className="mx-4 mb-3 rounded-xl bg-secondary/70 p-2.5 text-sm md:mx-5"><span className="font-semibold">You asked:</span> {quote.preferences}</p>}
                                    {quote.status !== "requested" && quote.status !== "declined" && (
                                        <div className="mx-4 mb-3 space-y-2 text-sm md:mx-5">
                                            {quote.willAttend && <p className={cn("flex items-center gap-2 font-medium", quote.willAttend === "no" && "text-muted-foreground")}><Users className="h-4 w-4 shrink-0 text-primary" />{ATTENDANCE_LABEL[quote.willAttend]}</p>}
                                            {quote.note && <p className="rounded-xl bg-secondary/70 p-2.5"><span className="font-semibold">{quote.chef.displayName.split(" ")[0]} says:</span> {quote.note}</p>}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3 md:px-5">
                                        <div className="flex flex-wrap gap-1">
                                            {booking.status !== "cancelled" && quote.status !== "declined" && (
                                                <Button variant="ghost" className="h-11 px-3" onClick={() => setChat(quote.id)}><MessageCircle className="mr-1.5 h-4 w-4" />Message{quote.messages.length ? ` (${quote.messages.length})` : ""}</Button>
                                            )}
                                            {booking.status === "completed" && quote.canReview && (
                                                <Button variant="outline" className="h-11 px-3" onClick={() => setRating(quote.chef)}><Star className="mr-1.5 h-4 w-4" />Rate {quote.chef.displayName.split(" ")[0]}</Button>
                                            )}
                                        </div>
                                        {deciding && quote.status === "submitted" && (
                                            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold">
                                                <Checkbox checked={isChosen} onCheckedChange={() => toggle(quote.id)} aria-label={`Include ${quote.chef.displayName}'s quote`} />
                                                Include this quote
                                            </label>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {canCancel && (
                    <Button variant="ghost" className="mt-5 h-11 text-destructive hover:text-destructive" disabled={cancel.isPending} onClick={() => { if (window.confirm("Cancel this booking? Your chefs will be told, and nothing is owed.")) cancel.mutate(); }}>
                        <XCircle className="mr-2 h-4 w-4" />Cancel booking
                    </Button>
                )}
                <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><Lock className="mt-0.5 h-4 w-4 shrink-0" />To keep everyone safe, all contact happens here. Phone numbers, emails and links can't be shared with chefs.</p>
            </div>

            {/* CONFIRM BAR */}
            {deciding && submitted.length > 0 && (
                <div className="fixed inset-x-0 z-40 border-t bg-background/95 p-3 backdrop-blur bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0">
                    <div className="mx-auto flex max-w-5xl items-center gap-3 px-1">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-muted-foreground">{selection.length} of {submitted.length} quote{submitted.length === 1 ? "" : "s"} selected</p>
                            <p className="truncate font-display text-xl font-extrabold leading-tight">{money(selectionTotal)}</p>
                        </div>
                        <Button className="h-12 shrink-0 rounded-full px-6 font-bold" disabled={selection.length === 0} onClick={() => setConfirmOpen(true)}>Confirm</Button>
                    </div>
                </div>
            )}

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm {selection.length} quote{selection.length === 1 ? "" : "s"}?</DialogTitle>
                        <DialogDescription>You'll pay {money(selectionTotal)} in full to MYUKCHEF, and your chefs are confirmed once it arrives. You can still cancel for free before you pay.</DialogDescription>
                    </DialogHeader>
                    {waiting.length > 0 && <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950"><AlertTriangle className="h-4 w-4 shrink-0" />{waiting.map((q) => q.chef.displayName).join(", ")} {waiting.length === 1 ? "hasn't" : "haven't"} replied yet. If you confirm now, they won't be included.</p>}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="h-11" onClick={() => setConfirmOpen(false)}>Not yet</Button>
                        <Button className="h-11" disabled={confirm.isPending} onClick={() => confirm.mutate(selection)}>{confirm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm quotes"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={chat !== null} onOpenChange={(o) => !o && setChat(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Message {chatQuote?.chef.displayName}</DialogTitle>
                        <DialogDescription>Ask about dishes, portions or the day itself. Contact details can't be shared.</DialogDescription>
                    </DialogHeader>
                    {chatQuote && <PlanChat postPath={`/events/quotes/${chatQuote.id}/messages`} invalidateKey={["my-booking", id]} messages={chatQuote.messages} viewerRole="customer" otherName={chatQuote.chef.displayName.split(" ")[0]} />}
                </DialogContent>
            </Dialog>

            {rating && <ReviewDialog chefId={rating.id} chefName={rating.displayName} open={!!rating} onOpenChange={(o) => !o && setRating(null)} />}
        </Layout>
    );
};

export default MyBookingDetail;
