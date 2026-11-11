import { Link } from 'react-router-dom';
import { useMenuPrices } from '@/lib/prices';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';

export const CartDrawer = () => {
  const {
    items,
    isOpen,
    setCartOpen,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
    deliveryFee,
    serviceFee,
    total,
  } = useCart();

  const formatPrice = (price: number) => `£${price.toFixed(2)}`;
  const { withFee, serviceFeePercent } = useMenuPrices();

  return (
    <Sheet open={isOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Basket ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Your basket is empty</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add some delicious dishes from our menu to get started!
            </p>
            <Button asChild onClick={() => setCartOpen(false)}>
              <Link to="/menu">
                Browse Menu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item, index) => {
                  const modifiersPrice = item.selectedModifiers.reduce(
                    (sum, mod) => sum + mod.price,
                    0
                  );
                  const itemTotal = withFee(item.menuItem.price + modifiersPrice) * item.quantity;

                  return (
                    <div key={`${item.menuItem.id}-${index}`} className="flex gap-3">
                      <img
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight">
                          {item.menuItem.name}
                        </h4>
                        {item.selectedModifiers.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.selectedModifiers.map((m) => m.name).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">
                            "{item.specialInstructions}"
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() =>
                                updateQuantity(
                                  item.menuItem.id,
                                  item.selectedModifiers,
                                  item.quantity - 1
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() =>
                                updateQuantity(
                                  item.menuItem.id,
                                  item.selectedModifiers,
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {formatPrice(itemTotal)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() =>
                                removeItem(item.menuItem.id, item.selectedModifiers)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Food</span>
                <span>{formatPrice(subtotal + serviceFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery fee</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Food includes {formatPrice(serviceFee)} service fee ({serviceFeePercent}%).</p>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <SheetFooter className="mt-4">
              <Button
                asChild
                className="w-full"
                size="lg"
                onClick={() => setCartOpen(false)}
              >
                <Link to="/checkout">
                  Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
