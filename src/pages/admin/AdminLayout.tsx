import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, MessageCircle, BarChart3, ShieldCheck, Lock, Megaphone, Wallet, CalendarDays, CalendarHeart, ChefHat, Clapperboard, ClipboardList, KeyRound, LayoutDashboard, LifeBuoy, Loader2, Menu as MenuIcon, MessagesSquare, Search, Settings, Star, Ticket, Users } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { PortalShell } from '@/components/layout/PortalShell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { canUse, firstAllowedPage, pageKey } from '@/lib/adminAccess';
import { api } from '@/lib/api';

// Grouped by job: what's happening, the work coming in, the people, what's on the site, growing, and setup.
const SECTIONS = [
    { group: 'Overview', icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
    { group: 'Overview', icon: BarChart3, label: 'Reports', to: '/admin/reports' },
    { group: 'Overview', icon: MessageCircle, label: 'Team chat', to: '/admin/team-chat' },
    { group: 'Orders', icon: ClipboardList, label: 'Orders', to: '/admin/orders' },
    { group: 'Orders', icon: CalendarDays, label: 'Meal plans', to: '/admin/meal-plans' },
    { group: 'Orders', icon: CalendarHeart, label: 'Events', to: '/admin/events' },
    { group: 'People', icon: ChefHat, label: 'Chefs', to: '/admin/chefs' },
    { group: 'People', icon: Users, label: 'Customers', to: '/admin/customers' },
    { group: 'People', icon: Star, label: 'Reviews', to: '/admin/reviews' },
    { group: 'People', icon: LifeBuoy, label: 'Support', to: '/admin/support' },
    { group: 'Content', icon: MenuIcon, label: 'Menu', to: '/admin/menu' },
    { group: 'Content', icon: Clapperboard, label: 'Chef videos', to: '/admin/videos' },
    { group: 'Content', icon: Megaphone, label: 'Banners', to: '/admin/banners' },
    { group: 'Marketing', icon: Wallet, label: 'Wallets & rewards', to: '/admin/wallets' },
    { group: 'Marketing', icon: Ticket, label: 'Discounts', to: '/admin/discounts' },
    { group: 'Marketing', icon: Search, label: 'SEO & tracking', to: '/admin/seo' },
    { group: 'Marketing', icon: MessagesSquare, label: 'Messages', to: '/admin/messages' },
    { group: 'Settings', icon: Settings, label: 'Settings', to: '/admin/settings' },
    { group: 'Settings', icon: KeyRound, label: 'Payments & keys', to: '/admin/payments-email' },
    { group: 'Settings', icon: Activity, label: 'System health', to: '/admin/system' },
    { group: 'Settings', icon: ShieldCheck, label: 'Team & roles', to: '/admin/team' },
];

const AdminLayout = () => {
    const { user, logout, isLoading } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const key = pageKey(pathname);
    // Unread team messages, for the Team chat badge.
    const unread = useQuery<{ count: number }>({
        queryKey: ['team-chat', 'unread'],
        queryFn: () => api.get('/admin/chat/unread'),
        enabled: !!user?.isAdmin && !user.mustCompleteProfile,
        refetchInterval: 20_000,
    });
    const allowed = canUse(user, key);
    useEffect(() => {
        // Wait for the saved session, so refreshing an admin page stays on that page.
        if (isLoading) return;
        if (!user?.isAdmin) navigate('/admin/login', { replace: true });
        // New staff set their own password and complete their profile before anything else.
        else if (user.mustCompleteProfile) navigate('/admin/complete-profile', { replace: true });
        // Staff without the dashboard start on their first page instead.
        else if (key === 'dashboard' && !allowed) {
            const first = firstAllowedPage(user);
            if (first) navigate(first, { replace: true });
        }
    }, [user, isLoading, navigate, key, allowed]);

    if (isLoading) return <div className="flex h-dvh items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!user?.isAdmin || user.mustCompleteProfile) return null;
    const visible = SECTIONS.filter((s) => canUse(user, pageKey(s.to)));

    return (
        <>
            <SEO title="Super Admin" description="Super Admin portal for MYUKCHEF." noindex />
            <PortalShell
                name={user.isSuperAdmin ? 'Super Admin' : 'Admin'}
                tagline={user.isSuperAdmin ? 'Runs all of MYUKCHEF' : user.adminRoleName || 'MYUKCHEF team'}
                initial={user.name?.[0] || 'A'}
                onLogout={logout}
                items={visible.map((s) => ({ ...s, active: s.to === '/admin' ? pathname === '/admin' : pathname === s.to || pathname.startsWith(s.to + '/'), badge: s.to === '/admin/team-chat' ? unread.data?.count || undefined : undefined }))}
            >
                {allowed ? <Outlet /> : (
                    <div className="mx-auto mt-16 max-w-md rounded-3xl border bg-card p-8 text-center">
                        <Lock className="mx-auto h-10 w-10 text-primary" />
                        <h1 className="mt-4 font-display text-2xl font-bold">Not part of your role</h1>
                        <p className="mt-2 text-muted-foreground">Your role, {user.adminRoleName ?? 'Staff'}, doesn't include this page. Ask your Super Admin if you need it.</p>
                        {firstAllowedPage(user) && <Button className="mt-5" onClick={() => navigate(firstAllowedPage(user)!)}>Go to my pages</Button>}
                    </div>
                )}
            </PortalShell>
        </>
    );
};

export default AdminLayout;
