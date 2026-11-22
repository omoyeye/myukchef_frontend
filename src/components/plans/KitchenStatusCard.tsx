import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChefHat, Loader2, Save, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface KitchenChef { ordersPaused?: boolean; prepMinMinutes?: number | null; prepMaxMinutes?: number | null }

/**
 * The chef's operational status: open or close their kitchen to new orders, and how long they
 * usually take to cook an order (shown to customers on their page and dishes).
 */
export function KitchenStatusCard({ chef, compact }: { chef: KitchenChef; compact?: boolean }) {
    const qc = useQueryClient();
    const [min, setMin] = useState(chef.prepMinMinutes != null ? String(chef.prepMinMinutes) : '');
    const [max, setMax] = useState(chef.prepMaxMinutes != null ? String(chef.prepMaxMinutes) : '');
    useEffect(() => {
        setMin(chef.prepMinMinutes != null ? String(chef.prepMinMinutes) : '');
        setMax(chef.prepMaxMinutes != null ? String(chef.prepMaxMinutes) : '');
    }, [chef.prepMinMinutes, chef.prepMaxMinutes]);

    const save = useMutation({
        mutationFn: (body: Record<string, unknown>) => api.put('/chefs/me', body),
        onSuccess: (_d, body) => {
            qc.invalidateQueries({ queryKey: ['chef-me'] });
            qc.invalidateQueries({ queryKey: ['chef-profile'] });
            toast.success('ordersPaused' in body ? (body.ordersPaused ? 'Kitchen closed to new orders' : 'Kitchen open') : 'Preparation time saved');
        },
        onError: (e: Error) => toast.error(e.message),
    });
    const open = !chef.ordersPaused;
    const changed = min !== (chef.prepMinMinutes != null ? String(chef.prepMinMinutes) : '') || max !== (chef.prepMaxMinutes != null ? String(chef.prepMaxMinutes) : '');

    return (
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className={cn('space-y-5 p-5 sm:p-6', compact && 'sm:p-5')}>
                <div>
                    <h2 className="font-display text-xl font-bold sm:text-2xl">Operational status</h2>
                    <p className="text-sm text-muted-foreground">Control your kitchen's availability and cooking time.</p>
                </div>

                <div className={cn('flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors', open ? 'border-emerald-300/60 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30')}>
                    <div className="flex items-start gap-3">
                        <span className={cn('relative mt-1 flex h-3 w-3 shrink-0')}>
                            {open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                            <span className={cn('relative inline-flex h-3 w-3 rounded-full', open ? 'bg-emerald-500' : 'bg-amber-500')} />
                        </span>
                        <div>
                            <Label htmlFor="kitchen-open" className="flex items-center gap-2 text-base font-semibold"><ChefHat className="h-4 w-4" />Kitchen {open ? 'open' : 'closed'}</Label>
                            <p className="text-sm text-muted-foreground">
                                {open ? 'Customers can order from you. Switch off when you’re on holiday or too busy.' : 'Customers can’t place new orders with you. Orders you already have carry on.'}
                            </p>
                        </div>
                    </div>
                    <Switch id="kitchen-open" checked={open} disabled={save.isPending} onCheckedChange={(on) => save.mutate({ ordersPaused: !on })} />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Timer className="h-4 w-4 text-primary" />Estimated preparation time (mins)</Label>
                    <div className="flex items-center gap-3">
                        <Input aria-label="Shortest preparation time in minutes" inputMode="numeric" type="number" min={5} max={600} placeholder="20" className="h-11 w-28" value={min} onChange={(e) => setMin(e.target.value)} />
                        <span className="text-muted-foreground">to</span>
                        <Input aria-label="Longest preparation time in minutes" inputMode="numeric" type="number" min={5} max={600} placeholder="40" className="h-11 w-28" value={max} onChange={(e) => setMax(e.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground">Customers see this on your page and dishes. Leave both empty to use MYUKCHEF's usual time.</p>
                </div>
            </div>
            <div className="border-t bg-muted/40 px-5 py-4 sm:px-6">
                <Button
                    className="h-11"
                    disabled={!changed || save.isPending}
                    onClick={() => save.mutate({ prepMinMinutes: min === '' ? null : Number(min), prepMaxMinutes: max === '' ? null : Number(max) })}
                >
                    {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save status
                </Button>
            </div>
        </section>
    );
}
