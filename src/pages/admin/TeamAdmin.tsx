import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, KeyRound, Loader2, Mail, Pencil, Plus, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Menu { key: string; label: string; group: string }
interface Role { id: number; name: string; description: string | null; permissions: string[]; staffCount: number }
interface Staff { id: number; name: string; email: string; phone: string | null; jobTitle: string | null; adminRoleId: number | null; roleName: string; isSuper: boolean; status: 'active' | 'invited' | 'expired' | 'suspended'; profileDueAt: string | null; createdAt: string }
interface Team { menus: Menu[]; roles: Role[]; staff: Staff[] }
interface Invite { emailed: boolean; dueAt: string; temporaryPassword?: string; email?: string }

const STATUS: Record<Staff['status'], { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-100 text-emerald-900' },
    invited: { label: 'Invite sent', className: 'bg-sky-100 text-sky-900' },
    expired: { label: 'Invite expired', className: 'bg-amber-100 text-amber-900' },
    suspended: { label: 'Suspended', className: 'bg-muted text-muted-foreground' },
};
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Picks menus for a role, grouped like the admin sidebar. */
function MenuPicker({ menus, value, onChange }: { menus: Menu[]; value: string[]; onChange: (v: string[]) => void }) {
    const groups = [...new Set(menus.map((m) => m.group))];
    const toggle = (key: string, on: boolean) => onChange(on ? [...value, key] : value.filter((k) => k !== key));
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => {
                const items = menus.filter((m) => m.group === g);
                const all = items.every((m) => value.includes(m.key));
                return (
                    <div key={g} className="rounded-xl border p-3">
                        <label className="mb-2 flex items-center justify-between text-sm font-semibold">
                            {g}
                            <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => onChange(all ? value.filter((k) => !items.some((m) => m.key === k)) : [...new Set([...value, ...items.map((m) => m.key)])])}>{all ? 'Clear' : 'All'}</button>
                        </label>
                        <div className="space-y-2">
                            {items.map((m) => (
                                <label key={m.key} className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox checked={value.includes(m.key)} onCheckedChange={(v) => toggle(m.key, v === true)} />{m.label}
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** Super Admin: create named roles from menus, invite staff by email, and manage their access. */
const TeamAdmin = () => {
    const qc = useQueryClient();
    const { user } = useAuth();
    const { data, isLoading } = useQuery<Team>({ queryKey: ['admin-team'], queryFn: () => api.get('/admin/team') });
    const refresh = () => qc.invalidateQueries({ queryKey: ['admin-team'] });
    const fail = (e: Error) => toast.error(e.message);

    // Adding staff
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', roleId: '' });
    const [invite, setInvite] = useState<Invite | null>(null);
    const create = useMutation({
        mutationFn: () => api.post('/admin/team/staff', form),
        onSuccess: (r: Invite & { email: string }) => {
            refresh(); setAdding(false); setForm({ name: '', email: '', roleId: '' });
            setInvite({ ...r });
            if (r.emailed) toast.success(`Sign-in details sent to ${r.email}`);
        },
        onError: fail,
    });
    const resend = useMutation({
        mutationFn: (s: Staff) => api.post(`/admin/team/staff/${s.id}/resend`, {}).then((r: Invite) => ({ ...r, email: s.email })),
        onSuccess: (r: Invite) => { refresh(); setInvite(r); if (r.emailed) toast.success(`A new invite was sent to ${r.email}`); },
        onError: fail,
    });
    const update = useMutation({
        mutationFn: ({ id, ...body }: { id: number; roleId?: string | number; suspended?: boolean; name?: string }) => api.put(`/admin/team/staff/${id}`, body),
        onSuccess: () => { refresh(); toast.success('Saved'); },
        onError: fail,
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/team/staff/${id}`),
        onSuccess: () => { refresh(); toast.success('Removed from the team'); },
        onError: fail,
    });

    // Roles
    const [role, setRole] = useState<{ id?: number; name: string; description: string; permissions: string[] } | null>(null);
    const saveRole = useMutation({
        mutationFn: () => (role!.id ? api.put(`/admin/team/roles/${role!.id}`, role) : api.post('/admin/team/roles', role)),
        onSuccess: () => { refresh(); setRole(null); toast.success('Role saved. Staff in this role see the change straight away.'); },
        onError: fail,
    });
    const deleteRole = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/team/roles/${id}`),
        onSuccess: () => { refresh(); toast.success('Role deleted'); },
        onError: fail,
    });

    if (isLoading || !data) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    const menuLabel = (k: string) => data.menus.find((m) => m.key === k)?.label ?? k;

    return (
        <div className="max-w-6xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team and roles</h1>
                    <p className="mt-1 max-w-2xl text-muted-foreground">Give each member of staff a role made of the menus they need. They only see and use those menus. New staff get their sign-in details by email and must complete their profile within 24 hours.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setRole({ name: '', description: '', permissions: [] })}><Plus className="mr-2 h-4 w-4" />New role</Button>
                    <Button onClick={() => setAdding(true)} disabled={!data.roles.length}><UserPlus className="mr-2 h-4 w-4" />Add staff</Button>
                </div>
            </div>
            {!data.roles.length && <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Start by creating a role, for example "Support team" with the Support inbox and Customers menus. Then add staff to it.</p>}

            <Tabs defaultValue="staff">
                <TabsList>
                    <TabsTrigger value="staff"><Users className="mr-1.5 h-4 w-4" />Staff ({data.staff.length})</TabsTrigger>
                    <TabsTrigger value="roles"><ShieldCheck className="mr-1.5 h-4 w-4" />Roles ({data.roles.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="staff" className="pt-4">
                    <Card><ul className="divide-y">
                        {data.staff.map((s) => {
                            const me = s.id === user?.id;
                            return (
                                <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap items-center gap-2 font-semibold">{s.name}{me && <Badge variant="outline">You</Badge>}<span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', STATUS[s.status].className)}>{STATUS[s.status].label}</span></p>
                                        <p className="truncate text-sm text-muted-foreground">{s.email}{s.jobTitle ? ` · ${s.jobTitle}` : ''}{s.phone ? ` · ${s.phone}` : ''}</p>
                                        {s.status === 'invited' && s.profileDueAt && <p className="text-xs text-muted-foreground">Must complete their profile by {when(s.profileDueAt)}</p>}
                                    </div>
                                    <select aria-label={`Role for ${s.name}`} className="h-10 rounded-md border bg-background px-3 text-sm" disabled={me || update.isPending} value={s.isSuper ? 'super' : String(s.adminRoleId)} onChange={(e) => update.mutate({ id: s.id, roleId: e.target.value })}>
                                        <option value="super">Super Admin (everything)</option>
                                        {data.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    {!me && (
                                        <div className="flex flex-wrap gap-1">
                                            {(s.status === 'invited' || s.status === 'expired') && <Button size="sm" variant="outline" onClick={() => resend.mutate(s)} disabled={resend.isPending}><Mail className="mr-1.5 h-4 w-4" />Resend invite</Button>}
                                            <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: s.id, suspended: s.status !== 'suspended' })}>{s.status === 'suspended' ? 'Reactivate' : 'Suspend'}</Button>
                                            <Button size="icon" variant="ghost" aria-label={`Remove ${s.name}`} onClick={() => { if (window.confirm(`Remove ${s.name} from the team? They won't be able to sign in.`)) remove.mutate(s.id); }}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul></Card>
                </TabsContent>

                <TabsContent value="roles" className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {data.roles.map((r) => (
                            <Card key={r.id}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center justify-between gap-2 text-lg">{r.name}<span className="text-sm font-normal text-muted-foreground">{r.staffCount} staff</span></CardTitle>
                                    {r.description && <CardDescription>{r.description}</CardDescription>}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex flex-wrap gap-1.5">{r.permissions.map((k) => <Badge key={k} variant="secondary">{menuLabel(k)}</Badge>)}</div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => setRole({ id: r.id, name: r.name, description: r.description ?? '', permissions: r.permissions })}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>
                                        <Button size="sm" variant="ghost" disabled={r.staffCount > 0} title={r.staffCount ? 'Move its staff to another role first' : undefined} onClick={() => { if (window.confirm(`Delete the ${r.name} role?`)) deleteRole.mutate(r.id); }}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Add staff */}
            <Dialog open={adding} onOpenChange={setAdding}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a member of staff</DialogTitle>
                        <DialogDescription>When you press Create, we email them the sign-in link, their username and a temporary password, and ask them to complete their profile within 24 hours.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1"><Label htmlFor="staff-name">Full name</Label><Input id="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tolu Adebayo" /></div>
                        <div className="space-y-1"><Label htmlFor="staff-email">Work email (their username)</Label><Input id="staff-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@myukchef.com" /></div>
                        <div className="space-y-1">
                            <Label htmlFor="staff-role">Role</Label>
                            <select id="staff-role" className="h-10 w-full rounded-md border bg-background px-3" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                                <option value="">Choose a role…</option>
                                {data.roles.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.permissions.length} menus)</option>)}
                                <option value="super">Super Admin (everything, including the team)</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
                        <Button onClick={() => create.mutate()} disabled={!form.name.trim() || !form.email.trim() || !form.roleId || create.isPending}>{create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create and send details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Result of an invite: shown when the email couldn't be sent */}
            <Dialog open={!!invite && !invite.emailed} onOpenChange={(o) => !o && setInvite(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />We couldn't send the email</DialogTitle>
                        <DialogDescription>Email isn't set up yet (Payments and keys). Pass these details to them privately. This is the only time the password is shown.</DialogDescription>
                    </DialogHeader>
                    {invite && (
                        <div className="space-y-2 rounded-xl bg-secondary p-4 text-sm">
                            <p><span className="text-muted-foreground">Sign-in page:</span> <b>{window.location.origin}/admin/login</b></p>
                            <p><span className="text-muted-foreground">Username:</span> <b>{invite.email}</b></p>
                            <p><span className="text-muted-foreground">Temporary password:</span> <b className="font-mono tracking-wider">{invite.temporaryPassword}</b></p>
                            <p><span className="text-muted-foreground">Complete profile by:</span> <b>{when(invite.dueAt)}</b></p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(`Sign in at ${window.location.origin}/admin/login\nUsername: ${invite?.email}\nTemporary password: ${invite?.temporaryPassword}\nPlease complete your profile within 24 hours.`); toast.success('Copied'); }}><Copy className="mr-2 h-4 w-4" />Copy details</Button>
                        <Button onClick={() => setInvite(null)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create or edit a role */}
            <Dialog open={!!role} onOpenChange={(o) => !o && setRole(null)}>
                <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{role?.id ? `Edit ${role.name}` : 'New role'}</DialogTitle>
                        <DialogDescription>Tick the menus this role can use. Staff in the role only see these menus, and the server blocks everything else.</DialogDescription>
                    </DialogHeader>
                    {role && (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1"><Label htmlFor="role-name">Role name</Label><Input id="role-name" value={role.name} onChange={(e) => setRole({ ...role, name: e.target.value })} placeholder="e.g. Support team" /></div>
                                <div className="space-y-1"><Label htmlFor="role-desc">Description (optional)</Label><Input id="role-desc" value={role.description} onChange={(e) => setRole({ ...role, description: e.target.value })} placeholder="What this role is for" /></div>
                            </div>
                            <MenuPicker menus={data.menus} value={role.permissions} onChange={(permissions) => setRole({ ...role, permissions })} />
                            <p className="text-xs text-muted-foreground">Team and roles is always for Super Admins only.</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRole(null)}>Cancel</Button>
                        <Button onClick={() => saveRole.mutate()} disabled={!role?.name.trim() || !role?.permissions.length || saveRole.isPending}>Save role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeamAdmin;
