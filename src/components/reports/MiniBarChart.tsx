import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A light bar chart for daily figures: one series, one colour, value on hover or tap, and a text
 * summary for screen readers. No chart library needed.
 */
export function MiniBarChart({ data, label, format, className }: {
    data: { date: string; value: number }[];
    label: string;
    format: (n: number) => string;
    className?: string;
}) {
    const [active, setActive] = useState<number | null>(null);
    const max = Math.max(...data.map((d) => d.value), 0);
    const total = data.reduce((s, d) => s + d.value, 0);
    const shown = active !== null ? data[active] : null;
    const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return (
        <figure className={cn('space-y-2', className)}>
            <figcaption className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold">{label}</span>
                <span className="text-muted-foreground" aria-live="polite">{shown ? `${day(shown.date)}: ${format(shown.value)}` : `Total ${format(total)}`}</span>
            </figcaption>
            <div className="flex h-32 items-end gap-[2px]" role="img" aria-label={`${label}: ${format(total)} in total over ${data.length} days${max ? `, highest ${format(max)}` : ''}.`}>
                {data.map((d, i) => (
                    <button
                        key={d.date}
                        type="button"
                        tabIndex={-1}
                        aria-hidden
                        onMouseEnter={() => setActive(i)}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive(i)}
                        onClick={() => setActive(active === i ? null : i)}
                        className="group flex h-full flex-1 items-end"
                    >
                        <span
                            className={cn('block w-full rounded-t-sm bg-primary/70 transition-all duration-500 group-hover:bg-primary', active === i && 'bg-primary')}
                            style={{ height: max ? `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%` : '0%' }}
                        />
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{data[0] ? day(data[0].date) : ''}</span>
                <span>{data.length ? day(data[data.length - 1]!.date) : ''}</span>
            </div>
        </figure>
    );
}
