import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Copy, Gift, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/common/SEO';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

interface Referral { enabled: boolean; points: number; code: string; joined: number; rewarded: number }

/** Each customer's own code to share. When a friend's first order is delivered, both get points. */
const ReferFriend = () => {
    const { user } = useAuth();
    const { data, isLoading } = useQuery<Referral>({ queryKey: ['referral'], queryFn: () => api.get('/auth/referral'), enabled: !!user });
    const link = data ? `${SITE_URL}/register?ref=${data.code}` : '';
    const message = data ? `Try MYUKCHEF, home-cooked food from local chefs. Sign up with my code ${data.code} and we both get ${data.points} points: ${link}` : '';

    const share = async () => {
        if (navigator.share) { await navigator.share({ title: 'MYUKCHEF', text: message, url: link }).catch(() => undefined); return; }
        await navigator.clipboard?.writeText(message);
        toast.success('Copied. Paste it to a friend.');
    };

    return (
        <Layout>
            <SEO noindex title="Refer a friend" description="Share MYUKCHEF with friends and earn points." />
            <div className="container max-w-xl py-12">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Gift className="h-8 w-8 text-primary" /></div>
                    <h1 className="text-3xl font-black tracking-tight">Give points, get points</h1>
                    <p className="mt-2 text-muted-foreground">{data ? `When a friend joins with your code and their first order is delivered, you each get ${data.points} points.` : 'Share MYUKCHEF with friends and you both earn points.'}</p>
                </div>
                {!user ? (
                    <Card><CardContent className="space-y-3 p-6 text-center"><p>Sign in to get your code.</p><Button asChild className="h-11"><Link to="/login?redirect=/refer">Sign in</Link></Button></CardContent></Card>
                ) : isLoading || !data ? <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : !data.enabled ? (
                    <Card><CardContent className="p-6 text-center text-muted-foreground">Refer a friend is paused at the moment.</CardContent></Card>
                ) : (
                    <Card>
                        <CardContent className="space-y-5 p-6">
                            <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-5 text-center">
                                <p className="text-sm text-muted-foreground">Your code</p>
                                <p className="font-mono text-3xl font-black tracking-widest">{data.code}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button className="h-11 flex-1" onClick={share}><Share2 className="mr-2 h-4 w-4" />Share</Button>
                                <Button variant="outline" className="h-11 flex-1" onClick={() => { navigator.clipboard?.writeText(link); toast.success('Link copied'); }}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="rounded-xl bg-muted/50 p-3"><p className="text-2xl font-bold">{data.joined}</p><p className="text-xs text-muted-foreground">friends joined</p></div>
                                <div className="rounded-xl bg-muted/50 p-3"><p className="text-2xl font-bold">{data.rewarded * data.points}</p><p className="text-xs text-muted-foreground">points earned</p></div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Layout>
    );
};

export default ReferFriend;
