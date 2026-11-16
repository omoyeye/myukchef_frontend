import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export interface Banner { id: number; title: string; message: string | null; image: string | null; ctaLabel: string | null; link: string | null; theme: 'brand' | 'dark' | 'light' }

const HIDDEN_KEY = 'hidden-banners';
const readHidden = (): number[] => { try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'); } catch { return []; } };
const THEME: Record<Banner['theme'], string> = {
    brand: 'bg-primary text-primary-foreground',
    dark: 'bg-ink text-ink-foreground',
    light: 'bg-secondary text-foreground border',
};
const seen = (id: number, clicked = false) => { api.post(`/banners/${id}/seen`, clicked ? { clicked: true } : {}).catch(() => undefined); };

/** One banner. Also used for the preview in the admin area. */
export function BannerCard({ banner, onClose, preview }: { banner: Banner; onClose?: () => void; preview?: boolean }) {
    const external = !!banner.link && /^https:\/\//.test(banner.link);
    const cta = banner.link ? (
        external
            ? <a href={banner.link} target="_blank" rel="noopener noreferrer sponsored" onClick={() => !preview && seen(banner.id, true)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-background px-4 text-sm font-bold text-foreground hover:opacity-90">{banner.ctaLabel || 'Find out more'}<ArrowRight className="h-4 w-4" /></a>
            : <Link to={banner.link} onClick={() => !preview && seen(banner.id, true)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-background px-4 text-sm font-bold text-foreground hover:opacity-90">{banner.ctaLabel || 'Find out more'}<ArrowRight className="h-4 w-4" /></Link>
    ) : null;
    return (
        <div className={cn('relative flex min-h-[7.5rem] overflow-hidden rounded-3xl', THEME[banner.theme] ?? THEME.brand)}>
            <div className="relative z-10 flex flex-1 flex-col justify-center gap-2 p-5 pr-12 sm:p-6 sm:pr-6">
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Sponsored</p>
                <p className="font-display text-xl font-extrabold leading-tight sm:text-2xl">{banner.title}</p>
                {banner.message && <p className="max-w-xl text-sm opacity-90">{banner.message}</p>}
                {cta && <div className="pt-1">{cta}</div>}
            </div>
            {banner.image && (
                <div className="relative hidden w-2/5 shrink-0 sm:block">
                    <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                </div>
            )}
            {onClose && (
                <button type="button" onClick={onClose} aria-label="Hide this banner" className="absolute right-2 top-2 z-20 rounded-full bg-black/20 p-1.5 text-white hover:bg-black/40">
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

/** The banners for a page. Rotates every 7 seconds; each one can be hidden. Shows nothing when there are none. */
export function BannerAds({ placement, className }: { placement: 'home' | 'menu' | 'meal_plans'; className?: string }) {
    const { user } = useAuth();
    const { data = [] } = useQuery<Banner[]>({ queryKey: ['banners', placement, user?.id ?? 0], queryFn: () => api.get(`/banners?platform=website&placement=${placement}`), staleTime: 60_000 });
    const [hidden, setHidden] = useState<number[]>(readHidden);
    const [index, setIndex] = useState(0);
    const counted = useRef(new Set<number>());
    const list = data.filter((b) => !hidden.includes(b.id));
    const current = list[index % Math.max(list.length, 1)];

    useEffect(() => {
        if (list.length < 2) return;
        const t = setInterval(() => setIndex((i) => i + 1), 7000);
        return () => clearInterval(t);
    }, [list.length]);
    useEffect(() => {
        if (current && !counted.current.has(current.id)) { counted.current.add(current.id); seen(current.id); }
    }, [current]);

    if (!current) return null;
    const hide = () => {
        const next = [...hidden, current.id].slice(-50);
        setHidden(next);
        try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    };
    return (
        <aside className={cn('relative', className)} aria-label="Offers" aria-roledescription="carousel">
            <BannerCard key={current.id} banner={current} onClose={hide} />
            {list.length > 1 && (
                <div className="mt-2 flex items-center justify-center gap-2">
                    <button type="button" aria-label="Previous offer" onClick={() => setIndex((i) => (i - 1 + list.length) % list.length)} className="rounded-full p-1 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
                    {list.map((b, i) => (
                        <button key={b.id} type="button" aria-label={`Offer ${i + 1} of ${list.length}`} aria-current={b.id === current.id} onClick={() => setIndex(i)}
                            className={cn('h-2 rounded-full transition-all', b.id === current.id ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30')} />
                    ))}
                    <button type="button" aria-label="Next offer" onClick={() => setIndex((i) => (i + 1) % list.length)} className="rounded-full p-1 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
                </div>
            )}
        </aside>
    );
}
