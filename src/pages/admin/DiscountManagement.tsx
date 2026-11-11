import { useState } from 'react';
import { Plus, Trash2, Ticket, Percent, Banknote, Calendar, UserPlus, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DiscountManagement = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<any>(null);

    // Form State
    const [form, setForm] = useState({
        code: '',
        type: 'percentage',
        value: 10,
        minOrderAmount: 0,
        isFirstOrderOnly: false,
        expiryDate: ''
    });

    const { data: discounts = [], isLoading } = useQuery<any[]>({
        queryKey: ['discounts'],
        queryFn: async () => api.get('/discounts')
    });

    const createMutation = useMutation({
        mutationFn: (newDiscount: any) => api.post('/discounts', newDiscount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
            setIsAdding(false);
            setForm({ code: '', type: 'percentage', value: 10, minOrderAmount: 0, isFirstOrderOnly: false, expiryDate: '' });
            toast.success("Discount code created!");
        },
        onError: () => toast.error("Failed to create code")
    });

    const updateMutation = useMutation({
        mutationFn: (discount: any) => api.put(`/discounts/${discount.id}`, discount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
            setIsEditing(false);
            setEditingDiscount(null);
            toast.success("Discount updated successfully");
        },
        onError: () => toast.error("Failed to update discount")
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/discounts/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
            toast.success("Discount deleted");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: number, isActive: boolean }) =>
            api.patch(`/discounts/${id}/toggle`, { isActive }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discounts'] })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(form);
    };

    const handleEditClick = (discount: any) => {
        setEditingDiscount({
            ...discount,
            expiryDate: discount.expiryDate ? format(new Date(discount.expiryDate), 'yyyy-MM-dd') : ''
        });
        setIsEditing(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(editingDiscount);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Discounts & Promos</h2>
                    <p className="text-muted-foreground">Create and manage dynamic discount codes.</p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> New Code</>}
                </Button>
            </div>

            {isAdding && (
                <Card className="border-primary/20 bg-primary/5 animate-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle>Generate New Discount</CardTitle>
                        <CardDescription>Configure the rules for this promotion.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Code (Caps recommended)</Label>
                                <Input
                                    placeholder="WELCOME20"
                                    value={form.code}
                                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select onValueChange={val => setForm({ ...form, type: val })} defaultValue={form.type}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Value ({form.type === 'percentage' ? '%' : '£'})</Label>
                                <Input
                                    type="number"
                                    value={form.value}
                                    onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Order Amount (£)</Label>
                                <Input
                                    type="number"
                                    value={form.minOrderAmount}
                                    onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Expiry Date (Optional)</Label>
                                <Input
                                    type="date"
                                    value={form.expiryDate}
                                    onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    id="first-order"
                                    checked={form.isFirstOrderOnly}
                                    onCheckedChange={val => setForm({ ...form, isFirstOrderOnly: val })}
                                />
                                <Label htmlFor="first-order">First Order Only</Label>
                            </div>
                            <Button className="md:col-span-2 lg:col-span-3" type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create Promotion"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discounts.map((discount) => (
                    <Card key={discount.id} className={cn("relative overflow-hidden group", !discount.isActive && "opacity-60")}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Ticket className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleEditClick(discount)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Delete ${discount.code}`}
                                        className="h-10 w-10 text-destructive"
                                        onClick={() => { if (confirm(`Delete discount ${discount.code}?`)) deleteMutation.mutate(discount.id); }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Switch
                                        checked={discount.isActive}
                                        onCheckedChange={(val) => toggleMutation.mutate({ id: discount.id, isActive: val })}
                                    />
                                </div>
                            </div>
                            <CardTitle className="mt-4 text-2xl font-black italic">{discount.code}</CardTitle>
                            <CardDescription>
                                {discount.type === 'percentage' ? `${discount.value}% OFF` : `£${discount.value} OFF`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {discount.isFirstOrderOnly ? "First customers only" : "All customers"}
                            </div>
                            {discount.minOrderAmount > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Banknote className="h-4 w-4" /> Min order: £{discount.minOrderAmount}
                                </div>
                            )}
                            {discount.expiryDate && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" /> Expires: {format(new Date(discount.expiryDate), 'PPP')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {discounts.length === 0 && !isLoading && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-muted-foreground/20">
                        <Ticket className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">No active promotions</h3>
                        <p className="text-sm text-muted-foreground">Click 'New Code' to start pushing discounts to your users.</p>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Discount Code</DialogTitle>
                        <DialogDescription>Modify the rules for {editingDiscount?.code}.</DialogDescription>
                    </DialogHeader>
                    {editingDiscount && (
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Code</Label>
                                <Input
                                    value={editingDiscount.code}
                                    onChange={e => setEditingDiscount({ ...editingDiscount, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                        onValueChange={val => setEditingDiscount({ ...editingDiscount, type: val })}
                                        defaultValue={editingDiscount.type}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Value</Label>
                                    <Input
                                        type="number"
                                        value={editingDiscount.value}
                                        onChange={e => setEditingDiscount({ ...editingDiscount, value: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Min Order Amount (£)</Label>
                                <Input
                                    type="number"
                                    value={editingDiscount.minOrderAmount}
                                    onChange={e => setEditingDiscount({ ...editingDiscount, minOrderAmount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Expiry Date</Label>
                                <Input
                                    type="date"
                                    value={editingDiscount.expiryDate}
                                    onChange={e => setEditingDiscount({ ...editingDiscount, expiryDate: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 py-2">
                                <Switch
                                    id="edit-first-order"
                                    checked={editingDiscount.isFirstOrderOnly}
                                    onCheckedChange={val => setEditingDiscount({ ...editingDiscount, isFirstOrderOnly: val })}
                                />
                                <Label htmlFor="edit-first-order">First Order Only</Label>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DiscountManagement;
