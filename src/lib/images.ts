/**
 * Smaller copies of uploaded photos for cards and lists. The server makes a WebP copy at the
 * requested width the first time it's asked for. Photos from elsewhere are left as they are.
 */
export function thumb(src: string | null | undefined, width = 480): string | undefined {
    if (!src) return undefined;
    const m = src.match(/^\/uploads\/([\w-]+\.(?:jpg|jpeg|png|webp))$/i);
    return m ? `/uploads/sm/${m[1]}?w=${width}` : src;
}

/** A srcSet so phones with sharp screens get the bigger copy. */
export function thumbSet(src: string | null | undefined, width = 480): string | undefined {
    if (!src || !/^\/uploads\/[\w-]+\.(?:jpg|jpeg|png|webp)$/i.test(src)) return undefined;
    return `${thumb(src, width)} 1x, ${thumb(src, width * 2)} 2x`;
}

/** When a chef next cooks, for menus: "Opens today 17:00" or "Opens Thu 12:00". */
export function nextOpenLabel(iso: string | null | undefined) {
    if (!iso) return 'Not taking orders';
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return today ? `Opens today ${time}` : `Opens ${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${time}`;
}
