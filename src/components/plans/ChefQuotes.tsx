import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarHeart, Check, Lock, MapPin, MessageCircle, Send, Users, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { ATTENDANCE_LABEL, QUOTE_STATUS } from "@/lib/eventBookings";
import { money } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";
import { allergenSummary } from "@/lib/allergens";
import { PlanChat } from "./PlanChat";

const ATTEND_OPTIONS = [
    { id: "yes", label: "Yes, I'll attend" },
    { id: "if_possible", label: "If possible" },
    { id: "no", label: "No, delivery only" },
];

export const useChefQuotes = (enabled = true) => useQuery<{ commissionPercent: number; quotes: any[] }>({
    queryKey: ["chef-quotes"],
    queryFn: () => api.get("/chef-portal/quotes"),
    enabled,
    refetchInterval: 30_000,
});

const QuoteForm = ({ quote, commissionPercent, onClose }: { quote: any | null; commissionPercent: number; onClose: () => void }) => {
    const qc = useQueryClient();
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [serviceFee, setServiceFee] = useState("");
    const [willAttend, setWillAttend] = useState("yes");
    const [note, setNote] = useState("");

    useEffect(() => {
        if (!quote) return;
        setPrices(Object.fromEntries((quote.items ?? []).map((i: any) => [i.id, String(i.unitPrice ?? i.guidePrice)])));
        setServiceFee(quote.serviceFee ? String(quote.serviceFee) : "");
        setWillAttend(quote.willAttend ?? "yes");
        setNote(quote.note ?? "");
    }, [quote]);

    const items = quote?.items ?? [];
    const total = items.reduce((sum: number, i: any) => sum + (Number(prices[i.id]) || 0) * i.quantity, 0) + (Number(serviceFee) || 0);
    const youReceive = total * (1 - commissionPercent / 100);

    const submit = useMutation({
        mutationFn: () => api.post(`/chef-portal/quotes/${quote.id}/submit`, {
            items: items.map((i: any) => ({ id: i.id, unitPrice: Number(prices[i.id]) })),
            serviceFee: Number(serviceFee) || 0,
            willAttend,
            note,
        }),
        onSuccess: () => { toast.success("Quote sent to the customer"); qc.invalidateQueries({ queryKey: ["chef-quotes"] }); onClose(); },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <Dialog open={!!quote} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                {quote && (
                    <form className="min-w-0 space-y-4" onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}>
                        <DialogHeader>
                            <DialogTitle>Your quote for {quote.event.name}</DialogTitle>
                            <DialogDescription>{quote.event.headcount} guests on {format(new Date(quote.event.date), "EEE d MMMM yyyy")}. Prices are per portion, and the menu price is filled in as a starting point.</DialogDescription>
                        </DialogHeader>
                        {items.length > 0 && (
                            <ul className="space-y-2">
                                {items.map((item: any) => (
                                    <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-secondary/60 p-3">
                                        <div className="min-w-0 flex-1 basis-36"><p className="break-words font-semibold leading-tight">{item.name}</p><p className="text-sm text-muted-foreground">{item.quantity} portions</p><p className="text-xs text-muted-foreground">{allergenSummary(item.allergens)}</p></div>
                                        <div className="w-24 shrink-0"><Label htmlFor={`price-${item.id}`} className="sr-only">Price per portion of {item.name}</Label><Input id={`price-${item.id}`} type="number" inputMode="decimal" min={0} step="0.01" required className="h-11" value={prices[item.id] ?? ""} onChange={(e) => setPrices({ ...prices, [item.id]: e.target.value })} /></div>
                                        <span className="w-20 shrink-0 text-right text-sm font-bold">{money((Number(prices[item.id]) || 0) * item.quantity)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="quote-fee">{items.length ? "Service, travel and attendance fee (£)" : "Your price for this event (£)"}</Label>
                            <Input id="quote-fee" type="number" inputMode="decimal" min={0} step="0.01" className="h-11" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
                        </div>
                        <fieldset>
                            <legend className="mb-2 text-sm font-medium">Will you attend the event in person?</legend>
                            <div className="grid grid-cols-3 gap-2">
                                {ATTEND_OPTIONS.map((o) => <button key={o.id} type="button" aria-pressed={willAttend === o.id} onClick={() => setWillAttend(o.id)} className={cn("min-h-12 rounded-xl border-2 px-1 text-sm font-semibold", willAttend === o.id ? "border-primary bg-primary/5" : "hover:border-primary/40")}>{o.label}</button>)}
                            </div>
                        </fieldset>
                        <div className="space-y-2">
                            <Label htmlFor="quote-note">Note for the customer</Label>
                            <Textarea id="quote-note" rows={2} maxLength={1000} placeholder="What's included, what you'd suggest..." value={note} onChange={(e) => setNote(e.target.value)} />
                            <p className="text-xs text-muted-foreground">Phone numbers, emails and links can't be shared.</p>
                        </div>
                        <dl className="rounded-2xl bg-ink p-4 text-ink-foreground">
                            <div className="flex items-baseline justify-between"><dt>Customer pays</dt><dd className="font-display text-2xl font-extrabold">{money(total)}</dd></div>
                            <div className="mt-1 flex items-baseline justify-between text-sm text-ink-foreground/75"><dt>You receive after {commissionPercent}% MYUKCHEF commission</dt><dd className="font-bold">{money(youReceive)}</dd></div>
                        </dl>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" className="h-11" onClick={onClose}>Back</Button>
                            <Button type="submit" className="h-11" disabled={submit.isPending || total <= 0}><Send className="mr-2 h-4 w-4" />{submit.isPending ? "Sending..." : quote.status === "submitted" ? "Update quote" : "Send quote"}</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

/** Every event a chef has been asked about, from first request to final payout. */
export const ChefQuotes = () => {
    const qc = useQueryClient();
    const { data, isLoading } = useChefQuotes();
    const [editing, setEditing] = useState<any>(null);
    const [declining, setDeclining] = useState<any>(null);
    const [declineNote, setDeclineNote] = useState("");
    const [chat, setChat] = useState<number | null>(null);
    const quotes = data?.quotes ?? [];
    const refresh = () => qc.invalidateQueries({ queryKey: ["chef-quotes"] });

    const decline = useMutation({
        mutationFn: () => api.post(`/chef-portal/quotes/${declining.id}/decline`, { note: declineNote }),
        onSuccess: () => { toast.success("You've declined this event"); setDeclining(null); setDeclineNote(""); refresh(); },
        onError: (e: Error) => toast.error(e.message),
    });
    const attendance = useMutation({
        mutationFn: ({ id, willAttend }: { id: number; willAttend: string }) => api.patch(`/chef-portal/quotes/${id}/attendance`, { willAttend }),
        onSuccess: () => { toast.success("The customer has been told"); refresh(); },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading) return <Skeleton className="h-40 w-full rounded-3xl" />;
    if (quotes.length === 0) return <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground"><CalendarHeart className="mx-auto mb-2 h-8 w-8 text-primary" />No event requests yet. They'll appear here when customers ask you to quote.</p>;

    const open = quotes.filter((q) => ["requested", "submitted"].includes(q.status) && ["quoting", "pending", "quotes_ready"].includes(q.event.status));
    const won = quotes.filter((q) => q.status === "accepted");
    const closed = quotes.filter((q) => !open.includes(q) && !won.includes(q));
    const chatQuote = quotes.find((q) => q.id === chat);

    const card = (q: any) => {
        const status = QUOTE_STATUS[q.status] ?? QUOTE_STATUS.requested;
        const canQuote = ["requested", "submitted"].includes(q.status) && ["quoting", "pending", "quotes_ready"].includes(q.event.status);
        return (
            <li key={q.id} className={cn("space-y-3 rounded-3xl border bg-card p-4 md:p-5", q.status === "requested" && canQuote && "border-2 border-primary")}>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="break-words font-display text-lg font-bold">{q.event.name}</p>
                        <p className="text-sm text-muted-foreground">For {q.customerFirstName} · {format(new Date(q.event.date), "EEE d MMM yyyy")}{q.event.time ? ` at ${q.event.time}` : ""} · {q.event.headcount} guests</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", status.className)}>{status.label}</span>
                </div>
                {q.items?.length > 0 && <p className="text-sm"><span className="font-semibold">Asked for:</span> {q.items.map((i: any) => `${i.quantity} × ${i.name}`).join(", ")}</p>}
                {q.preferences && <p className="rounded-xl bg-secondary p-2.5 text-sm"><span className="font-semibold">Preferences:</span> {q.preferences}</p>}
                {q.event.specialRequests && <p className="text-sm text-muted-foreground"><span className="font-semibold">For all chefs:</span> {q.event.specialRequests}</p>}
                {q.total != null && q.status !== "declined" && <p className="text-sm"><span className="font-semibold">Your quote:</span> {money(q.total)}{q.willAttend ? ` · ${ATTENDANCE_LABEL[q.willAttend]}` : ""}</p>}

                {q.status === "accepted" && (
                    q.event.paid ? (
                        <div className="space-y-2">
                            <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-2.5 text-sm text-emerald-950"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span><span className="font-semibold">Venue:</span> {q.event.venue}</span></p>
                            <p className="flex items-center gap-2 text-sm"><Wallet className="h-4 w-4 shrink-0 text-primary" /><span>Payout {money(q.payoutAmount ?? 0)} after {q.commissionPercent}% commission: <span className="font-bold">{q.payoutStatus === "paid" ? "paid" : q.payoutStatus === "cancelled" ? "cancelled" : "on its way from MYUKCHEF"}</span></span></p>
                            <label htmlFor={`attend-${q.id}`} className="flex flex-wrap items-center gap-2 text-sm font-medium">Attending?
                                <select id={`attend-${q.id}`} className="h-11 rounded-md border border-input bg-background px-2" value={q.willAttend ?? "yes"} onChange={(e) => attendance.mutate({ id: q.id, willAttend: e.target.value })}>
                                    {ATTEND_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                                </select>
                            </label>
                        </div>
                    ) : (
                        <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-sm text-amber-950"><Lock className="h-4 w-4 shrink-0" />You were chosen. The venue and your payout appear once the customer has paid MYUKCHEF.</p>
                    )
                )}

                <div className="flex flex-wrap gap-2">
                    {canQuote && <Button className="h-11" onClick={() => setEditing(q)}><Send className="mr-1.5 h-4 w-4" />{q.status === "submitted" ? "Update quote" : "Send quote"}</Button>}
                    {canQuote && <Button variant="outline" className="h-11" onClick={() => { setDeclineNote(""); setDeclining(q); }}><X className="mr-1.5 h-4 w-4" />Decline</Button>}
                    {["requested", "submitted", "accepted"].includes(q.status) && q.event.status !== "cancelled" && <Button variant="ghost" className="h-11" onClick={() => setChat(q.id)}><MessageCircle className="mr-1.5 h-4 w-4" />Message{q.messages.length ? ` (${q.messages.length})` : ""}</Button>}
                </div>
            </li>
        );
    };

    return (
        <div className="space-y-8">
            {open.length > 0 && <section><h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><Send className="h-5 w-5 text-primary" />Waiting on you or the customer</h2><ul className="grid gap-4 md:grid-cols-2">{open.map(card)}</ul></section>}
            {won.length > 0 && <section><h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><Check className="h-5 w-5 text-primary" />Your events</h2><ul className="grid gap-4 md:grid-cols-2">{won.map(card)}</ul></section>}
            {closed.length > 0 && <section><h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><Users className="h-5 w-5 text-primary" />Past requests</h2><ul className="grid gap-4 md:grid-cols-2">{closed.map(card)}</ul></section>}

            <QuoteForm quote={editing} commissionPercent={data?.commissionPercent ?? 0} onClose={() => setEditing(null)} />

            <Dialog open={!!declining} onOpenChange={(o) => !o && setDeclining(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Decline this event?</DialogTitle><DialogDescription>The customer will be told, and their other quotes aren't affected.</DialogDescription></DialogHeader>
                    <div className="space-y-2"><Label htmlFor="decline-note">Reason (optional)</Label><Textarea id="decline-note" rows={2} maxLength={500} placeholder="Sorry, I'm already booked that day." value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} /></div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="h-11" onClick={() => setDeclining(null)}>Back</Button>
                        <Button variant="destructive" className="h-11" disabled={decline.isPending} onClick={() => decline.mutate()}>Decline event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={chat !== null} onOpenChange={(o) => !o && setChat(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Message {chatQuote?.customerFirstName}</DialogTitle><DialogDescription>About {chatQuote?.event.name}. Contact details can't be shared.</DialogDescription></DialogHeader>
                    {chatQuote && <PlanChat postPath={`/events/quotes/${chatQuote.id}/messages`} invalidateKey={["chef-quotes"]} messages={chatQuote.messages} viewerRole="chef" otherName={chatQuote.customerFirstName} />}
                </DialogContent>
            </Dialog>
        </div>
    );
};
