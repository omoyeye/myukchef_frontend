import { useState } from 'react';
import { useMenuPrices } from '@/lib/prices';
import { allergenSummary } from '@/lib/allergens';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle2, Lock, Ticket } from 'lucide-react';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const checkoutSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number is required'),
    deliveryMethod: z.enum(['delivery', 'pickup']),
    address: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    notes: z.string().optional(),
}).refine((data) => {
    if (data.deliveryMethod === 'delivery') {
        return !!data.address && !!data.city && !!data.postcode;
    }
    return true;
}, {
    message: "Address details are required for delivery",
    path: ["address"],
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const Checkout = () => {
    const { items, total, subtotal, deliveryFee, deliveryNote, nextDeliveryBand, serviceFee, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [trackingLink, setTrackingLink] = useState<string | null>(null);
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
    const [isValidatingCode, setIsValidatingCode] = useState(false);

    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            deliveryMethod: 'delivery',
            address: '',
            city: '',
            postcode: '',
            notes: '',
        },
    });

    const deliveryMethod = form.watch('deliveryMethod');
    const formatPrice = (price: number) => `£${price.toFixed(2)}`;
    const { withFee, serviceFeePercent } = useMenuPrices();

    if (items.length === 0 && !orderPlaced) {
        return (
            <Layout>
                <SEO title="Checkout" description="Complete your order at MYUKCHEF." />
                <div className="container mx-auto px-4 py-16 text-center animate-in fade-in duration-500 min-h-[50vh] flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-bold mb-6">Your cart is empty</h2>
                    <p className="text-muted-foreground mb-10 max-w-sm mx-auto">Add some home-cooked dishes from our chefs to get started.</p>
                    <Button asChild size="lg" className="rounded-full px-10">
                        <Link to="/menu">Browse Menu</Link>
                    </Button>
                </div>
            </Layout>
        );
    }


    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setIsValidatingCode(true);
        try {
            const data = await api.get(`/discounts/validate/${encodeURIComponent(discountCode)}?amount=${subtotal}`);
            setAppliedDiscount(data);
            toast.success(`Discount "${data.code}" applied!`);
        } catch (error: any) {
            toast.error(error.message || "Invalid discount code");
            setAppliedDiscount(null);
        } finally {
            setIsValidatingCode(false);
        }
    };

    const shownDeliveryFee = deliveryMethod === 'pickup' ? 0 : deliveryFee;
    const totalBeforeDiscount = subtotal + serviceFee + shownDeliveryFee;

    const calculateDiscountedTotal = () => {
        if (!appliedDiscount) return totalBeforeDiscount;
        let discountValue = 0;
        if (appliedDiscount.type === 'percentage') {
            discountValue = subtotal * (appliedDiscount.value / 100);
        } else {
            discountValue = Math.min(appliedDiscount.value, subtotal);
        }
        return Math.max(0, totalBeforeDiscount - discountValue);
    };

    // With Stripe switched on, the customer pays by card before the order reaches the chefs.
    const { data: payment } = useQuery<{ cardPayments: boolean; testMode: boolean }>({
        queryKey: ['payment-config'],
        queryFn: () => api.get('/orders/payment-config'),
        staleTime: 60_000,
    });
    const cardPayments = !!payment?.cardPayments;

    const onSubmit = async (data: CheckoutFormValues) => {
        setIsSubmitting(true);

        try {
            const orderPayload = {
                items,
                deliveryMethod: data.deliveryMethod,
                discountCode: appliedDiscount?.code,
                deliveryAddress: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    line1: data.address,
                    city: data.city,
                    postcode: data.postcode,
                    notes: data.notes
                }
            };

            const responseData = await api.post('/orders', orderPayload);
            if (responseData.checkoutUrl) {
                // Off to Stripe's secure page. If they back out, the tracker lets them pay later.
                clearCart();
                window.location.assign(responseData.checkoutUrl);
                return;
            }

            setIsSubmitting(false);
            setOrderPlaced(true);
            setTrackingLink(`/order-tracker/${responseData.id}?t=${responseData.trackingToken}`);
            clearCart();
            toast.success('Order placed successfully!', {
                description: `Order #${responseData.id} has been confirmed.`
            });
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error('Failed to place order', {
                description: error.message || 'Please try again.'
            });
            setIsSubmitting(false);
        }
    };

    if (orderPlaced) {
        return (
            <Layout hideFooter>
                <SEO title="Order Confirmed!" description="Your order at MYUKCHEF has been confirmed. Thank you for choosing us!" />
                <div className="container mx-auto px-4 py-24 max-w-lg text-center animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ring-green-50 dark:ring-green-900/10">
                        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Order Confirmed!</h1>
                    <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                        Thank you for your order. We've sent a confirmation email to <span className="font-semibold text-foreground">{form.getValues().email}</span>.
                    </p>
                    <div className="space-y-4">
                        <Button asChild className="w-full rounded-2xl h-14 text-lg shadow-lg" size="lg">
                            <Link to={trackingLink ?? "/menu"}>{trackingLink ? "Track My Order" : "Order More Food"}</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full rounded-2xl h-14 text-lg">
                            <Link to="/">Back to Home</Link>
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <SEO title="Checkout" description="Complete your order at MYUKCHEF." />
            <div className="container mx-auto px-4 py-12 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-10">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-secondary">
                        <Link to="/cart">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                    </Button>
                    <h1 className="font-extrabold text-4xl tracking-tight">Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-10">
                    <div className="lg:col-span-7">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                {/* Contact Details */}
                                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-secondary/10">
                                        <CardTitle className="text-xl">Contact Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 pt-6">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>First Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="John" className="rounded-xl h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Last Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Doe" className="rounded-xl h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2">
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="john@example.com" className="rounded-xl h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2">
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+44 7123 456789" className="rounded-xl h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Delivery Details */}
                                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-secondary/10">
                                        <CardTitle className="text-xl">Delivery Method</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-8 pt-6">
                                        <FormField
                                            control={form.control}
                                            name="deliveryMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                            className="grid grid-cols-2 gap-4"
                                                        >
                                                            <FormItem>
                                                                <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="delivery" className="sr-only" />
                                                                    </FormControl>
                                                                    <div className="border-2 rounded-2xl p-6 hover:border-primary/50 transition-all text-center">
                                                                        <span className="block font-bold text-lg mb-1">Delivery</span>
                                                                        <span className="text-sm text-muted-foreground">To your door</span>
                                                                    </div>
                                                                </FormLabel>
                                                            </FormItem>
                                                            <FormItem>
                                                                <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-primary/5 cursor-pointer">
                                                                    <FormControl>
                                                                        <RadioGroupItem value="pickup" className="sr-only" />
                                                                    </FormControl>
                                                                    <div className="border-2 rounded-2xl p-6 hover:border-primary/50 transition-all text-center">
                                                                        <span className="block font-bold text-lg mb-1">Pickup</span>
                                                                        <span className="text-sm text-muted-foreground">Collect now</span>
                                                                    </div>
                                                                </FormLabel>
                                                            </FormItem>
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {deliveryMethod === 'delivery' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                                <SavedAddressSelector onSelect={(addr) => {
                                                    form.setValue('address', addr.street);
                                                    form.setValue('city', addr.city);
                                                    form.setValue('postcode', addr.postcode);
                                                }} />

                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-card px-4 text-muted-foreground font-semibold">Or enter manually</span>
                                                    </div>
                                                </div>

                                                <FormField
                                                    control={form.control}
                                                    name="address"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Street Address</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="123 High Street" className="rounded-xl h-11" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="city"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>City</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="London" className="rounded-xl h-11" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="postcode"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Postcode</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="SW1A 1AA" className="rounded-xl h-11" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Delivery Notes</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Ring the doorbell, leave at front desk, etc."
                                                            className="resize-none rounded-2xl min-h-[100px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-secondary/10">
                                        <CardTitle className="text-xl">Payment</CardTitle>
                                        <CardDescription>You'll pay when your order arrives or when you collect it. We'll confirm the details by email.</CardDescription>
                                    </CardHeader>
                                </Card>
                            </form>
                        </Form>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-5">
                        <div className="lg:sticky lg:top-24 space-y-6">
                            <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden ring-1 ring-black/5">
                                <CardHeader className="bg-secondary/10 pb-6">
                                    <CardTitle className="text-2xl font-bold">Your Order</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[350px] overflow-auto p-6 space-y-6">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex gap-4 group">
                                                <div className="h-16 w-16 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                                                    <img
                                                        src={item.menuItem.image}
                                                        alt={item.menuItem.name}
                                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between font-bold text-base leading-snug">
                                                        <span className="truncate">{item.quantity}x {item.menuItem.name}</span>
                                                        <span className="text-primary">{formatPrice(withFee(item.menuItem.price + item.selectedModifiers.reduce((s, m) => s + m.price, 0)) * item.quantity)}</span>
                                                    </div>
                                                    {item.selectedModifiers.length > 0 && (
                                                        <p className="text-muted-foreground text-xs mt-1 font-medium">
                                                            {item.selectedModifiers.map(m => m.name).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator className="opacity-50" />
                                    <div className="p-8 space-y-4">
                                        <div className="flex justify-between text-base">
                                            <span className="text-muted-foreground font-medium">Food</span>
                                            <span className="font-bold text-foreground">{formatPrice(subtotal + serviceFee)}</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="text-muted-foreground font-medium">Delivery fee</span>
                                            <span className="font-bold text-green-600">{shownDeliveryFee === 0 ? "FREE" : formatPrice(shownDeliveryFee)}</span>
                                        </div>
                                        {deliveryMethod === 'delivery' && deliveryNote && <p className="text-xs text-muted-foreground">{deliveryNote}</p>}
                                        {deliveryMethod === 'delivery' && nextDeliveryBand && (
                                            <p className="text-xs font-medium text-primary">Add {formatPrice(nextDeliveryBand.spendMore)} more for {nextDeliveryBand.fee === 0 ? 'free delivery' : `${formatPrice(nextDeliveryBand.fee)} delivery`}.</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Food includes {formatPrice(serviceFee)} service fee ({serviceFeePercent}%).</p>
                                        <div className="rounded-xl bg-secondary/60 p-3 text-xs">
                                            <p className="mb-1 font-semibold">Allergen information</p>
                                            {items.map((item) => <p key={item.menuItem.id}>{item.menuItem.name}: {allergenSummary(item.menuItem.allergens)}</p>)}
                                            <p className="mt-1 text-muted-foreground">Food is made in kitchens that may handle other allergens. If your allergy is severe, please contact us before ordering.</p>
                                        </div>

                                        <Separator className="my-6" />

                                        <div className="flex justify-between items-end pb-4">
                                            <span className="font-extrabold text-2xl tracking-tight">Total</span>
                                            <div className="text-right">
                                                <span className="block font-black text-4xl text-primary">{formatPrice(calculateDiscountedTotal())}</span>
                                            </div>
                                        </div>

                                        {!appliedDiscount ? (
                                            <div className="flex gap-3 mt-6 bg-secondary/20 p-2 rounded-2xl border border-border/50">
                                                <Input
                                                    placeholder="Promo code"
                                                    value={discountCode}
                                                    onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                                                    className="h-11 rounded-xl bg-background border-none shadow-none focus-visible:ring-1"
                                                />
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="h-11 rounded-xl px-6 font-bold"
                                                    onClick={handleApplyDiscount}
                                                    disabled={isValidatingCode || !discountCode}
                                                >
                                                    {isValidatingCode ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Apply'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl mt-6 border border-green-200 dark:border-green-900/30">
                                                <div className="flex items-center gap-3 text-green-700 dark:text-green-400 font-bold">
                                                    <Ticket className="h-5 w-5" />
                                                    {appliedDiscount.code} Applied
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-2 text-muted-foreground hover:text-destructive transition-colors font-bold"
                                                    onClick={() => {
                                                        setAppliedDiscount(null);
                                                        setDiscountCode('');
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="px-8 pb-10 pt-2">
                                    <Button
                                        size="lg"
                                        className="w-full text-xl h-16 shadow-[0_10px_25px_-5px_rgba(234,88,12,0.4)] hover:shadow-[0_15px_35px_-5px_rgba(234,88,12,0.6)] transition-all rounded-2xl font-black bg-primary"
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                                {cardPayments ? 'Opening secure payment...' : 'Processing...'}
                                            </>
                                        ) : cardPayments ? (
                                            <><Lock className="mr-3 h-5 w-5" />Pay · {formatPrice(calculateDiscountedTotal())}</>
                                        ) : (
                                            `Place order · ${formatPrice(calculateDiscountedTotal())}`
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>

                            <div className="px-6 text-center">
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                    {cardPayments
                                        ? <>You'll pay by card on Stripe's secure page. Your order goes to the chefs once it's paid.{payment?.testMode ? ' (Test mode: no real money is taken.)' : ''}</>
                                        : 'Your order will be prepared immediately after confirmation. Please ensure your delivery details are correct.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

// Helper Component for Saved Addresses
const SavedAddressSelector = ({ onSelect }: { onSelect: (addr: any) => void }) => {
    const { user } = useAuth();

    const { data: addresses = [] } = useQuery<any[]>({
        queryKey: ['my-addresses'],
        queryFn: async () => {
            return api.get('/addresses');
        },
        enabled: !!user
    });

    if (!user || addresses.length === 0) return null;

    return (
        <div className="mb-4">
            <FormLabel className="mb-2 block">Use Saved Address</FormLabel>
            <Select onValueChange={(val) => {
                const addr = addresses.find(a => a.id.toString() === val);
                if (addr) onSelect(addr);
            }}>
                <SelectTrigger>
                    <SelectValue placeholder="Select an address..." />
                </SelectTrigger>
                <SelectContent>
                    {addresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id.toString()}>
                            {addr.name} - {addr.street}, {addr.postcode}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default Checkout;
