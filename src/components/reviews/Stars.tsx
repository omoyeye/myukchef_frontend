import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only stars. Part-filled so a 4.5 looks like a 4.5. */
export const Stars = ({ value, className }: { value: number; className?: string }) => (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => {
            const fill = Math.min(Math.max(value - (n - 1), 0), 1);
            return (
                <span key={n} className="relative inline-block h-4 w-4">
                    <Star className="absolute inset-0 h-4 w-4 text-primary/25" />
                    <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                        <Star className="h-4 w-4 fill-primary text-primary" />
                    </span>
                </span>
            );
        })}
    </span>
);

/** "4.8 (12)" for chef cards, or a clear "New" when there are no reviews yet. */
export const RatingPill = ({ rating, count, className }: { rating?: number | null; count?: number; className?: string }) =>
    rating && count ? (
        <span className={cn("inline-flex items-center gap-1 text-sm font-bold", className)}>
            <Star className="h-4 w-4 fill-primary text-primary" aria-hidden />
            {rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">({count})</span>
        </span>
    ) : (
        <span className={cn("inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground", className)}>New chef</span>
    );

export const StarInput = ({ label, value, onChange, large }: { label: string; value: number; onChange: (n: number) => void; large?: boolean }) => (
    <fieldset>
        <legend className={cn("font-semibold", large ? "mb-2 text-base" : "mb-1 text-sm")}>{label}</legend>
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                    aria-pressed={value === n}
                    onClick={() => onChange(n)}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
                >
                    <Star className={cn(large ? "h-9 w-9" : "h-7 w-7", n <= value ? "fill-primary text-primary" : "text-muted-foreground/40")} />
                </button>
            ))}
        </div>
    </fieldset>
);
