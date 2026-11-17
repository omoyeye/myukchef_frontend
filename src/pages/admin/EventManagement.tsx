import { peopleLabel } from "@/lib/area";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Banknote, Check, Loader2, Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { ATTENDANCE_LABEL, BOOKING_STATUS, QUOTE_STATUS } from "@/lib/eventBookings";
import { money } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";

const STATUSES = ["quoting", "quotes_ready", "awaiting_payment", "confirmed", "in_progress", "completed", "cancelled"];
const PAYMENT: Record<string, { label: string; className: string }> = {
    unpaid: { label: "Unpaid", className: "bg-muted text-muted-foreground" },
    submitted: { label: "Check payment", className: "bg-primary text-primary-foreground" },
    paid: { label: "Paid", className: "bg-emerald-100 text-emerald-900" },
    refunded: { label: "Refunded", className: "bg-secondary text-secondary-foreground" },
};
const EMPTY = { eventName: "", eventDate: "", eventTime: "", headcount: 50, adults: 50 as number | string, kids: 0 as number | string, venue: "", contactPhone: "", contactEmail: "", specialRequests: "", adminNotes: "", status: "quoting" };
const Pill = ({ s }: { s?: { label: string; className: string } }) => <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", s?.className)}>{s?.label}</span>;

const EventManagement = () => {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [form, setForm] = useState<(typeof EMPTY & { id?: number }) | null>(null);
    const [openId, setOpenId] = useState<number | null>(null);
    const [inviteChef, setInviteChef] = useState("");

    const { data: bookings = [], isLoading } = useQuery<any[]>({ queryKey: ["admin-events"], queryFn: () => api.get("/events/admin/all") });
    const { data: chefs = [] } = useQuery<any[]>({ queryKey: ["admin-chefs"], queryFn: () => api.get("/chefs/admin/all") });
    const { data: detail } = useQuery<any>({ queryKey: ["admin-event", openId], queryFn: () => api.get(`/events/admin/${openId}`), enabled: openId !== null });
    useEffect(() => setInviteChef(""), [openId]);

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ["admin-events"] });
        qc.invalidateQueries({ queryKey: ["admin-event"] });
    };
    const fail = (e: Error) => toast.error(e.message);
    const save = useMutation({
        mutationFn: ({ id, ...body }: typeof EMPTY & { id?: number }) => (id ? api.put(`/events/admin/${id}`, body) : api.post("/events/admin", body)),
        onSuccess: () => { toast.success("Booking saved"); setForm(null); refresh(); },
        onError: fail,
    });
    const remove = useMutation({ mutationFn: (id: number) => api.delete(`/events/admin/${id}`), onSuccess: () => { toast.success("Booking deleted"); setOpenId(null); refresh(); }, onError: fail });
    const payment = useMutation({
        mutationFn: (status: string) => api.post(`/events/admin/${openId}/payment`, { status }),
        onSuccess: () => { toast.success("Payment updated"); refresh(); },
        onError: fail,
    });
    const updateQuote = useMutation({ mutationFn: ({ id, ...body }: { id: number; payoutStatus?: string; attended?: boolean }) => api.patch(`/events/admin/quotes/${id}`, body), onSuccess: refresh, onError: fail });
    const invite = useMutation({
        mutationFn: () => api.post(`/events/admin/${openId}/quotes`, { chefId: Number(inviteChef) }),
        onSuccess: () => { toast.success("Chef asked to quote"); setInviteChef(""); refresh(); },
        onError: fail,
    });

    const field = (key: keyof typeof EMPTY) => ({
        value: form?.[key] ?? "",
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => form && setForm({ ...form, [key]: e.target.value }),
    });

    const term = search.trim().toLowerCase();
    const shown = bookings.filter((b) => (filter === "all" || b.status === filter || (filter === "check_payment" && b.paymentStatus === "submitted") || (filter === "payouts" && b.payoutsDue > 0)) && (!term || `${b.eventName} ${b.customerName} ${b.customerEmail} ${(b.chefNames ?? []).join(" ")}`.toLowerCase().includes(term)));
    const tiles = [
        { key: "quoting", label: "Waiting for quotes", value: bookings.filter((b) => b.status === "quoting").length },
        { key: "awaiting_payment", label: "Awaiting payment", value: bookings.filter((b) => b.status === "awaiting_payment").length },
        { key: "check_payment", label: "Payments to check", value: bookings.filter((b) => b.paymentStatus === "submitted").length },
        { key: "payouts", label: "Chef payouts due", value: bookings.reduce((sum, b) => sum + (b.payoutsDue ?? 0), 0) },
    ];

    const accepted = detail?.quotes?.filter((q: any) => q.status === "accepted") ?? [];
    const paidOut = accepted.filter((q: any) => q.payoutStatus === "paid").reduce((sum: number, q: any) => sum + (q.payoutAmount ?? 0), 0);
    const payoutTotal = accepted.reduce((sum: number, q: any) => sum + (q.payoutAmount ?? 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Event Bookings</h1>
                    <p className="text-sm text-muted-foreground">Follow quotes, receive the customer's payment and pay each chef their share.</p>
                </div>
                <Button className="h-11 md:h-10" onClick={() => setForm({ ...EMPTY })}><Plus className="mr-2 h-4 w-4" />Add booking</Button>
            </div>

            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {tiles.map((t) => (
                    <button key={t.key} type="button" onClick={() => setFilter(filter === t.key ? "all" : t.key)} className={cn("rounded-2xl border bg-card p-4 text-left transition-colors", filter === t.key && "border-primary")}>
                        <dt className="text-sm text-muted-foreground">{t.label}</dt>
                        <dd className="text-3xl font-bold">{t.value}</dd>
                    </button>
                ))}
            </dl>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Search bookings" className="h-11 pl-9 md:h-10" placeholder="Search event, customer or chef" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Chefs</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                            <TableBody>
                                {shown.length === 0 && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No bookings found</TableCell></TableRow>}
                                {shown.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell><button type="button" className="min-h-10 text-left font-medium hover:text-primary hover:underline" onClick={() => setOpenId(b.id)}>{b.eventName}</button><div className="text-xs text-muted-foreground">{b.headcount} guests · {peopleLabel(b, b.headcount)}</div></TableCell>
                                        <TableCell>{b.customerName}<div className="text-xs text-muted-foreground">{b.customerEmail}</div></TableCell>
                                        <TableCell className="whitespace-nowrap">{format(new Date(b.eventDate), "d MMM yyyy")}</TableCell>
                                        <TableCell className="min-w-32">{b.quotesIn}/{b.quoteCount} replied<div className="text-xs text-muted-foreground">{(b.chefNames ?? []).join(", ")}</div></TableCell>
                                        <TableCell>{b.finalTotal != null ? money(b.finalTotal) : <span className="text-muted-foreground">-</span>}</TableCell>
                                        <TableCell><Pill s={PAYMENT[b.paymentStatus]} /></TableCell>
                                        <TableCell><Pill s={BOOKING_STATUS[b.status] ?? { label: b.status, className: "bg-secondary" }} /></TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button size="sm" variant="outline" className="h-10" onClick={() => setOpenId(b.id)}>Manage</Button>
                                                <Button size="icon" variant="ghost" aria-label={`Edit ${b.eventName}`} className="h-10 w-10" onClick={() => setForm({ ...EMPTY, ...b, id: b.id, adults: b.adults ?? b.headcount, kids: b.kids ?? 0, specialRequests: b.specialRequests ?? "", adminNotes: b.adminNotes ?? "", eventDate: format(new Date(b.eventDate), "yyyy-MM-dd") })}><Pencil className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" aria-label={`Delete ${b.eventName}`} className="h-10 w-10 text-destructive" onClick={() => { if (confirm(`Delete the booking "${b.eventName}" and its quotes?`)) remove.mutate(b.id); }}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* MANAGE: quotes, payment, payouts */}
            <Dialog open={openId !== null} onOpenChange={(o) => !o && setOpenId(null)}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
                    {!detail || detail.id !== openId ? (
                        <div className="flex justify-center py-12"><DialogTitle className="sr-only">Loading booking</DialogTitle><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="min-w-0 space-y-5">
                            <DialogHeader>
                                <DialogTitle>{detail.eventName}</DialogTitle>
                                <DialogDescription>{format(new Date(detail.eventDate), "EEE d MMMM yyyy")} at {detail.eventTime}, {detail.headcount} guests ({peopleLabel(detail, detail.headcount)}). {detail.venue}. Customer: {detail.customerName}, {detail.contactPhone}, {detail.contactEmail}. Staff only, never shown to chefs.</DialogDescription>
                            </DialogHeader>

                            <section className="rounded-2xl border p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="flex items-center gap-2 font-bold"><Banknote className="h-4 w-4 text-primary" />Customer payment</h3>
                                        <p className="text-sm text-muted-foreground">Reference <span className="font-semibold text-foreground">{detail.reference}</span>{detail.finalTotal != null ? ` · ${money(detail.finalTotal)}` : " · customer hasn't confirmed yet"}</p>
                                    </div>
                                    <Pill s={PAYMENT[detail.paymentStatus]} />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {detail.status === "awaiting_payment" && <Button className="h-11" disabled={payment.isPending} onClick={() => { if (confirm(`Confirm ${money(detail.finalTotal)} has arrived in the company account? The chefs will get the venue details.`)) payment.mutate("paid"); }}><Check className="mr-2 h-4 w-4" />Full payment received</Button>}
                                    {detail.paymentStatus === "submitted" && <Button variant="outline" className="h-11" disabled={payment.isPending} onClick={() => payment.mutate("unpaid")}>Not received yet</Button>}
                                    {detail.paymentStatus === "paid" && <Button variant="ghost" className="h-11 text-destructive" disabled={payment.isPending} onClick={() => { if (confirm("Record that this customer has been refunded? This cancels the booking.")) payment.mutate("refunded"); }}>Mark as refunded</Button>}
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-2 font-bold">Chefs and quotes</h3>
                                <div className="rounded-2xl border">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Chef</TableHead><TableHead>Quote</TableHead><TableHead>Customer pays</TableHead><TableHead>Status</TableHead><TableHead>Attending</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {detail.quotes.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No chefs asked yet</TableCell></TableRow>}
                                            {detail.quotes.map((q: any) => (
                                                <TableRow key={q.id}>
                                                    <TableCell className="font-medium">{q.chef.displayName}{q.preferences && <div className="max-w-48 text-xs font-normal text-muted-foreground">{q.preferences}</div>}</TableCell>
                                                    <TableCell className="min-w-40 text-xs">{(q.items ?? []).map((i: any) => `${i.quantity} × ${i.name}${i.unitPrice != null ? ` @ ${money(i.unitPrice)}` : ""}`).join(", ") || "From notes"}{q.serviceFee > 0 && <div>+ {money(q.serviceFee)} service</div>}</TableCell>
                                                    <TableCell>{q.total != null ? money(q.total) : "-"}</TableCell>
                                                    <TableCell><Pill s={QUOTE_STATUS[q.status]} /></TableCell>
                                                    <TableCell className="min-w-28 text-xs">{q.willAttend ? ATTENDANCE_LABEL[q.willAttend] : "-"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {["quoting", "pending", "quotes_ready"].includes(detail.status) && (
                                    <div className="mt-2 flex flex-wrap items-end gap-2">
                                        <div className="min-w-48 flex-1 space-y-1">
                                            <Label htmlFor="invite-chef">Ask another chef to quote</Label>
                                            <select id="invite-chef" className="h-11 w-full rounded-md border border-input bg-background px-3" value={inviteChef} onChange={(e) => setInviteChef(e.target.value)}>
                                                <option value="">Choose a chef</option>
                                                {chefs.filter((c) => c.status === "approved" && !detail.quotes.some((q: any) => q.chefId === c.id)).map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                            </select>
                                        </div>
                                        <Button variant="outline" className="h-11" disabled={!inviteChef || invite.isPending} onClick={() => invite.mutate()}><UserPlus className="mr-2 h-4 w-4" />Ask chef</Button>
                                    </div>
                                )}
                            </section>

                            {detail.paymentStatus === "paid" && (
                                <section>
                                    <h3 className="font-bold">Distribution to chefs</h3>
                                    <p className="mb-2 text-sm text-muted-foreground">Paid out {money(paidOut)} of {money(payoutTotal)}. MYUKCHEF keeps {money((detail.finalTotal ?? 0) - payoutTotal)}. Send the money by bank, then tick it here.</p>
                                    <div className="rounded-2xl border">
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Chef</TableHead><TableHead>Quote</TableHead><TableHead>Commission</TableHead><TableHead>Pay chef</TableHead><TableHead>Attended</TableHead><TableHead>Paid</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {accepted.map((q: any) => (
                                                    <TableRow key={q.id}>
                                                        <TableCell className="font-medium">{q.chef.displayName}<div className={`text-xs font-normal ${q.payoutBank ? "text-muted-foreground" : "text-destructive"}`}>{q.payoutBank ? `${q.payoutBank.name}, ${q.payoutBank.sortCode}, ${q.payoutBank.accountNumber}` : "No bank details yet"}</div></TableCell>
                                                        <TableCell>{money(q.total ?? 0)}</TableCell>
                                                        <TableCell>{q.commissionPercent}%</TableCell>
                                                        <TableCell className="font-bold">{money(q.payoutAmount ?? 0)}</TableCell>
                                                        <TableCell><Checkbox aria-label={`${q.chef.displayName} attended`} checked={!!q.attended} onCheckedChange={(v) => updateQuote.mutate({ id: q.id, attended: !!v })} /></TableCell>
                                                        <TableCell><Checkbox aria-label={`${q.chef.displayName} has been paid`} checked={q.payoutStatus === "paid"} onCheckedChange={(v) => updateQuote.mutate({ id: q.id, payoutStatus: v ? "paid" : "pending" })} /></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </section>
                            )}
                            <DialogFooter><Button variant="outline" className="h-11" onClick={() => setOpenId(null)}>Close</Button></DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* EDIT */}
            <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                    {form && (
                        <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-3">
                            <DialogHeader>
                                <DialogTitle>{form.id ? `Edit booking #${form.id}` : "Add booking"}</DialogTitle>
                                {!form.id && <DialogDescription>For bookings taken outside the app. Add it, then open Manage to ask chefs to quote.</DialogDescription>}
                            </DialogHeader>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2"><Label htmlFor="ev-name">Event name *</Label><Input id="ev-name" required {...field("eventName")} /></div>
                                <div className="space-y-2"><Label htmlFor="ev-date">Date *</Label><Input id="ev-date" type="date" required {...field("eventDate")} /></div>
                                <div className="space-y-2"><Label htmlFor="ev-time">Time *</Label><Input id="ev-time" type="time" required {...field("eventTime")} /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2"><Label htmlFor="ev-adults">Adults *</Label><Input id="ev-adults" type="number" inputMode="numeric" min={0} required {...field("adults")} /></div>
                                    <div className="space-y-2"><Label htmlFor="ev-kids">Children</Label><Input id="ev-kids" type="number" inputMode="numeric" min={0} {...field("kids")} /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ev-status">Status</Label>
                                    <select id="ev-status" className="h-10 w-full rounded-md border border-input bg-background px-3" {...field("status")}>
                                        {STATUSES.map((s) => <option key={s} value={s}>{BOOKING_STATUS[s]?.label ?? s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2 sm:col-span-2"><Label htmlFor="ev-venue">Venue *</Label><Input id="ev-venue" required {...field("venue")} /></div>
                                <div className="space-y-2"><Label htmlFor="ev-phone">Contact phone *</Label><Input id="ev-phone" type="tel" required {...field("contactPhone")} /></div>
                                <div className="space-y-2"><Label htmlFor="ev-email">Contact email *</Label><Input id="ev-email" type="email" required {...field("contactEmail")} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="ev-requests">Requests for all chefs</Label><Textarea id="ev-requests" rows={2} {...field("specialRequests")} /></div>
                            <div className="space-y-2"><Label htmlFor="ev-notes">Internal notes</Label><Textarea id="ev-notes" rows={2} {...field("adminNotes")} /></div>
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
                                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save booking"}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EventManagement;
