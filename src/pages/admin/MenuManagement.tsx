import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, MoreHorizontal, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
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
    tags?: string[];
    calories?: number;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
    isPopular?: boolean;
}

const MenuManagement = () => {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Fetch Products
    const { data: items = [], isLoading } = useQuery<Product[]>({
        queryKey: ['admin-products'],
        queryFn: async () => {
            return api.get('/products');
        }
    });

    // Delete Product Mutation
    const deleteProductMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success("Product deleted");
        },
        onError: (error: any) => toast.error(error.message || "Failed to delete product")
    });

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
                    <p className="text-muted-foreground">Manage your dishes, prices, and availability.</p>
                </div>

                <Button asChild>
                    <Link to="/admin/menu/add">
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="border rounded-md shadow-sm bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <img src={item.image} alt={item.name} className="h-10 w-10 rounded-md object-cover bg-muted" />
                                    </TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="capitalize">{item.category}</TableCell>
                                    <TableCell>£{Number(item.price).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.isSoldOut ? "destructive" : "default"}>
                                            {item.isSoldOut ? 'Sold Out' : 'Active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link to={`/admin/menu/edit/${item.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => {
                                                    if (confirm("Are you sure you want to delete this product?")) {
                                                        deleteProductMutation.mutate(item.id);
                                                    }
                                                }}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default MenuManagement;
