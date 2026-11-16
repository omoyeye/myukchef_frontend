import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clapperboard, Loader2 } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ChefAvatar, Comments, FollowButton, PostCard, timeAgo, YouTubeVideo, type Comment, type Post } from '@/components/social/social';

/** Short videos from MYUKCHEF chefs: everyone's, or just the chefs you follow. */
export const Videos = () => {
    const { isAuthenticated } = useAuth();
    const [params, setParams] = useSearchParams();
    const scope = params.get('show') === 'following' && isAuthenticated ? 'following' : 'all';
    const feed = useInfiniteQuery<{ posts: Post[]; hasMore: boolean; page: number }>({
        queryKey: ['posts', scope],
        queryFn: ({ pageParam }) => api.get(`/posts?scope=${scope}&page=${pageParam}`),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    });
    const posts = feed.data?.pages.flatMap((p) => p.posts) ?? [];

    return (
        <Layout>
            <SEO title="Chef Videos" description="Short videos from MYUKCHEF's local chefs: see what they're cooking this week." />
            <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
                <h1 className="font-display text-3xl font-extrabold md:text-4xl">Chef videos</h1>
                <p className="mt-2 text-muted-foreground">Each chef shares one short video a week. Follow the ones you like to hear when they post.</p>
                <div className="mt-5 flex gap-2" role="tablist" aria-label="Which videos">
                    <Button role="tab" aria-selected={scope === 'all'} variant={scope === 'all' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setParams({})}>Everyone</Button>
                    <Button role="tab" aria-selected={scope === 'following'} variant={scope === 'following' ? 'default' : 'outline'} size="sm" className="rounded-full"
                        onClick={() => (isAuthenticated ? setParams({ show: 'following' }) : (window.location.href = `/login?redirect=${encodeURIComponent('/videos?show=following')}`))}>
                        Chefs I follow
                    </Button>
                </div>

                <div className="mt-6 space-y-6">
                    {feed.isLoading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                    {!feed.isLoading && posts.length === 0 && (
                        <div className="rounded-3xl border border-dashed p-10 text-center">
                            <Clapperboard className="mx-auto mb-3 h-9 w-9 text-primary" />
                            <p className="font-bold">{scope === 'following' ? "No videos from chefs you follow yet" : 'No videos yet'}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{scope === 'following' ? 'Follow chefs from their page or from Everyone.' : 'Check back soon.'}</p>
                            {scope === 'following' && <Button className="mt-4" variant="outline" onClick={() => setParams({})}>See everyone's videos</Button>}
                        </div>
                    )}
                    {posts.map((p) => <PostCard key={p.id} post={p} />)}
                    {feed.hasNextPage && (
                        <div className="flex justify-center">
                            <Button variant="outline" onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
                                {feed.isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Load more
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

/** One video, with its comments. */
export const VideoDetail = () => {
    const { id } = useParams();
    const qc = useQueryClient();
    const { data: post, isLoading, isError } = useQuery<Post & { comments: Comment[] }>({ queryKey: ['post', id], queryFn: () => api.get(`/posts/${id}`), retry: false });

    return (
        <Layout>
            <SEO title={post ? `${post.title} by ${post.chef?.displayName}` : 'Chef video'} description={post?.caption || 'A short video from a MYUKCHEF chef.'} />
            <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
                <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2"><Link to="/videos"><ArrowLeft className="mr-1.5 h-4 w-4" />All videos</Link></Button>
                {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                {isError && (
                    <div className="rounded-3xl border border-dashed p-10 text-center">
                        <p className="font-bold">This video isn't available</p>
                        <p className="mt-1 text-sm text-muted-foreground">It may have been removed by the chef or by MYUKCHEF.</p>
                    </div>
                )}
                {post && (
                    <div className="space-y-6">
                        {post.chef && (
                            <div className="flex items-center justify-between gap-3">
                                <Link to={`/chefs/${post.chef.id}`} className="flex min-w-0 items-center gap-3 hover:underline">
                                    <ChefAvatar chef={post.chef} size={48} />
                                    <span className="min-w-0">
                                        <span className="block truncate text-lg font-semibold">{post.chef.displayName}</span>
                                        <span className="block text-sm text-muted-foreground">{timeAgo(post.createdAt)}</span>
                                    </span>
                                </Link>
                                {!post.mine && <FollowButton chefId={post.chef.id} chefName={post.chef.displayName} />}
                            </div>
                        )}
                        <YouTubeVideo id={post.youtubeId} title={post.title} />
                        <div>
                            <h1 className="text-2xl font-bold">{post.title}</h1>
                            {post.caption && <p className="mt-2 whitespace-pre-line text-muted-foreground">{post.caption}</p>}
                            {post.chef && <Button asChild className="mt-4"><Link to={`/chefs/${post.chef.id}`}>See {post.chef.displayName}'s dishes</Link></Button>}
                        </div>
                        <Comments postId={post.id} comments={post.comments} onChange={() => qc.invalidateQueries({ queryKey: ['post', id] })} />
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Videos;
