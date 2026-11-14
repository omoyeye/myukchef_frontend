import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, CalendarHeart, PackageSearch, Plus, Sparkles, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIONS = [
    { label: "Find my meal", href: "/recommend", icon: Sparkles },
    { label: "Order food", href: "/menu", icon: Utensils },
    { label: "Plan my meals", href: "/meal-plans/new", icon: CalendarDays },
    { label: "Get event quotes", href: "/events", icon: CalendarHeart },
    { label: "Track an order", href: "/track-order", icon: PackageSearch },
];

// These pages already have a main action fixed to the bottom of the screen, or their own "+"
// buttons on every dish card (the home page and menus), which the floating button would cover.
const HIDDEN_ON = [/^\/$/, /^\/menu$/, /^\/chefs(\/.*)?$/,/^\/menu\/.+/, /^\/events/, /^\/checkout/, /^\/recommend/, /^\/order-tracker/, /^\/meal-plans\/new/, /^\/my-plans\/.+/, /^\/my-bookings\/.+/];

export const MobileFab = () => {
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);

    useEffect(() => setOpen(false), [pathname]);

    // Tucks itself away while scrolling down to read, and comes back when scrolling up.
    const [tucked, setTucked] = useState(false);
    useEffect(() => {
        let last = window.scrollY;
        const onScroll = () => {
            const y = window.scrollY;
            if (Math.abs(y - last) > 8) { setTucked(y > last && y > 120); last = y; }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    if (HIDDEN_ON.some((pattern) => pattern.test(pathname))) return null;

    return (
        <div className="md:hidden">
            {open && <button aria-label="Close quick actions" className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />}
            <div className={cn("fixed right-4 z-50 flex flex-col items-end gap-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] transition-all duration-300 motion-reduce:transition-none", tucked && !open && "pointer-events-none translate-y-24 opacity-0")}>
                {open && (
                    <nav aria-label="Quick actions" className="flex flex-col items-end gap-3">
                        {ACTIONS.map(({ label, href, icon: Icon }, i) => (
                            <Link
                                key={href}
                                to={href}
                                style={{ animationDelay: `${(ACTIONS.length - i - 1) * 30}ms` }}
                                className="flex min-h-12 items-center gap-3 rounded-full bg-background py-2 pl-4 pr-2 text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                            >
                                {label}
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </span>
                            </Link>
                        ))}
                    </nav>
                )}
                <button
                    type="button"
                    aria-label={open ? "Close quick actions" : "Open quick actions"}
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-warm-lg transition-transform active:scale-95"
                >
                    <Plus className={cn("h-7 w-7 transition-transform duration-200", open && "rotate-45")} />
                </button>
            </div>
        </div>
    );
};
