import { peopleLabel } from "@/lib/area";
import { DocumentButton } from '@/components/common/DocumentButton';
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Search, Trash2 } from "lucide-react";
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
import { money, PLAN_STATUS, PlanDetail, planDate, planName, PlanSummary, WEEK_STATUS } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";

const PLAN_STATUSES = Object.keys(PLAN_STATUS);
const WEEK_STATUSES = ["scheduled", "skipped", "preparing", "out_for_delivery", "delivered", "missed", "cancelled"];

const MealPlanManagement = () => {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ status: "", adminNotes: "" });

    const { data: plans = [], isLoading } = useQuery<PlanSummary[]>({ queryKey: ["admin-meal-plans"], queryFn: () => api.get("/meal-plans/admin/all") });
    const { data: detail } = useQuery<PlanDetail>({ queryKey: ["meal-plan", editingId], queryFn: () => api.get(`/meal-plans/${editingId}`), enabled: editingId !== null });

    useEffect(() => {
        if (detail && detail.id === editingId) setForm({ status: detail.status, adminNotes: detail.adminNotes ?? "" });
    }, [detail, editingId]);

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ["admin-meal-plans"] });
        qc.invalidateQueries({ queryKey: ["meal-plan", editingId] });
    };
    const fail = (e: Error) => toast.error(e.message);
    const save = useMutation({ mutationFn: () => api.put(`/meal-plans/admin/${editingId}`, form), onSuccess: () => { toast.success("Plan saved"); refresh(); setEditingId(null); }, onError: fail });
    const remove = useMutation({ mutationFn: (id: number) => api.delete(`/meal-plans/admin/${id}`), onSuccess: () => { toast.success("Plan deleted"); setEditingId(null); qc.invalidateQueries({ queryKey: ["admin-meal-plans"] }); }, onError: fail });
    const weekStatus = useMutation({ mutationFn: ({ weekId, status }: { weekId: number; status: string }) => api.patch(`/meal-plans/${editingId}/weeks/${weekId}/status`, { status }), onSuccess: refresh, onError: fail });
    const weekPaid = useMutation({ mutationFn: ({ weekId, isPaid }: { weekId: number; isPaid: boolean }) => api.patch(`/meal-plans/${editingId}/weeks/${weekId}/payment`, { isPaid }), onSuccess: refresh, onError: fail });

    const term = search.trim().toLowerCase();
    const shown = plans.filter((p) => (filter === "all" || p.status === filter) && (!term || `${p.customerName} ${p.customerEmail} ${p.chefName}`.toLowerCase().includes(term)));
    const countOf = (status: string) => plans.filter((p) => p.status === status).length;
    const owed = detail?.weeks.filter((w) => w.status === "delivered" && !w.isPaid).reduce((sum, w) => sum + w.total, 0) ?? 0;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Meal Plans</h1>
                <p className="text-sm text-muted-foreground">Oversee every 1 week to 6 month plan, correct deliveries and record payments.</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[["requested", "Waiting for chef"], ["active", "Active"], ["paused", "Paused"], ["completed", "Completed"]].map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setFilter(filter === key ? "all" : key)} className={cn("rounded-2xl border bg-card p-4 text-left transition-colors", filter === key && "border-primary")}>
                        <dt className="text-sm text-muted-foreground">{label}</dt>
                        <dd className="text-3xl font-bold">{countOf(key)}</dd>
                    </button>
                ))}
            </dl>
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input aria-label="Search plans" className="h-11 pl-9 md:h-10" placeholder="Search customer or chef" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select aria-label="Filter by status" className="h-11 rounded-md border border-input bg-background px-3 md:h-10" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    {PLAN_STATUSES.map((s) => <option key={s} value={s}>{PLAN_STATUS[s].label}</option>)}
                </select>
            </div>
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Chef</TableHead><TableHead>Plan</TableHead><TableHead>Progress</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                            <TableBody>
                                {shown.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No plans found</TableCell></TableRow>}
                                {shown.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell><div className="font-medium">{p.customerName}</div><div className="text-xs text-muted-foreground">{p.customerEmail}</div></TableCell>
                                        <TableCell>{p.chefName}</TableCell>
                                        <TableCell className="whitespace-nowrap">{planName(p)}<div className="text-xs text-muted-foreground">{p.mealsPerWeek} meals for {peopleLabel(p, p.servings)}</div></TableCell>
                                        <TableCell className="whitespace-nowrap">{p.weeksDelivered}/{p.weeksTotal}</TableCell>
                                        <TableCell>{money(p.estimatedTotal)}</TableCell>
                                        <TableCell><span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", PLAN_STATUS[p.status]?.className)}>{PLAN_STATUS[p.status]?.label}</span></TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" aria-label={`Edit ${p.customerName}'s plan`} className="h-10 w-10" onClick={() => setEditingId(p.id)}><Pencil className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" aria-label={`Delete ${p.customerName}'s plan`} className="h-10 w-10 text-destructive" onClick={() => { if (confirm(`Delete ${p.customerName}'s plan and all of its deliveries and messages?`)) remove.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
                    {!detail || detail.id !== editingId ? (
                        <div className="flex justify-center py-12"><DialogTitle className="sr-only">Loading plan</DialogTitle><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <form className="min-w-0 space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                            <DialogHeader>
                                <DialogTitle>Plan #{detail.id}: {detail.customerName} with {detail.chef.displayName}</DialogTitle>
                                <DialogDescription>{planName(detail)}, {detail.mealsPerWeek} meals for {peopleLabel(detail, detail.servings)}, {planDate(detail.startDate, "d MMM yyyy")} to {planDate(detail.endDate, "d MMM yyyy")}. {detail.deliveryAddress.street}, {detail.deliveryAddress.postcode}. {detail.deliveryAddress.phone}</DialogDescription>
                            </DialogHeader>
                            {owed > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-950">{money(owed)} delivered and not yet marked as paid.</p>}
                            <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                                <div className="space-y-2">
                                    <Label htmlFor="plan-status">Plan status</Label>
                                    <select id="plan-status" className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                        {PLAN_STATUSES.map((s) => <option key={s} value={s}>{PLAN_STATUS[s].label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2"><Label htmlFor="plan-admin-notes">Internal notes</Label><Textarea id="plan-admin-notes" rows={2} value={form.adminNotes} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} /></div>
                            </div>
                            <div className="rounded-2xl border">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Dishes</TableHead><TableHead>Total</TableHead><TableHead>Delivery</TableHead><TableHead>Paid</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {detail.weeks.map((w) => (
                                            <TableRow key={w.id}>
                                                <TableCell className="whitespace-nowrap">{planDate(w.deliveryDate, "d MMM yy")}</TableCell>
                                                <TableCell className="min-w-40 text-xs">{w.items.map((i) => `${i.meals} × ${i.name}`).join(", ")}</TableCell>
                                                <TableCell>{money(w.total)}</TableCell>
                                                <TableCell>
                                                    <select aria-label={`Week ${w.weekNumber} delivery status`} className="h-10 rounded-md border border-input bg-background px-2 text-sm" value={w.status} onChange={(e) => weekStatus.mutate({ weekId: w.id, status: e.target.value })}>
                                                        {[...new Set([w.status, ...WEEK_STATUSES])].map((s) => <option key={s} value={s}>{WEEK_STATUS[s]?.label ?? s}</option>)}
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Checkbox aria-label={`Week ${w.weekNumber} paid`} checked={w.isPaid} onCheckedChange={(v) => weekPaid.mutate({ weekId: w.id, isPaid: !!v })} />
                                                        {w.total > 0 && <DocumentButton path={`plan-weeks/${w.id}`} iconOnly variant="ghost" size="icon" className="h-9 w-9" label={w.isPaid ? `Week ${w.weekNumber} receipt` : `Week ${w.weekNumber} invoice`} />}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Close</Button>
                                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save plan"}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MealPlanManagement;
