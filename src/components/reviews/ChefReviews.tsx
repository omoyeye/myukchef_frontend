import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageCircle, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ChefReview } from "@/lib/mealPlans";
import { ReviewDialog } from "./ReviewDialog";
import { Stars } from "./Stars";

interface ReviewData {
    summary: {
        average: number | null;
        count: number;
        distribution: { stars: number; count: number }[];
        taste: number | null;
        reliability: number | null;
        value: number | null;
        topTags: { tag: string; count: number }[];
    };
    reviews: ChefReview[];
}

const SOURCE_LABEL: Record<string, string> = { meal_plan: "Meal plan customer", order: "Ordered from this chef", event: "Booked for an event" };

const Meter = ({ label, value }: { label: string; value: number | null }) =>
    value === null ? null : (
        <div>
            <div className="flex justify-between text-sm"><span>{label}</span><span className="font-bold">{value.toFixed(1)}</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(value / 5) * 100}%` }} /></div>
        </div>
    );

export const ChefReviews = ({ chefId, chefName }: { chefId: number; chefName: string }) => {
    const { isAuthenticated } = useAuth();
    const [writing, setWriting] = useState(false);
    const { data } = useQuery<ReviewData>({ queryKey: ["chef-reviews", chefId], queryFn: () => api.get(`/chef-reviews/chef/${chefId}`) });
    const { data: mine } = useQuery<{ canReview: boolean; review: ChefReview | null }>({
        queryKey: ["chef-review-mine", chefId],
        queryFn: () => api.get(`/chef-reviews/chef/${chefId}/mine`),
        enabled: isAuthenticated,
    });

    const summary = data?.summary;
    const reviews = data?.reviews ?? [];
    const writeButton = mine?.canReview && (
        <Button variant={mine.review ? "outline" : "default"} className="h-11" onClick={() => setWriting(true)}>
            <PenLine className="mr-2 h-4 w-4" />{mine.review ? "Edit your review" : `Rate ${chefName}`}
        </Button>
    );

    return (
        <section aria-labelledby="reviews-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 id="reviews-heading" className="font-display text-2xl font-extrabold md:text-3xl">Customer reviews</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><BadgeCheck className="h-4 w-4 text-primary" />Only customers this chef has cooked for can leave a review.</p>
                </div>
                {writeButton}
            </div>

            {!summary || summary.count === 0 ? (
                <div className="mt-5 rounded-3xl border border-dashed p-8 text-center">
                    <p className="font-bold">No reviews yet</p>
                    <p className="text-sm text-muted-foreground">{mine?.canReview ? "You could be the first to share how it went." : "Reviews appear here once customers have tried this chef's food."}</p>
                </div>
            ) : (
                <>
                    <div className="mt-5 grid gap-6 rounded-3xl border bg-card p-5 md:grid-cols-3 md:p-7">
                        <div className="text-center md:border-r md:pr-6">
                            <p className="font-display text-6xl font-extrabold">{summary.average?.toFixed(1)}</p>
                            <Stars value={summary.average ?? 0} className="mt-1 justify-center" />
                            <p className="mt-1 text-sm text-muted-foreground">{summary.count} {summary.count === 1 ? "review" : "reviews"}</p>
                        </div>
                        <div className="space-y-1.5">
                            {summary.distribution.map((row) => (
                                <div key={row.stars} className="flex items-center gap-2 text-sm">
                                    <span className="w-8 shrink-0">{row.stars} ★</span>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(row.count / summary.count) * 100}%` }} /></div>
                                    <span className="w-6 shrink-0 text-right text-muted-foreground">{row.count}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <Meter label="Taste" value={summary.taste} />
                            <Meter label="Reliability" value={summary.reliability} />
                            <Meter label="Value for money" value={summary.value} />
                        </div>
                    </div>
                    {summary.topTags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {summary.topTags.map((t) => <span key={t.tag} className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">{t.tag} · {t.count}</span>)}
                        </div>
                    )}
                    <ul className="mt-5 grid gap-4 md:grid-cols-2">
                        {reviews.map((review) => (
                            <li key={review.id} className="rounded-3xl border bg-card p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-bold">{review.author}</p>
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />{SOURCE_LABEL[review.source] ?? "Verified customer"}</p>
                                    </div>
                                    <time className="shrink-0 text-xs text-muted-foreground" dateTime={review.createdAt}>{format(new Date(review.createdAt), "d MMM yyyy")}</time>
                                </div>
                                <Stars value={review.rating} className="mt-2" />
                                {review.comment && <p className="mt-2 whitespace-pre-line break-words">{review.comment}</p>}
                                {review.tags.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{review.tags.join(" · ")}</p>}
                                {review.chefReply && (
                                    <div className="mt-3 rounded-2xl bg-secondary/70 p-3 text-sm">
                                        <p className="mb-1 flex items-center gap-1.5 font-semibold"><MessageCircle className="h-3.5 w-3.5" />{chefName} replied</p>
                                        <p className="break-words">{review.chefReply}</p>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <ReviewDialog chefId={chefId} chefName={chefName} open={writing} onOpenChange={setWriting} existing={mine?.review} />
        </section>
    );
};
