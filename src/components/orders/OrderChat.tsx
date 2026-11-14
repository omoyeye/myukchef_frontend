import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Thread { chefId: number; chefName: string; messages: { id: number; from: 'customer' | 'chef'; body: string; createdAt: string }[] }
interface Threads { open: boolean; role: 'customer' | 'chef'; threads: Thread[] }

/**
 * Messages between the customer and each chef cooking their order. Used on the order page (customer)
 * and in the chef's order list (chef). Phone numbers and links are removed by the server.
 */
export function OrderChat({ orderId, token, compact }: { orderId: number; token?: string | null; compact?: boolean }) {
    const qc = useQueryClient();
    const q = token ? `?t=${encodeURIComponent(token)}` : '';
    const { data, error } = useQuery<Threads>({
        queryKey: ['order-messages', orderId],
        queryFn: () => api.get(`/orders/${orderId}/messages${q}`),
        refetchInterval: 15_000,
        retry: false,
    });
    const [chefId, setChefId] = useState<number | null>(null);
    const [body, setBody] = useState('');
    const end = useRef<HTMLDivElement>(null);
    const thread = data?.threads.find((t) => t.chefId === chefId) ?? data?.threads[0];
    useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [thread?.messages.length]);

    const send = useMutation({
        mutationFn: () => api.post(`/orders/${orderId}/messages`, { chefId: thread?.chefId, body, t: token }),
        onSuccess: () => { setBody(''); qc.invalidateQueries({ queryKey: ['order-messages', orderId] }); },
        onError: (e: Error) => toast.error(e.message),
    });

    if (error || !data || data.threads.length === 0) return null;
    const me = data.role;

    return (
        <Card className={cn('space-y-3 p-4', compact && 'border-dashed shadow-none')}>
            <p className="flex items-center gap-2 font-semibold"><MessageCircle className="h-4 w-4 text-primary" />{me === 'customer' ? 'Message your chef' : 'Messages with the customer'}</p>
            {me === 'customer' && data.threads.length > 1 && (
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose a chef">
                    {data.threads.map((t) => (
                        <button key={t.chefId} role="tab" aria-selected={thread?.chefId === t.chefId} onClick={() => setChefId(t.chefId)}
                            className={cn('h-9 rounded-full border px-3 text-sm', thread?.chefId === t.chefId ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary')}>
                            {t.chefName}{t.messages.length ? ` (${t.messages.length})` : ''}
                        </button>
                    ))}
                </div>
            )}
            <div className="max-h-64 space-y-2 overflow-y-auto" aria-live="polite">
                {thread?.messages.length ? thread.messages.map((m) => (
                    <div key={m.id} className={cn('flex', m.from === me ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm', m.from === me ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={cn('mt-0.5 text-[10px]', m.from === me ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                )) : <p className="text-sm text-muted-foreground">{me === 'customer' ? `Ask ${thread?.chefName} anything about your order, like "no onions please" or "I'm in flat 2".` : 'No messages yet.'}</p>}
                <div ref={end} />
            </div>
            {data.open ? (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (body.trim()) send.mutate(); }}>
                    <Textarea aria-label="Your message" rows={1} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (body.trim()) send.mutate(); } }}
                        placeholder="Write a message" className="min-h-11 resize-none" />
                    <Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label="Send" disabled={!body.trim() || send.isPending}><Send className="h-4 w-4" /></Button>
                </form>
            ) : <p className="text-xs text-muted-foreground">This conversation has closed. Email us if you need help.</p>}
            <p className="text-xs text-muted-foreground">Keep chats on MYUKCHEF: phone numbers, emails and links are removed.</p>
        </Card>
    );
}
