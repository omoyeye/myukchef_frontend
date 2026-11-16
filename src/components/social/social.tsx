import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChefHat, Loader2, MessageCircle, Play, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface Post {
    id: number;
    youtubeId: string;
    title: string;
    caption: string | null;
    durationSeconds: number | null;
    createdAt: string;
    commentCount: number;
    chef: { id: number; displayName: string; avatar: string | null } | null;
    isFollowing: boolean;
    mine: boolean;
    status?: 'live' | 'removed';
    review?: 'unchecked' | 'food';
    removedReason?: string | null;
    reviewedAt?: string | null;
}
export interface Comment { id: number; body: string; createdAt: string; author: string; mine: boolean; canRemove: boolean; status?: string }

export const timeAgo = (iso: string) => {
    const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'just now';
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
export const seconds = (n: number | null) => (n === null ? '' : `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`);

/**
 * YouTube only loads after the viewer presses play, so no YouTube cookies are set by just
 * opening a page. The privacy-enhanced (nocookie) player is used.
 */
export function YouTubeVideo({ id, title, className }: { id: string; title: string; className?: string }) {
    const [playing, setPlaying] = useState(false);
    return (
        <div className={cn('relative aspect-[9/16] max-h-[70vh] w-full overflow-hidden rounded-xl bg-black sm:aspect-video', className)}>
            {playing ? (
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
                    title={title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                />
            ) : (
                <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play video: ${title}`}>
                    <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                    <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition group-hover:scale-110">
                        <Play className="ml-1 h-7 w-7 fill-current" />
                    </span>
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">Plays from YouTube</span>
                </button>
            )}
        </div>
    );
}

export function ChefAvatar({ chef, size = 40 }: { chef: Post['chef']; size?: number }) {
    return (
        <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10" style={{ width: size, height: size }}>
            {chef?.avatar ? <img src={chef.avatar} alt="" className="h-full w-full object-cover" /> : <ChefHat className="h-1/2 w-1/2 text-primary" />}
        </span>
    );
}

/** Follow or unfollow a chef. Signed-out visitors are sent to sign in first. */
export function FollowButton({ chefId, chefName, size = 'sm', className }: { chefId: number; chefName: string; size?: 'sm' | 'default'; className?: string }) {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const key = ['follow', chefId];
    const { data } = useQuery<{ following: boolean; followers: number }>({ queryKey: key, queryFn: () => api.get(`/posts/chefs/${chefId}/follow`) });
    const toggle = useMutation({
        mutationFn: (on: boolean) => (on ? api.post(`/posts/chefs/${chefId}/follow`, {}) : api.delete(`/posts/chefs/${chefId}/follow`)),
        onSuccess: (next: { following: boolean; followers: number }) => {
            qc.setQueryData(key, next);
            qc.invalidateQueries({ queryKey: ['posts'] });
            toast.success(next.following ? `You're following ${chefName}. We'll tell you when they share a video.` : `You've unfollowed ${chefName}.`);
        },
        onError: (e: Error) => toast.error(e.message),
    });
    if (user?.role === 'chef' && data === undefined) return null;
    const following = !!data?.following;
    return (
        <Button
            size={size}
            variant={following ? 'outline' : 'default'}
            className={cn('rounded-full', className)}
            disabled={toggle.isPending}
            aria-pressed={following}
            onClick={() => (isAuthenticated ? toggle.mutate(!following) : navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`))}
        >
            {toggle.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : following ? <UserCheck className="mr-1.5 h-4 w-4" /> : <UserPlus className="mr-1.5 h-4 w-4" />}
            {following ? 'Following' : 'Follow'}
            {data && data.followers > 0 && <span className="ml-1.5 opacity-70">· {data.followers}</span>}
        </Button>
    );
}

/** A video in a feed. */
export function PostCard({ post, showChef = true, children }: { post: Post; showChef?: boolean; children?: React.ReactNode }) {
    return (
        <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {showChef && post.chef && (
                <header className="flex items-center justify-between gap-3 p-3">
                    <Link to={`/chefs/${post.chef.id}`} className="flex min-w-0 items-center gap-2.5 hover:underline">
                        <ChefAvatar chef={post.chef} />
                        <span className="min-w-0">
                            <span className="block truncate font-semibold">{post.chef.displayName}</span>
                            <span className="block text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                        </span>
                    </Link>
                    {!post.mine && <FollowButton chefId={post.chef.id} chefName={post.chef.displayName} />}
                </header>
            )}
            <YouTubeVideo id={post.youtubeId} title={post.title} className="rounded-none" />
            <div className="space-y-1.5 p-4">
                <h3 className="font-semibold leading-snug">{post.title}</h3>
                {post.caption && <p className="whitespace-pre-line text-sm text-muted-foreground">{post.caption}</p>}
                <div className="flex items-center gap-3 pt-1 text-sm text-muted-foreground">
                    {!showChef && <span>{timeAgo(post.createdAt)}</span>}
                    <Link to={`/videos/${post.id}`} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                        <MessageCircle className="h-4 w-4" />
                        {post.commentCount ? `${post.commentCount} comment${post.commentCount > 1 ? 's' : ''}` : 'Comment'}
                    </Link>
                </div>
                {children}
            </div>
        </article>
    );
}

/** Comments under a video, with a box to add one. */
export function Comments({ postId, comments, onChange }: { postId: number; comments: Comment[]; onChange: () => void }) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const add = useMutation({
        mutationFn: () => api.post(`/posts/${postId}/comments`, { body: text }),
        onSuccess: () => { setText(''); onChange(); },
        onError: (e: Error) => toast.error(e.message),
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/posts/${postId}/comments/${id}`),
        onSuccess: () => { toast.success('Comment removed'); onChange(); },
        onError: (e: Error) => toast.error(e.message),
    });
    return (
        <section className="space-y-4" aria-label="Comments">
            <h2 className="text-lg font-semibold">Comments{comments.length ? ` (${comments.length})` : ''}</h2>
            {isAuthenticated ? (
                <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) add.mutate(); }}>
                    <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={2} placeholder="Say something nice about the food" aria-label="Your comment" />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Phone numbers, emails and links are removed.</span>
                        <Button type="submit" size="sm" disabled={!text.trim() || add.isPending}>
                            {add.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Post comment
                        </Button>
                    </div>
                </form>
            ) : (
                <Button variant="outline" onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}>Sign in to comment</Button>
            )}
            {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
            ) : (
                <ul className="space-y-3">
                    {comments.map((c) => (
                        <li key={c.id} className={cn('rounded-xl bg-muted/50 p-3', c.status === 'removed' && 'opacity-50')}>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold">{c.author}{c.mine && ' (you)'}</span>
                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {c.status === 'removed' && 'Removed · '}{timeAgo(c.createdAt)}
                                    {c.canRemove && c.status !== 'removed' && (
                                        <button type="button" onClick={() => remove.mutate(c.id)} className="rounded p-1 hover:bg-muted hover:text-destructive" aria-label="Remove comment">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </span>
                            </div>
                            <p className="mt-1 whitespace-pre-line text-sm">{c.body}</p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
