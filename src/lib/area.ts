// Where chefs deliver, and who the food is for. Matches the server's rules.

/** A chef the customer chose from outside that chef's usual area, and the extra wait they agree to. */
export interface FarAway { chefId: number; name: string; miles: number; radiusMiles: number; extraHours: number }

export type AreaStatus = 'inside' | 'far' | 'outside' | 'unknown';

/** "24 hours", "2 days", "1 day and 6 hours". */
export function waitLabel(hours: number) {
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
    const days = Math.floor(hours / 24);
    const rest = hours % 24;
    return `${days} day${days === 1 ? '' : 's'}${rest ? ` and ${rest} hour${rest === 1 ? '' : 's'}` : ''}`;
}

/** "2 adults and 1 child". Older bookings without the split show the total. */
export function peopleLabel(row: { adults?: number | null; kids?: number | null }, total: number) {
    if (row.adults === null || row.adults === undefined) return `${total} ${total === 1 ? 'person' : 'people'}`;
    const kids = row.kids ?? 0;
    const a = row.adults ? `${row.adults} adult${row.adults === 1 ? '' : 's'}` : '';
    const k = kids ? `${kids} child${kids === 1 ? '' : 'ren'}` : '';
    return [a, k].filter(Boolean).join(' and ');
}

export const RADIUS_PRESETS = [3, 5, 10, 15, 25, 50];
export const EXTRA_WAIT_CHOICES = [2, 4, 6, 12, 24, 48, 72, 168];
export const FAR_MAX_CHOICES = [0, 25, 50, 100, 200];
