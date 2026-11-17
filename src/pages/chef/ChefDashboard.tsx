import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChefPlansPanel, ChefReviewsPanel } from "@/components/plans/ChefPlansPanel";
import { ChefOverview } from "@/components/plans/ChefPortalSections";
import { ChefOrders } from "@/components/plans/ChefOrders";
import { KitchenVideoField } from "@/components/plans/KitchenVideoField";
import { ChefQuotes, useChefQuotes } from "@/components/plans/ChefQuotes";
import { PortalItem, PortalShell } from "@/components/layout/PortalShell";
import { AllergenPicker } from "@/components/common/AllergenPicker";
import { ChefCompliance } from "@/components/plans/ChefCompliance";
import { ChefPayouts } from "@/components/payouts/ChefPayouts";
import { CookingTimes } from "@/components/plans/CookingTimes";
import { ChefEarnings } from "@/components/payouts/ChefEarnings";
import { ChefCredentials } from "@/components/credentials/ChefCredentials";
import { ChefVideos } from "@/components/social/ChefVideos";
import { WeeklyReport } from "@/components/reports/WeeklyReport";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { allergenSummary } from "@/lib/allergens";
import { useAuth } from "@/contexts/AuthContext";
import { api, uploadImage } from "@/lib/api";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SEO from "@/components/common/SEO";
import { Clapperboard, ShieldCheck, CalendarDays, CalendarHeart, ChefHat, ExternalLink, LayoutDashboard, Loader2, Plus, ShoppingBag, Star, Trash2, UserRound, Wallet, Upload, UtensilsCrossed, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { WalletPanel } from "@/components/wallet/wallet";

interface Chef {
    id: number;
    displayName: string;
    openingHours?: Record<string, { open: boolean; from: string; to: string }> | null;
    ordersPaused?: boolean;
    noticeHours?: number;
    bio: string | null;
    specialty: string | null;
    avatar: string | null;
    phone: string | null;
    location: string | null;
    serviceRadiusMiles?: number;
    yearsExperience: number | null;
    status: "pending" | "approved" | "suspended" | "rejected";
    rejectionReason: string | null;
    isAvailableForEvents: boolean;
    eventRate: number | null;
    acceptsMealPlans?: boolean;
    story?: string | null;
    kitchenVideo?: string | null;
}

interface ChefProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    status: "pending" | "approved" | "rejected";
    isSoldOut: boolean;
    allergens?: string[];
    allergensDeclared?: boolean;
}

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { variant: any; icon: any; label: string }> = {
        approved: { variant: "default", icon: CheckCircle2, label: "Approved" },
        pending: { variant: "secondary", icon: Clock, label: "Pending Review" },
        suspended: { variant: "destructive", icon: AlertCircle, label: "Suspended" },
        rejected: { variant: "destructive", icon: AlertCircle, label: "Rejected" },
    };
    const cfg = map[status] || map.pending;
    const Icon = cfg.icon;
    return (
        <Badge variant={cfg.variant} className="gap-1">
            <Icon className="h-3 w-3" /> {cfg.label}
        </Badge>
    );
};

const ChefDashboard = () => {
    const { user, logout, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Only chef accounts belong here. Anyone else goes to the chef sign-in page.
        if (!authLoading && user?.role !== "chef") navigate("/chef/login", { replace: true });
    }, [user, authLoading, navigate]);

    const { data: chef, isLoading: chefLoading } = useQuery<Chef>({
        queryKey: ["chef-me"],
        queryFn: () => api.get("/chefs/me"),
        enabled: user?.role === "chef",
        retry: false,
    });

    const { data: products = [] } = useQuery<ChefProduct[]>({
        queryKey: ["chef-me-products"],
        queryFn: () => api.get("/chefs/me/products"),
        enabled: !!chef,
    });

    const { data: quoteData } = useChefQuotes(!!chef);

    // Profile form
    const [profile, setProfile] = useState<Partial<Chef>>({});
    useEffect(() => {
        if (chef) setProfile(chef);
    }, [chef]);

    const profileMutation = useMutation({
        mutationFn: (payload: any) => api.put("/chefs/me", payload),
        onSuccess: () => {
            toast.success("Profile updated");
            qc.invalidateQueries({ queryKey: ["chef-me"] });
        },
        onError: (e: any) => toast.error(e.message),
    });

    // New product form
    const [newProduct, setNewProduct] = useState({
        name: "", description: "", price: "", category: "mains", image: "",
        isVegetarian: false, isVegan: false, isGlutenFree: false, isHalal: false,
        allergens: [] as string[], allergensDeclared: false,
    });
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "profile" | "product") => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadImage(file);
            if (target === "profile") setProfile((p) => ({ ...p, avatar: url }));
            else setNewProduct((p) => ({ ...p, image: url }));
            toast.success("Image uploaded");
        } catch (err: any) {
            toast.error(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const createProduct = useMutation({
        mutationFn: () => api.post("/chefs/me/products", { ...newProduct, price: Number(newProduct.price) }),
        onSuccess: () => {
            toast.success("Dish submitted for review!");
            setNewProduct({ name: "", description: "", price: "", category: "mains", image: "", isVegetarian: false, isVegan: false, isGlutenFree: false, isHalal: false, allergens: [], allergensDeclared: false });
            qc.invalidateQueries({ queryKey: ["chef-me-products"] });
        },
        onError: (e: any) => toast.error(e.message),
    });

    const [allergenDish, setAllergenDish] = useState<{ id: string; name: string; allergens: string[]; confirmed: boolean } | null>(null);
    const saveAllergens = useMutation({
        mutationFn: () => api.patch(`/chefs/me/products/${allergenDish!.id}/allergens`, { allergens: allergenDish!.allergens, confirmed: allergenDish!.confirmed }),
        onSuccess: () => { toast.success("Allergens confirmed"); setAllergenDish(null); qc.invalidateQueries({ queryKey: ["chef-me-products"] }); },
        onError: (e: any) => toast.error(e.message),
    });

    const deleteProduct = useMutation({
        mutationFn: (id: string) => api.delete(`/chefs/me/products/${id}`),
        onSuccess: () => {
            toast.success("Deleted");
            qc.invalidateQueries({ queryKey: ["chef-me-products"] });
        },
    });

    if (user?.role !== "chef" && !authLoading) return null;

    if (authLoading || chefLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (!chef) {
        return (
            <Layout>
                <div className="container py-10 max-w-md text-center">
                    <Card>
                        <CardHeader>
                            <CardTitle>No chef profile found</CardTitle>
                            <CardDescription>This account is not registered as a chef.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate("/chef/register")}>Apply to be a chef</Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    const isApproved = chef.status === "approved";
    const tab = searchParams.get("tab") || "overview";
    const signOut = () => { logout(); navigate("/chef/login"); };
    const section = (icon: PortalItem["icon"], label: string, id: string): PortalItem => ({ icon, label, to: id === "overview" ? "/chef/dashboard" : `/chef/dashboard?tab=${id}`, active: tab === id });
    const sections = [
        section(LayoutDashboard, "Overview", "overview"),
        section(CalendarDays, "Meal plans", "plans"),
        section(ShoppingBag, "Orders", "orders"),
        { ...section(CalendarHeart, "Event quotes", "bookings"), badge: (quoteData?.quotes ?? []).filter((q) => q.status === "requested" && ["quoting", "pending", "quotes_ready"].includes(q.event.status)).length },
        section(UtensilsCrossed, `My dishes (${products.length})`, "products"),
        ...(isApproved ? [section(Plus, "Add a dish", "add")] : []),
        section(Star, "Reviews", "reviews"),
        section(Clapperboard, "Videos", "videos"),
        section(Wallet, "Payouts", "payouts"),
        section(ShieldCheck, "Safety and certificates", "compliance"),
        section(UserRound, "My profile", "profile"),
    ];

    return (
        <PortalShell name="Chef Portal" tagline={chef.displayName} initial={chef.displayName[0] ?? "C"} items={sections} onLogout={signOut}>
            <SEO noindex title="Chef Portal" description="Manage your meal plans, dishes and profile." />
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="h-14 w-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {chef.avatar ? <img src={chef.avatar} alt={chef.displayName} className="w-full h-full object-cover" /> : <ChefHat className="h-7 w-7 text-primary" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{chef.displayName}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <StatusBadge status={chef.status} />
                                {chef.specialty && <span className="text-sm text-muted-foreground">{chef.specialty}</span>}
                            </div>
                        </div>
                    </div>
                    {isApproved && <Button asChild variant="outline" className="h-11"><a href={`/chefs/${chef.id}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View public page</a></Button>}
                </div>

                {/* Status banners */}
                {chef.status === "pending" && (
                    <Card className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                        <CardContent className="pt-6 flex gap-3 items-start">
                            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="font-semibold">Application under review</p>
                                <p className="text-sm text-muted-foreground">You can update your profile, but you'll be able to add dishes once an admin approves your account.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {chef.status === "suspended" && (
                    <Card className="mb-6 border-destructive/50 bg-destructive/5">
                        <CardContent className="pt-6 flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                                <p className="font-semibold">Account suspended</p>
                                <p className="text-sm text-muted-foreground">{chef.rejectionReason || "Please contact admin support."}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {chef.status === "rejected" && (
                    <Card className="mb-6 border-destructive/50 bg-destructive/5">
                        <CardContent className="pt-6 flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                                <p className="font-semibold">Application rejected</p>
                                <p className="text-sm text-muted-foreground">{chef.rejectionReason || "Please contact admin for details."}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs value={tab}>
                    <TabsContent value="overview" className="space-y-10"><ChefOverview enabled={isApproved} />{isApproved && <WeeklyReport who="chef" />}</TabsContent>
                    <TabsContent value="videos"><ChefVideos /></TabsContent>
                    <TabsContent value="orders"><ChefOrders enabled /></TabsContent>
                    <TabsContent value="bookings"><ChefQuotes /></TabsContent>

                    <TabsContent value="plans"><ChefPlansPanel /></TabsContent>
                    <TabsContent value="reviews"><ChefReviewsPanel /></TabsContent>
                    <TabsContent value="payouts" className="space-y-10"><section aria-labelledby="wallet-heading" className="space-y-3"><h2 id="wallet-heading" className="text-xl font-semibold">Wallet</h2><p className="text-sm text-muted-foreground">Rewards like referral credit, released by MYUKCHEF. Use it on an order or withdraw it.</p><WalletPanel /></section><ChefEarnings /><ChefPayouts /></TabsContent>
                    <TabsContent value="compliance"><div className="space-y-10"><ChefCredentials /><ChefCompliance /></div></TabsContent>

                    {/* MY PRODUCTS */}
                    <TabsContent value="products" className="space-y-4">
                        {products.length === 0 ? (
                            <Card><CardContent className="py-10 text-center text-muted-foreground">No dishes yet. {isApproved ? "Add your first dish!" : "Once approved, you can add dishes."}</CardContent></Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.map((p) => (
                                    <Card key={p.id} className="overflow-hidden">
                                        <div className="aspect-video bg-muted overflow-hidden">
                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <CardContent className="pt-4 space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-semibold">{p.name}</h3>
                                                <StatusBadge status={p.status} />
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                                            {p.allergensDeclared
                                                ? <p className="text-xs text-muted-foreground">{allergenSummary(p.allergens)}</p>
                                                : <p className="rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-950">Off sale until you confirm its allergens</p>}
                                            <Button variant="outline" className="h-11 w-full" onClick={() => setAllergenDish({ id: p.id, name: p.name, allergens: p.allergens ?? [], confirmed: false })}>{p.allergensDeclared ? "Update allergens" : "Check allergens"}</Button>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="font-bold text-primary">£{p.price.toFixed(2)}</span>
                                                <Button size="icon" variant="ghost" aria-label={`Delete ${p.name}`} className="h-11 w-11" onClick={() => deleteProduct.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ADD PRODUCT */}
                    <TabsContent value="add">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add a new dish</CardTitle>
                                <CardDescription>Submitted dishes are reviewed by admin before going live.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Dish Image *</Label>
                                    <div className="flex items-center gap-4">
                                        {newProduct.image && <img src={newProduct.image} alt="preview" className="h-20 w-20 rounded-md object-cover border" />}
                                        <label className="cursor-pointer">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "product")} />
                                            <Button type="button" variant="outline" disabled={uploading} asChild>
                                                <span><Upload className="h-4 w-4 mr-2" />{uploading ? "Uploading..." : "Upload image"}</span>
                                            </Button>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Dish Name *</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Price (£) *</Label><Input type="number" inputMode="decimal" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} /></div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="dish-notice">Extra notice for this dish (hours, optional)</Label>
                                        <Input id="dish-notice" type="number" min="0" max="168" className="sm:max-w-xs" placeholder={`Your usual ${chef.noticeHours ?? 1} hour(s)`} value={(newProduct as { noticeHours?: string }).noticeHours ?? ""} onChange={(e) => setNewProduct({ ...newProduct, noticeHours: e.target.value } as typeof newProduct)} />
                                        <p className="text-xs text-muted-foreground">For dishes that take longer, like slow-cooked stews or celebration cakes.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                                        <option value="mains">Mains</option>
                                        <option value="sides">Sides</option>
                                        <option value="drinks">Drinks</option>
                                        <option value="desserts">Desserts</option>
                                        <option value="deals">Deals</option>
                                    </select>
                                </div>
                                <div className="space-y-2"><Label>Description *</Label><Textarea rows={3} value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
                                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[["isVegetarian", "Vegetarian"], ["isVegan", "Vegan"], ["isGlutenFree", "Gluten Free"], ["isHalal", "Halal"]].map(([k, label]) => (
                                        <label key={k} className="flex items-center gap-2 text-sm">
                                            <Switch checked={(newProduct as any)[k]} onCheckedChange={(v) => setNewProduct({ ...newProduct, [k]: v })} />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <AllergenPicker idPrefix="new-dish" value={newProduct.allergens} confirmed={newProduct.allergensDeclared} onChange={(allergens) => setNewProduct({ ...newProduct, allergens })} onConfirmedChange={(allergensDeclared) => setNewProduct({ ...newProduct, allergensDeclared })} />
                                <Button onClick={() => createProduct.mutate()} disabled={createProduct.isPending || !newProduct.name || !newProduct.image || !newProduct.price || !newProduct.allergensDeclared}>
                                    <Plus className="h-4 w-4 mr-2" />{createProduct.isPending ? "Submitting..." : "Submit for Review"}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PROFILE */}
                    <TabsContent value="profile" className="space-y-6">
                        <CookingTimes chef={chef} />
                        <Card>
                            <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Avatar</Label>
                                    <div className="flex items-center gap-4">
                                        {profile.avatar && <img src={profile.avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover border" />}
                                        <label className="cursor-pointer">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "profile")} />
                                            <Button type="button" variant="outline" disabled={uploading} asChild>
                                                <span><Upload className="h-4 w-4 mr-2" />{uploading ? "Uploading..." : "Upload"}</span>
                                            </Button>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Display Name</Label><Input value={profile.displayName || ""} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Specialty</Label><Input value={profile.specialty || ""} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} /></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Phone</Label><Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Your postcode or town</Label><Input value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Used to match you with nearby customers" /><p className="text-xs text-muted-foreground">Customers only see your general area and a rough distance, never your full postcode or address.</p></div>
                                    <div className="space-y-2"><Label>How far you serve (miles)</Label><Input type="number" inputMode="numeric" min={1} max={500} value={profile.serviceRadiusMiles ?? 15} onChange={(e) => setProfile({ ...profile, serviceRadiusMiles: Number(e.target.value) })} /></div>
                                </div>
                                <div className="space-y-2"><Label>Short bio</Label><Textarea rows={3} value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="chef-story">My story</Label>
                                    <Textarea id="chef-story" rows={6} maxLength={4000} placeholder="How you learned to cook, the food you grew up with, what makes your kitchen special..." value={profile.story || ""} onChange={(e) => setProfile({ ...profile, story: e.target.value })} />
                                    <p className="text-xs text-muted-foreground">Shown on your public page. No phone numbers, emails or links.</p>
                                </div>
                                <KitchenVideoField value={profile.kitchenVideo} onChange={(kitchenVideo) => setProfile({ ...profile, kitchenVideo })} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                                    <label className="flex items-center gap-2">
                                        <Switch checked={!!profile.isAvailableForEvents} onCheckedChange={(v) => setProfile({ ...profile, isAvailableForEvents: v })} />
                                        <span>Available for private events</span>
                                    </label>
                                    <label className="flex items-center gap-2 sm:col-span-2">
                                        <Switch checked={profile.acceptsMealPlans ?? true} onCheckedChange={(v) => setProfile({ ...profile, acceptsMealPlans: v })} />
                                        <span>Taking new meal plans <span className="block text-xs text-muted-foreground">Turn this off when you're fully booked. Your current plans carry on.</span></span>
                                    </label>
                                    <div className="space-y-2"><Label>Event base rate (£)</Label><Input type="number" value={profile.eventRate || ""} onChange={(e) => setProfile({ ...profile, eventRate: Number(e.target.value) })} /></div>
                                </div>
                                <Button onClick={() => profileMutation.mutate(profile)} disabled={profileMutation.isPending}>
                                    {profileMutation.isPending ? "Saving..." : "Save changes"}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={!!allergenDish} onOpenChange={(o) => !o && setAllergenDish(null)}>
                    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                        <DialogHeader><DialogTitle>Allergens in {allergenDish?.name}</DialogTitle></DialogHeader>
                        {allergenDish && <AllergenPicker idPrefix="edit-dish" value={allergenDish.allergens} confirmed={allergenDish.confirmed} onChange={(allergens) => setAllergenDish({ ...allergenDish, allergens })} onConfirmedChange={(confirmed) => setAllergenDish({ ...allergenDish, confirmed })} />}
                        <DialogFooter><Button className="h-11" disabled={!allergenDish?.confirmed || saveAllergens.isPending} onClick={() => saveAllergens.mutate()}>{saveAllergens.isPending ? "Saving..." : "Save allergens"}</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </PortalShell>
    );
};

export default ChefDashboard;
