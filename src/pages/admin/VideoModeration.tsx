import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChefAvatar, seconds, timeAgo, YouTubeVideo, type Post } from '@/components/social/social';

type Filter = 'unchecked' | 'food' | 'removed' | 'all';
const FILTERS: { value: Filter; label: string }[] = [
    { value: 'unchecked', label: 'To check' },
    { value: 'food', label: 'Checked' },
    { value: 'removed', label: 'Removed' },
    { value: 'all', label: 'All' },
];
const REASONS = ["This video isn't about food or cooking", 'This video shows unsafe food handling', 'This video includes contact details or advertising', 'This video is longer than one minute'];

/** Super Admins check every chef video is about food, and take down any that isn't. */
const VideoModeration = () => {
    const qc = useQueryClient();
    const [filter, setFilter] = useState<Filter>('unchecked');
    const [page, setPage] = useState(1);
    const [removing, setRemoving] = useState<Post | null>(null);
    const [reason, setReason] = useState('');
    const { data, isLoading } = useQuery<{ posts: Post[]; hasMore: boolean; waiting: number }>({
        queryKey: ['admin-posts', filter, page],
        queryFn: () => api.get(`/posts/admin?filter=${filter}&page=${page}`),
    });
    const review = useMutation({
        mutationFn: ({ id, decision, reason }: { id: number; decision: 'food' | 'remove' | 'restore'; reason?: string }) => api.post(`/posts/${id}/review`, { decision, reason }),
        onSuccess: (_: unknown, v) => {
            qc.invalidateQueries({ queryKey: ['admin-posts'] });
            toast.success(v.decision === 'food' ? 'Marked as food' : v.decision === 'remove' ? 'Video removed. The chef has been told why.' : 'Video restored');
            setRemoving(null);
            setReason('');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <div className="max-w-5xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Chef videos</h1>
                <p className="mt-1 text-muted-foreground">
                    Chefs share one YouTube video a week, up to a minute long. Videos go live straight away; check each one is about food, and remove any that isn't. The chef is told why.
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <Button key={f.value} size="sm" variant={filter === f.value ? 'default' : 'outline'} onClick={() => { setFilter(f.value); setPage(1); }}>
                        {f.label}{f.value === 'unchecked' && data?.waiting ? ` (${data.waiting})` : ''}
                    </Button>
                ))}
            </div>

            {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {data && data.posts.length === 0 && (
                <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                    {filter === 'unchecked' ? 'All caught up: no videos waiting to be checked.' : 'No videos here.'}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {data?.posts.map((p) => (
                    <article key={p.id} className="overflow-hidden rounded-2xl border bg-card">
                        <div className="flex items-center justify-between gap-2 p-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <ChefAvatar chef={p.chef} size={36} />
                                <div className="min-w-0">
                                    {p.chef ? <Link to={`/chefs/${p.chef.id}`} target="_blank" className="block truncate font-semibold hover:underline">{p.chef.displayName}</Link> : <span>Unknown chef</span>}
                                    <span className="text-xs text-muted-foreground">{timeAgo(p.createdAt)}</span>
                                </div>
                            </div>
                            {p.status === 'removed' ? <Badge variant="destructive">Removed</Badge> : p.review === 'food' ? <Badge className="bg-green-600 hover:bg-green-600">Checked</Badge> : <Badge variant="secondary">To check</Badge>}
                        </div>
                        <YouTubeVideo id={p.youtubeId} title={p.title} className="rounded-none" />
                        <div className="space-y-3 p-4">
                            <div>
                                <h2 className="font-semibold">{p.title}</h2>
                                {p.caption && <p className="mt-1 text-sm text-muted-foreground">{p.caption}</p>}
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Length: {p.durationSeconds === null ? <span className="text-orange-600">not checked, watch to confirm it's under a minute</span> : seconds(p.durationSeconds)}
                                    {' · '}{p.commentCount} comment{p.commentCount === 1 ? '' : 's'}
                                    {' · '}<a href={`https://youtu.be/${p.youtubeId}`} target="_blank" rel="noreferrer" className="underline">Open on YouTube</a>
                                </p>
                                {p.removedReason && <p className="mt-2 rounded bg-destructive/10 p-2 text-sm text-destructive">Removed: {p.removedReason}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {p.status === 'removed' ? (
                                    <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: p.id, decision: 'restore' })}><RotateCcw className="mr-1.5 h-4 w-4" />Restore</Button>
                                ) : (
                                    <>
                                        {p.review !== 'food' && <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ id: p.id, decision: 'food' })}><CheckCircle2 className="mr-1.5 h-4 w-4" />It's about food</Button>}
                                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRemoving(p)}><Trash2 className="mr-1.5 h-4 w-4" />Remove</Button>
                                    </>
                                )}
                                <Button size="sm" variant="ghost" asChild><Link to={`/videos/${p.id}`} target="_blank">Comments</Link></Button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {data && (page > 1 || data.hasMore) && (
                <div className="flex justify-center gap-2">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <Button variant="outline" disabled={!data.hasMore} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
            )}

            <Dialog open={!!removing} onOpenChange={(o) => { if (!o) { setRemoving(null); setReason(''); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Remove this video?</DialogTitle>
                        <DialogDescription>"{removing?.title}" will be hidden from everyone. The chef sees your reason and can share a different video straight away.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="remove-reason">Reason, for the chef</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {REASONS.map((r) => <button key={r} type="button" onClick={() => setReason(r)} className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted">{r}</button>)}
                        </div>
                        <Textarea id="remove-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoving(null)}>Cancel</Button>
                        <Button variant="destructive" disabled={!reason.trim() || review.isPending} onClick={() => removing && review.mutate({ id: removing.id, decision: 'remove', reason })}>
                            {review.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Remove video
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VideoModeration;
