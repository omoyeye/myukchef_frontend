import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Clock, Loader2, Trash2, Users, Youtube } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Comments, PostCard, seconds, type Comment, type Post } from './social';

interface Mine { posts: Post[]; nextPostAt: string | null; followers: number; canPost: boolean }

const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

/** The chef's Videos tab: share this week's YouTube video and see comments. */
export function ChefVideos() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery<Mine>({ queryKey: ['my-posts'], queryFn: () => api.get('/posts/mine') });
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [deleting, setDeleting] = useState<Post | null>(null);
    const [open, setOpen] = useState<number | null>(null);

    const share = useMutation({
        mutationFn: () => api.post('/posts', { url, title, caption }),
        onSuccess: () => {
            setUrl(''); setTitle(''); setCaption('');
            qc.invalidateQueries({ queryKey: ['my-posts'] });
            toast.success('Video shared. Your followers have been told.');
        },
        onError: (e: Error) => toast.error(e.message),
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/posts/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-posts'] }); toast.success('Video deleted'); },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading || !data) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Youtube className="h-5 w-5 text-primary" />Share this week's video</CardTitle>
                    <CardDescription>
                        Upload a short video of your cooking to YouTube (a Short works well), then paste the link here. One video a week, up to one minute.
                        It must be about your food: MYUKCHEF checks every video and removes any that aren't.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" />{data.followers} follower{data.followers === 1 ? '' : 's'}</div>
                    {!data.canPost ? (
                        <p className="rounded-lg bg-muted p-3 text-sm">You can share videos once your chef account is approved.</p>
                    ) : data.nextPostAt ? (
                        <p className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm"><Clock className="h-4 w-4 shrink-0" />You've shared this week's video. Your next one can go up on {longDate(data.nextPostAt)}.</p>
                    ) : (
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); share.mutate(); }}>
                            <div className="space-y-1.5">
                                <Label htmlFor="video-url">YouTube link</Label>
                                <Input id="video-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/shorts/..." inputMode="url" required />
                                <p className="text-xs text-muted-foreground">The video must be public or unlisted, with embedding allowed.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="video-title">Title (optional)</Label>
                                <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="We'll use the YouTube title if you leave this empty" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="video-caption">Caption (optional)</Label>
                                <Textarea id="video-caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} rows={3} placeholder="What are you cooking? Which dish on your menu is it?" />
                            </div>
                            <Button type="submit" disabled={!url.trim() || share.isPending}>
                                {share.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Share video
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">My videos</h2>
                {data.posts.length === 0 && <p className="text-muted-foreground">You haven't shared a video yet.</p>}
                <div className="grid gap-6 md:grid-cols-2">
                    {data.posts.map((p) => (
                        <div key={p.id} className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {p.status === 'removed'
                                    ? <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Removed</Badge>
                                    : p.review === 'food'
                                        ? <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />Checked</Badge>
                                        : <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Live, waiting for a check</Badge>}
                                {p.durationSeconds !== null && <span className="text-xs text-muted-foreground">{seconds(p.durationSeconds)}</span>}
                            </div>
                            {p.status === 'removed' && p.removedReason && <p className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">Reason: {p.removedReason}</p>}
                            <PostCard post={p} showChef={false}>
                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="outline" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Hide comments' : 'Comments'}</Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(p)}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>
                                </div>
                                {open === p.id && <PostComments postId={p.id} />}
                            </PostCard>
                        </div>
                    ))}
                </div>
            </section>

            <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this video?</AlertDialogTitle>
                        <AlertDialogDescription>"{deleting?.title}" and its comments will be removed from MYUKCHEF. It stays on your YouTube channel. You can share another video straight away.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleting && remove.mutate(deleting.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function PostComments({ postId }: { postId: number }) {
    const qc = useQueryClient();
    const { data } = useQuery<{ comments: Comment[] }>({ queryKey: ['post', String(postId)], queryFn: () => api.get(`/posts/${postId}`) });
    if (!data) return <Loader2 className="mt-3 h-5 w-5 animate-spin text-muted-foreground" />;
    return <div className="mt-4 border-t pt-4"><Comments postId={postId} comments={data.comments} onChange={() => { qc.invalidateQueries({ queryKey: ['post', String(postId)] }); qc.invalidateQueries({ queryKey: ['my-posts'] }); }} /></div>;
}
