import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { ChefReview } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";
import { StarInput } from "./Stars";

const TAGS = ["Delicious", "Generous portions", "On time", "Great value", "Lovely packaging", "Great with dietary needs", "Friendly", "Would recommend"];
const RATING_WORDS = ["", "Poor", "Below par", "Good", "Great", "Outstanding"];

interface Props {
    chefId: number;
    chefName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existing?: ChefReview | null;
}

export const ReviewDialog = ({ chefId, chefName, open, onOpenChange, existing }: Props) => {
    const qc = useQueryClient();
    const [rating, setRating] = useState(0);
    const [taste, setTaste] = useState(0);
    const [reliability, setReliability] = useState(0);
    const [value, setValue] = useState(0);
    const [comment, setComment] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        setRating(existing?.rating ?? 0);
        setTaste(existing?.tasteRating ?? 0);
        setReliability(existing?.reliabilityRating ?? 0);
        setValue(existing?.valueRating ?? 0);
        setComment(existing?.comment ?? "");
        setTags(existing?.tags ?? []);
    }, [open, existing]);

    const save = useMutation({
        mutationFn: () => api.put(`/chef-reviews/chef/${chefId}`, { rating, tasteRating: taste || null, reliabilityRating: reliability || null, valueRating: value || null, comment, tags }),
        onSuccess: () => {
            toast.success("Thanks for your review");
            onOpenChange(false);
            for (const key of ["chef-reviews", "chef-review-mine", "chef", "public-chefs", "meal-plan"]) qc.invalidateQueries({ queryKey: [key] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>{existing ? "Update your review" : `Rate ${chefName}`}</DialogTitle>
                        <DialogDescription>Your honest opinion helps others choose. Your first name and last initial are shown.</DialogDescription>
                    </DialogHeader>
                    <div>
                        <StarInput label="Overall" value={rating} onChange={setRating} large />
                        <p className="mt-1 h-5 text-sm font-semibold text-primary">{RATING_WORDS[rating]}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-1">
                        <StarInput label="Taste" value={taste} onChange={setTaste} />
                        <StarInput label="Reliability" value={reliability} onChange={setReliability} />
                        <StarInput label="Value for money" value={value} onChange={setValue} />
                    </div>
                    <fieldset>
                        <legend className="mb-2 text-sm font-semibold">What stood out?</legend>
                        <div className="flex flex-wrap gap-2">
                            {TAGS.map((tag) => {
                                const on = tags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() => setTags(on ? tags.filter((t) => t !== tag) : [...tags, tag])}
                                        className={cn("min-h-10 rounded-full border px-3 text-sm font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary")}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                    <div className="space-y-2">
                        <Label htmlFor="review-comment">Tell others about it</Label>
                        <Textarea id="review-comment" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you enjoy? What could be better?" />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="h-11" disabled={!rating || save.isPending}>{save.isPending ? "Saving..." : "Post review"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
