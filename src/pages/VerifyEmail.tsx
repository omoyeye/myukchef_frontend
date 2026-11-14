import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/** Where the "confirm your email" link lands. */
const VerifyEmail = () => {
    const [params] = useSearchParams();
    const { user, refreshUser } = useAuth();
    const [state, setState] = useState<'checking' | 'done' | 'failed'>('checking');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = params.get('token');
        if (!token) { setState('failed'); setMessage('This link is missing its code.'); return; }
        api.post('/auth/verify-email', { token })
            .then(() => { setState('done'); refreshUser?.(); })
            .catch((e: Error) => { setState('failed'); setMessage(e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    return (
        <Layout>
            <SEO noindex title="Confirm your email" description="Confirming your email address" />
            <div className="container flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 py-16 text-center">
                {state === 'checking' && <><Loader2 className="h-10 w-10 animate-spin text-primary" /><p>Confirming your email address…</p></>}
                {state === 'done' && (
                    <>
                        <CheckCircle2 className="h-14 w-14 text-green-600 animate-in zoom-in duration-500" />
                        <h1 className="text-2xl font-bold">Email confirmed</h1>
                        <p className="text-muted-foreground">Thanks. Your order updates and receipts will come to this address.</p>
                        <Button asChild className="h-11"><Link to={user ? '/menu' : '/login'}>{user ? 'Find something to eat' : 'Sign in'}</Link></Button>
                    </>
                )}
                {state === 'failed' && (
                    <>
                        <XCircle className="h-14 w-14 text-destructive" />
                        <h1 className="text-2xl font-bold">That link didn't work</h1>
                        <p className="text-muted-foreground">{message}</p>
                        <Button asChild variant="outline" className="h-11"><Link to={user ? '/profile' : '/login'}>{user ? 'Go to my account' : 'Sign in'}</Link></Button>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default VerifyEmail;
