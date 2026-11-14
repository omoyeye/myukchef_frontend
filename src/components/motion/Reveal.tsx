import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Fades and lifts its content into place the first time it scrolls into view. Shows straight away
 * for people who prefer reduced motion, and when the browser can't watch for scrolling.
 */
export function Reveal({ children, as: Tag = 'div', delay = 0, className }: { children: ReactNode; as?: ElementType; delay?: number; className?: string }) {
    const ref = useRef<HTMLElement>(null);
    const [shown, setShown] = useState(() => typeof window === 'undefined' || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    useEffect(() => {
        if (shown || !ref.current) return;
        const el = ref.current;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry?.isIntersecting) { setShown(true); observer.disconnect(); }
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [shown]);

    return (
        <Tag
            ref={ref}
            style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
            className={cn('transition-all duration-700 ease-out motion-reduce:transition-none', shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0', className)}
        >
            {children}
        </Tag>
    );
}
