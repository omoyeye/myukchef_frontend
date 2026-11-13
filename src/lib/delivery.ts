/** A delivery price band set by the Super Admin: orders from `minOrder` up pay `fee`. */
export interface DeliveryTier { minOrder: number; fee: number; note?: string }

export function readTiers(raw: unknown): DeliveryTier[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((t) => ({ minOrder: Number(t?.minOrder), fee: Number(t?.fee), note: typeof t?.note === 'string' ? t.note : undefined }))
        .filter((t) => Number.isFinite(t.minOrder) && Number.isFinite(t.fee))
        .sort((a, b) => a.minOrder - b.minOrder);
}

/** The band an order reaches, and the next cheaper one it could reach by adding more. Same rules as the server. */
export function deliveryFor(subtotal: number, config: { fee?: unknown; freeOver?: unknown; tiers?: unknown }) {
    const tiers = readTiers(config.tiers);
    const freeOver = Number(config.freeOver ?? 0);
    const band = [...tiers].reverse().find((t) => subtotal >= t.minOrder) ?? null;
    const isFree = subtotal === 0 || (freeOver > 0 && subtotal >= freeOver);
    const fee = isFree ? 0 : band ? band.fee : Number(config.fee ?? 3.99);
    const cheaper = [...tiers, ...(freeOver > 0 ? [{ minOrder: freeOver, fee: 0 }] : [])]
        .sort((a, b) => a.minOrder - b.minOrder)
        .find((t) => t.minOrder > subtotal && t.fee < fee) ?? null;
    return { fee, band, next: cheaper ? { spendMore: Math.round((cheaper.minOrder - subtotal) * 100) / 100, fee: cheaper.fee } : null };
}
