import { Link } from 'react-router-dom';
import { nextOpenLabel, thumb, thumbSet } from "@/lib/images";
import { ChefHat, Plus, Star, Leaf, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MenuItem } from '@/types/menu';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { allergenSummary } from '@/lib/allergens';
import { useMenuPrices } from '@/lib/prices';

interface MenuCardProps {
  item: MenuItem;
  className?: string;
}

import { toast } from 'sonner';

// ... (existing imports)

export const MenuCard = ({ item, className }: MenuCardProps) => {
  const { addItem } = useCart();
  const { withFee } = useMenuPrices();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.isSoldOut) {
      addItem(item);

      toast.success(`Added ${item.name} to cart`);
    }
  };

  return (
    <Link to={`/menu/${item.id}`}>
      <Card
        className={cn(
          "group overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-warm transition-all duration-300",
          item.isSoldOut && "opacity-60",
          className
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={thumb(item.image, 480)}
            srcSet={thumbSet(item.image, 480)}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            {item.isPopular && (
              <Badge className="bg-primary text-primary-foreground">
                <Star className="h-3 w-3 mr-1" fill="currentColor" />
                Popular
              </Badge>
            )}
            {item.isVegan && (
              <Badge variant="secondary" className="bg-brand-success/90 text-white">
                <Leaf className="h-3 w-3 mr-1" />
                Vegan
              </Badge>
            )}
            {item.tags.includes('spicy') && (
              <Badge variant="secondary" className="bg-destructive/90 text-white">
                <Flame className="h-3 w-3 mr-1" />
                Spicy
              </Badge>
            )}
          </div>

          {/* When the chef cooks: paused, or opens later (orders can still be scheduled). */}
          {!item.isSoldOut && item.chef && (item.chef.paused || item.chef.openNow === false) && (
            <div className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold shadow">
              {item.chef.paused ? "Not taking orders" : nextOpenLabel(item.chef.nextOpen)}
            </div>
          )}
          {/* The chef's own cooking time, when they've set one and are cooking now. */}
          {!item.isSoldOut && item.chef?.prepTime && !item.chef.paused && item.chef.openNow !== false && (
            <div className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold shadow">
              Ready in {item.chef.prepTime.min}-{item.chef.prepTime.max} min
            </div>
          )}
          {item.isSoldOut && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">
                Sold Out
              </Badge>
            </div>
          )}

          {/* Quick Add Button */}
          {!item.isSoldOut && (
            <Button
              size="icon"
              aria-label={`Add ${item.name} to cart`}
              className="absolute bottom-2 right-2 h-11 w-11 rounded-full shadow-lg transition-opacity md:h-10 md:w-10 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              onClick={handleQuickAdd}
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              {item.chef && (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                    {item.chef.avatar ? <img src={thumb(item.chef.avatar, 240)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ChefHat className="h-3 w-3" />}
                  </span>
                  <span className="truncate">By {item.chef.displayName}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {item.description}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="font-bold text-primary text-lg">
                £{withFee(item.price).toFixed(2)}
              </span>
              {item.calories && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.calories} kcal
                </p>
              )}
            </div>
          </div>

          {/* Dietary Info */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {item.isGlutenFree && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                GF
              </span>
            )}
            {item.isHalal && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Halal
              </span>
            )}
            <span className={cn("text-xs px-2 py-0.5 rounded-full", item.allergens.length > 0 ? "bg-brand-warning/20 text-brand-warning" : "bg-muted text-muted-foreground")}>
              {allergenSummary(item.allergens)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
