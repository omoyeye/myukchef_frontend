import { useMemo } from 'react';
import { dayLabel, timeLabel, whenLabel } from "@/lib/when";
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Heart, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


/**
 * When the customer wants their food, chosen from times that suit every chef in the basket
 * (their opening hours and notice), and an optional tip that goes to the chefs in full.
 */
export function WhenAndTip({ itemIds, pickup, when, onWhen, tip, onTip, foodTotal }: {
    itemIds: string[];
    pickup: boolean;
    when: string | null;
    onWhen: (iso: string | null) => void;
    tip: number;
    onTip: (amount: number) => void;
    foodTotal: number;
}) {
    const key = itemIds.slice().sort().join(',');
    const { data, isLoading } = useQuery<{ slots: string[]; earliest: string | null; reason: string | null; noticeHours: number }>({
        queryKey: ['order-slots', key],
        queryFn: () => api.post('/orders/slots', { itemIds }),
        enabled: itemIds.length > 0,
        staleTime: 60_000,
        refetchInterval: 5 * 60_000,
    });
    const slots = useMemo(() => data?.slots ?? [], [data]);
    const days = useMemo(() => [...new Set(slots.map((s) => new Date(s).toDateString()))], [slots]);
    const chosenDay = when ? new Date(when).toDateString() : null;
    const dayOptions = days.map((d) => ({ value: d, label: dayLabel(slots.find((s) => new Date(s).toDateString() === d)!) }));
    const timesForDay = slots.filter((s) => new Date(s).toDateString() === (chosenDay ?? days[0]));

    const tipChoices = [0, 0.1, 0.15].map((p) => Math.round(foodTotal * p * 100) / 100).filter((v, i, a) => a.indexOf(v) === i);

    return (
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-secondary/10">
                <CardTitle className="flex items-center gap-2 text-xl"><CalendarClock className="h-5 w-5 text-primary" />{pickup ? 'When to collect' : 'When to deliver'}</CardTitle>
                <CardDescription>Your chefs cook to order. Times shown suit every chef in your basket.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
                {isLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Finding times…</p>
                ) : slots.length === 0 ? (
                    <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">{data?.reason ?? 'No times available right now.'}</p>
                ) : (
                    <>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => onWhen(null)}
                                aria-pressed={when === null}
                                className={cn('min-h-14 rounded-xl border p-3 text-left transition-colors', when === null ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary')}
                            >
                                <span className="block font-semibold">As soon as possible</span>
                                <span className="block text-sm text-muted-foreground">{whenLabel(slots[0]!)}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onWhen(when ?? slots[Math.min(1, slots.length - 1)]!)}
                                aria-pressed={when !== null}
                                className={cn('min-h-14 rounded-xl border p-3 text-left transition-colors', when !== null ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary')}
                            >
                                <span className="block font-semibold">Schedule for later</span>
                                <span className="block text-sm text-muted-foreground">Up to two weeks ahead</span>
                            </button>
                        </div>
                        {when !== null && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-1">
                                    <Label htmlFor="when-day">Day</Label>
                                    <Select value={chosenDay ?? days[0]} onValueChange={(d) => onWhen(slots.find((s) => new Date(s).toDateString() === d) ?? null)}>
                                        <SelectTrigger id="when-day" className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>{dayOptions.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="when-time">Time</Label>
                                    <Select value={when} onValueChange={onWhen}>
                                        <SelectTrigger id="when-time" className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-72">{timesForDay.map((s) => <SelectItem key={s} value={s}>{timeLabel(s)}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="space-y-2 border-t pt-5">
                    <p className="flex items-center gap-2 font-semibold"><Heart className="h-4 w-4 text-primary" />Add a tip for your chef</p>
                    <p className="text-sm text-muted-foreground">Optional. 100% of it goes to the chefs who cook your order.</p>
                    <div className="flex flex-wrap gap-2">
                        {tipChoices.map((amount) => (
                            <button key={amount} type="button" aria-pressed={tip === amount} onClick={() => onTip(amount)}
                                className={cn('h-11 rounded-full border px-4 text-sm font-semibold transition-colors', tip === amount ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary')}>
                                {amount === 0 ? 'No tip' : `£${amount.toFixed(2)}`}
                            </button>
                        ))}
                        <div className="relative w-28">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                            <Input aria-label="Other tip amount" type="number" min="0" max="200" step="0.5" className="h-11 rounded-full pl-7"
                                placeholder="Other" value={tipChoices.includes(tip) ? '' : String(tip)}
                                onChange={(e) => onTip(Math.min(Math.max(Number(e.target.value) || 0, 0), 200))} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
