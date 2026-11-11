import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChefHat, ArrowLeft, Minus, Plus, ShoppingBag, Leaf, Flame, Info, Star, MessageSquare, Share2 } from 'lucide-react';
import { shareLink } from '@/lib/share';
import { SITE_URL } from '@/lib/site';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Modifier, MenuItem } from '@/types/menu';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuPrices } from '@/lib/prices';
import { allergenLabel } from '@/lib/allergens';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SEO from '@/components/common/SEO';

interface Review {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    userName: string;
}

const ItemDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const { user, isAuthenticated } = useAuth();
    const { withFee, serviceFeePercent } = useMenuPrices();
    const queryClient = useQueryClient();

    // Fetch Item from DB
    const { data: item, isLoading: isLoadingItem } = useQuery<MenuItem>({
        queryKey: ['product', id],
        queryFn: async () => {
            return api.get(`/products/${id}`);
        },
        enabled: !!id
    });

    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    // Review State
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    // Fetch Reviews
    const { data: eligibility } = useQuery<{ canReview: boolean; alreadyReviewed: boolean }>({
        queryKey: ['review-eligibility', id],
        queryFn: () => api.get(`/reviews/eligibility/${id}`),
        enabled: isAuthenticated,
    });

    const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<Review[]>({
        queryKey: ['reviews', id],
        queryFn: async () => {
            return api.get(`/reviews/${id}`);
        },
        enabled: !!id
    });

    // Add Review Mutation
    const addReviewMutation = useMutation({
        mutationFn: async (review: typeof newReview) => {
            return api.post('/reviews', { ...review, productId: item?.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', id] });
            setNewReview({ rating: 5, comment: '' });
            toast.success("Review added successfully");
        },
        onError: () => toast.error("Failed to add review")
    });


    useEffect(() => {
        if (item) {
            const modifiersPrice = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
            setTotalPrice(withFee(item.price + modifiersPrice) * quantity);
        }
    }, [item, quantity, selectedModifiers, serviceFeePercent]);

    if (isLoadingItem) {
        return (
            <Layout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (!item) {
        return (
            <Layout>
                <div className="container py-20 text-center">
                    <h2 className="text-2xl font-bold">Item not found</h2>
                    <Button onClick={() => navigate('/menu')} className="mt-4">Back to Menu</Button>
                </div>
            </Layout>
        );
    }

    const handleModifierToggle = (modifier: Modifier) => {
        setSelectedModifiers(prev => {
            const exists = prev.find(m => m.id === modifier.id);
            if (exists) {
                return prev.filter(m => m.id !== modifier.id);
            } else {
                return [...prev, modifier];
            }
        });
    };

    const incrementQuantity = () => setQuantity(q => q + 1);
    const decrementQuantity = () => setQuantity(q => (q > 1 ? q - 1 : 1));

    const handleAddToCart = () => {
        addItem(item, quantity, selectedModifiers, specialInstructions);
        toast.success(`Added ${quantity}x ${item.name} to cart`);
        navigate('/menu');
    };

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error("Please log in to leave a review");
            return;
        }
        addReviewMutation.mutate(newReview);
    };

    return (
        <Layout>
            <SEO
                title={item.name}
                description={item.description.slice(0, 155)}
                image={item.image}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: item.name,
                        description: item.description,
                        image: item.image.startsWith('http') ? item.image : SITE_URL + item.image,
                        category: item.category,
                        offers: {
                            '@type': 'Offer',
                            price: withFee(item.price).toFixed(2),
                            priceCurrency: 'GBP',
                            availability: item.isSoldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                            url: `${SITE_URL}/menu/${item.id}`,
                        },
                        ...(reviews.length > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1), reviewCount: reviews.length } } : {}),
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Menu', item: `${SITE_URL}/menu` },
                            { '@type': 'ListItem', position: 2, name: item.name, item: `${SITE_URL}/menu/${item.id}` },
                        ],
                    },
                ]}
            />
            <div className="bg-background min-h-screen pb-28 md:pb-20">
                {/* Sticky Header for mobile mainly */}
                <div className="sticky top-[64px] z-30 bg-background/80 backdrop-blur-md border-b md:hidden">
                    <div className="container py-2 flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="font-semibold text-lg truncate flex-1">{item.name}</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Share ${item.name}`}
                            onClick={async () => {
                                const result = await shareLink(item.name, item.description, `${SITE_URL}/menu/${item.id}`);
                                if (result === 'copied') toast.success('Link copied');
                            }}
                        >
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="container max-w-4xl pt-4 md:pt-12 pb-6 mx-auto animate-fade-in">
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image Section */}
                        <div>
                            <div className="rounded-2xl overflow-hidden shadow-warm aspect-square relative">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                                {item.isSoldOut && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Badge variant="destructive" className="text-lg px-4 py-2">Sold Out</Badge>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Nutritional Info - visible here on large screens */}
                            <div className="hidden md:block mt-8">
                                <NutritionalAccordion item={item} />
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {item.isPopular && <Badge className="bg-primary">Popular</Badge>}
                                    {item.isVegan && <Badge variant="secondary" className="bg-green-100 text-green-800">Vegan</Badge>}
                                    {item.isGlutenFree && <Badge variant="secondary" className="bg-amber-100 text-amber-800">GF</Badge>}
                                    {item.isHalal && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Halal</Badge>}
                                </div>

                                <h2 className="text-3xl font-bold mb-2">{item.name}</h2>
                                {item.chef && (
                                    <Link to={`/chefs/${item.chef.id}`} className="mb-2 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                            {item.chef.avatar ? <img src={item.chef.avatar} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-4 w-4" />}
                                        </span>
                                        Cooked by {item.chef.displayName}
                                    </Link>
                                )}
                                <p className="text-xl font-medium text-primary">£{withFee(item.price).toFixed(2)}</p>
                                <p className="mb-4 text-xs text-muted-foreground">Includes {serviceFeePercent}% service fee. Delivery is added at checkout.</p>
                                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                            </div>

                            {/* Modifiers */}
                            {item.modifiers && item.modifiers.length > 0 && (
                                <div className="space-y-4 py-4 border-t border-b">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        Customise
                                        <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Optional</span>
                                    </h3>
                                    <div className="grid gap-3">
                                        {item.modifiers.map(mod => (
                                            <div key={mod.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleModifierToggle(mod)}>
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        id={mod.id}
                                                        checked={selectedModifiers.some(m => m.id === mod.id)}
                                                        onCheckedChange={() => handleModifierToggle(mod)}
                                                    />
                                                    <Label htmlFor={mod.id} className="cursor-pointer font-medium">{mod.name}</Label>
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {mod.price > 0 ? `+£${withFee(mod.price).toFixed(2)}` : 'Free'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Special Instructions */}
                            <div>
                                <Label htmlFor="instructions" className="mb-2 block font-medium">Special Instructions</Label>
                                <Textarea
                                    id="instructions"
                                    placeholder="e.g. No onions, extra spicy..."
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                                    className="resize-none"
                                />
                            </div>

                            {/* Reviews Section */}
                            <div className="py-4 border-t">
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                    <MessageSquare className="h-5 w-5" /> Reviews ({reviews.length})
                                </h3>

                                <div className="space-y-4 mb-6">
                                    {reviews.length > 0 ? (
                                        reviews.map(review => (
                                            <div key={review.id} className="bg-secondary/10 p-4 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-sm">{review.userName || 'Anonymous'}</span>
                                                    <div className="flex text-yellow-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{review.comment}</p>
                                                <span className="text-xs text-muted-foreground mt-2 block">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No reviews yet. Be the first!</p>
                                    )}
                                </div>

                                {(item as { status?: string }).status ? null : eligibility?.canReview ? (
                                    <form onSubmit={handleSubmitReview} className="space-y-4 bg-secondary/20 p-4 rounded-lg">
                                        <h4 className="font-medium text-sm">Write a Review</h4>
                                        <div>
                                            <Label className="mb-2 block text-xs">Rating</Label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Button
                                                        key={star}
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label={`Rate ${star} stars`}
                                                        className={`h-11 w-11 p-0 hover:bg-transparent ${star <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                        onClick={() => setNewReview({ ...newReview, rating: star })}
                                                    >
                                                        <Star className="h-6 w-6 fill-current" />
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="comment" className="mb-2 block text-xs">Comment</Label>
                                            <Textarea
                                                id="comment"
                                                value={newReview.comment}
                                                onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                                placeholder="Tell us what you liked..."
                                                required
                                            />
                                        </div>
                                        <Button type="submit" size="sm" disabled={addReviewMutation.isPending}>
                                            {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="text-center p-4 bg-secondary/20 rounded-lg">
                                        <p className="text-sm">{!isAuthenticated ? "Reviews come from customers who've received this dish." : eligibility?.alreadyReviewed ? "Thanks, you've reviewed this dish." : "You can review this dish once you've received it."}</p>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Nutritional Info */}
                            <div className="md:hidden">
                                <NutritionalAccordion item={item} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Bottom Bar */}
                <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 left-0 right-0 p-3 md:bottom-0 md:p-4 bg-background border-t shadow-lg md:relative md:border-none md:shadow-none md:bg-transparent md:p-0">
                    <div className="container max-w-4xl mx-auto flex items-center gap-2 px-0 sm:gap-4 md:px-4">
                        {/* Quantity Control */}
                        <div className="flex items-center border rounded-full bg-secondary/20 h-12 md:h-14 px-1 md:px-2 shrink-0">
                            <Button variant="ghost" size="icon" aria-label="Decrease quantity" className="rounded-full h-10 w-10" onClick={decrementQuantity} disabled={quantity <= 1}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                            <Button variant="ghost" size="icon" aria-label="Increase quantity" className="rounded-full h-10 w-10" onClick={incrementQuantity}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Add Button */}
                        <Button
                            size="lg"
                            className="min-w-0 flex-1 h-12 md:h-14 rounded-full text-base md:text-lg shadow-warm font-bold flex justify-between items-center gap-2 px-4 md:px-6"
                            onClick={handleAddToCart}
                            disabled={item.isSoldOut}
                        >
                            <span>{item.isSoldOut ? 'Sold Out' : 'Add to Order'}</span>
                            {!item.isSoldOut && <span>£{totalPrice.toFixed(2)}</span>}
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const NutritionalAccordion = ({ item }: { item: any }) => (
    <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="nutrition">
            <AccordionTrigger className="text-muted-foreground hover:text-foreground">
                <span className="flex items-center gap-2">
                    <Info className="h-4 w-4" /> Nutritional Information
                </span>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-2 pt-2">
                    <div className="flex justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">Calories</span>
                        <span className="font-medium">{item.calories || 'N/A'} kcal</span>
                    </div>

                    {item.allergens && item.allergens.length > 0 ? (
                        <div className="py-2">
                            <span className="text-muted-foreground block mb-2">Allergens</span>
                            <div className="flex flex-wrap gap-2">
                                {item.allergens.map((allergen: string) => (
                                    <Badge key={allergen} variant="outline" className="text-xs uppercase bg-warning/10 border-warning/20 text-warning-foreground">
                                        {allergenLabel(allergen)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 text-sm text-green-600 flex items-center gap-1">
                            <Leaf className="h-3 w-3" /> No listed allergens
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4 italic">
                        Adults need around 2000 kcal a day. Variations may occur during preparation.
                    </p>
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
);

export default ItemDetail;
