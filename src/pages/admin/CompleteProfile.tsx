import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** A new staff admin's first step: their own password and contact details, within 24 hours of the invite. */
const CompleteProfile = () => {
    const { user, isLoading, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', phone: '', jobTitle: '', newPassword: '', confirm: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (!user?.isAdmin) navigate('/admin/login', { replace: true });
        else if (!user.mustCompleteProfile) navigate('/admin', { replace: true });
        else setForm((f) => ({ ...f, name: f.name || user.name || '', phone: f.phone || user.phone || '', jobTitle: f.jobTitle || user.jobTitle || '' }));
    }, [user, isLoading, navigate]);

    const mismatch = form.confirm && form.newPassword !== form.confirm;
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mismatch) return;
        setSaving(true);
        try {
            await api.post('/auth/complete-profile', { name: form.name, phone: form.phone, jobTitle: form.jobTitle, newPassword: form.newPassword });
            await refreshUser();
            toast.success('Welcome to the team');
            navigate('/admin', { replace: true });
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || !user) return <div className="flex h-dvh items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    return (
        <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
            <SEO title="Complete your profile" description="Finish setting up your MYUKCHEF staff account." noindex />
            <form onSubmit={submit} className="w-full max-w-lg space-y-5 rounded-3xl border bg-card p-6 shadow-sm md:p-8">
                <div className="text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><ShieldCheck className="h-7 w-7 text-primary" /></span>
                    <h1 className="mt-3 text-2xl font-bold">Welcome to the MYUKCHEF team</h1>
                    <p className="mt-1 text-sm text-muted-foreground">You've joined as <b>{user.adminRoleName ?? 'staff'}</b>. Choose your own password and check your details to finish setting up.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2"><Label htmlFor="cp-name">Full name</Label><Input id="cp-name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                    <div className="space-y-1"><Label htmlFor="cp-phone">Phone number</Label><Input id="cp-phone" required type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                    <div className="space-y-1"><Label htmlFor="cp-job">Job title (optional)</Label><Input id="cp-job" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="e.g. Customer support" /></div>
                    <div className="space-y-1"><Label htmlFor="cp-pass">New password</Label><Input id="cp-pass" required type="password" autoComplete="new-password" minLength={8} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /><p className="text-xs text-muted-foreground">At least 8 characters</p></div>
                    <div className="space-y-1"><Label htmlFor="cp-confirm">Confirm password</Label><Input id="cp-confirm" required type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />{mismatch && <p className="text-xs text-destructive">The passwords don't match</p>}</div>
                </div>
                <Button type="submit" className="h-12 w-full rounded-full text-base font-bold" disabled={saving || !!mismatch}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Finish setting up</Button>
                <button type="button" onClick={() => { logout(); navigate('/admin/login'); }} className="block w-full text-center text-sm text-muted-foreground hover:text-primary">Sign out</button>
            </form>
        </div>
    );
};

export default CompleteProfile;
