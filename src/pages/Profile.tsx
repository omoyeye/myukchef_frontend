import { peopleLabel } from "@/lib/area";
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CustomerPortal } from '@/components/layout/CustomerPortal';
import { BOOKING_STATUS } from '@/lib/eventBookings';
import { AccountData } from '@/components/account/AccountData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, LogOut, ChevronRight, Leaf, Gift, Clock, Plus, Trash2, Zap, Ticket, CalendarHeart, Heart, Receipt, Wallet as WalletIcon } from 'lucide-react';
import { ActionTile, greeting, HeroStat, LiveDot, PortalHero, rise } from '@/components/portal/PortalBits';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import SEO from '@/components/common/SEO';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { pounds, useWallet, WalletNudge, WalletPanel } from '@/components/wallet/wallet';

interface Address {
    id: number;
    name: string;
    street: string;
    city: string;
    postcode: string;
    isDefault: boolean;
}

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
    selectedModifiers?: any[];
    product: {
        id: string;
        name: string;
        image: string;
        description: string;
        price: number;
        category: string;
    };
}

interface Order {
    id: number;
    status: string;
    total: number;
    createdAt: string;
    items: OrderItem[];
}

interface EventBooking {
    id: number;
    eventName: string;
    eventDate: string;
    eventTime: string;
    headcount: number;
    adults?: number | null;
    kids?: number;
    venue: string;
    status: string;
    estimatedTotal: number;
    finalTotal?: number | null;
    quoteCount?: number;
    quotesIn?: number;
}

const Profile = () => {
    const { user, logout } = useAuth();
    const { addItem, clearCart } = useCart();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
    const [newAddress, setNewAddress] = useState({ name: '', street: '', city: '', postcode: '' });

    // Fetch Orders
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
        queryKey: ['my-orders'],
        queryFn: async () => {
            return api.get('/orders/my-orders');
        },
        enabled: !!user
    });

    // Meal plans and wallet, for the welcome card.
    const { data: plans = [] } = useQuery<{ status: string }[]>({ queryKey: ['my-plans'], queryFn: () => api.get('/meal-plans/mine'), enabled: !!user });
    const { data: wallet } = useWallet();

    // Fetch Addresses
    const { data: addresses = [], isLoading: isLoadingAddresses } = useQuery<Address[]>({
        queryKey: ['my-addresses'],
        queryFn: async () => {
            return api.get('/addresses');
        },
        enabled: !!user
    });

    // Fetch Event Bookings
    const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<EventBooking[]>({
        queryKey: ['my-events'],
        queryFn: () => api.get('/events/me'),
        enabled: !!user
    });

    // Add Address Mutation
    const addAddressMutation = useMutation({
        mutationFn: async (address: typeof newAddress) => {
            return api.post('/addresses', address);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
            setIsAddressDialogOpen(false);
            setNewAddress({ name: '', street: '', city: '', postcode: '' });
            toast.success("Address added successfully");
        },
        onError: () => toast.error("Failed to add address")
    });

    // Delete Address Mutation
    const deleteAddressMutation = useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`/addresses/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
            toast.success("Address deleted");
        }
    });

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    const handleAddAddress = (e: React.FormEvent) => {
        e.preventDefault();
        addAddressMutation.mutate(newAddress);
    };

    const DONE = ['delivered', 'completed', 'cancelled'];
    const liveOrders = orders.filter((o) => !DONE.includes(o.status)).length;

    if (!user) {
        return (
            <Layout>
                <div className="container py-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
                    <p className="text-muted-foreground mb-8">Access your profile, wallet and order history.</p>
                    <Link to="/login?redirect=%2Fprofile"><Button>Log In / Sign Up</Button></Link>
                </div>
            </Layout>
        );
    }

    return (
        <CustomerPortal>
            <SEO noindex title={`${user.name}'s Profile`} description="Manage your MYUKCHEF account, wallet, and order history." />
            <div>
                <div className="max-w-5xl space-y-4 md:space-y-6">

                    {activeTab === 'overview' ? (
                        <PortalHero>
                            <div className="flex items-center gap-4">
                                <div className="rounded-full border-2 border-primary p-1">
                                    <Avatar className="h-14 w-14 md:h-16 md:w-16"><AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">{user.name.charAt(0)}</AvatarFallback></Avatar>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-ink-foreground/70">{greeting()},</p>
                                    <h1 className="truncate font-display text-2xl font-extrabold md:text-3xl">{user.name.split(' ')[0]}</h1>
                                    <p className="truncate text-xs text-ink-foreground/60 md:text-sm">{user.email}</p>
                                </div>
                                <Button variant="ghost" size="icon" aria-label="Log out" className="h-11 w-11 shrink-0 text-ink-foreground/70 hover:bg-white/10 hover:text-ink-foreground" onClick={logout}>
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex gap-2 sm:gap-3">
                                <HeroStat value={orders.length} label="Orders" />
                                <HeroStat value={plans.filter((p) => ['active', 'requested', 'accepted'].includes(p.status)).length} label="Meal plans" />
                                <HeroStat value={wallet?.available ?? 0} label="Wallet" format={(n) => `£${n.toFixed(2)}`} />
                            </div>
                            {liveOrders > 0 && (
                                <button type="button" onClick={() => navigate(`/order-tracker/${orders.find((o) => !DONE.includes(o.status))!.id}`)} className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.08] px-4 py-3 text-left transition-colors hover:bg-white/[0.12]">
                                    <LiveDot />
                                    <span className="flex-1 text-sm font-semibold">{liveOrders === 1 ? '1 order on its way' : `${liveOrders} orders on their way`}</span>
                                    <span className="text-sm font-bold text-primary">Track</span>
                                </button>
                            )}
                        </PortalHero>
                    ) : (
                        <div className="flex items-center gap-3 md:gap-4 mb-4">
                            <Avatar className="h-14 w-14 shrink-0 md:h-20 md:w-20 border-4 border-background shadow-sm">
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-xl md:text-2xl font-bold">{user.name}</h1>
                                <p className="truncate text-sm md:text-base text-muted-foreground">{user.email}</p>
                                <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                                    <ProfileWalletBadge />
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" aria-label="Log out" className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive" onClick={logout}>
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    )}

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

                        {/* OVERVIEW TAB */}
                        <TabsContent value="overview" className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <ActionTile to="/profile?tab=history" icon={Receipt} label="My orders" hint={liveOrders ? `${liveOrders} on the way` : 'Track and reorder'} tint="bg-sky-500/15 text-sky-600 dark:text-sky-400" alert={liveOrders > 0} delay={80} />
                                <ActionTile to="/my-plans" icon={CalendarHeart} label="Meal plans" hint="Change, skip or pause" tint="bg-primary/15 text-primary" delay={140} />
                                <ActionTile to="/wallet" icon={WalletIcon} label="Wallet" hint={wallet ? `${pounds(wallet.available)} to spend` : 'Cashback and rewards'} tint="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" delay={200} />
                                <ActionTile to="/saved-chefs" icon={Heart} label="Saved chefs" hint="Chefs you love" tint="bg-pink-500/15 text-pink-600 dark:text-pink-400" delay={260} />
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                                <div className="hero-rise space-y-6" style={rise(320)}>
                                {/* Recent Activity Mini-List */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" /> Recent Orders
                                    </h3>
                                    <div className="space-y-3">
                                        {isLoadingOrders ? (
                                            <Skeleton className="h-20 w-full" />
                                        ) : orders.length > 0 ? (
                                            orders.slice(0, 2).map(order => (
                                                <div key={order.id} className="bg-background rounded-xl p-4 border shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/order-tracker/${order.id}`)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors uppercase font-black italic">
                                                            M
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">Order #{order.id}</p>
                                                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="capitalize">{order.status}</Badge>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No orders yet. Let's change that!</p>
                                        )}
                                        <Button variant="link" className="w-full text-primary font-bold uppercase tracking-widest text-xs" onClick={() => handleTabChange('history')}>
                                            View Full History <ChevronRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Addresses Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-primary" /> Delivery Spots
                                        </h3>
                                        <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="h-11 gap-1 rounded-lg md:h-9">
                                                    <Plus className="h-3 w-3" /> Add Spot
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add New Spot</DialogTitle>
                                                    <DialogDescription>Where should we deliver your orders?</DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleAddAddress}>
                                                    <div className="space-y-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="name">Label (e.g. Home Base)</Label>
                                                            <Input id="name" placeholder="Home, Office..." value={newAddress.name} onChange={e => setNewAddress({ ...newAddress, name: e.target.value })} required />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="street">Street Address</Label>
                                                            <Input id="street" placeholder="Street and house number" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} required />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="city">City</Label>
                                                                <Input id="city" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} required />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="postcode">Postcode</Label>
                                                                <Input id="postcode" value={newAddress.postcode} onChange={e => setNewAddress({ ...newAddress, postcode: e.target.value })} required />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit" disabled={addAddressMutation.isPending} className="w-full">
                                                            {addAddressMutation.isPending ? "Locking it in..." : "Save Delivery Spot"}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div className="grid gap-3">
                                        {isLoadingAddresses ? (
                                            <Skeleton className="h-24 w-full" />
                                        ) : addresses.length > 0 ? (
                                            addresses.map(addr => (
                                                <Card key={addr.id} className="p-3 md:p-4 flex justify-between items-center gap-2 shadow-sm border-muted hover:border-primary/30 transition-colors">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <div className="shrink-0 p-2 bg-secondary/50 rounded-lg text-primary mt-0.5">
                                                            <MapPin className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold leading-none mb-1 break-words">{addr.name}</p>
                                                            <p className="text-xs text-muted-foreground break-words">{addr.street}, {addr.city} {addr.postcode}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" aria-label={`Delete ${addr.name}`} className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => deleteAddressMutation.mutate(addr.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="p-6 text-center border-2 border-dashed rounded-xl bg-background/50">
                                                <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">No delivery spots saved yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                </div>
                                <div className="hero-rise space-y-6" style={rise(380)}>
                                    <WalletNudge />
                                    <AccountData />
                                </div>
                            </div>
                        </TabsContent>

                        {/* REWARDS TAB */}
                        <TabsContent value="rewards" className="space-y-6 animate-fade-in">
                            <WalletPanel />
                        </TabsContent>

                        {/* HISTORY TAB */}
                        <TabsContent value="history" className="animate-fade-in">
                            <Card className="border-none shadow-sm overflow-hidden bg-transparent">
                                <CardHeader className="px-0">
                                    <CardTitle className="text-xl font-black italic tracking-tight uppercase">Your Feast History</CardTitle>
                                    <CardDescription>Click any order to track it or view details.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-0 space-y-4">
                                    {isLoadingOrders ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-24 w-full rounded-2xl" />
                                            <Skeleton className="h-24 w-full rounded-2xl" />
                                        </div>
                                    ) : orders.length > 0 ? (
                                        orders.map(order => (
                                            <div key={order.id} className="bg-background border rounded-2xl p-4 md:p-5 hover:border-primary/50 transition-all cursor-pointer group flex items-center justify-between gap-2" onClick={() => navigate(`/order-tracker/${order.id}`)}>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black italic group-hover:bg-primary group-hover:text-white transition-colors">
                                                            M
                                                        </div>
                                                        <span className="font-black text-lg italic uppercase tracking-tight">Order #{order.id}</span>
                                                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-[9px] uppercase tracking-widest px-2 py-0">
                                                            {order.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-foreground font-medium truncate mb-1">
                                                        {order.items.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                        <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
                                                        <span className="text-primary font-black italic text-sm">£{order.total.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1 md:gap-3">
                                                    <Button variant="ghost" size="sm" className="h-11 px-2 rounded-lg font-bold uppercase tracking-tighter text-xs" onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearCart();
                                                        order.items.forEach(item => {
                                                            if (item.product) {
                                                                addItem(item.product as any, item.quantity, item.selectedModifiers || []);
                                                            }
                                                        });
                                                        toast.success("Feast added to cart!");
                                                        navigate('/cart');
                                                    }}>REORDER</Button>
                                                    <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 bg-background rounded-3xl border-2 border-dashed">
                                            <div className="bg-secondary/20 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Clock className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <h3 className="font-black italic text-xl uppercase tracking-tighter mb-2">No feasts yet?</h3>
                                            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Your order history will appear here after your first order.</p>
                                            <Button asChild className="rounded-xl px-10 py-6 text-lg font-black italic uppercase">
                                                <Link to="/menu">Order Now</Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* BOOKINGS TAB */}
                        <TabsContent value="bookings" className="space-y-3 animate-fade-in">
                            {isLoadingBookings ? (
                                <Skeleton className="h-24 w-full rounded-2xl" />
                            ) : bookings.length > 0 ? (
                                bookings.map(booking => (
                                    <div key={booking.id} className="bg-background border rounded-2xl p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="min-w-0 font-bold break-words">{booking.eventName}</h3>
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${(BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.quoting).className}`}>{(BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.quoting).label}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {new Date(booking.eventDate).toLocaleDateString()} at {booking.eventTime} · {peopleLabel(booking, booking.headcount)}
                                        </p>
                                        <p className="text-sm text-muted-foreground break-words">{booking.venue}</p>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <p className="min-w-0 text-sm font-semibold text-muted-foreground">{booking.finalTotal != null ? <span className="font-bold text-primary">£{booking.finalTotal.toFixed(2)}</span> : `${booking.quotesIn ?? 0} of ${booking.quoteCount ?? 0} chefs replied`}</p>
                                            <Button asChild variant="outline" className="h-11 shrink-0"><Link to={`/my-bookings/${booking.id}`}>View booking</Link></Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-background rounded-3xl border-2 border-dashed">
                                    <CalendarHeart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-muted-foreground text-sm mb-4">You haven't booked an event yet.</p>
                                    <Button asChild className="h-11"><Link to="/events">Get quotes for an event</Link></Button>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </CustomerPortal>
    );
};

export default Profile;

/** The wallet balance next to the person's name. */
function ProfileWalletBadge() {
    const { data } = useWallet();
    if (!data) return null;
    return (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
            <Zap className="h-3 w-3 fill-primary mr-1" />
            {pounds(data.available)} in wallet{data.pending > 0 ? ` · ${pounds(data.pending)} on its way` : ''}
        </Badge>
    );
}
