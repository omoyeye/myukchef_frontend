import { addDays, format, parseISO } from "date-fns";

export interface PlanDish { dishId: string; name: string; image: string; price: number; meals: number; allergens?: string[] }

export interface PlanWeek {
    id: number;
    planId: number;
    weekNumber: number;
    deliveryDate: string;
    status: string;
    items: PlanDish[];
    note: string | null;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
    isPaid: boolean;
    locked?: boolean;
    lockAt?: string;
}

export interface PlanMessage { id: number; senderRole: "customer" | "chef" | "admin"; body: string; createdAt: string }

export interface PlanSummary {
    id: number;
    chefId: number;
    durationMonths: number;
    mealsPerWeek: number;
    servings: number;
    deliveryWindow: string;
    startDate: string;
    endDate: string;
    status: string;
    pausedUntil: string | null;
    discountPercent: number;
    deliveryFee: number;
    dietary: string[];
    avoidAllergens: string[];
    requests: string | null;
    rotation: string[];
    deliveryAddress: { street: string; city: string; postcode: string; phone: string };
    chefNote: string | null;
    adminNotes?: string | null;
    weeksTotal: number;
    weeksDelivered: number;
    weeksSkipped: number;
    estimatedTotal: number;
    nextDelivery: PlanWeek | null;
    chef?: { id: number; displayName: string; avatar: string | null; specialty: string | null };
    customerName?: string;
    customerEmail?: string;
    chefName?: string;
}

export interface PlanDetail extends PlanSummary {
    viewerRole: "customer" | "chef" | "admin";
    chef: { id: number; displayName: string; avatar: string | null; specialty: string | null };
    customerName: string;
    cutoffHours: number;
    weeks: PlanWeek[];
    messages: PlanMessage[];
    canReview: boolean;
    myReview: ChefReview | null;
}

export interface ChefReview {
    id: number;
    rating: number;
    tasteRating?: number | null;
    reliabilityRating?: number | null;
    valueRating?: number | null;
    comment: string | null;
    tags: string[];
    source: string;
    status?: string;
    chefReply: string | null;
    createdAt: string;
    author?: string;
}

export interface PlanConfig {
    durations: { months: number; weeks: number; discountPercent: number }[];
    cutoffHours: number;
    leadDays: number;
    deliveryFee: number;
    mealOptions: number[];
    servingOptions: number[];
}

export const DIETARY_OPTIONS = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "gluten_free", label: "Gluten free" },
    { id: "halal", label: "Halal" },
];
export const WINDOWS = [
    { id: "morning", label: "Morning", hint: "8am to 12pm" },
    { id: "afternoon", label: "Afternoon", hint: "12pm to 5pm" },
    { id: "evening", label: "Evening", hint: "5pm to 9pm" },
];

export const dietaryLabel = (id: string) => DIETARY_OPTIONS.find((d) => d.id === id)?.label ?? id;
export const money = (n: number) => `£${Number(n).toFixed(2)}`;
export const planDate = (iso: string, pattern = "EEE d MMM") => format(parseISO(iso), pattern);
export const planName = (months: number) => `${months} month plan`;
export const inDays = (days: number) => format(addDays(new Date(), days), "yyyy-MM-dd");

export const PLAN_STATUS: Record<string, { label: string; className: string }> = {
    requested: { label: "Waiting for chef", className: "bg-amber-100 text-amber-900" },
    active: { label: "Active", className: "bg-emerald-100 text-emerald-900" },
    paused: { label: "Paused", className: "bg-sky-100 text-sky-900" },
    completed: { label: "Completed", className: "bg-secondary text-secondary-foreground" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
    declined: { label: "Declined", className: "bg-red-100 text-red-900" },
    expired: { label: "Expired", className: "bg-muted text-muted-foreground" },
};

export const WEEK_STATUS: Record<string, { label: string; className: string }> = {
    scheduled: { label: "Scheduled", className: "bg-secondary text-secondary-foreground" },
    preparing: { label: "Being cooked", className: "bg-amber-100 text-amber-900" },
    out_for_delivery: { label: "On its way", className: "bg-sky-100 text-sky-900" },
    delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-900" },
    skipped: { label: "Skipped", className: "bg-muted text-muted-foreground" },
    paused: { label: "Paused", className: "bg-sky-100 text-sky-900" },
    missed: { label: "Not delivered", className: "bg-red-100 text-red-900" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export const totalMeals = (items: PlanDish[]) => items.reduce((sum, item) => sum + item.meals, 0);
