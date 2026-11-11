import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, LogOut, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "./NotificationCenter";

export interface PortalItem {
    icon: LucideIcon;
    label: string;
    to: string;
    active: boolean;
    badge?: number;
}

interface Props {
    name: string;
    tagline: string;
    initial: string;
    items: PortalItem[];
    onLogout: () => void;
    children: ReactNode;
}

const Count = ({ value }: { value?: number }) => (value ? <span className="ml-auto rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">{value}</span> : null);

/** The frame around a staff portal: a sidebar on large screens and a floating menu on phones. */
export const PortalShell = ({ name, tagline, initial, items, onLogout, children }: Props) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

    return (
        <div className="flex h-dvh bg-secondary/10">
            <aside className="hidden w-64 flex-col border-r bg-background md:flex">
                <div className="flex items-center gap-3 border-b p-5">
                    <Link to="/" aria-label="Back to MYUKCHEF" className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-white p-1 shadow-sm"><img src="/logo.png" alt="" className="h-full w-full object-contain" /></Link>
                    <div className="min-w-0">
                        <p className="truncate font-display font-extrabold text-primary">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">{tagline}</p>
                    </div>
                </div>
                <nav aria-label={name} className="flex-1 space-y-1 overflow-y-auto p-3">
                    {items.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={item.active ? "page" : undefined}
                            className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 transition-colors", item.active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {item.label}
                            <Count value={item.badge} />
                        </Link>
                    ))}
                </nav>
                <div className="border-t p-3">
                    <Button variant="outline" className="h-11 w-full justify-start gap-2" onClick={onLogout}><LogOut className="h-4 w-4" />Sign out</Button>
                </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4 md:h-16 md:px-6">
                    <p className="truncate font-display font-extrabold md:hidden">{name}</p>
                    <p className="hidden truncate font-semibold md:block">{items.find((i) => i.active)?.label}</p>
                    <div className="flex shrink-0 items-center gap-3">
                        <NotificationCenter />
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" aria-hidden>{initial}</span>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-4 pb-24 md:p-8">{children}</div>

                <button
                    type="button"
                    aria-label={`Open ${name} menu`}
                    onClick={() => setMenuOpen(true)}
                    className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-warm-lg transition-transform active:scale-95 bottom-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
                >
                    <LayoutGrid className="h-6 w-6" />
                </button>
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                        <SheetTitle className="mb-4 text-center">{name}</SheetTitle>
                        <nav aria-label={`${name} sections`} className="grid grid-cols-3 gap-2">
                            {items.map((item) => (
                                <Link key={item.to} to={item.to} className={cn("relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center text-xs font-medium", item.active ? "bg-primary text-primary-foreground" : "bg-secondary/60")}>
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                    {item.badge ? <span className="absolute right-2 top-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground ring-2 ring-background">{item.badge}</span> : null}
                                </Link>
                            ))}
                            <button type="button" onClick={onLogout} className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary/60 p-2 text-xs font-medium"><LogOut className="h-5 w-5" />Sign out</button>
                        </nav>
                    </SheetContent>
                </Sheet>
            </main>
        </div>
    );
};
