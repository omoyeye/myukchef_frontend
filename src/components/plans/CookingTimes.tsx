import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Loader2, PauseCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']] as const;
type DayHours = { open: boolean; from: string; to: string };
type Hours = Partial<Record<(typeof DAYS)[number][0], DayHours>>;

/**
 * When the chef cooks one-off orders: opening days and times, the notice they need, and a switch
 * to pause new orders. Customers can only choose delivery times that fit.
 */
export function CookingTimes({ chef }: { chef: { openingHours?: Hours | null; ordersPaused?: boolean; noticeHours?: number } }) {
    const qc = useQueryClient();
    const [always, setAlways] = useState(!chef.openingHours);
    const [hours, setHours] = useState<Hours>(chef.openingHours ?? {});
    const [notice, setNotice] = useState(String(chef.noticeHours ?? 1));
    useEffect(() => { setAlways(!chef.openingHours); setHours(chef.openingHours ?? {}); setNotice(String(chef.noticeHours ?? 1)); }, [chef.openingHours, chef.noticeHours]);

    const save = useMutation({
        mutationFn: (body: Record<string, unknown>) => api.put('/chefs/me', body),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['chef-me'] }); qc.invalidateQueries({ queryKey: ['chef-profile'] }); toast.success('Saved'); },
        onError: (e: Error) => toast.error(e.message),
    });
    const day = (key: (typeof DAYS)[number][0]): DayHours => hours[key] ?? { open: false, from: '17:00', to: '21:00' };
    const setDay = (key: (typeof DAYS)[number][0], patch: Partial<DayHours>) => setHours((h) => ({ ...h, [key]: { ...day(key), ...patch } }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />When I cook</CardTitle>
                <CardDescription>Customers can only order for times that suit you. Times are UK time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${chef.ordersPaused ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                    <div>
                        <Label htmlFor="pause-orders" className="flex items-center gap-2 font-semibold"><PauseCircle className="h-4 w-4" />Pause new orders</Label>
                        <p className="text-sm text-muted-foreground">{chef.ordersPaused ? "You're paused. Customers can't order from you until you switch this off." : 'On holiday or too busy? Stop new orders for now. Orders you already have carry on.'}</p>
                    </div>
                    <Switch id="pause-orders" checked={!!chef.ordersPaused} disabled={save.isPending} onCheckedChange={(ordersPaused) => save.mutate({ ordersPaused })} />
                </div>

                <div className="grid gap-1 sm:max-w-xs">
                    <Label htmlFor="notice">Notice I need (hours)</Label>
                    <Input id="notice" type="number" min="0" max="168" className="h-11" value={notice} onChange={(e) => setNotice(e.target.value)} />
                    <p className="text-xs text-muted-foreground">How long before the delivery time an order must be placed. Dishes can ask for more.</p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                        <Label htmlFor="always-open">I can cook any time</Label>
                        <Switch id="always-open" checked={always} onCheckedChange={setAlways} />
                    </div>
                    {!always && (
                        <ul className="divide-y rounded-xl border">
                            {DAYS.map(([key, label]) => {
                                const d = day(key);
                                return (
                                    <li key={key} className="flex flex-wrap items-center gap-3 p-3">
                                        <Switch id={`day-${key}`} checked={d.open} onCheckedChange={(open) => setDay(key, { open })} aria-label={`Cook on ${label}`} />
                                        <Label htmlFor={`day-${key}`} className="w-24">{label}</Label>
                                        {d.open ? (
                                            <div className="flex items-center gap-2">
                                                <Input type="time" aria-label={`${label} from`} className="h-10 w-28" value={d.from} onChange={(e) => setDay(key, { from: e.target.value })} />
                                                <span className="text-sm text-muted-foreground">to</span>
                                                <Input type="time" aria-label={`${label} to`} className="h-10 w-28" value={d.to} onChange={(e) => setDay(key, { to: e.target.value })} />
                                            </div>
                                        ) : <span className="text-sm text-muted-foreground">Not cooking</span>}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <Button className="h-11" disabled={save.isPending} onClick={() => save.mutate({ noticeHours: Number(notice), openingHours: always ? null : Object.fromEntries(DAYS.map(([k]) => [k, day(k)])) })}>
                    {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save cooking times
                </Button>
            </CardContent>
        </Card>
    );
}
