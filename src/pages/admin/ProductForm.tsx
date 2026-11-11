import { useState, useEffect } from 'react';
import { AllergenPicker } from '@/components/common/AllergenPicker';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, uploadImage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    isSoldOut: boolean;
    modifiers?: any[];
    allergens?: string[];
    allergensDeclared?: boolean;
    tags?: string[];
    calories?: number;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
    isPopular?: boolean;
    chefId?: number | string | null;
}

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isEdit = Boolean(id);

    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
        modifiers: [],
        allergens: [],
        isSoldOut: false,
        isPopular: false,
    });
    const { data: chefList = [] } = useQuery<any[]>({ queryKey: ['admin-chefs'], queryFn: () => api.get('/chefs/admin/all') });
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Fetch Product if editing
    const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
        queryKey: ['admin-product', id],
        queryFn: async () => {
            if (!id) return null;
            const products = await api.get('/products');
            return products.find((p: Product) => p.id.toString() === id);
        },
        enabled: isEdit
    });

    useEffect(() => {
        if (product) {
            setCurrentProduct(product);
        }
    }, [product]);

    // Mutation
    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            if (isEdit) {
                return api.put(`/products/${id}`, payload);
            } else {
                return api.post('/products', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
            navigate('/admin/menu');
        },
        onError: (error: any) => toast.error(error.message || "Failed to save product")
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...currentProduct,
            price: Number(currentProduct.price),
            image: currentProduct.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
        };
        mutation.mutate(payload);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setIsUploading(true);
        try {
            const imageUrl = await uploadImage(file);
            setCurrentProduct({ ...currentProduct, image: imageUrl });
            setImagePreview(imageUrl);
            toast.success("Image uploaded successfully");
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    if (isEdit && isLoadingProduct) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link to="/admin/menu">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Item' : 'Add New Item'}</h2>
                    <p className="text-muted-foreground">
                        {isEdit ? 'Update existing dish details.' : 'Create a new dish for your menu.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Main details of the dish.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="product-chef">Chef who makes this dish</Label>
                                <select id="product-chef" required className="h-10 w-full rounded-md border border-input bg-background px-3" value={currentProduct.chefId ?? ''} onChange={(e) => setCurrentProduct({ ...currentProduct, chefId: e.target.value })}>
                                    <option value="">Choose a chef</option>
                                    {chefList.filter((c) => c.status === 'approved' || c.id === Number(currentProduct.chefId)).map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={currentProduct.name || ''} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" placeholder="e.g. Mains, Sides" value={currentProduct.category || ''} onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price (£)</Label>
                                <Input id="price" type="number" step="0.01" value={currentProduct.price || ''} onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" className="min-h-[100px]" value={currentProduct.description || ''} onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Media & Availability</CardTitle>
                            <CardDescription>Product image and status.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Availability</Label>
                                    <p className="text-sm text-muted-foreground">Mark as active or sold out</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={!currentProduct.isSoldOut}
                                        onCheckedChange={(checked) => setCurrentProduct({ ...currentProduct, isSoldOut: !checked })}
                                    />
                                    <Badge variant={currentProduct.isSoldOut ? "destructive" : "default"}>
                                        {currentProduct.isSoldOut ? 'Sold Out' : 'Active'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="image">Image URL</Label>
                                <div className="flex gap-2">
                                    <Input id="image" placeholder="https://..." value={currentProduct.image || ''} onChange={e => setCurrentProduct({ ...currentProduct, image: e.target.value })} className="flex-1" />
                                    <div className="relative">
                                        <Button type="button" variant="outline" size="sm" className="h-full" disabled={isUploading}>
                                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                                        </Button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                    </div>
                                </div>
                                {(imagePreview || currentProduct.image) && (
                                    <div className="mt-2 relative aspect-video rounded-md overflow-hidden border bg-muted shadow-sm">
                                        <img
                                            src={imagePreview || currentProduct.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Metadata & Customization</CardTitle>
                        <CardDescription>Add dietary info, allergens, and modifiers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="calories">Calories (kcal)</Label>
                                    <Input id="calories" type="number" value={currentProduct.calories || ''} onChange={e => setCurrentProduct({ ...currentProduct, calories: parseInt(e.target.value) })} />
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="isPopular" checked={currentProduct.isPopular} onCheckedChange={(checked) => setCurrentProduct({ ...currentProduct, isPopular: !!checked })} />
                                    <Label htmlFor="isPopular" className="text-sm font-medium">Mark as Popular Item</Label>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <Label className="text-sm font-semibold">Dietary Flags</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['isVegetarian', 'isVegan', 'isGlutenFree', 'isHalal'] as const).map(flagId => {
                                            const labels = {
                                                isVegetarian: 'Vegetarian',
                                                isVegan: 'Vegan',
                                                isGlutenFree: 'Gluten Free',
                                                isHalal: 'Halal'
                                            };
                                            return (
                                                <div key={flagId} className="flex items-center space-x-2">
                                                    <Checkbox id={flagId} checked={!!currentProduct[flagId]} onCheckedChange={(checked) => setCurrentProduct({ ...currentProduct, [flagId]: !!checked })} />
                                                    <Label htmlFor={flagId} className="text-sm cursor-pointer">{labels[flagId]}</Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <AllergenPicker idPrefix="product" value={currentProduct.allergens ?? []} confirmed={!!currentProduct.allergensDeclared} onChange={(allergens) => setCurrentProduct({ ...currentProduct, allergens })} onConfirmedChange={(allergensDeclared) => setCurrentProduct({ ...currentProduct, allergensDeclared })} />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Modifiers (Extra options)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                        const mods = [...(currentProduct.modifiers || []), { name: '', price: 0, id: `mod-${Date.now()}` }];
                                        setCurrentProduct({ ...currentProduct, modifiers: mods });
                                    }}>
                                        <Plus className="mr-2 h-3 w-3" /> Add Modifier
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {(currentProduct.modifiers || []).map((mod, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-muted/40 p-2 rounded-md border">
                                            <div className="flex-1 space-y-2">
                                                <Input placeholder="Modifier Name (e.g. Extra Cheese)" value={mod.name} onChange={e => {
                                                    const mods = [...(currentProduct.modifiers || [])];
                                                    mods[idx] = { ...mods[idx], name: e.target.value, id: mods[idx].id || e.target.value.toLowerCase().replace(/\s+/g, '-') };
                                                    setCurrentProduct({ ...currentProduct, modifiers: mods });
                                                }} />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">Price: £</span>
                                                    <Input placeholder="0.00" type="number" step="0.01" value={mod.price} onChange={e => {
                                                        const mods = [...(currentProduct.modifiers || [])];
                                                        mods[idx] = { ...mods[idx], price: parseFloat(e.target.value) || 0 };
                                                        setCurrentProduct({ ...currentProduct, modifiers: mods });
                                                    }} className="h-8" />
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => {
                                                const mods = (currentProduct.modifiers || []).filter((_, i) => i !== idx);
                                                setCurrentProduct({ ...currentProduct, modifiers: mods });
                                            }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(currentProduct.modifiers || []).length === 0 && (
                                        <div className="text-sm text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground">
                                            No modifiers added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/menu')}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={mutation.isPending}>
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEdit ? 'Save Changes' : 'Create Product'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
