/** Friendly labels for delivery times: "Today, 18:30", "Tomorrow, 12:00", "Friday 21 Nov, 19:00". */
export const dayLabel = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400_000);
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (same(d, today)) return 'Today';
    if (same(d, tomorrow)) return 'Tomorrow';
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
};
export const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
export const whenLabel = (iso: string) => `${dayLabel(iso)}, ${timeLabel(iso)}`;
