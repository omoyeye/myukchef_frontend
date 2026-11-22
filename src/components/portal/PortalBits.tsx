import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** "Good morning" / "Good afternoon" / "Good evening". */
export function greeting(now = new Date()) {
    const h = now.getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** A number that counts up to its value. */
export function useCountUp(value: number, duration = 900) {
    const [shown, setShown] = useState(0);
    const from = useRef(0);
    useEffect(() => {
        if (reducedMotion()) { from.current = value; setShown(value); return; }
        const start = performance.now();
        const begin = from.current;
        let frame = 0;
        const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            from.current = begin + (value - begin) * eased;
            setShown(from.current);
            if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value, duration]);
    return shown;
}

/** Content that rises into place, one piece after another. */
export const rise = (delay: number): CSSProperties => ({ ['--hero-delay' as string]: `${delay}ms` });

/** The dark welcome card at the top of a portal, with drifting glows and a sweep of light. */
export function PortalHero({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <section className={cn('hero-rise relative overflow-hidden rounded-3xl bg-ink p-5 text-ink-foreground shadow-lg sm:p-7', className)}>
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2A1A12] to-transparent" />
            <div aria-hidden className="hero-glow pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
            <div aria-hidden className="hero-glow hero-glow-slow pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
            <div aria-hidden className="portal-sheen" />
            <div className="relative space-y-5">{children}</div>
        </section>
    );
}

/** A figure in the hero that counts up. */
export function HeroStat({ value, label, format = (n) => String(Math.round(n)) }: { value: number; label: string; format?: (n: number) => string }) {
    const shown = useCountUp(value);
    return (
        <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="font-display text-xl font-extrabold leading-tight sm:text-2xl" aria-label={`${label}: ${format(value)}`}>{format(shown)}</p>
            <p className="truncate text-xs text-ink-foreground/70 sm:text-sm">{label}</p>
        </div>
    );
}

/** A live dot with a ring that keeps spreading out. */
export function LiveDot({ className = 'bg-emerald-400' }: { className?: string }) {
    return (
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
            <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', className)} />
            <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', className)} />
        </span>
    );
}

/** A shortcut tile with a coloured icon. `alert` adds a pulsing dot when something needs doing. */
export function ActionTile({ to, onClick, icon: Icon, label, hint, tint, alert, value, delay = 0 }: {
    to?: string;
    onClick?: () => void;
    icon: LucideIcon;
    label: string;
    hint?: string;
    /** Tailwind classes for the icon chip, e.g. "bg-sky-500/15 text-sky-600". */
    tint: string;
    alert?: boolean;
    value?: number | string;
    delay?: number;
}) {
    const shown = useCountUp(typeof value === 'number' ? value : 0);
    const body = (
        <>
            <div className="flex items-start justify-between">
                <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', tint)}><Icon className="h-5 w-5" /></span>
                {alert && <LiveDot className="bg-primary" />}
            </div>
            {value !== undefined && <p className="mt-3 font-display text-3xl font-extrabold leading-none">{typeof value === 'number' ? Math.round(shown) : value}</p>}
            <p className={cn('font-semibold', value === undefined ? 'mt-3' : 'mt-1')}>{label}</p>
            {hint && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{hint}</p>}
        </>
    );
    const className = cn('portal-lift hero-rise block rounded-2xl border bg-card p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', alert && 'border-primary/60 bg-primary/5');
    if (to) return <Link to={to} className={className} style={rise(delay)}>{body}</Link>;
    return <button type="button" onClick={onClick} className={className} style={rise(delay)}>{body}</button>;
}
