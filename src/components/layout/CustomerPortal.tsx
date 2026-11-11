import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, CalendarHeart, Gift, Heart, LayoutDashboard, LogOut, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { portalHome } from "@/lib/portals";
import { cn } from "@/lib/utils";
import { Layout } from "./Layout";

const SECTIONS = [
    { icon: LayoutDashboard, label: "Overview", to: "/profile" },
    { icon: CalendarDays, label: "Meal plans", to: "/my-plans" },
    { icon: ShoppingBag, label: "Orders", to: "/profile?tab=history" },
    { icon: CalendarHeart, label: "Event bookings", to: "/profile?tab=bookings" },
    { icon: Gift, label: "Rewards", to: "/profile?tab=rewards" },
    { icon: Heart, label: "Saved chefs", to: "/saved-chefs" },
];

/** The customer portal keeps the shop's header and cart, because customers order from here too. */
export const CustomerPortal = ({ children }: { children: ReactNode }) => {
    const { user, logout } = useAuth();
    const { pathname, search } = useLocation();
    const navigate = useNavigate();

    // Chefs and Super Admins have their own portals.
    useEffect(() => {
        if (user && user.role && user.role !== "customer") navigate(portalHome(user.role), { replace: true });
    }, [user, navigate]);

    // On phones the section list scrolls sideways, so keep the current section in view.
    useEffect(() => {
        document.querySelector('nav[aria-label="My account"] [aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
    }, [pathname, search]);

    const current = pathname + search;
    const isActive = (to: string) => to === "/profile" ? current === "/profile" || current === "/profile?tab=overview" : current.startsWith(to);

    return (
        <Layout>
            <div className="container max-w-6xl px-4 pb-10">
                <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
                    <nav aria-label="My account" className="-mx-4 min-w-0 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:overflow-visible lg:px-0">
                        <ul className="flex gap-2 lg:sticky lg:top-28 lg:flex-col lg:gap-1">
                            {SECTIONS.map(({ icon: Icon, label, to }) => (
                                <li key={to} className="shrink-0">
                                    <Link
                                        to={to}
                                        aria-current={isActive(to) ? "page" : undefined}
                                        className={cn("flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors lg:gap-3 lg:rounded-xl lg:border-0 lg:text-base", isActive(to) ? "border-primary bg-primary text-primary-foreground lg:bg-primary/10 lg:text-primary" : "bg-card hover:border-primary lg:bg-transparent lg:text-muted-foreground lg:hover:bg-secondary")}
                                    >
                                        <Icon className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />{label}
                                    </Link>
                                </li>
                            ))}
                            <li className="hidden lg:block">
                                <button type="button" onClick={() => { logout(); navigate("/login"); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 font-semibold text-muted-foreground hover:bg-secondary"><LogOut className="h-5 w-5" />Sign out</button>
                            </li>
                        </ul>
                    </nav>
                    <div className="min-w-0">{children}</div>
                </div>
            </div>
        </Layout>
    );
};
