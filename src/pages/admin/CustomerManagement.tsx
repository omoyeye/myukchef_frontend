import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface Account {
    id: number;
    name: string;
    email: string;
    role: string;
    points: number;
    createdAt: string;
}

const EMPTY = { name: "", email: "", role: "customer", points: 0, password: "" };

const CustomerManagement = () => {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<(typeof EMPTY & { id?: number }) | null>(null);

    const { data: accounts = [], isLoading } = useQuery<Account[]>({
        queryKey: ["admin-users", search],
        queryFn: () => api.get(`/users?search=${encodeURIComponent(search)}`),
    });

    const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

    const save = useMutation({
        mutationFn: ({ id, password, ...rest }: typeof EMPTY & { id?: number }) => {
            const body = { ...rest, ...(password ? { password } : {}) };
            return id ? api.put(`/users/${id}`, body) : api.post("/users", body);
        },
        onSuccess: () => { toast.success("Saved"); setEditing(null); refresh(); },
        onError: (e) => toast.error(e.message),
    });

    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/users/${id}`),
        onSuccess: () => { toast.success("Account deleted"); refresh(); },
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Customers & Accounts</h1>
                    <p className="text-sm text-muted-foreground">Manage customers, chefs and Super Admin access.</p>
                </div>
                <Button className="h-11 md:h-10" onClick={() => setEditing({ ...EMPTY })}><Plus className="mr-2 h-4 w-4" />Add account</Button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Search accounts" className="h-11 pl-9 md:h-10" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Wallet</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No accounts found</TableCell></TableRow>}
                                {accounts.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-medium">{a.name}</TableCell>
                                        <TableCell>{a.email}</TableCell>
                                        <TableCell><Badge variant={a.role === "admin" ? "default" : "secondary"} className="capitalize">{a.role === "admin" ? "Super Admin" : a.role}</Badge></TableCell>
                                        <TableCell><a className="text-primary underline-offset-4 hover:underline" href={`/admin/wallets?tab=people&user=${a.id}`}>Wallet</a></TableCell>
                                        <TableCell className="whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString("en-GB")}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" aria-label={`Edit ${a.name}`} className="h-10 w-10" onClick={() => setEditing({ ...a, password: "" })}><Pencil className="h-4 w-4" /></Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Delete ${a.name}`}
                                                    className="h-10 w-10 text-destructive"
                                                    disabled={a.id === user?.id}
                                                    onClick={() => { if (confirm(`Delete ${a.name}'s account and personal data? Their past orders stay on record without their name.`)) remove.mutate(a.id); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent>
                    {editing && (
                        <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>{editing.id ? "Edit account" : "Add account"}</DialogTitle>
                                <DialogDescription>Leave the password blank to keep it, or to let a new person set their own with "Forgot password".</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2"><Label htmlFor="acct-name">Name</Label><Input id="acct-name" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="acct-email">Email</Label><Input id="acct-email" type="email" required value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="acct-role">Role</Label>
                                    <select id="acct-role" className="h-10 w-full rounded-md border border-input bg-background px-3" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                                        <option value="customer">Customer</option>
                                        <option value="chef">Chef</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="acct-password">New password</Label><Input id="acct-password" type="password" autoComplete="new-password" minLength={8} value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></div>
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CustomerManagement;
