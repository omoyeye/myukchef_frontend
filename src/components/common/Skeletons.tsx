import { cn } from '@/lib/utils';

const Block = ({ className }: { className?: string }) => <div className={cn('shimmer rounded-xl bg-muted', className)} />;

/** Grey shapes in the layout of a dish or chef card, shown while the real ones load. */
export const CardSkeleton = ({ className }: { className?: string }) => (
    <div className={cn('overflow-hidden rounded-2xl border bg-card', className)} aria-hidden>
        <Block className="aspect-[4/3] w-full rounded-none" />
        <div className="space-y-2 p-4">
            <Block className="h-5 w-3/4" />
            <Block className="h-4 w-1/3" />
            <Block className="h-4 w-full" />
            <div className="flex gap-2 pt-1"><Block className="h-5 w-12 rounded-full" /><Block className="h-5 w-16 rounded-full" /></div>
        </div>
    </div>
);

export const CardGridSkeleton = ({ count = 8, className }: { count?: number; className?: string }) => (
    <div role="status" aria-label="Loading" className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4', className)}>
        {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}
    </div>
);

/** Rows, for lists of orders, plans and bookings. */
export const ListSkeleton = ({ rows = 4 }: { rows?: number }) => (
    <div role="status" aria-label="Loading" className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border bg-card p-4" aria-hidden>
                <Block className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2"><Block className="h-4 w-1/2" /><Block className="h-3 w-1/3" /></div>
                <Block className="h-6 w-16" />
            </div>
        ))}
    </div>
);

/** A whole page: a header band and some content, used while a page's code loads. */
export const PageSkeleton = () => (
    <div role="status" aria-label="Loading" className="container space-y-6 py-28">
        <Block className="h-10 w-2/3 max-w-md" />
        <Block className="h-5 w-1/2 max-w-sm" />
        <CardGridSkeleton count={4} />
    </div>
);
