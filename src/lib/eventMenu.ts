// What chefs offer for events. Matches the server's event menu.

export interface EventDish {
    id: string;
    chefId: number;
    name: string;
    description: string;
    image: string;
    category: string;
    allergens: string[];
    isVegetarian?: boolean | null; isVegan?: boolean | null; isGlutenFree?: boolean | null; isHalal?: boolean | null;
    /** portion, tray, platter, dozen, hour... */
    unit: string;
    /** People one unit feeds. */
    serves: number;
    /** Event price per unit. */
    price: number;
    minQty: number;
    /** Only for events: not on the everyday menu. */
    eventOnly: boolean;
}

export const EVENT_UNITS: { id: string; label: string; plural: string }[] = [
    { id: 'portion', label: 'portion', plural: 'portions' },
    { id: 'tray', label: 'tray', plural: 'trays' },
    { id: 'platter', label: 'platter', plural: 'platters' },
    { id: 'dozen', label: 'dozen', plural: 'dozen' },
    { id: 'bowl', label: 'bowl', plural: 'bowls' },
    { id: 'cooler', label: 'cooler', plural: 'coolers' },
    { id: 'litre', label: 'litre', plural: 'litres' },
    { id: 'cake', label: 'cake', plural: 'cakes' },
    { id: 'hour', label: 'hour', plural: 'hours' },
    { id: 'set', label: 'set', plural: 'sets' },
    { id: 'item', label: 'item', plural: 'items' },
];
export const unitLabel = (unit: string | undefined, n = 1) => {
    const u = EVENT_UNITS.find((x) => x.id === (unit ?? 'portion')) ?? EVENT_UNITS[0];
    return n === 1 ? u.label : u.plural;
};

export const EVENT_CATEGORIES: { id: string; label: string }[] = [
    { id: 'mains', label: 'Mains' },
    { id: 'sides', label: 'Sides' },
    { id: 'small_chops', label: 'Small chops and finger food' },
    { id: 'platters', label: 'Platters and trays' },
    { id: 'desserts', label: 'Desserts and cakes' },
    { id: 'drinks', label: 'Drinks' },
    { id: 'extras', label: 'Extras and services' },
    { id: 'deals', label: 'Deals' },
];
export const categoryLabel = (id: string) => EVENT_CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** A sensible starting quantity for the guest count: enough units to feed everyone, at least the minimum. */
export function startingQty(dish: Pick<EventDish, 'unit' | 'serves' | 'minQty'>, guests: number) {
    if (['hour', 'set', 'item', 'cake', 'cooler', 'litre'].includes(dish.unit)) return Math.max(dish.minQty, 1);
    return Math.max(dish.minQty, Math.ceil(Math.max(guests, 1) / Math.max(dish.serves, 1)));
}

/** "Tray (serves 10) · min 2" */
export function unitNote(dish: Pick<EventDish, 'unit' | 'serves' | 'minQty'>) {
    const parts = [`per ${unitLabel(dish.unit)}`];
    if (dish.serves > 1) parts.push(`serves ${dish.serves}`);
    if (dish.minQty > 1) parts.push(`min ${dish.minQty}`);
    return parts.join(' · ');
}
