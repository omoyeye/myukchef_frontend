import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LayoutGrid, LogOut, LucideIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
    /** Items with the same group are shown together under that heading. */
    group?: string;
    /** A short line under the label in the phone menu. */
    hint?: string;
}

/** Items in their groups, keeping the order they first appear in. Ungrouped items come first. */
function grouped(items: PortalItem[]) {
    const out: { name: string | null; items: PortalItem[] }[] = [];
    for (const item of items) {
        const name = item.group ?? null;
        let g = out.find((x) => x.name === name);
        if (!g) { g = { name, items: [] }; out.push(g); }
        g.items.push(item);
    }
    return out;
}

const OPEN_KEY = "portal-closed-groups";
const readClosed = (): string[] => { try { return JSON.parse(localStorage.getItem(OPEN_KEY) || "[]"); } catch { return []; } };
const COLLAPSED_KEY = "portal-sidebar-collapsed";
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSED_KEY) === "1"; } catch { return false; } };

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
    const groups = grouped(items);
    // Groups can be folded away; the one holding the current page always stays open.
    const [closed, setClosed] = useState<string[]>(readClosed);
    const toggle = (g: string) => setClosed((c) => {
        const next = c.includes(g) ? c.filter((x) => x !== g) : [...c, g];
        try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)); } catch { /* private mode */ }
        return next;
    });
    // On large screens the sidebar can shrink to a rail of icons; the choice is remembered.
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const toggleSidebar = () => setCollapsed((c) => {
        try { localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1"); } catch { /* private mode */ }
        return !c;
    });
    const link = (item: PortalItem) => (
        <Link
            key={item.to}
            to={item.to}
            aria-current={item.active ? "page" : undefined}
            aria-label={collapsed ? (item.badge ? `${item.label}, ${item.badge} new` : item.label) : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
                "relative flex min-h-10 items-center gap-3 rounded-xl text-sm transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                item.active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
        >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {collapsed ? (
                item.badge ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" /> : null
            ) : (
                <>
                    <span className="truncate">{item.label}</span>
                    <Count value={item.badge} />
                </>
            )}
        </Link>
    );

    return (
        <div className="flex h-dvh bg-secondary/10">
            <aside className={cn("hidden shrink-0 flex-col border-r bg-background transition-[width] duration-200 ease-out md:flex", collapsed ? "w-[76px]" : "w-64")}>
                <div className={cn("flex items-center gap-3 border-b", collapsed ? "justify-center px-2 py-5" : "p-5")}>
                    <Link to="/" aria-label="Back to MYUKCHEF" className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-white p-1 shadow-sm"><img src="/logo.png" alt="" className="h-full w-full object-contain" /></Link>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate font-display font-extrabold text-primary">{name}</p>
                            <p className="truncate text-xs text-muted-foreground">{tagline}</p>
                        </div>
                    )}
                </div>
                <nav aria-label={name} className={cn("flex-1 space-y-1 overflow-y-auto", collapsed ? "px-2 py-3" : "p-3")}>
                    {groups.map((g) => {
                        if (!g.name) return <div key="top" className="space-y-1">{g.items.map(link)}</div>;
                        // Collapsed: every item shows, with a thin line between groups instead of headings.
                        if (collapsed) return <div key={g.name} className="space-y-0.5 border-t pt-2 first:border-t-0">{g.items.map(link)}</div>;
                        const hasActive = g.items.some((i) => i.active);
                        const open = hasActive || !closed.includes(g.name);
                        const badge = g.items.reduce((s, i) => s + (i.badge ?? 0), 0);
                        const id = `group-${g.name.replace(/\W+/g, "-").toLowerCase()}`;
                        return (
                            <div key={g.name} className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => !hasActive && toggle(g.name!)}
                                    aria-expanded={open}
                                    aria-controls={id}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground"
                                >
                                    {g.name}
                                    {!open && badge > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{badge}</span>}
                                    <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform", !open && "-rotate-90", hasActive && "opacity-0")} />
                                </button>
                                {open && <div id={id} className="mt-0.5 space-y-0.5">{g.items.map(link)}</div>}
                            </div>
                        );
                    })}
                </nav>
                <div className={cn("border-t", collapsed ? "p-2" : "p-3")}>
                    {collapsed
                        ? <Button variant="outline" size="icon" className="h-11 w-full" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut className="h-4 w-4" /></Button>
                        : <Button variant="outline" className="h-11 w-full justify-start gap-2" onClick={onLogout}><LogOut className="h-4 w-4" />Sign out</Button>}
                </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4 md:h-16 md:px-6">
                    <p className="truncate font-display font-extrabold md:hidden">{name}</p>
                    <div className="hidden min-w-0 items-center gap-2 md:flex">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={toggleSidebar}
                        aria-label={collapsed ? "Expand the menu" : "Collapse the menu"}
                        aria-expanded={!collapsed}
                        title={collapsed ? "Expand the menu" : "Collapse the menu"}
                    >
                        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </Button>
                    <p className="truncate font-semibold">
                        {(() => { const a = items.find((i) => i.active); return a ? <>{a.group && <span className="font-normal text-muted-foreground">{a.group} / </span>}{a.label}</> : null; })()}
                    </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <NotificationCenter />
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" aria-hidden>{initial}</span>
                    </div>
                </header>
                {/* `relative` keeps hidden screen-reader labels inside this scroll area; without it they
                    escape and stretch the whole page, adding a second scrollbar. */}
                <div className="relative flex-1 overflow-auto p-4 pb-24 md:p-8">{children}</div>

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
                        <nav aria-label={`${name} sections`} className="space-y-4">
                            {groups.map((g) => (
                                <section key={g.name ?? "top"} aria-label={g.name ?? undefined}>
                                    {g.name && <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{g.name}</p>}
                                    <div className="grid grid-cols-3 gap-2">
                                        {g.items.map((item) => (
                                            <Link key={item.to} to={item.to} className={cn("relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center text-xs font-medium", item.active ? "bg-primary text-primary-foreground" : "bg-secondary/60")}>
                                                <item.icon className="h-5 w-5" />
                                                {item.label}
                                                {item.badge ? <span className="absolute right-2 top-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground ring-2 ring-background">{item.badge}</span> : null}
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            ))}
                            <button type="button" onClick={onLogout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary/60 p-2 text-sm font-medium"><LogOut className="h-5 w-5" />Sign out</button>
                        </nav>
                    </SheetContent>
                </Sheet>
            </main>
        </div>
    );
};
