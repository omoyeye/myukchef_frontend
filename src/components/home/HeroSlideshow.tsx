import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { thumb } from '@/lib/images';

/**
 * The hero photo, slowly crossfading through real dishes from the menu. The first image loads with
 * the page; the rest load quietly afterwards. Holds still for people who prefer reduced motion.
 */
export function HeroSlideshow({ first, firstAlt, dishes, className, imgProps, dotsClassName }: {
    first: string;
    firstAlt: string;
    dishes: { image: string; name: string }[];
    className?: string;
    imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
    dotsClassName?: string;
}) {
    const slides = [{ src: first, alt: firstAlt }, ...dishes.slice(0, 5).map((d) => ({ src: thumb(d.image, 960) ?? d.image, alt: d.name }))];
    const [index, setIndex] = useState(0);
    const [ready, setReady] = useState<Set<number>>(() => new Set([0]));

    useEffect(() => {
        if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const timer = window.setInterval(() => {
            setIndex((i) => {
                // Only move on to a photo that has finished loading.
                for (let step = 1; step < slides.length; step++) {
                    const next = (i + step) % slides.length;
                    if (ready.has(next)) return next;
                }
                return i;
            });
        }, 5000);
        return () => window.clearInterval(timer);
    }, [slides.length, ready]);

    return (
        <div className={cn('relative h-full w-full', className)}>
            {slides.map((s, i) => (
                <img
                    key={s.src}
                    src={s.src}
                    alt={i === index ? s.alt : ''}
                    aria-hidden={i !== index}
                    {...(i === 0 ? imgProps : { loading: 'lazy' as const, decoding: 'async' as const })}
                    onLoad={() => setReady((r) => (r.has(i) ? r : new Set(r).add(i)))}
                    className={cn(
                        'absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out motion-reduce:transition-none',
                        i === index ? 'opacity-100 hero-zoom' : 'opacity-0',
                    )}
                />
            ))}
            {slides.length > 1 && (
                <div className={cn('absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5', dotsClassName)} aria-hidden>
                    {slides.map((s, i) => <span key={s.src} className={cn('h-1.5 rounded-full bg-white/80 transition-all duration-500', i === index ? 'w-5' : 'w-1.5 opacity-60')} />)}
                </div>
            )}
        </div>
    );
}
