import { MapPin, Route } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { EXTRA_WAIT_CHOICES, FAR_MAX_CHOICES, RADIUS_PRESETS, waitLabel } from '@/lib/area';

export interface DeliveryArea { serviceRadiusMiles?: number; acceptsFarOrders?: boolean; farExtraHours?: number; farMaxMiles?: number }

/**
 * Where a chef delivers: their usual area, and whether they'll take orders from further away. Customers
 * further out agree to wait the extra time the chef sets, and not to complain about it.
 */
export function DeliveryAreaField({ value, onChange, who = 'you' }: { value: DeliveryArea; onChange: (v: DeliveryArea) => void; who?: 'you' | 'chef' }) {
    const radius = value.serviceRadiusMiles ?? 15;
    const far = !!value.acceptsFarOrders;
    const extra = value.farExtraHours ?? 24;
    const max = value.farMaxMiles ?? 0;
    const set = (patch: DeliveryArea) => onChange({ ...value, ...patch });
    const you = who === 'you';
    return (
        <div className="space-y-4 rounded-2xl border p-4">
            <div>
                <p className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" />{you ? 'Where you deliver' : 'Delivery area'}</p>
                <p className="text-sm text-muted-foreground">Customers within this distance of {you ? 'your' : 'the'} kitchen see {you ? 'you' : 'the chef'} first and can order straight away.</p>
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Slider value={[Math.min(radius, 100)]} min={1} max={100} step={1} onValueChange={([v]) => set({ serviceRadiusMiles: v })} aria-label="Delivery distance in miles" className="flex-1" />
                    <div className="relative w-24">
                        <Input type="number" inputMode="numeric" min={1} max={200} value={radius} onChange={(e) => set({ serviceRadiusMiles: Math.max(1, Math.min(200, Math.round(Number(e.target.value)) || 1)) })} aria-label="Miles" className="pr-10" />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">miles</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {RADIUS_PRESETS.map((m) => (
                        <button key={m} type="button" onClick={() => set({ serviceRadiusMiles: m })} aria-pressed={radius === m}
                            className={cn('h-9 rounded-full border px-3 text-sm font-medium transition-colors', radius === m ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary')}>
                            {m} miles
                        </button>
                    ))}
                </div>
            </div>

            <label className="flex items-start gap-3 border-t pt-4">
                <Switch checked={far} onCheckedChange={(v) => set({ acceptsFarOrders: v })} className="mt-0.5" />
                <span>
                    <span className="flex items-center gap-2 font-semibold"><Route className="h-4 w-4 text-primary" />Take orders from further away</span>
                    <span className="block text-sm text-muted-foreground">Customers outside {radius} miles can still choose {you ? 'you' : 'this chef'}, if they agree to wait longer and not complain about the delivery time.</span>
                </span>
            </label>
            {far && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label>Extra wait for those orders</Label>
                        <Select value={String(extra)} onValueChange={(v) => set({ farExtraHours: Number(v) })}>
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>{[...new Set([...EXTRA_WAIT_CHOICES, extra])].sort((a, b) => a - b).map((h) => <SelectItem key={h} value={String(h)}>{waitLabel(h)} longer</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>Furthest {you ? "you'll" : 'they'} go</Label>
                        <Select value={String(max)} onValueChange={(v) => set({ farMaxMiles: Number(v) })}>
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>{[...new Set([...FAR_MAX_CHOICES, max])].sort((a, b) => a - b).filter((m) => m === 0 || m > radius).map((m) => <SelectItem key={m} value={String(m)}>{m === 0 ? 'Anywhere in the UK' : `Up to ${m} miles`}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-2">The extra wait is added to {you ? 'your' : 'their'} usual notice, so the earliest time customers can pick already includes it. {you ? "You'll" : 'The chef will'} see on each order that the customer agreed to it.</p>
                </div>
            )}
        </div>
    );
}
