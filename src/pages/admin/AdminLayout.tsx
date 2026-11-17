import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Megaphone, CalendarDays, CalendarHeart, ChefHat, Clapperboard, ClipboardList, KeyRound, LayoutDashboard, LifeBuoy, Loader2, Menu as MenuIcon, MessagesSquare, Search, Settings, Star, Ticket, Users } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { PortalShell } from '@/components/layout/PortalShell';
import { useAuth } from '@/contexts/AuthContext';

// Grouped by job: what's happening, the work coming in, the people, what's on the site, growing, and setup.
const SECTIONS = [
    { group: 'Overview', icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
    { group: 'Overview', icon: BarChart3, label: 'Reports', to: '/admin/reports' },
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
    { group: 'Marketing', icon: Ticket, label: 'Discounts', to: '/admin/discounts' },
    { group: 'Marketing', icon: Search, label: 'SEO & tracking', to: '/admin/seo' },
    { group: 'Marketing', icon: MessagesSquare, label: 'Messages', to: '/admin/messages' },
    { group: 'Settings', icon: Settings, label: 'Settings', to: '/admin/settings' },
    { group: 'Settings', icon: KeyRound, label: 'Payments & keys', to: '/admin/payments-email' },
    { group: 'Settings', icon: Activity, label: 'System health', to: '/admin/system' },
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
