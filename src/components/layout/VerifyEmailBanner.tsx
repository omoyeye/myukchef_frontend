import { useState } from 'react';
import { MailCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

/** A gentle reminder for signed-in customers who haven't confirmed their email address yet. */
export function VerifyEmailBanner() {
    const { user } = useAuth();
    const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem('verify-banner-hidden') === '1'; } catch { return false; } });
    const [sending, setSending] = useState(false);
    if (!user || user.emailVerifiedAt || hidden || user.role !== 'customer') return null;

    const resend = async () => {
        setSending(true);
        try {
            await api.post('/auth/resend-verification', {});
            toast.success('Sent', { description: `Check ${user.email} for the link.` });
        } catch (e) { toast.error((e as Error).message); } finally { setSending(false); }
    };
    const hide = () => { setHidden(true); try { sessionStorage.setItem('verify-banner-hidden', '1'); } catch { /* fine */ } };

    return (
        <div role="status" className="container mb-4">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-900/20 dark:text-amber-100">
                <MailCheck className="h-5 w-5 shrink-0" />
                <p className="flex-1">Please confirm your email address so your receipts and order updates reach you.</p>
                <button type="button" onClick={resend} disabled={sending} className="min-h-10 shrink-0 font-semibold underline">{sending ? 'Sending…' : 'Resend link'}</button>
                <button type="button" onClick={hide} aria-label="Hide this reminder" className="flex h-10 w-10 shrink-0 items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
        </div>
    );
}
