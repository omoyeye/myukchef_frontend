import { useState } from 'react';
import { Trash2, Check, X, Star, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ChefReviewsAdmin } from './ChefReviewsAdmin';

interface Review {
    id: number;
    rating: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    userName: string;
    productName: string;
}

const ReviewManagement = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Fetch Reviews
    const { data: reviews = [], isLoading } = useQuery<Review[]>({
        queryKey: ['admin-reviews'],
        queryFn: async () => {
            return api.get('/reviews/admin/all');
        }
    });

    // Update Review Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: string }) => {
            return api.patch(`/reviews/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            toast.success("Review status updated");
        },
        onError: (error: any) => toast.error(error.message || "Failed to update status")
    });

    // Delete Review Mutation
    const deleteReviewMutation = useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`/reviews/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            toast.success("Review deleted");
        },
        onError: (error: any) => toast.error(error.message || "Failed to delete review")
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-500">Approved</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="secondary">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Review Management</h2>
                <p className="text-muted-foreground">Manage ratings for chefs and reviews for dishes.</p>
            </div>

            <ChefReviewsAdmin />

            <div className="border rounded-md shadow-sm bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : reviews.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No reviews found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reviews.map((review) => (
                                <TableRow key={review.id}>
                                    <TableCell className="text-sm">
                                        {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell className="font-medium">{review.userName}</TableCell>
                                    <TableCell>{review.productName}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold">{review.rating}</span>
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <span title={review.comment}>{review.comment}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {review.status !== 'approved' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                                                    onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'approved' })}
                                                    disabled={updateStatusMutation.isPending}
                                                >
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                                                    onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'rejected' })}
                                                    disabled={updateStatusMutation.isPending}
                                                >
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to delete this review?")) {
                                                        deleteReviewMutation.mutate(review.id);
                                                    }
                                                }}
                                                disabled={deleteReviewMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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

export default ReviewManagement;
