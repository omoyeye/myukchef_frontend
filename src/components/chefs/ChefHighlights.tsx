import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Quote, Star, X } from 'lucide-react';
import { api } from '@/lib/api';
import { thumb } from '@/lib/images';
import type { ChefReview } from '@/lib/mealPlans';

/** The chef's best recent review, pulled out as a quote. */
export function BestReview({ chefId, firstName }: { chefId: number; firstName: string }) {
    const { data } = useQuery<{ reviews: ChefReview[] }>({ queryKey: ['chef-reviews', chefId], queryFn: () => api.get(`/chef-reviews/chef/${chefId}`) });
    const best = (data?.reviews ?? []).filter((r) => r.rating >= 4 && (r.comment?.trim().length ?? 0) >= 20).sort((a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt))[0];
    if (!best) return null;
    return (
        <figure className="mt-6 max-w-2xl rounded-2xl bg-ink-foreground/10 p-4 backdrop-blur">
            <Quote className="h-5 w-5 text-primary" aria-hidden />
            <blockquote className="mt-1 line-clamp-3 text-base italic text-ink-foreground/90">"{best.comment}"</blockquote>
            <figcaption className="mt-2 flex items-center gap-2 text-sm text-ink-foreground/70">
                <span className="flex" aria-label={`${best.rating} out of 5 stars`}>{Array.from({ length: best.rating }, (_, i) => <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />)}</span>
                {best.author ?? 'A customer'} on {firstName}'s cooking
            </figcaption>
        </figure>
    );
}

/** A strip of the chef's dish photos. Tap one to see it large. */
export function ChefGallery({ dishes, firstName }: { dishes: { id: string; name: string; image: string }[]; firstName: string }) {
    const [open, setOpen] = useState<number | null>(null);
    const photos = dishes.filter((d) => d.image).slice(0, 8);
    if (photos.length < 2) return null;
    const current = open !== null ? photos[open] : null;
    return (
        <section aria-labelledby="gallery-heading" className="mt-8">
            <h2 id="gallery-heading" className="mb-3 font-display text-xl font-extrabold">From {firstName}'s kitchen</h2>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
                {photos.map((d, i) => (
                    <button key={d.id} type="button" onClick={() => setOpen(i)} aria-label={`See a larger photo of ${d.name}`}
                        className="group relative aspect-square w-40 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-auto">
                        <img src={thumb(d.image, 480)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{d.name}</span>
                    </button>
                ))}
            </div>
            {current && (
                <div role="dialog" aria-modal="true" aria-label={current.name} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 animate-in fade-in" onClick={() => setOpen(null)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setOpen(null); if (e.key === 'ArrowRight') setOpen((open! + 1) % photos.length); if (e.key === 'ArrowLeft') setOpen((open! - 1 + photos.length) % photos.length); }}>
                    <button type="button" autoFocus aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white" onClick={() => setOpen(null)}><X className="h-5 w-5" /></button>
                    <figure className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <img src={thumb(current.image, 960)} alt={current.name} className="max-h-[80vh] w-full rounded-2xl object-contain animate-in zoom-in-95" />
                        <figcaption className="mt-3 text-center font-semibold text-white">{current.name}</figcaption>
                    </figure>
                </div>
            )}
        </section>
    );
}
