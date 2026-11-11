import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Loader2, Mail, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Messages from the contact form. They're saved here, so a mail problem can't lose them. */
const SupportInbox = () => {
    const qc = useQueryClient();
    const { data: messages = [], isLoading } = useQuery<any[]>({ queryKey: ["admin-support"], queryFn: () => api.get("/contact/admin") });
    const refresh = () => qc.invalidateQueries({ queryKey: ["admin-support"] });
    const setStatus = useMutation({ mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/contact/admin/${id}`, { status }), onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });
    const remove = useMutation({ mutationFn: (id: number) => api.delete(`/contact/admin/${id}`), onSuccess: () => { toast.success("Message deleted"); refresh(); }, onError: (e: Error) => toast.error(e.message) });
    const open = messages.filter((m) => m.status === "open").length;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Support Inbox</h1>
                <p className="text-sm text-muted-foreground">{open} open {open === 1 ? "message" : "messages"} from the contact form. Closed messages are deleted after 24 months.</p>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : messages.length === 0 ? (
                <p className="rounded-3xl border border-dashed p-10 text-center text-muted-foreground">No messages yet.</p>
            ) : (
                <ul className="space-y-3">
                    {messages.map((m) => (
                        <li key={m.id} className={cn("space-y-2 rounded-2xl border bg-card p-4", m.status === "closed" && "opacity-70")}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="break-words font-bold">{m.name}</p>
                                    <p className="break-words text-sm text-muted-foreground">{m.email} · {m.phone}</p>
                                </div>
                                <time className="shrink-0 text-xs text-muted-foreground">{format(new Date(m.createdAt), "d MMM yyyy, HH:mm")}</time>
                            </div>
                            <p className="whitespace-pre-line break-words">{m.message}</p>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline" className="h-10"><a href={`mailto:${m.email}`}><Mail className="mr-2 h-4 w-4" />Reply by email</a></Button>
                                {m.status === "open"
                                    ? <Button variant="outline" className="h-10" onClick={() => setStatus.mutate({ id: m.id, status: "closed" })}><Check className="mr-2 h-4 w-4" />Close</Button>
                                    : <Button variant="outline" className="h-10" onClick={() => setStatus.mutate({ id: m.id, status: "open" })}><RotateCcw className="mr-2 h-4 w-4" />Reopen</Button>}
                                <Button variant="ghost" size="icon" aria-label={`Delete message from ${m.name}`} className="h-10 w-10 text-destructive" onClick={() => { if (confirm("Delete this message for good?")) remove.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SupportInbox;
