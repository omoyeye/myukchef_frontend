import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, BellRing, ChefHat, Clock, CreditCard, Eye, Loader2, PackageCheck, RefreshCw, Truck, Wallet, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AdminPayouts } from '@/components/payouts/AdminPayouts';

const STAGE: Record<string, { label: string; className: string }> = {
    awaiting_payment: { label: 'Unpaid', className: 'bg-muted text-muted-foreground' },
    received: { label: 'New', className: 'bg-amber-100 text-amber-900' },
    preparing: { label: 'Cooking', className: 'bg-orange-100 text-orange-900' },
    delivery: { label: 'On its way', className: 'bg-sky-100 text-sky-900' },
    completed: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-900' },
    cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
};
const COLUMNS = [
    { status: 'awaiting_payment', title: 'Awaiting payment', icon: CreditCard },
    { status: 'received', title: 'New', icon: Clock },
    { status: 'preparing', title: 'Cooking', icon: ChefHat },
    { status: 'delivery', title: 'On its way', icon: Truck },
    { status: 'completed', title: 'Delivered', icon: PackageCheck },
    { status: 'cancelled', title: 'Cancelled', icon: XCircle },
];
interface ChefStage { chefId: number; chefName: string; status: string }
interface AdminOrder {
    id: number;
    status: string;
    paymentStatus?: string;
    total: number;
    createdAt: string;
    deliveryAddress?: { firstName?: string; lastName?: string; method?: string } | null;
    items: { id: number; quantity: number; product?: { name: string } | null }[];
    chefProgress?: ChefStage[];
}
const money = (n: number) => `£${Number(n).toFixed(2)}`;
const Pill = ({ status }: { status: string }) => {
    const s = STAGE[status] ?? STAGE.received;
    return <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold', s.className)}>{s.label}</span>;
};

/**
 * The Super Admin watches every chef's kitchen here. Chefs move their own orders on;
 * the team can cancel or reopen an order, and pays chefs once delivery is evidenced.
 */
const OrderManagement = () => {
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') === 'payouts' ? 'payouts' : 'orders';
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Orders</h2>
                <p className="text-muted-foreground">Chefs move their orders from new to cooking to delivered. You watch every kitchen, and pay chefs once delivery is evidenced.</p>
            </div>
            <Tabs value={tab} onValueChange={(v) => setParams(v === 'payouts' ? { tab: 'payouts' } : {})}>
                <TabsList className="h-11">
                    <TabsTrigger value="orders" className="h-9 px-4">Live orders</TabsTrigger>
                    <TabsTrigger value="payouts" className="h-9 px-4">Chef payouts</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="mt-4"><LiveOrders /></TabsContent>
                <TabsContent value="payouts" className="mt-4"><AdminPayouts /></TabsContent>
            </Tabs>
        </div>
    );
};

const LiveOrders = () => {
    const qc = useQueryClient();
    const [chefFilter, setChefFilter] = useState<string | null>(null);
    const { data: orders = [], isLoading } = useQuery<AdminOrder[]>({ queryKey: ['admin-orders'], queryFn: () => api.get('/orders'), refetchInterval: 30_000 });

    // A new order arriving gets a message, so nothing waits unseen.
    const previous = useRef(0);
    useEffect(() => {
        if (orders.length > previous.current && previous.current > 0) {
            toast.info('New order received', { description: `${orders.length - previous.current} new order(s).`, icon: <BellRing className="h-4 w-4 text-primary" /> });
        }
        previous.current = orders.length;
    }, [orders.length]);

    const setStatus = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/orders/${id}/status`, { status }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Order updated. The customer and chefs have been told.'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/orders/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Order deleted'); },
        onError: (e: Error) => toast.error(e.message),
    });

    // Every chef's kitchen at a glance: how many of their orders are at each step right now.
    const board = useMemo(() => {
        const chefs = new Map<string, Record<string, number>>();
        for (const order of orders) {
            if (order.status === 'cancelled' || order.status === 'awaiting_payment') continue;
            for (const p of order.chefProgress ?? []) {
                const row = chefs.get(p.chefName) ?? { received: 0, preparing: 0, delivery: 0, completed: 0 };
                row[p.status] = (row[p.status] ?? 0) + 1;
                chefs.set(p.chefName, row);
            }
        }
        return [...chefs.entries()].sort((a, b) => (b[1].received + b[1].preparing + b[1].delivery) - (a[1].received + a[1].preparing + a[1].delivery));
    }, [orders]);

    const shown = chefFilter ? orders.filter((o) => (o.chefProgress ?? []).some((p) => p.chefName === chefFilter)) : orders;

    if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    return (
        <div className="space-y-6">
            <section aria-labelledby="kitchens-heading">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 id="kitchens-heading" className="font-bold">Kitchens</h3>
                    <Button variant="outline" size="sm" className="h-10" onClick={() => qc.invalidateQueries({ queryKey: ['admin-orders'] })}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
                </div>
                {board.length === 0 ? <p className="text-sm text-muted-foreground">No chef orders yet.</p> : (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {board.map(([name, counts]) => (
                            <button
                                key={name}
                                type="button"
                                aria-pressed={chefFilter === name}
                                onClick={() => setChefFilter(chefFilter === name ? null : name)}
                                className={cn('min-w-48 shrink-0 rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary', chefFilter === name && 'border-primary bg-primary/5')}
                            >
                                <p className="font-semibold">{name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{counts.received} new · {counts.preparing} cooking · {counts.delivery} on the way · {counts.completed} delivered</p>
                            </button>
                        ))}
                    </div>
                )}
                {chefFilter && <Button variant="link" className="px-0" onClick={() => setChefFilter(null)}>Show every chef</Button>}
            </section>

            <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((col) => {
                    const list = shown.filter((o) => o.status === col.status);
                    return (
                        <div key={col.status} className="w-72 shrink-0 space-y-3">
                            <h3 className="flex items-center gap-2 font-semibold"><col.icon className="h-4 w-4" />{col.title}<span className="rounded-full bg-secondary px-2 text-xs">{list.length}</span></h3>
                            {list.length === 0 && <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">No orders</p>}
                            {list.map((order) => (
                                <Card key={order.id} className="space-y-2 p-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold">#{order.id}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'd MMM, HH:mm')}</span>
                                    </div>
                                    <p className="text-muted-foreground">{order.deliveryAddress?.firstName ? `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName ?? ''}` : 'Guest'} · {order.deliveryAddress?.method === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                                    <ul className="space-y-0.5">
                                        {order.items.map((item) => <li key={item.id} className="truncate">• {item.quantity}× {item.product?.name || 'Item'}</li>)}
                                    </ul>
                                    {(order.chefProgress ?? []).length > 0 && (
                                        <ul className="space-y-1 border-t pt-2">
                                            {(order.chefProgress ?? []).map((p) => (
                                                <li key={p.chefId} className="flex items-center justify-between gap-2">
                                                    <span className="truncate">{p.chefName}</span>
                                                    <Pill status={order.status === 'cancelled' ? 'cancelled' : p.status} />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="flex justify-between border-t pt-2 font-bold">
                                        <span>Total</span>
                                        <span className="flex items-center gap-2">
                                            {order.paymentStatus === 'paid' && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">Paid by card</span>}
                                            {order.paymentStatus === 'refunded' && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Refunded</span>}
                                            {money(order.total)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <Button asChild variant="ghost" size="sm" className="h-10"><Link to={`/order-tracker/${order.id}`}><Eye className="mr-1 h-3 w-3" />View</Link></Button>
                                        {!['cancelled', 'completed'].includes(order.status) && (
                                            <Button variant="ghost" size="sm" className="h-10 text-destructive" onClick={() => { if (confirm(order.paymentStatus === 'paid' ? `Cancel order #${order.id} and refund ${money(order.total)} to the customer's card? The customer and chefs will be told.` : `Cancel order #${order.id}? The customer and chefs will be told.`)) setStatus.mutate({ id: order.id, status: 'cancelled' }); }}>Cancel</Button>
                                        )}
                                        {order.status === 'cancelled' && (
                                            <>
                                                {!['refunded', 'failed', 'awaiting'].includes(order.paymentStatus ?? '') && (
                                                    <Button variant="outline" size="sm" className="h-10" onClick={() => setStatus.mutate({ id: order.id, status: 'received' })}>Reopen</Button>
                                                )}
                                                <Button variant="ghost" size="sm" className="h-10 text-destructive" onClick={() => { if (confirm(`Permanently delete order #${order.id}?`)) remove.mutate(order.id); }}>Delete</Button>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderManagement;
