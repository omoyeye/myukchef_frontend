import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { discountForWeeks, PlanConfig, planLength } from '@/lib/mealPlans';
import { cn } from '@/lib/utils';

/** Quick lengths plus a slider for any number of weeks from 1 to 26 (6 months). */
export function PlanLengthPicker({ weeks, onChange, compact }: { weeks: number; onChange: (weeks: number) => void; compact?: boolean }) {
    const { data: config } = useQuery<PlanConfig>({ queryKey: ['plan-config'], queryFn: () => api.get('/meal-plans/config'), staleTime: 300_000 });
    const discount = discountForWeeks(weeks, config);
    const presets = config?.presets ?? [];
    return (
        <div className="space-y-3">
            <div className={cn('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6')}>
                {presets.map((d) => (
                    <button
                        key={d.weeks}
                        type="button"
                        aria-pressed={weeks === d.weeks}
                        onClick={() => onChange(d.weeks)}
                        className={cn('rounded-2xl border-2 p-2 text-center transition-all', weeks === d.weeks ? 'border-primary bg-primary/5' : 'bg-card hover:border-primary/40')}
                    >
                        <span className="block font-display text-xl font-extrabold">{d.label.split(' ')[0]}</span>
                        <span className="block text-xs font-semibold">{d.label.split(' ')[1]}</span>
                        {d.discountPercent > 0 && <span className="block text-[11px] font-bold text-primary">{d.discountPercent}% off</span>}
                    </button>
                ))}
            </div>
            <div className="rounded-2xl border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                    <label htmlFor="length-slider" className="text-sm font-semibold">Any length</label>
                    <span className="font-display text-lg font-extrabold" aria-live="polite">{planLength(weeks)}</span>
                </div>
                <input
                    id="length-slider"
                    type="range"
                    min={config?.minWeeks ?? 1}
                    max={config?.maxWeeks ?? 26}
                    step={1}
                    value={weeks}
                    onChange={(e) => onChange(Number(e.target.value))}
                    aria-valuetext={`${planLength(weeks)}, ${weeks} deliveries`}
                    className="mt-2 w-full accent-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                    {weeks} weekly {weeks === 1 ? 'delivery' : 'deliveries'}{discount > 0 ? ` · ${discount}% off` : ''}
                </p>
            </div>
        </div>
    );
}
