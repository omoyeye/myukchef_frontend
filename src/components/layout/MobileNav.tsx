import { Link, useLocation } from 'react-router-dom';
import { Home, Utensils, CalendarDays, MoreHorizontal, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from '@/contexts/AuthContext';
import { portalHome } from '@/lib/portals';

const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Menu', href: '/menu', icon: Utensils },
    { label: 'Plans', href: '/meal-plans', icon: CalendarDays },
    { label: 'Cart', href: '/cart', icon: ShoppingBag, isCart: true },
];

const moreLinks = [
    { label: 'Events', href: '/events' },
    { label: 'My Meal Plans', href: '/my-plans' },
    { label: 'Find My Meal', href: '/recommend' },
    { label: 'Our Chefs', href: '/chefs' },
    { label: 'Chef Videos', href: '/videos' },
    { label: 'Get the App', href: '/app' },
    { label: 'Track Order', href: '/track-order' },
    { label: 'My Wallet', href: '/wallet' },
    { label: 'Contact Us', href: '/support' },
    { label: 'Profile', href: '/profile' },
    { label: 'Chef Portal', href: '/chef/login' },
];

import { toast } from 'sonner';

export const MobileNav = () => {
    const location = useLocation();
    const { itemCount } = useCart();
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-lg border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
            <div className="flex items-center justify-around h-16">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn("h-6 w-6 transition-transform", isActive && "scale-110")} />
                                {link.isCart && itemCount > 0 && (
                                    <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium tracking-wide font-sans">{link.label}</span>
                            {isActive && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}

                {/* More Menu (3 Dots) */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover:text-foreground transition-all">
                            <MoreHorizontal className="h-6 w-6" />
                            <span className="text-[10px] font-medium tracking-wide">More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-[2rem] px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
                        <h2 className="text-xl font-bold mb-6 text-center italic text-primary">Explore MYUKCHEF</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {moreLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    to={link.label === 'Profile' ? portalHome(user?.role) : link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex min-h-14 flex-col items-center justify-center p-4 rounded-2xl bg-secondary/30 hover:bg-secondary transition-colors text-center"
                                >
                                    <span className="font-semibold text-sm">{link.label}</span>
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <Link
                                    to="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm col-span-2"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
};
