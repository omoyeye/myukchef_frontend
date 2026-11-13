import { useState } from "react";
import { AllergenPicker } from "@/components/common/AllergenPicker";
import { KitchenVideoField } from "@/components/plans/KitchenVideoField";
import { COMPLIANCE_GROUPS } from "@/components/plans/ChefCompliance";
import { Link, useSearchParams } from "react-router-dom";
import { AdminCredentials } from "@/components/credentials/AdminCredentials";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2, Pause, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, uploadImage, API_URL, authHeaders } from "@/lib/api";
import { categories } from "@/data/categories";

const DIETARY = [["isVegetarian", "Vegetarian"], ["isVegan", "Vegan"], ["isGlutenFree", "Gluten free"], ["isHalal", "Halal"], ["isPopular", "Popular"], ["isSoldOut", "Sold out"]] as const;

const EMPTY_CHEF = { email: "", password: "", displayName: "", specialty: "", location: "", phone: "", bio: "", yearsExperience: "", eventRate: "", serviceRadiusMiles: 15, isAvailableForEvents: true, acceptsMealPlans: true, hygieneRating: "" as string | number, avatar: "", coverImage: "", story: "", kitchenVideo: "" };
const EMPTY_DISH = { chefId: "", name: "", description: "", price: "", category: "mains", image: "", allergens: [] as string[], allergensDeclared: false, isVegetarian: false, isVegan: false, isGlutenFree: false, isHalal: false, isPopular: false, isSoldOut: false, calories: "" };

const statusVariant = (s: string) => ({ approved: "default", suspended: "destructive", rejected: "destructive" } as Record<string, "default" | "destructive">)[s] ?? "secondary";

const ImageField = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (url: string) => void }) => {
    const [busy, setBusy] = useState(false);
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-3">
                {value && <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-md border object-cover" />}
                <label className="inline-flex min-h-10 cursor-pointer items-center rounded-md border px-3 text-sm font-medium hover:bg-secondary">
                    <input
                        id={id}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setBusy(true);
                            try { onChange(await uploadImage(file)); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
                        }}
                    />
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload
                </label>
            </div>
        </div>
    );
};

const ChefManagement = () => {
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const [complianceChef, setComplianceChef] = useState<any>(null);
    const { data: complianceRecord } = useQuery<any>({ queryKey: ["admin-compliance", complianceChef?.id], queryFn: () => api.get(`/chefs/admin/${complianceChef.id}/compliance`), enabled: !!complianceChef });
    const verify = useMutation({
        mutationFn: (verified: boolean) => api.patch(`/chefs/admin/${complianceChef.id}/compliance`, { verified }),
        onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-chefs"] }); qc.invalidateQueries({ queryKey: ["admin-compliance"] }); },
        onError: (e: Error) => toast.error(e.message),
    });
    const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
    const downloadReport = async () => {
        const response = await fetch(`${API_URL}/chefs/admin/seller-report?year=${reportYear}`, { headers: authHeaders() });
        if (!response.ok) return toast.error("Couldn't create the report");
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = `myukchef-sellers-${reportYear}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };
    const [chefForm, setChefForm] = useState<(typeof EMPTY_CHEF & { id?: number }) | null>(null);
    const [dishForm, setDishForm] = useState<(typeof EMPTY_DISH & { id?: string }) | null>(null);
    const [reasonChef, setReasonChef] = useState<{ id: number; displayName: string; action: string } | null>(null);
    const [reason, setReason] = useState("");

    const { data: chefs = [], isLoading } = useQuery<any[]>({ queryKey: ["admin-chefs"], queryFn: () => api.get("/chefs/admin/all") });
    const { data: dishes = [] } = useQuery<any[]>({ queryKey: ["admin-chef-products"], queryFn: () => api.get("/chefs/admin/products") });

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ["admin-chefs"] });
        qc.invalidateQueries({ queryKey: ["admin-chef-products"] });
    };
    const onError = (e: Error) => toast.error(e.message);

    const saveChef = useMutation({
        mutationFn: ({ id, ...body }: typeof EMPTY_CHEF & { id?: number }) => (id ? api.put(`/chefs/admin/${id}`, body) : api.post("/chefs/admin", body)),
        onSuccess: () => { toast.success("Chef saved"); setChefForm(null); refresh(); },
        onError,
    });
    const updateStatus = useMutation({
        mutationFn: (d: { id: number; status: string; rejectionReason?: string }) => api.patch(`/chefs/${d.id}/status`, d),
        onSuccess: () => { toast.success("Status updated"); setReasonChef(null); setReason(""); refresh(); },
        onError,
    });
    const deleteChef = useMutation({
        mutationFn: (id: number) => api.delete(`/chefs/${id}`),
        onSuccess: () => { toast.success("Chef deleted"); refresh(); },
        onError,
    });
    const saveDish = useMutation({
        mutationFn: ({ id, ...body }: typeof EMPTY_DISH & { id?: string }) => (id ? api.put(`/chefs/admin/products/${id}`, body) : api.post("/chefs/admin/products", body)),
        onSuccess: () => { toast.success("Dish saved"); setDishForm(null); refresh(); },
        onError,
    });
    const moderateDish = useMutation({
        mutationFn: (d: { id: string; status: string }) => api.patch(`/chefs/admin/products/${d.id}/status`, { status: d.status }),
        onSuccess: () => { toast.success("Dish updated"); refresh(); },
        onError,
    });
    const deleteDish = useMutation({
        mutationFn: (id: string) => api.delete(`/chefs/admin/products/${id}`),
        onSuccess: () => { toast.success("Dish deleted"); refresh(); },
        onError,
    });

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const pending = dishes.filter((d) => d.status === "pending").length;
    const tab = ["dishes", "credentials"].includes(params.get("tab") ?? "") ? params.get("tab")! : "chefs";

    return (
        <div>
            <h1 className="mb-4 text-2xl font-bold">Chefs & Chef Dishes</h1>
            <Tabs value={tab} onValueChange={(v) => setParams(v === "chefs" ? {} : { tab: v })}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <TabsList className="h-11">
                        <TabsTrigger className="h-9" value="chefs">Chefs ({chefs.length})</TabsTrigger>
                        <TabsTrigger className="h-9" value="dishes">Dishes ({dishes.length}{pending ? `, ${pending} to review` : ""})</TabsTrigger>
                        <TabsTrigger className="h-9" value="credentials">Certificates</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="chefs" className="space-y-3">
                    <Button className="h-11 md:h-10" onClick={() => setChefForm({ ...EMPTY_CHEF })}><Plus className="mr-2 h-4 w-4" />Add chef</Button>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Name</TableHead><TableHead>Specialty</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {chefs.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No chefs yet</TableCell></TableRow>}
                                    {chefs.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.displayName}</TableCell>
                                            <TableCell>{c.specialty || "—"}</TableCell>
                                            <TableCell>{c.location || "—"}{c.location && c.latitude === null && <p className="text-xs text-destructive">Location not found</p>}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant(c.status)} className="capitalize">{c.status}</Badge>
                                                <button type="button" className={`mt-1 block min-h-8 text-left text-xs font-semibold underline ${c.complianceVerified ? "text-emerald-700" : "text-destructive"}`} onClick={() => setComplianceChef(c)}>
                                                    {c.complianceVerified ? "Checks verified" : c.complianceComplete ? "Details to verify" : "Details missing"}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {c.status !== "approved" && <Button size="sm" variant="outline" className="h-10" onClick={() => updateStatus.mutate({ id: c.id, status: "approved" })}><Check className="mr-1 h-3 w-3" />Approve</Button>}
                                                    {c.status === "approved" && <Button size="sm" variant="outline" className="h-10" onClick={() => setReasonChef({ id: c.id, displayName: c.displayName, action: "suspended" })}><Pause className="mr-1 h-3 w-3" />Suspend</Button>}
                                                    {c.status === "pending" && <Button size="sm" variant="outline" className="h-10" onClick={() => setReasonChef({ id: c.id, displayName: c.displayName, action: "rejected" })}><X className="mr-1 h-3 w-3" />Reject</Button>}
                                                    {c.status === "approved" && <Button asChild size="icon" variant="ghost" className="h-10 w-10"><Link to={`/chefs/${c.id}`} aria-label={`View ${c.displayName}'s public page`}><ExternalLink className="h-4 w-4" /></Link></Button>}
                                                    <Button size="icon" variant="ghost" aria-label={`Edit ${c.displayName}`} className="h-10 w-10" onClick={() => setChefForm({ ...EMPTY_CHEF, ...c, bio: c.bio ?? "", story: c.story ?? "", kitchenVideo: c.kitchenVideo ?? "", specialty: c.specialty ?? "", location: c.location ?? "", phone: c.phone ?? "", avatar: c.avatar ?? "", coverImage: c.coverImage ?? "", yearsExperience: c.yearsExperience ?? "", eventRate: c.eventRate ?? "", hygieneRating: c.hygieneRating ?? "" })}><Pencil className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" aria-label={`Delete ${c.displayName}`} className="h-10 w-10 text-destructive" onClick={() => { if (confirm(`Delete ${c.displayName} and all their dishes? Past orders and bookings stay on record, and their login becomes a customer account.`)) deleteChef.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="credentials"><AdminCredentials /></TabsContent>

                <TabsContent value="dishes" className="space-y-3">
                    <Button className="h-11 md:h-10" disabled={chefs.length === 0} onClick={() => setDishForm({ ...EMPTY_DISH, chefId: String(chefs[0]?.id ?? "") })}><Plus className="mr-2 h-4 w-4" />Add dish</Button>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Dish</TableHead><TableHead>Chef</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dishes.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No chef dishes yet</TableCell></TableRow>}
                                    {dishes.map((d) => (
                                        <TableRow key={d.id}>
                                            <TableCell>
                                                <div className="flex min-w-40 items-center gap-2">
                                                    <img src={d.image} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded object-cover" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium">{d.name}</p>
                                                        {!d.allergensDeclared && <p className="text-xs text-destructive">Allergens not declared</p>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{d.chefName}</TableCell>
                                            <TableCell>£{Number(d.price).toFixed(2)}</TableCell>
                                            <TableCell><Badge variant={statusVariant(d.status)} className="capitalize">{d.status}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {d.status !== "approved" && <Button size="sm" variant="outline" className="h-10" onClick={() => moderateDish.mutate({ id: d.id, status: "approved" })}><Check className="mr-1 h-3 w-3" />Approve</Button>}
                                                    {d.status !== "rejected" && <Button size="sm" variant="outline" className="h-10" onClick={() => moderateDish.mutate({ id: d.id, status: "rejected" })}><X className="mr-1 h-3 w-3" />Reject</Button>}
                                                    <Button size="icon" variant="ghost" aria-label={`Edit ${d.name}`} className="h-10 w-10" onClick={() => setDishForm({ ...EMPTY_DISH, ...d, chefId: String(d.chefId), price: String(d.price), calories: d.calories ?? "", allergens: d.allergens ?? [] })}><Pencil className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" aria-label={`Delete ${d.name}`} className="h-10 w-10 text-destructive" onClick={() => { if (confirm(`Delete ${d.name}?`)) deleteDish.mutate(d.id); }}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={!!chefForm} onOpenChange={(o) => !o && setChefForm(null)}>
                <DialogContent>
                    {chefForm && (
                        <form onSubmit={(e) => { e.preventDefault(); saveChef.mutate(chefForm); }} className="space-y-3">
                            <DialogHeader>
                                <DialogTitle>{chefForm.id ? `Edit ${chefForm.displayName}` : "Add chef"}</DialogTitle>
                                {!chefForm.id && <DialogDescription>Goes live straight away. Leave the password blank and the chef can set one with "Forgot password".</DialogDescription>}
                            </DialogHeader>
                            {!chefForm.id && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2"><Label htmlFor="chef-email">Login email *</Label><Input id="chef-email" type="email" required value={chefForm.email} onChange={(e) => setChefForm({ ...chefForm, email: e.target.value })} /></div>
                                    <div className="space-y-2"><Label htmlFor="chef-password">Password</Label><Input id="chef-password" type="password" autoComplete="new-password" minLength={8} value={chefForm.password} onChange={(e) => setChefForm({ ...chefForm, password: e.target.value })} /></div>
                                </div>
                            )}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2"><Label htmlFor="chef-name">Display name *</Label><Input id="chef-name" required value={chefForm.displayName} onChange={(e) => setChefForm({ ...chefForm, displayName: e.target.value })} /></div>
                                <div className="space-y-2"><Label htmlFor="chef-specialty">Specialty</Label><Input id="chef-specialty" value={chefForm.specialty} onChange={(e) => setChefForm({ ...chefForm, specialty: e.target.value })} /></div>
                                <div className="space-y-2"><Label htmlFor="chef-location">Postcode or town</Label><Input id="chef-location" value={chefForm.location} onChange={(e) => setChefForm({ ...chefForm, location: e.target.value })} /></div>
                                <div className="space-y-2"><Label htmlFor="chef-radius">Serves within (miles)</Label><Input id="chef-radius" type="number" inputMode="numeric" min={1} value={chefForm.serviceRadiusMiles} onChange={(e) => setChefForm({ ...chefForm, serviceRadiusMiles: Number(e.target.value) })} /></div>
                                <div className="space-y-2"><Label htmlFor="chef-phone">Phone (private)</Label><Input id="chef-phone" type="tel" value={chefForm.phone} onChange={(e) => setChefForm({ ...chefForm, phone: e.target.value })} /></div>
                                <div className="space-y-2"><Label htmlFor="chef-years">Years' experience</Label><Input id="chef-years" type="number" inputMode="numeric" min={0} value={chefForm.yearsExperience} onChange={(e) => setChefForm({ ...chefForm, yearsExperience: e.target.value })} /></div>
                                <div className="space-y-2"><Label htmlFor="chef-rate">Event rate (£)</Label><Input id="chef-rate" type="number" inputMode="decimal" min={0} value={chefForm.eventRate} onChange={(e) => setChefForm({ ...chefForm, eventRate: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="chef-hygiene">Food hygiene rating</Label>
                                <select id="chef-hygiene" className="h-10 w-full rounded-md border border-input bg-background px-3" value={chefForm.hygieneRating} onChange={(e) => setChefForm({ ...chefForm, hygieneRating: e.target.value })}>
                                    <option value="">Not checked yet (hidden)</option>
                                    {[5, 4, 3, 2, 1, 0].map((n) => <option key={n} value={n}>{n} out of 5</option>)}
                                </select>
                                <p className="text-xs text-muted-foreground">Only set this after checking the chef's listing on the Food Standards Agency website. Customers see it as a trust badge.</p>
                            </div>
                            <div className="space-y-2"><Label htmlFor="chef-bio">Bio</Label><Textarea id="chef-bio" rows={3} value={chefForm.bio} onChange={(e) => setChefForm({ ...chefForm, bio: e.target.value })} /></div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <ImageField id="chef-avatar" label="Profile photo" value={chefForm.avatar} onChange={(avatar) => setChefForm({ ...chefForm, avatar })} />
                                <ImageField id="chef-cover" label="Cover photo" value={chefForm.coverImage} onChange={(coverImage) => setChefForm({ ...chefForm, coverImage })} />
                                <div className="space-y-2 sm:col-span-2"><Label htmlFor="chef-story">Their story</Label><Textarea id="chef-story" rows={4} maxLength={4000} value={chefForm.story} onChange={(e) => setChefForm({ ...chefForm, story: e.target.value })} /></div>
                                <div className="sm:col-span-2"><KitchenVideoField value={chefForm.kitchenVideo} onChange={(kitchenVideo) => setChefForm({ ...chefForm, kitchenVideo })} /></div>
                            </div>
                            <label className="flex min-h-11 items-center gap-3"><Checkbox checked={chefForm.isAvailableForEvents} onCheckedChange={(v) => setChefForm({ ...chefForm, isAvailableForEvents: !!v })} />Available for events</label>
                            <label className="flex min-h-11 items-center gap-3"><Checkbox checked={chefForm.acceptsMealPlans} onCheckedChange={(v) => setChefForm({ ...chefForm, acceptsMealPlans: !!v })} />Taking new meal plans</label>
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setChefForm(null)}>Cancel</Button>
                                <Button type="submit" disabled={saveChef.isPending}>{saveChef.isPending ? "Saving..." : "Save chef"}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!dishForm} onOpenChange={(o) => !o && setDishForm(null)}>
                <DialogContent>
                    {dishForm && (
                        <form onSubmit={(e) => { e.preventDefault(); if (!dishForm.image) { toast.error("Please upload a dish photo"); return; } saveDish.mutate(dishForm); }} className="space-y-3">
                            <DialogHeader><DialogTitle>{dishForm.id ? `Edit ${dishForm.name}` : "Add chef dish"}</DialogTitle></DialogHeader>
                            {!dishForm.id && (
                                <div className="space-y-2">
                                    <Label htmlFor="dish-chef">Chef *</Label>
                                    <select id="dish-chef" className="h-10 w-full rounded-md border border-input bg-background px-3" value={dishForm.chefId} onChange={(e) => setDishForm({ ...dishForm, chefId: e.target.value })}>
                                        {chefs.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 space-y-2"><Label htmlFor="dish-name">Name *</Label><Input id="dish-name" required value={dishForm.name} onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })} /></div>
                                <div className="space-y-2"><Label htmlFor="dish-price">Price (£) *</Label><Input id="dish-price" type="number" inputMode="decimal" step="0.01" min="0.01" required value={dishForm.price} onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="dish-category">Category</Label>
                                    <select id="dish-category" className="h-10 w-full rounded-md border border-input bg-background px-3" value={dishForm.category} onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="dish-description">Description *</Label><Textarea id="dish-description" rows={3} required value={dishForm.description} onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })} /></div>
                            <ImageField id="dish-image" label="Dish photo *" value={dishForm.image} onChange={(image) => setDishForm({ ...dishForm, image })} />
                            <div className="grid grid-cols-2 gap-1">
                                {DIETARY.map(([key, label]) => (
                                    <label key={key} className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={dishForm[key]} onCheckedChange={(v) => setDishForm({ ...dishForm, [key]: !!v })} />{label}</label>
                                ))}
                            </div>
                            <AllergenPicker idPrefix="admin-dish" value={dishForm.allergens} confirmed={dishForm.allergensDeclared} onChange={(allergens) => setDishForm({ ...dishForm, allergens })} onConfirmedChange={(allergensDeclared) => setDishForm({ ...dishForm, allergensDeclared })} />
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setDishForm(null)}>Cancel</Button>
                                <Button type="submit" disabled={saveDish.isPending}>{saveDish.isPending ? "Saving..." : "Save dish"}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!reasonChef} onOpenChange={(o) => !o && setReasonChef(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{reasonChef?.action === "rejected" ? "Reject" : "Suspend"} {reasonChef?.displayName}</DialogTitle></DialogHeader>
                    <Textarea aria-label="Reason" placeholder="Reason (the chef will see this)" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setReasonChef(null)}>Cancel</Button>
                        <Button onClick={() => reasonChef && updateStatus.mutate({ id: reasonChef.id, status: reasonChef.action, rejectionReason: reason })}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <section className="rounded-2xl border bg-card p-4">
                <h2 className="font-bold">Yearly seller report</h2>
                <p className="text-sm text-muted-foreground">Chefs' details and sales for the year, to help you and your accountant with HMRC platform reporting. Check it against HMRC's requirements before submitting.</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Input aria-label="Report year" type="number" className="h-11 w-28" value={reportYear} onChange={(e) => setReportYear(e.target.value)} />
                    <Button variant="outline" className="h-11" onClick={downloadReport}>Download CSV</Button>
                </div>
            </section>

            <Dialog open={!!complianceChef} onOpenChange={(o) => !o && setComplianceChef(null)}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{complianceChef?.displayName}: private details</DialogTitle>
                        <DialogDescription>Check these against the chef's documents and their council's food business register before verifying.</DialogDescription>
                    </DialogHeader>
                    {COMPLIANCE_GROUPS.map((group) => (
                        <div key={group.title}>
                            <h3 className="font-semibold">{group.title}</h3>
                            <dl className="mt-1 space-y-1 text-sm">
                                {group.fields.map(([key, label]) => (
                                    <div key={key} className="flex justify-between gap-3 border-b py-1"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right font-medium">{complianceRecord?.[key] || "Not given"}</dd></div>
                                ))}
                            </dl>
                        </div>
                    ))}
                    <DialogFooter className="gap-2">
                        {complianceRecord?.verified
                            ? <Button variant="outline" className="h-11" disabled={verify.isPending} onClick={() => verify.mutate(false)}>Remove verification</Button>
                            : <Button className="h-11" disabled={verify.isPending || !complianceRecord?.complete} onClick={() => verify.mutate(true)}>{complianceRecord?.complete ? "Mark as verified" : "Details not complete"}</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ChefManagement;
