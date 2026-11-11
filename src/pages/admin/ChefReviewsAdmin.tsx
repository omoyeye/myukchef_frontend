import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

/** Reviews publish straight away. Hide only abusive, unlawful or non-genuine ones, never just low ratings. */
export const ChefReviewsAdmin = () => {
    const qc = useQueryClient();
    const { data: reviews = [], isLoading } = useQuery<any[]>({ queryKey: ["admin-chef-reviews"], queryFn: () => api.get("/chef-reviews/admin/all") });
    const refresh = () => qc.invalidateQueries({ queryKey: ["admin-chef-reviews"] });
    const setStatus = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/chef-reviews/admin/${id}`, { status }),
        onSuccess: refresh,
        onError: (e: Error) => toast.error(e.message),
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/chef-reviews/admin/${id}`),
        onSuccess: () => { toast.success("Review deleted"); refresh(); },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-xl font-bold">Chef ratings</h3>
                <p className="text-sm text-muted-foreground">These go live straight away, and only customers a chef has cooked for can post one. Hide a review only if it's abusive, unlawful or not genuine, never just because it's negative.</p>
            </div>
            <div className="rounded-md border bg-background shadow-sm">
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Chef</TableHead><TableHead>Customer</TableHead><TableHead>Rating</TableHead><TableHead>Comment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></TableCell></TableRow>
                        ) : reviews.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No chef ratings yet.</TableCell></TableRow>
                        ) : reviews.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="whitespace-nowrap text-sm">{format(new Date(r.createdAt), "d MMM yyyy")}</TableCell>
                                <TableCell className="font-medium">{r.chefName}</TableCell>
                                <TableCell>{r.customerName}</TableCell>
                                <TableCell><span className="inline-flex items-center gap-1 font-bold">{r.rating}<Star className="h-3 w-3 fill-primary text-primary" /></span></TableCell>
                                <TableCell className="max-w-xs"><span className="line-clamp-2" title={r.comment ?? ""}>{r.comment || "No comment"}</span></TableCell>
                                <TableCell><Badge variant={r.status === "published" ? "default" : "secondary"} className="capitalize">{r.status}</Badge></TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button size="icon" variant="ghost" className="h-10 w-10" aria-label={r.status === "published" ? `Hide ${r.customerName}'s review` : `Publish ${r.customerName}'s review`} disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: r.id, status: r.status === "published" ? "hidden" : "published" })}>
                                            {r.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" aria-label={`Delete ${r.customerName}'s review`} disabled={remove.isPending} onClick={() => { if (confirm("Delete this review for good?")) remove.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <h3 className="pt-4 text-xl font-bold">Dish reviews</h3>
            <p className="text-sm text-muted-foreground">Only customers who received a dish can review it, and reviews go live straight away. Reject one only if it's abusive, unlawful or not genuine, never just because it's negative.</p>
        </section>
    );
};
