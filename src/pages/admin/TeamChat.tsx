import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Loader2, LogOut, MessageSquarePlus, Send, UserPlus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Person { id: number; name: string; jobTitle: string | null; isSuper: boolean; roleName: string }
interface ThreadSummary {
    id: number; title: string | null; isGroup: boolean; isMember: boolean; lastMessageAt: string; unread: number;
    members: { id: number; name: string }[];
    lastMessage: { body: string; senderId: number; createdAt: string } | null;
}
interface Overview { me: { id: number; isSuper: boolean }; people: Person[]; threads: ThreadSummary[] }
interface Message { id: number; senderId: number; senderName: string; body: string; createdAt: string }
interface Thread { thread: { id: number; title: string | null; isGroup: boolean; isMember: boolean }; members: { id: number; name: string }[]; messages: Message[] }

const time = (iso: string) => {
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    return d.toLocaleString('en-GB', today ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const nameOf = (t: { title: string | null; isGroup: boolean; members: { id: number; name: string }[] }, me: number) =>
    t.isGroup ? t.title || 'Group' : t.members.filter((m) => m.id !== me).map((m) => m.name).join(', ') || 'Just you';
const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/** Picks people from the admin team. */
function PeoplePicker({ people, value, onChange, exclude = [] }: { people: Person[]; value: number[]; onChange: (v: number[]) => void; exclude?: number[] }) {
    const [q, setQ] = useState('');
    const shown = people.filter((p) => !exclude.includes(p.id) && (p.name + ' ' + p.roleName).toLowerCase().includes(q.toLowerCase()));
    return (
        <div className="space-y-2">
            <Input placeholder="Search the team" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border p-2">
                {shown.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">No one else on the team yet.</p>}
                {shown.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted">
                        <Checkbox checked={value.includes(p.id)} onCheckedChange={(on) => onChange(on ? [...value, p.id] : value.filter((x) => x !== p.id))} />
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials(p.name)}</span>
                        <span className="flex-1">
                            <span className="block text-sm font-semibold">{p.name}</span>
                            <span className="block text-xs text-muted-foreground">{p.jobTitle ? `${p.jobTitle} · ` : ''}{p.roleName}</span>
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

/** Messages between the admin team. Super Admins can also watch every conversation. */
const TeamChat = () => {
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const openId = Number(params.get('thread')) || null;
    const [view, setView] = useState<'mine' | 'all'>('mine');
    const [composing, setComposing] = useState(false);
    const [adding, setAdding] = useState(false);

    const overview = useQuery<Overview>({
        queryKey: ['team-chat', view],
        queryFn: () => api.get(`/admin/chat${view === 'all' ? '?all=1' : ''}`),
        refetchInterval: 10_000,
    });
    const me = overview.data?.me.id ?? 0;
    const isSuper = !!overview.data?.me.isSuper;
    const open = (id: number | null) => setParams(id ? { thread: String(id) } : {}, { replace: false });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="font-display text-3xl font-bold">Team chat</h1>
                    <p className="text-muted-foreground">Message the MYUKCHEF team, one-to-one or in a group.{isSuper ? ' As Super Admin you can also watch every conversation.' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isSuper && (
                        <Tabs value={view} onValueChange={(v) => setView(v as 'mine' | 'all')}>
                            <TabsList>
                                <TabsTrigger value="mine">My chats</TabsTrigger>
                                <TabsTrigger value="all"><Eye className="mr-1.5 h-4 w-4" />Monitor all</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                    <Button onClick={() => setComposing(true)}><MessageSquarePlus className="mr-2 h-4 w-4" />New message</Button>
                </div>
            </div>

            <div className="grid min-h-[60vh] gap-4 lg:grid-cols-[320px_1fr]">
                <div className={cn('rounded-3xl border bg-card', openId && 'hidden lg:block')}>
                    {overview.isLoading ? (
                        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : !overview.data?.threads.length ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            <Users className="mx-auto mb-3 h-8 w-8 text-primary" />
                            {view === 'all' ? 'No one on the team has messaged yet.' : 'No messages yet. Start one with "New message".'}
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {overview.data.threads.map((t) => (
                                <li key={t.id}>
                                    <button onClick={() => open(t.id)} className={cn('flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/60', openId === t.id && 'bg-primary/5')}>
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                            {t.isGroup ? <Users className="h-4 w-4" /> : initials(nameOf(t, me))}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center justify-between gap-2">
                                                <span className={cn('truncate text-sm', t.unread ? 'font-bold' : 'font-semibold')}>{view === 'all' && !t.isMember ? t.members.map((m) => m.name).join(', ') : nameOf(t, me)}</span>
                                                <span className="shrink-0 text-[11px] text-muted-foreground">{time(t.lastMessageAt)}</span>
                                            </span>
                                            {view === 'all' && t.isGroup && <span className="block truncate text-xs text-muted-foreground">{t.title}</span>}
                                            <span className="flex items-center gap-2">
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {t.lastMessage ? `${t.lastMessage.senderId === me ? 'You: ' : ''}${t.lastMessage.body}` : ''}
                                                </span>
                                                {t.unread > 0 && <Badge className="ml-auto h-5 shrink-0 px-1.5">{t.unread}</Badge>}
                                                {view === 'all' && !t.isMember && <Eye className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="You're watching" />}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={cn('flex min-h-[60vh] flex-col rounded-3xl border bg-card', !openId && 'hidden lg:flex')}>
                    {openId ? (
                        <Conversation key={openId} id={openId} me={me} isSuper={isSuper} onBack={() => open(null)} people={overview.data?.people ?? []} addingOpen={adding} setAdding={setAdding} />
                    ) : (
                        <div className="m-auto p-8 text-center text-muted-foreground">
                            <MessageSquarePlus className="mx-auto mb-3 h-10 w-10 text-primary" />
                            Choose a conversation, or start a new one.
                        </div>
                    )}
                </div>
            </div>

            <NewMessage
                open={composing}
                onClose={() => setComposing(false)}
                people={(overview.data?.people ?? []).filter((p) => p.id !== me)}
                onSent={(id) => { setComposing(false); setView('mine'); void qc.invalidateQueries({ queryKey: ['team-chat'] }); open(id); }}
            />
        </div>
    );
};

function Conversation({ id, me, isSuper, onBack, people, addingOpen, setAdding }: { id: number; me: number; isSuper: boolean; onBack: () => void; people: Person[]; addingOpen: boolean; setAdding: (v: boolean) => void }) {
    const qc = useQueryClient();
    const [body, setBody] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const bottom = useRef<HTMLDivElement>(null);
    const { data, isLoading, error } = useQuery<Thread>({ queryKey: ['team-chat-thread', id], queryFn: () => api.get(`/admin/chat/threads/${id}`) });

    useEffect(() => { if (data) setMessages(data.messages); }, [data]);
    // Every few seconds, fetch only what's new.
    const lastId = messages.at(-1)?.id ?? 0;
    useEffect(() => {
        if (!data) return;
        const timer = setInterval(async () => {
            try {
                const fresh: Thread = await api.get(`/admin/chat/threads/${id}?after=${lastId}`);
                if (fresh.messages.length) {
                    setMessages((m) => [...m, ...fresh.messages.filter((x) => !m.some((y) => y.id === x.id))]);
                    void qc.invalidateQueries({ queryKey: ['team-chat'] });
                }
            } catch { /* try again next time */ }
        }, 5000);
        return () => clearInterval(timer);
    }, [data, id, lastId, qc]);
    useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);
    useEffect(() => { if (data) void qc.invalidateQueries({ queryKey: ['team-chat'] }); }, [data, qc]);

    const send = useMutation({
        mutationFn: () => api.post(`/admin/chat/threads/${id}/messages`, { body }),
        onSuccess: async () => {
            setBody('');
            const fresh: Thread = await api.get(`/admin/chat/threads/${id}?after=${lastId}`);
            setMessages((m) => [...m, ...fresh.messages.filter((x) => !m.some((y) => y.id === x.id))]);
            void qc.invalidateQueries({ queryKey: ['team-chat'] });
            if (!data?.thread.isMember) void qc.invalidateQueries({ queryKey: ['team-chat-thread', id] });
        },
        onError: (e: Error) => toast.error(e.message),
    });
    const leave = useMutation({
        mutationFn: () => api.post(`/admin/chat/threads/${id}/leave`, {}),
        onSuccess: () => { toast.success('You left the group'); void qc.invalidateQueries({ queryKey: ['team-chat'] }); onBack(); },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading) return <div className="m-auto"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    if (error || !data) return <div className="m-auto p-8 text-center text-muted-foreground">{(error as Error)?.message ?? "Couldn't open this conversation."}</div>;

    const title = nameOf({ ...data.thread, members: data.members }, me);
    const watching = !data.thread.isMember;
    return (
        <>
            <div className="flex items-center gap-3 border-b p-4">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></Button>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{title}</p>
                    <p className="truncate text-xs text-muted-foreground">{data.members.map((m) => (m.id === me ? 'You' : m.name)).join(', ')}</p>
                </div>
                {data.thread.isGroup && (data.thread.isMember || isSuper) && <Button variant="outline" size="sm" onClick={() => setAdding(true)}><UserPlus className="mr-1.5 h-4 w-4" />Add</Button>}
                {data.thread.isGroup && data.thread.isMember && <Button variant="ghost" size="sm" onClick={() => leave.mutate()} disabled={leave.isPending}><LogOut className="mr-1.5 h-4 w-4" />Leave</Button>}
            </div>
            {watching && <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><Eye className="h-4 w-4" />You're watching this conversation. If you reply, you'll join it.</div>}
            <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '60vh' }}>
                {messages.map((m) => {
                    const mine = m.senderId === me;
                    return (
                        <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                            <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5', mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted')}>
                                {!mine && <p className="text-xs font-semibold text-primary">{m.senderName}</p>}
                                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                                <p className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{time(m.createdAt)}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottom} />
            </div>
            <form className="flex items-end gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); if (body.trim()) send.mutate(); }}>
                <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (body.trim()) send.mutate(); } }}
                    placeholder={watching ? 'Reply (you will join this chat)' : 'Write a message'}
                    rows={1}
                    maxLength={4000}
                    className="min-h-[44px] resize-none"
                />
                <Button type="submit" size="icon" disabled={!body.trim() || send.isPending} aria-label="Send">{send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
            </form>
            <AddPeople open={addingOpen} onClose={() => setAdding(false)} threadId={id} people={people} exclude={data.members.map((m) => m.id)} onAdded={() => void qc.invalidateQueries({ queryKey: ['team-chat-thread', id] })} />
        </>
    );
}

function NewMessage({ open, onClose, people, onSent }: { open: boolean; onClose: () => void; people: Person[]; onSent: (id: number) => void }) {
    const [to, setTo] = useState<number[]>([]);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const group = to.length > 1;
    useEffect(() => { if (!open) { setTo([]); setTitle(''); setBody(''); } }, [open]);
    const send = useMutation({
        mutationFn: () => api.post('/admin/chat/threads', { memberIds: to, title: group ? title : undefined, body }),
        onSuccess: (r: { id: number }) => onSent(r.id),
        onError: (e: Error) => toast.error(e.message),
    });
    const canSend = useMemo(() => to.length > 0 && body.trim() && (!group || title.trim()), [to, body, group, title]);
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>New message</DialogTitle>
                    <DialogDescription>Choose one person, or several to start a group.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <PeoplePicker people={people} value={to} onChange={setTo} />
                    {group && (
                        <div className="space-y-1.5">
                            <Label htmlFor="chat-group">Group name</Label>
                            <Input id="chat-group" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Weekend support" maxLength={120} />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label htmlFor="chat-body">Message</Label>
                        <Textarea id="chat-body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={4000} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => send.mutate()} disabled={!canSend || send.isPending}>{send.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AddPeople({ open, onClose, threadId, people, exclude, onAdded }: { open: boolean; onClose: () => void; threadId: number; people: Person[]; exclude: number[]; onAdded: () => void }) {
    const [ids, setIds] = useState<number[]>([]);
    useEffect(() => { if (!open) setIds([]); }, [open]);
    const add = useMutation({
        mutationFn: () => api.post(`/admin/chat/threads/${threadId}/members`, { userIds: ids }),
        onSuccess: () => { toast.success('Added to the group'); onAdded(); onClose(); },
        onError: (e: Error) => toast.error(e.message),
    });
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add people</DialogTitle>
                    <DialogDescription>They'll see the whole conversation.</DialogDescription>
                </DialogHeader>
                <PeoplePicker people={people} value={ids} onChange={setIds} exclude={exclude} />
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => add.mutate()} disabled={!ids.length || add.isPending}>Add</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TeamChat;
