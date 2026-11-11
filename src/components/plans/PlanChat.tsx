import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { PlanMessage } from "@/lib/mealPlans";
import { cn } from "@/lib/utils";

interface Props {
    /** Where new messages are posted. */
    postPath: string;
    /** The query to refresh after sending. */
    invalidateKey: unknown[];
    messages: PlanMessage[];
    viewerRole: "customer" | "chef" | "admin";
    otherName: string;
}

/** The conversation between a customer and a chef. All contact stays on MYUKCHEF. */
export const PlanChat = ({ postPath, invalidateKey, messages, viewerRole, otherName }: Props) => {
    const qc = useQueryClient();
    const [draft, setDraft] = useState("");
    const list = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (list.current) list.current.scrollTop = list.current.scrollHeight;
    }, [messages.length]);

    const send = useMutation({
        mutationFn: () => api.post(postPath, { body: draft }),
        onSuccess: () => {
            setDraft("");
            qc.invalidateQueries({ queryKey: invalidateKey });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <div>
            <div ref={list} className="max-h-80 space-y-2 overflow-y-auto pr-1" aria-live="polite">
                {messages.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No messages yet. Ask about a dish, portions or anything else.</p>}
                {messages.map((m) => {
                    const mine = m.senderRole === viewerRole;
                    const name = mine ? "You" : m.senderRole === "admin" ? "MYUKCHEF support" : otherName;
                    return (
                        <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2", mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary")}>
                                <p className="whitespace-pre-line break-words text-sm">{m.body}</p>
                                <p className={cn("mt-0.5 text-[11px]", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>{name} · {format(new Date(m.createdAt), "d MMM, HH:mm")}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <form className="mt-3 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) send.mutate(); }}>
                <Textarea aria-label={`Message ${otherName}`} rows={1} maxLength={1000} className="min-h-11 resize-none" placeholder={`Message ${otherName}`} value={draft} onChange={(e) => setDraft(e.target.value)} />
                <Button type="submit" size="icon" aria-label="Send message" className="h-11 w-11 shrink-0" disabled={!draft.trim() || send.isPending}><Send className="h-4 w-4" /></Button>
            </form>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Phone numbers, emails and links can't be shared here.</p>
        </div>
    );
};
