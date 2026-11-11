import { useParams, Link, useSearchParams } from 'react-router-dom';
import { allergenSummary } from '@/lib/allergens';
import { CheckCircle2, MapPin, ChefHat, Truck, Loader2 } from 'lucide-react';
import { GoogleMap } from '@/components/location/GoogleMap';
import { formatMiles } from '@/lib/location';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import SEO from '@/components/common/SEO';
import { OrderProgressPanel } from '@/components/orders/OrderProgressPanel';

const milesApart = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(h));
};

const ORDER_STEPS = [
    { id: 'received', label: 'Order Received', icon: CheckCircle2, progress: 10, time: 35 },
    { id: 'preparing', label: 'Chef Cooking', icon: ChefHat, progress: 35, time: 25 },
    { id: 'delivery', label: 'En Route', icon: Truck, progress: 65, time: 15 },
    { id: 'completed', label: 'Delivered', icon: MapPin, progress: 100, time: 0 },
];

const OrderTracker = () => {
    const { id } = useParams<{ id: string }>();

    const [searchParams] = useSearchParams();
    const trackingToken = searchParams.get('t');
    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order-tracking', id, trackingToken],
        queryFn: async () => {
            return api.get(`/orders/${id}${trackingToken ? `?t=${encodeURIComponent(trackingToken)}` : ''}`);
        },
        refetchInterval: 10000, // Poll every 10 seconds
        enabled: !!id
    });

    if (isLoading) {
        return (
            <Layout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (error || !order) {
        return (
            <Layout>
                <div className="container py-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">Order not found</h2>
                    <Button asChild>
                        <Link to="/menu">Back to Menu</Link>
                    </Button>
                </div>
            </Layout>
        );
    }

    const currentStepIndex = ORDER_STEPS.findIndex(step => step.id === order.status);
    const safeStepIndex = currentStepIndex === -1 ? 0 : currentStepIndex;
    const currentStep = ORDER_STEPS[safeStepIndex];
    const progressValue = currentStep.progress;
    const estimatedTime = currentStep.time;

    return (
        <Layout>
            <SEO
                title={`Track Order #${order.id}`}
                description={`Tracking your order #${order.id} from MYUKCHEF. Current status: ${order.status}.`}
            />
            <div className="bg-secondary/20 min-h-screen pb-20">
                <div className="container py-8 max-w-2xl mx-auto">

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pt-4">
                        <div className="flex items-center gap-4">
                            <Link to="/track-order" className="h-12 w-12 rounded-xl bg-white shadow-sm border p-2 hover:scale-110 transition-transform">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-black italic tracking-tight uppercase">Order #{order.id}</h1>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Live Status</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={order.status === 'completed' ? "default" : "secondary"} className="text-xs px-4 py-1 uppercase tracking-widest font-bold">
                                {order.status === 'completed' ? 'Delivered' : order.status}
                            </Badge>
                            <Button variant="outline" size="sm" asChild className="rounded-lg h-9 font-bold uppercase tracking-tighter text-xs">
                                <Link to="/track-order">New Search</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Live map: the customer's destination plus the courier while out for delivery */}
                    {order.status !== 'completed' && order.status !== 'cancelled' && order.destination && (
                        <Card className="overflow-hidden mb-6 border-0 shadow-warm">
                            <GoogleMap
                                className="h-64 w-full"
                                markers={[
                                    { lat: order.destination.lat, lng: order.destination.lng, title: 'Delivery address', kind: 'destination' },
                                    ...(order.courier ? [{ lat: order.courier.lat, lng: order.courier.lng, title: 'Your delivery', kind: 'courier' as const }] : []),
                                ]}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                                        {order.courier ? 'Your delivery is on the way' : order.status === 'delivery' ? 'Out for delivery' : 'Being prepared'}
                                    </p>
                                    {order.courier && (
                                        <p className="text-xl font-bold text-primary">{formatMiles(milesApart(order.courier, order.destination))}</p>
                                    )}
                                </div>
                                {order.courier && (
                                    <Button asChild variant="outline" className="h-11">
                                        <a href={`https://www.google.com/maps/dir/?api=1&origin=${order.courier.lat},${order.courier.lng}&destination=${order.destination.lat},${order.destination.lng}`} target="_blank" rel="noopener noreferrer">
                                            Open in Google Maps
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Progress Steps */}
                    <Card className="p-6 mb-6 shadow-sm">
                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                {ORDER_STEPS.map((step, idx) => (
                                    <div key={step.id} className={`flex flex-col items-center gap-2 relative z-10 ${idx <= safeStepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${idx <= safeStepIndex ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted'}`}>
                                            <step.icon className="h-4 w-4" />
                                        </div>
                                        <span className="text-[10px] font-medium uppercase tracking-wider hidden sm:block">{step.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="relative h-2 bg-secondary rounded-full mt-2">
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-in-out"
                                    style={{ width: `${progressValue}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-secondary/30 p-4 rounded-lg flex items-center gap-4">
                            <div className="p-3 bg-background rounded-full">
                                <currentStep.icon className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{currentStep.label}</h3>
                                <p className="text-muted-foreground text-sm">
                                    {order.status === 'received' && "We've received your order and sent it to the kitchen."}
                                    {order.status === 'preparing' && "Our chefs are preparing your delicious meal."}
                                    {order.status === 'delivery' && "Your driver is on the way!"}
                                    {order.status === 'completed' && "Enjoy your meal!"}
                                    {order.status === 'cancelled' && "This order was cancelled. Email info@myukchef.com if you have questions."}
                                </p>
                            </div>
                        </div>
                    </Card>


                    <OrderProgressPanel
                        orderId={order.id}
                        progress={order.chefProgress ?? []}
                        token={trackingToken}
                        pickup={order.deliveryAddress?.method === "pickup"}
                        highlightConfirm={searchParams.get("confirm") === "1"}
                    />

                    {order.items?.some((i: any) => i.product) && (
                        <Card className="mb-6 p-5 shadow-sm">
                            <h3 className="mb-2 font-semibold">Allergen information for your order</h3>
                            <ul className="space-y-1 text-sm">
                                {order.items.filter((i: any) => i.product).map((i: any) => (
                                    <li key={i.id}><span className="font-medium">{i.quantity} × {i.product.name}:</span> {allergenSummary(i.product.allergens)}</li>
                                ))}
                            </ul>
                            <p className="mt-2 text-xs text-muted-foreground">Food is made in kitchens that may handle other allergens. If you have a severe allergy, please check before eating.</p>
                        </Card>
                    )}

                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Order ID</span>
                            <span className="font-mono">#{order.id}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Delivery Address</span>
                            <span className="text-right max-w-[200px]">
                                {order.deliveryAddress ? `${order.deliveryAddress.line1 ?? ''}, ${order.deliveryAddress.city ?? ''}` : 'Sign in to see the address'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-bold">£{Number(order.total).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Button variant="link" asChild>
                            <Link to="/menu">Need help with this order?</Link>
                        </Button>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default OrderTracker;
