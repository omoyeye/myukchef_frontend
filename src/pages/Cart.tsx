import { Link } from 'react-router-dom';
import { useMenuPrices } from '@/lib/prices';
import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';

const Cart = () => {
    const {
        items,
        removeItem,
        updateQuantity,
        subtotal,
        deliveryFee,
        serviceFee,
        total,
        itemCount,
    } = useCart();

    const formatPrice = (price: number) => `£${price.toFixed(2)}`;
  const { withFee, serviceFeePercent } = useMenuPrices();

    if (items.length === 0) {
        return (
            <Layout>
                <SEO title="Your Basket" description="Your shopping basket is currently empty. Browse our menu to add some home-cooked dishes." />
                <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h1 className="font-bold text-3xl mb-4 text-foreground">Your basket is empty</h1>
                    <p className="text-muted-foreground mb-10 max-w-md text-lg leading-relaxed">
                        Looks like you haven't added anything to your cart yet. Browse our menu to find something delicious!
                    </p>
                    <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg">
                        <Link to="/menu">
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Browse Menu
                        </Link>
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <SEO title="Your Basket" description={`Review your order of ${itemCount} items at MYUKCHEF.`} />
            <div className="container mx-auto px-4 py-4 md:py-12 max-w-4xl animate-in fade-in duration-500">
                <div className="flex items-center gap-1 md:gap-2 mb-4 md:mb-10">
                    <Button variant="ghost" size="icon" asChild className="mr-2 hover:bg-secondary">
                        <Link to="/menu">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                    </Button>
                    <h1 className="font-bold text-2xl md:text-4xl tracking-tight">Your Basket</h1>
                    <span className="text-muted-foreground ml-1 md:ml-2 text-base md:text-xl font-medium">({itemCount} items)</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-10">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                <ScrollArea className="w-full lg:h-[calc(100vh-350px)] lg:min-h-[500px]">
                                    <div className="divide-y p-4 md:p-6">
                                        {items.map((item, index) => {
                                            const modifiersPrice = item.selectedModifiers.reduce(
                                                (sum, mod) => sum + mod.price,
                                                0
                                            );
                                            const itemTotal = withFee(item.menuItem.price + modifiersPrice) * item.quantity;

                                            return (
                                                <div key={`${item.menuItem.id}-${index}`} className="flex gap-3 md:gap-6 py-4 md:py-8 first:pt-0 last:pb-0 group">
                                                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-muted shadow-inner">
                                                        <img
                                                            src={item.menuItem.image}
                                                            alt={item.menuItem.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start gap-2 md:gap-4">
                                                                <h3 className="min-w-0 font-bold text-base md:text-xl leading-tight text-foreground">
                                                                    {item.menuItem.name}
                                                                </h3>
                                                                <span className="font-bold text-base md:text-xl text-primary whitespace-nowrap">
                                                                    {formatPrice(itemTotal)}
                                                                </span>
                                                            </div>

                                                            {item.selectedModifiers.length > 0 && (
                                                                <p className="text-sm text-muted-foreground mt-2 font-medium">
                                                                    {item.selectedModifiers.map((m) => m.name).join(', ')}
                                                                </p>
                                                            )}

                                                            {item.specialInstructions && (
                                                                <p className="text-sm text-muted-foreground italic mt-3 bg-secondary/30 p-3 rounded-xl border border-border/30">
                                                                    "{item.specialInstructions}"
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 mt-3 md:mt-6">
                                                            <div className="flex items-center gap-1 md:gap-4 bg-secondary/50 rounded-2xl p-1.5 border border-border/50 shadow-sm">
                                                                <Button
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className="h-10 w-10 bg-background hover:bg-background/80 shadow-sm transition-all rounded-xl"
                                                                    onClick={() =>
                                                                        updateQuantity(
                                                                            item.menuItem.id,
                                                                            item.selectedModifiers,
                                                                            item.quantity - 1
                                                                        )
                                                                    }
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                                <span className="text-base font-bold w-6 text-center">
                                                                    {item.quantity}
                                                                </span>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className="h-10 w-10 bg-background hover:bg-background/80 shadow-sm transition-all rounded-xl"
                                                                    onClick={() =>
                                                                        updateQuantity(
                                                                            item.menuItem.id,
                                                                            item.selectedModifiers,
                                                                            item.quantity + 1
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                aria-label={`Remove ${item.menuItem.name}`}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full h-11 w-11 p-0 md:w-auto md:px-4"
                                                                onClick={() =>
                                                                    removeItem(item.menuItem.id, item.selectedModifiers)
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 md:mr-2" />
                                                                <span className="hidden md:inline">Remove</span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="lg:sticky lg:top-24 border-border/50 shadow-xl rounded-3xl overflow-hidden ring-1 ring-black/5">
                            <CardHeader className="bg-secondary/20 p-4 md:pb-6 md:pt-8 md:px-8">
                                <CardTitle className="text-2xl font-extrabold tracking-tight">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 md:space-y-5 p-4 md:pt-8 md:px-8">
                                <div className="flex justify-between text-base">
                                    <span className="text-muted-foreground font-medium">Food</span>
                                    <span className="font-bold text-foreground">{formatPrice(subtotal + serviceFee)}</span>
                                </div>
                                <div className="flex justify-between text-base">
                                    <span className="text-muted-foreground font-medium">Delivery fee</span>
                                    <span className="font-bold text-success text-green-600">
                                        {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">Food includes {formatPrice(serviceFee)} service fee ({serviceFeePercent}%).</p>

                                <Separator className="my-3 md:my-6" />

                                <div className="flex justify-between items-end pb-2">
                                    <span className="font-extrabold text-2xl tracking-tight">Total</span>
                                    <div className="text-right">
                                        <span className="block font-black text-3xl md:text-4xl text-primary animate-in fade-in slide-in-from-right-2 duration-500">
                                            {formatPrice(total)}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium mt-1 block uppercase tracking-wider">
                                            Includes VAT & Fees
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 md:pb-10 md:px-8">
                                <Button asChild className="w-full text-lg md:text-xl h-14 md:h-16 shadow-[0_10px_20px_-5px_rgba(234,88,12,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(234,88,12,0.6)] transition-all rounded-2xl font-bold bg-primary hover:bg-primary/90" size="lg">
                                    <Link to="/checkout" className="flex items-center justify-center gap-3">
                                        Checkout Now
                                        <ArrowRight className="h-6 w-6" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        <div className="mt-8 text-center px-4">
                            <p className="text-sm text-balance text-muted-foreground leading-relaxed">
                                By proceeding, you agree to our <Link to="/terms" className="underline hover:text-primary transition-colors">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Cart;
