import { PartyPopper, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EVENT_UNITS } from '@/lib/eventMenu';

export interface EventDishValue { forMenu: boolean; forEvents: boolean; eventUnit: string; eventServes: string; eventPrice: string; eventMinQty: string }

/**
 * Where a dish is offered (everyday menu, events, or both) and how it's sold for events: by the tray,
 * platter, dozen or hour, how many people one feeds, its event price and a minimum.
 */
export function EventDishFields({ value, onChange }: { value: EventDishValue; onChange: (patch: Partial<EventDishValue>) => void }) {
    const eventOnly = !value.forMenu;
    return (
        <div className="space-y-4 rounded-2xl border p-4">
            <p className="font-semibold">Where to offer it</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border p-3">
                    <Switch checked={value.forMenu} onCheckedChange={(v) => onChange({ forMenu: v, ...(v ? {} : { forEvents: true }) })} className="mt-0.5" />
                    <span><span className="flex items-center gap-1.5 font-medium"><UtensilsCrossed className="h-4 w-4 text-primary" />Everyday menu</span><span className="block text-xs text-muted-foreground">Customers can order it any day.</span></span>
                </label>
                <label className="flex items-start gap-3 rounded-xl border p-3">
                    <Switch checked={value.forEvents} onCheckedChange={(v) => onChange({ forEvents: v, ...(v ? {} : { forMenu: true }) })} className="mt-0.5" />
                    <span><span className="flex items-center gap-1.5 font-medium"><PartyPopper className="h-4 w-4 text-primary" />Event menu</span><span className="block text-xs text-muted-foreground">Customers can pick it when asking you to quote for a party.</span></span>
                </label>
            </div>
            {value.forEvents && (
                <div className="grid gap-3 sm:grid-cols-4">
                    <div className="space-y-1">
                        <Label htmlFor="ev-unit">Sold for events by the</Label>
                        <select id="ev-unit" className="h-10 w-full rounded-md border border-input bg-background px-3" value={value.eventUnit} onChange={(e) => onChange({ eventUnit: e.target.value })}>
                            {EVENT_UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="ev-serves">Feeds (people)</Label>
                        <Input id="ev-serves" type="number" inputMode="numeric" min={1} placeholder="1" value={value.eventServes} onChange={(e) => onChange({ eventServes: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="ev-price">Event price (£){eventOnly ? ' *' : ''}</Label>
                        <Input id="ev-price" type="number" inputMode="decimal" step="0.01" min={0} placeholder={eventOnly ? 'Per unit' : 'Same as menu'} value={value.eventPrice} onChange={(e) => onChange({ eventPrice: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="ev-min">Minimum</Label>
                        <Input id="ev-min" type="number" inputMode="numeric" min={1} placeholder="1" value={value.eventMinQty} onChange={(e) => onChange({ eventMinQty: e.target.value })} />
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-4">For example a jollof tray that feeds 10, small chops by the dozen, or serving staff by the hour (use the Extras and services category). Customers see the price as a guide; you still send your own quote.</p>
                </div>
            )}
        </div>
    );
}
