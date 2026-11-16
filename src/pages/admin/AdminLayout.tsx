import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Megaphone, CalendarDays, CalendarHeart, ChefHat, Clapperboard, ClipboardList, KeyRound, LayoutDashboard, LifeBuoy, Loader2, Menu as MenuIcon, MessagesSquare, Settings, Star, Ticket, Users } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { PortalShell } from '@/components/layout/PortalShell';
import { useAuth } from '@/contexts/AuthContext';

const SECTIONS = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
    { icon: ChefHat, label: 'Chefs', to: '/admin/chefs' },
    { icon: Users, label: 'Customers', to: '/admin/customers' },
    { icon: CalendarDays, label: 'Meal Plans', to: '/admin/meal-plans' },
    { icon: ClipboardList, label: 'Orders', to: '/admin/orders' },
    { icon: BarChart3, label: 'Reports', to: '/admin/reports' },
    { icon: CalendarHeart, label: 'Events', to: '/admin/events' },
    { icon: MenuIcon, label: 'Menu', to: '/admin/menu' },
    { icon: Star, label: 'Reviews', to: '/admin/reviews' },
    { icon: Clapperboard, label: 'Chef videos', to: '/admin/videos' },
    { icon: LifeBuoy, label: 'Support', to: '/admin/support' },
    { icon: Ticket, label: 'Discounts', to: '/admin/discounts' },
    { icon: Megaphone, label: 'Banners', to: '/admin/banners' },
    { icon: MessagesSquare, label: 'Messages', to: '/admin/messages' },
    { icon: Settings, label: 'Settings', to: '/admin/settings' },
    { icon: KeyRound, label: 'Payments & email', to: '/admin/payments-email' },
    { icon: Activity, label: 'System health', to: '/admin/system' },
];

const AdminLayout = () => {
    const { user, logout, isLoading } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for the saved session, so refreshing an admin page stays on that page.
        if (!isLoading && !user?.isAdmin) navigate('/admin/login', { replace: true });
    }, [user, isLoading, navigate]);

    if (isLoading) return <div className="flex h-dvh items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!user?.isAdmin) return null;

    return (
        <>
            <SEO title="Super Admin" description="Super Admin portal for MYUKCHEF." noindex />
            <PortalShell
                name="Super Admin"
                tagline="Runs all of MYUKCHEF"
                initial={user.name?.[0] || 'A'}
                onLogout={logout}
                items={SECTIONS.map((s) => ({ ...s, active: s.to === '/admin' ? pathname === '/admin' : pathname.startsWith(s.to) }))}
            >
                <Outlet />
            </PortalShell>
        </>
    );
};

export default AdminLayout;
