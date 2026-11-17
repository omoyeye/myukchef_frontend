export const BOOKING_STATUS: Record<string, { label: string; className: string }> = {
    quoting: { label: "Waiting for quotes", className: "bg-amber-100 text-amber-900" },
    pending: { label: "Waiting for quotes", className: "bg-amber-100 text-amber-900" },
    quotes_ready: { label: "Quotes ready", className: "bg-sky-100 text-sky-900" },
    awaiting_payment: { label: "Awaiting payment", className: "bg-orange-100 text-orange-900" },
    confirmed: { label: "Paid and confirmed", className: "bg-emerald-100 text-emerald-900" },
    in_progress: { label: "Happening now", className: "bg-sky-100 text-sky-900" },
    completed: { label: "Completed", className: "bg-secondary text-secondary-foreground" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export const QUOTE_STATUS: Record<string, { label: string; className: string }> = {
    requested: { label: "Quote needed", className: "bg-primary text-primary-foreground" },
    submitted: { label: "Quote sent", className: "bg-sky-100 text-sky-900" },
    declined: { label: "Declined", className: "bg-muted text-muted-foreground" },
    accepted: { label: "Chosen", className: "bg-emerald-100 text-emerald-900" },
    not_selected: { label: "Not selected", className: "bg-muted text-muted-foreground" },
    withdrawn: { label: "Removed by customer", className: "bg-muted text-muted-foreground" },
};

export const ATTENDANCE_LABEL: Record<string, string> = {
    yes: "Will attend and serve on the day",
    if_possible: "Will attend if possible",
    no: "Can't attend, food will be delivered",
};

/** Which step of the journey a booking has reached: quotes, confirm, pay, event, rate. */
export const bookingStage = (booking: { status: string }) => {
    switch (booking.status) {
        case "quotes_ready": return 1;
        case "awaiting_payment": return 2;
        case "confirmed":
        case "in_progress": return 3;
        case "completed": return 4;
        default: return 0;
    }
};
