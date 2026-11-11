import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search, Sparkles, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { MenuCard } from '@/components/menu/MenuCard';
import { api } from '@/lib/api';
import { categories } from '@/data/categories';
import { MenuItem } from '@/types/menu';
import SEO from '@/components/common/SEO';

const DIETARY_FILTERS = [
    { id: 'isVegetarian', label: 'Vegetarian' },
    { id: 'isVegan', label: 'Vegan' },
    { id: 'isGlutenFree', label: 'Gluten Free' },
    { id: 'isHalal', label: 'Halal' },
] as const;

const Menu = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';
    const initialSearch = searchParams.get('search') || '';

    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const chefFilter = searchParams.get('chef');

    const { data: regularProducts = [], isLoading: l1, error } = useQuery({
        queryKey: ['products'],
        queryFn: () => api.get('/products'),
    });
    const { data: chefProducts = [], isLoading: l2 } = useQuery({
        queryKey: ['public-chef-products'],
        queryFn: () => api.get('/chefs/products/public'),
    });
    const isLoading = l1 || l2;
    const menuItems = useMemo(() => {
        const merged = [
            ...regularProducts,
            ...chefProducts.map((p: any) => ({ ...p, _chef: p.chef })),
        ];
        return chefFilter ? merged.filter((m: any) => m.chef?.id === Number(chefFilter)) : merged;
    }, [regularProducts, chefProducts, chefFilter]);

    const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);

    // Sync state with URL params
    useEffect(() => {
        setActiveCategory(searchParams.get('category') || 'all');
        setSearchQuery(searchParams.get('search') || '');
    }, [searchParams]);

    // Filter logic
    useEffect(() => {
        let result = menuItems;

        // 1. Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(
                item =>
                    item.name.toLowerCase().includes(lowerQuery) ||
                    item.description.toLowerCase().includes(lowerQuery) ||
                    item.chef?.displayName.toLowerCase().includes(lowerQuery) ||
                    item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Category
        if (activeCategory !== 'all') {
            result = result.filter((item) => item.category === activeCategory);
        }

        // 3. Dietary Filters
        if (activeFilters.length > 0) {
            result = result.filter((item) => {
                return activeFilters.every((filter) => (item as any)[filter]);
            });
        }

        setFilteredItems(result);
    }, [activeCategory, searchQuery, activeFilters, menuItems]); // Added menuItems dependency

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
        const newParams = new URLSearchParams(searchParams);
        if (categoryId === 'all') {
            newParams.delete('category');
        } else {
            newParams.set('category', categoryId);
        }
        setSearchParams(newParams);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set('search', value);
        } else {
            newParams.delete('search');
        }
        setSearchParams(newParams);
    };

    const toggleFilter = (filterId: string) => {
        setActiveFilters((prev) =>
            prev.includes(filterId)
                ? prev.filter((id) => id !== filterId)
                : [...prev, filterId]
        );
    };

    const clearFilters = () => {
        setActiveFilters([]);
        setSearchQuery('');
        setActiveCategory('all');
        setSearchParams({});
    };

    return (
        <Layout>
            <SEO
                title="Our Menu"
                description="Browse home-cooked dishes from independent local chefs across the UK. Filter by diet, order for delivery or collection, and see who cooked your meal."
            />
            <div className="bg-secondary/30 pb-8 min-h-screen">
                <div className="container px-4 pt-4 md:pt-12">
                    {/* Error State */}
                    {error && (
                        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
                            Failed to load menu. Please try again later.
                        </div>
                    )}

                    {/* Header & Search */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Our Menu</h1>
                            <p className="text-muted-foreground mt-1">
                                Home-cooked dishes from local chefs. Prices include the service fee, and delivery is added at checkout.
                            </p>
                        </div>

                        <div className="flex w-full md:w-auto gap-2">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search dishes..."
                                    className="h-11 pl-9 md:h-10"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            const newParams = new URLSearchParams(searchParams);
                                            newParams.delete('search');
                                            setSearchParams(newParams);
                                        }}
                                        aria-label="Clear search"
                                        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" aria-label="Open filters" className="relative h-11 w-11 shrink-0 md:h-10 md:w-10">
                                        <Filter className="h-4 w-4" />
                                        {activeFilters.length > 0 && (
                                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{activeFilters.length}</span>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-[85%] overflow-y-auto sm:max-w-sm">
                                    <SheetHeader>
                                        <SheetTitle>Filters</SheetTitle>
                                        <SheetDescription>
                                            Refine your menu selection
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="py-6 space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Dietary Preferences</h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {DIETARY_FILTERS.map((filter) => (
                                                    <div key={filter.id} className="flex min-h-11 items-center space-x-3">
                                                        <Checkbox
                                                            id={filter.id}
                                                            checked={activeFilters.includes(filter.id)}
                                                            onCheckedChange={() => toggleFilter(filter.id)}
                                                        />
                                                        <Label htmlFor={filter.id} className="cursor-pointer">{filter.label}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <Button variant="outline" className="w-full" onClick={clearFilters}>
                                            Clear All Filters
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    {/* Categories Horizontal Scroll */}
                    <Link to="/recommend" className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 hover:bg-primary/10">
                        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-0 text-sm"><span className="font-semibold">Not sure what to order?</span> <span className="text-muted-foreground">Get picks for your diet, budget and occasion.</span></span>
                    </Link>

                    <div className="-mx-4 flex overflow-x-auto px-4 pb-3 mb-4 gap-2 no-scrollbar md:mx-0 md:mb-6 md:flex-wrap md:px-0">
                        <Button
                            variant={activeCategory === 'all' ? 'default' : 'outline'}
                            onClick={() => handleCategoryChange('all')}
                            className="h-11 shrink-0 rounded-full whitespace-nowrap md:h-10"
                        >
                            All Items
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.id}
                                variant={activeCategory === cat.id ? 'default' : 'outline'}
                                onClick={() => handleCategoryChange(cat.id)}
                                className="h-11 shrink-0 rounded-full whitespace-nowrap md:h-10"
                            >
                                <span className="mr-2">{cat.icon}</span>
                                {cat.name}
                            </Button>
                        ))}
                    </div>

                    {/* Active Filters Display */}
                    {activeFilters.length > 0 && (
                        <div className="flex gap-2 mb-6 flex-wrap">
                            {activeFilters.map(filterId => {
                                const label = DIETARY_FILTERS.find(f => f.id === filterId)?.label;
                                return (
                                    <Badge key={filterId} variant="secondary" className="px-3 py-1 text-sm bg-background border">
                                        {label}
                                        <button aria-label={`Remove ${label} filter`} onClick={() => toggleFilter(filterId)} className="-my-1 -mr-1 ml-1 flex h-7 w-7 items-center justify-center hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}

                    {/* Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
                            {filteredItems.map((item) => (
                                <MenuCard key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-background/50 rounded-lg border border-dashed">
                            <span className="text-4xl block mb-4">🔍</span>
                            <h3 className="text-lg font-medium">No items found</h3>
                            <p className="text-muted-foreground mt-2">
                                Try adjusting your filters or search term
                            </p>
                            <Button variant="link" onClick={clearFilters} className="mt-4">
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Menu;
