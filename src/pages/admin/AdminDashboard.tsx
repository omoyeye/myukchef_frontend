import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, ShieldCheck, DollarSign, ShoppingBag, Users, TrendingUp, Loader2, ChefHat, UtensilsCrossed, CalendarDays, CalendarHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/** Work waiting for a decision, each tile opening the page where it can be done. */
const NeedsAttention = () => {
    const { data: chefs = [] } = useQuery<any[]>({ queryKey: ['admin-chefs'], queryFn: () => api.get('/chefs/admin/all') });
    const { data: dishes = [] } = useQuery<any[]>({ queryKey: ['admin-chef-products'], queryFn: () => api.get('/chefs/admin/products') });
    const { data: plans = [] } = useQuery<any[]>({ queryKey: ['admin-meal-plans'], queryFn: () => api.get('/meal-plans/admin/all') });
    const { data: events = [] } = useQuery<any[]>({ queryKey: ['admin-events'], queryFn: () => api.get('/events/admin/all') });
    const { data: orderPayouts = [] } = useQuery<any[]>({ queryKey: ['admin-order-payouts'], queryFn: () => api.get('/orders/admin/payouts') });
    const tiles = [
        { label: 'Chefs to review', value: chefs.filter((c) => c.status === 'pending').length, icon: ChefHat, to: '/admin/chefs' },
        { label: 'Chef checks to verify', value: chefs.filter((c) => c.status === 'approved' && !c.complianceVerified).length, icon: ShieldCheck, to: '/admin/chefs' },
        { label: 'Dishes to review', value: dishes.filter((d) => d.status === 'pending').length, icon: UtensilsCrossed, to: '/admin/chefs' },
        { label: 'Plans waiting for a chef', value: plans.filter((p) => p.status === 'requested').length, icon: CalendarDays, to: '/admin/meal-plans' },
        { label: 'Event payments to check', value: events.filter((e) => e.paymentStatus === 'submitted').length, icon: CalendarHeart, to: '/admin/events' },
        { label: 'Order payouts to check', value: orderPayouts.filter((p) => p.payoutStatus !== 'paid').length, icon: Banknote, to: '/admin/orders?tab=payouts' },
        { label: 'Event payouts due', value: events.reduce((sum, e) => sum + (e.payoutsDue ?? 0), 0), icon: Banknote, to: '/admin/events' },
    ];
    return (
        <section aria-labelledby="attention-heading">
            <h3 id="attention-heading" className="mb-3 text-lg font-bold">Needs attention</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
                {tiles.map((t) => (
                    <Link key={t.label} to={t.to} className={`rounded-2xl border bg-card p-4 transition-colors hover:border-primary ${t.value > 0 ? 'border-primary bg-primary/5' : ''}`}>
                        <t.icon className="h-5 w-5 text-primary" />
                        <p className="mt-2 text-3xl font-bold">{t.value}</p>
                        <p className="text-sm text-muted-foreground">{t.label}</p>
                    </Link>
                ))}
            </div>
        </section>
    );
};

const AdminDashboard = () => {
    const { user } = useAuth();

    const { data: statsData, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            return api.get('/orders/stats');
        },
        enabled: !!user
    });

    const stats = [
        { title: 'Total Revenue', value: statsData?.totalRevenue || '£0.00', icon: DollarSign, change: 'all time' },
        { title: 'Active Orders', value: statsData?.activeOrders || '0', icon: ShoppingBag, change: 'real-time' },
        { title: 'Total Customers', value: statsData?.customerCount || '0', icon: Users, change: 'all time' },
        { title: 'Avg. Order Value', value: statsData?.avgOrderValue || '£0.00', icon: TrendingUp, change: 'per order' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Super Admin dashboard</h2>
                <p className="text-muted-foreground">Everything happening across customers, chefs and orders.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <NeedsAttention />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {statsData?.recentOrders?.length > 0 ? (
                                statsData.recentOrders.map((order: any) => (
                                    <div key={order.id} className="flex items-center">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">Order #{order.id}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.items?.length || 0} item(s) • {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">+£{Number(order.total).toFixed(2)}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent sales</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Popular Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {statsData?.popularItems?.length > 0 ? (
                                statsData.popularItems.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{item.name}</span>
                                        <span className="text-sm font-bold">{item.sales} orders</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
