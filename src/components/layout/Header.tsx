import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from "./ThemeToggle";
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { NotificationCenter } from './NotificationCenter';
import { portalHome } from '@/lib/portals';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Meal Plans', href: '/meal-plans' },
  { label: 'For You', href: '/recommend' },
  { label: 'Chefs', href: '/chefs' },
  { label: 'Videos', href: '/videos' },
  { label: 'Events', href: '/events' },
  { label: 'Track Order', href: '/track-order' },
  { label: 'Wallet', href: '/wallet' },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { itemCount, toggleCart } = useCart();
  // A little bounce on the basket whenever something is added.
  const [bump, setBump] = useState(false);
  const lastCount = useRef(itemCount);
  useEffect(() => {
    if (itemCount > lastCount.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 600);
      lastCount.current = itemCount;
      return () => window.clearTimeout(t);
    }
    lastCount.current = itemCount;
  }, [itemCount]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // These pages open with a dark hero, so the header starts in white until the page scrolls.
  const overDarkHero = !isScrolled && /^\/($|meal-plans\/?$|events\/?$|chefs\/\d+)/.test(location.pathname);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-background/95 backdrop-blur-md shadow-md py-2" : "bg-transparent py-4"
    )}>
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group border-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-sm transition-transform group-hover:scale-110 overflow-hidden">
            <img src="/logo.png" alt="MYUKCHEF Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <span className={cn("font-display text-2xl font-extrabold tracking-tight", !isScrolled && location.pathname === "/" ? "text-white" : "text-foreground")}>MYUK<span className="text-primary">CHEF</span></span>
            
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-all hover:text-primary relative group",
                overDarkHero ? "text-white/90" : "text-muted-foreground",
                location.pathname === link.href && "text-primary"
              )}
            >
              {link.label}
              <span className={cn(
                "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full",
                location.pathname === link.href && "w-full"
              )} />
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild aria-label="Search the menu" className={cn("hidden sm:inline-flex", overDarkHero ? "text-white hover:bg-white/10" : "")}>
            <Link to="/menu"><Search className="h-5 w-5" /></Link>
          </Button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button variant="ghost" size="icon" asChild title="My portal" aria-label="My portal" className={cn(overDarkHero ? "text-white hover:bg-white/10" : "")}>
                <Link to={portalHome(user?.role)}>
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button variant={overDarkHero ? "secondary" : "default"} size="sm" asChild className="hidden sm:flex">
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          )}

          <ThemeToggle className={overDarkHero ? "text-white hover:bg-white/10" : ""} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open cart"
            className={cn("relative", overDarkHero ? "text-white hover:bg-white/10" : "", bump && "animate-cart-bump")}
            onClick={toggleCart}
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Button>

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className={cn("lg:hidden", overDarkHero ? "text-white hover:bg-white/10" : "")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] overflow-y-auto">
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "text-lg font-medium transition-colors hover:text-primary py-2 px-4 rounded-lg",
                      location.pathname === link.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Button className="mt-4" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/login">Sign In</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
