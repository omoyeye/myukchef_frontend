import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DeliveryTier } from '@/lib/delivery';

/**
 * The Super Admin's delivery price bands: bigger orders can pay a different delivery fee,
 * with a note on how they're delivered (for example "Large orders come by van, allow 2 hours").
 */
export function DeliveryTiersEditor({ value, onChange }: { value: DeliveryTier[] | undefined; onChange: (tiers: DeliveryTier[]) => void }) {
    const tiers = value ?? [];
    const update = (i: number, patch: Partial<DeliveryTier>) => onChange(tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)));
    return (
        <fieldset className="space-y-3 rounded-xl border p-4">
            <legend className="px-1 text-sm font-semibold">Delivery by order size</legend>
            <p className="text-xs text-muted-foreground">
                Orders from each amount up pay that band's delivery fee instead of the standard one. Leave empty to use the standard fee for every order.
                Free delivery over the amount above still applies.
            </p>
            {tiers.length === 0 && <p className="text-sm text-muted-foreground">No bands yet.</p>}
            {tiers.map((tier, i) => (
                <div key={i} className="grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
                    <div className="grid gap-1">
                        <Label htmlFor={`tier-min-${i}`}>Orders from (£)</Label>
                        <Input id={`tier-min-${i}`} type="number" min="0" step="0.01" value={Number.isFinite(tier.minOrder) ? tier.minOrder : ''} onChange={(e) => update(i, { minOrder: parseFloat(e.target.value) })} />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor={`tier-fee-${i}`}>Delivery fee (£)</Label>
                        <Input id={`tier-fee-${i}`} type="number" min="0" step="0.01" value={Number.isFinite(tier.fee) ? tier.fee : ''} onChange={(e) => update(i, { fee: parseFloat(e.target.value) })} />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor={`tier-note-${i}`}>Delivery arrangement (optional)</Label>
                        <Input id={`tier-note-${i}`} maxLength={200} placeholder="e.g. Delivered by van, allow 2 hours" value={tier.note ?? ''} onChange={(e) => update(i, { note: e.target.value })} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive" aria-label={`Remove band from £${tier.minOrder}`} onClick={() => onChange(tiers.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([...tiers, { minOrder: tiers.length ? Math.max(...tiers.map((t) => t.minOrder || 0)) + 25 : 25, fee: 0, note: '' }])}
            >
                <Plus className="mr-1 h-4 w-4" />Add band
            </Button>
        </fieldset>
    );
}
