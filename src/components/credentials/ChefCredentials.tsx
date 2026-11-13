import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Award, BadgeCheck, Clock, Eye, EyeOff, FileUp, Loader2, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import { api, openCertificate, uploadDocument } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CREDENTIAL_HELP, credentialStatus, type Credential } from './credentialTypes';

type Types = Record<string, { label: string; needsDocument: boolean }>;
const EMPTY = { type: 'food_hygiene', title: '', issuer: '', level: '', reference: '', issuedOn: '', expiresOn: '', document: '', showOnProfile: true };

/**
 * Where chefs prove they're trained and checked: food hygiene certificates, council registration,
 * insurance and DBS checks. Our team verifies each one, and verified ones show on the chef's page.
 */
export function ChefCredentials() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery<{ credentials: Credential[]; types: Types }>({ queryKey: ['chef-credentials'], queryFn: () => api.get('/chefs/me/credentials') });
    const [editing, setEditing] = useState<(typeof EMPTY & { id?: number }) | null>(null);

    const refresh = () => qc.invalidateQueries({ queryKey: ['chef-credentials'] });
    const toggle = useMutation({
        mutationFn: (c: Credential) => api.put(`/chefs/me/credentials/${c.id}`, { showOnProfile: !c.showOnProfile }),
        onSuccess: refresh,
        onError: (e: Error) => toast.error(e.message),
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/chefs/me/credentials/${id}`),
        onSuccess: () => { refresh(); toast.success('Removed'); },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading || !data) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    const hasHygiene = data.credentials.some((c) => c.type === 'food_hygiene' && c.status === 'verified');

    return (
        <section aria-labelledby="certs-heading" className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="certs-heading" className="font-display text-xl font-bold">Certificates and checks</h2>
                    <p className="text-sm text-muted-foreground">
                        A food hygiene certificate (Level 2 Food Hygiene and Safety or above) is required. Add council registration, insurance, a DBS check or
                        other training too: once we verify them, they show as badges on your public page. You can also mention them in your story.
                    </p>
                </div>
                <Button className="h-11" onClick={() => setEditing({ ...EMPTY })}><Plus className="mr-2 h-4 w-4" />Add certificate</Button>
            </div>
            {!hasHygiene && (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
                    <strong>Food hygiene certificate needed.</strong> Upload yours so our team can verify it. It's required before your details can be verified.
                </p>
            )}
            {data.credentials.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing added yet.</p>}
            {data.credentials.map((c) => {
                const s = credentialStatus(c);
                return (
                    <Card key={c.id}>
                        <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                            <div className="min-w-0 space-y-1">
                                <p className="flex flex-wrap items-center gap-2 font-semibold">
                                    <Award className="h-4 w-4 text-primary" />{c.title}
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.className}`}>{s.label}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {[data.types[c.type]?.label, c.level && `Level ${c.level}`, c.issuer, c.issuedOn && `Issued ${c.issuedOn}`, c.expiresOn && `Expires ${c.expiresOn}`].filter(Boolean).join(' · ')}
                                </p>
                                {c.status === 'rejected' && c.reviewNote && <p className="flex items-center gap-1 text-sm text-destructive"><XCircle className="h-4 w-4" />{c.reviewNote}</p>}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {c.document && <Button variant="ghost" size="sm" className="h-10" onClick={() => openCertificate(c.id).catch((e: Error) => toast.error(e.message))}>View copy</Button>}
                                <Button variant="ghost" size="sm" className="h-10" title={c.showOnProfile ? 'Shown on your page once verified' : 'Hidden from your page'} onClick={() => toggle.mutate(c)}>
                                    {c.showOnProfile ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}{c.showOnProfile ? 'On my page' : 'Hidden'}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label={`Edit ${c.title}`} onClick={() => setEditing({ ...EMPTY, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ''])), id: c.id, showOnProfile: c.showOnProfile })}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" aria-label={`Remove ${c.title}`} onClick={() => { if (confirm(`Remove ${c.title}?`)) remove.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            <CredentialDialog value={editing} types={data.types} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
        </section>
    );
}

function CredentialDialog({ value, types, onClose, onSaved }: { value: (typeof EMPTY & { id?: number }) | null; types: Types; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState(value ?? EMPTY);
    const [fileName, setFileName] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [lastValue, setLastValue] = useState(value);
    if (value !== lastValue) { setLastValue(value); setForm(value ?? EMPTY); setFileName(''); }

    const isDbs = form.type === 'dbs_check';
    const needsDoc = types[form.type]?.needsDocument;
    const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));
    const save = useMutation({
        mutationFn: () => {
            const body = { ...form, title: form.title || types[form.type]?.label };
            return value?.id ? api.put(`/chefs/me/credentials/${value.id}`, body) : api.post('/chefs/me/credentials', body);
        },
        onSuccess: () => { toast.success('Saved. Our team will check it.'); onSaved(); },
        onError: (e: Error) => toast.error(e.message),
    });
    const pick = async (file: File | undefined) => {
        if (!file) return;
        setUploading(true);
        try {
            const { file: ref, name } = await uploadDocument(file);
            set({ document: ref });
            setFileName(name);
        } catch (e) { toast.error((e as Error).message); } finally { setUploading(false); }
    };

    return (
        <Dialog open={!!value} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{value?.id ? 'Update certificate' : 'Add a certificate or check'}</DialogTitle>
                    <DialogDescription>Private. Only you and the MYUKCHEF team see the copy. Your page only shows that it's verified.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="grid gap-1">
                        <Label htmlFor="cred-type">What is it?</Label>
                        <Select value={form.type} onValueChange={(type) => set({ type, title: '' })}>
                            <SelectTrigger id="cred-type" className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(types).map(([id, t]) => <SelectItem key={id} value={id}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                        {CREDENTIAL_HELP[form.type] && <p className="text-xs text-muted-foreground">{CREDENTIAL_HELP[form.type]}</p>}
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="cred-title">Name of the course or check</Label>
                        <Input id="cred-title" className="h-11" maxLength={150} placeholder={types[form.type]?.label} value={form.title} onChange={(e) => set({ title: e.target.value })} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1">
                            <Label htmlFor="cred-issuer">{isDbs ? 'Type of check' : 'Issued by'}</Label>
                            <Input id="cred-issuer" className="h-11" maxLength={150} placeholder={isDbs ? 'Basic, Standard or Enhanced' : form.type === 'council_registration' ? 'Your council' : 'e.g. Highfield, CIEH'} value={form.issuer} onChange={(e) => set({ issuer: e.target.value })} />
                        </div>
                        {['food_hygiene', 'allergen_awareness', 'hygiene_rating'].includes(form.type) && (
                            <div className="grid gap-1">
                                <Label htmlFor="cred-level">{form.type === 'hygiene_rating' ? 'Rating (0 to 5)' : 'Level'}</Label>
                                <Input id="cred-level" className="h-11" maxLength={20} placeholder={form.type === 'hygiene_rating' ? '5' : '2'} value={form.level} onChange={(e) => set({ level: e.target.value })} />
                            </div>
                        )}
                        <div className="grid gap-1">
                            <Label htmlFor="cred-issued">{isDbs ? 'Date of the check' : 'Date issued or completed'}</Label>
                            <Input id="cred-issued" type="date" className="h-11" value={form.issuedOn} onChange={(e) => set({ issuedOn: e.target.value })} />
                        </div>
                        {!isDbs && (
                            <div className="grid gap-1">
                                <Label htmlFor="cred-expires">Expiry or renewal date (optional)</Label>
                                <Input id="cred-expires" type="date" className="h-11" value={form.expiresOn} onChange={(e) => set({ expiresOn: e.target.value })} />
                            </div>
                        )}
                        {!isDbs && (
                            <div className="grid gap-1 sm:col-span-2">
                                <Label htmlFor="cred-ref">Certificate or registration number (optional)</Label>
                                <Input id="cred-ref" className="h-11" maxLength={80} value={form.reference} onChange={(e) => set({ reference: e.target.value })} />
                            </div>
                        )}
                    </div>
                    {isDbs ? (
                        <p className="rounded-xl bg-muted p-3 text-sm">
                            Don't upload your DBS certificate. It contains criminal record information, so we only record that you've had a check and when.
                            Our team may ask to see it on a video call, or check it with the DBS Update Service with your permission.
                        </p>
                    ) : (
                        <div className="grid gap-1">
                            <Label>Copy of the certificate {needsDoc ? '' : '(optional)'}</Label>
                            <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} aria-label="Choose a certificate file" />
                            <Button type="button" variant="outline" className="h-11 justify-start" onClick={() => fileRef.current?.click()} disabled={uploading}>
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : form.document ? <BadgeCheck className="mr-2 h-4 w-4 text-emerald-600" /> : <FileUp className="mr-2 h-4 w-4" />}
                                {form.document ? (fileName || 'Copy uploaded. Choose another to replace it') : 'Upload a PDF or photo (up to 10MB)'}
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center justify-between rounded-xl border p-3">
                        <Label htmlFor="cred-show" className="font-normal">Show as a badge on my public page once verified</Label>
                        <Switch id="cred-show" checked={form.showOnProfile} onCheckedChange={(v) => set({ showOnProfile: v })} />
                    </div>
                    {value?.id && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />Changes go back to our team to check.</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => save.mutate()} disabled={save.isPending || uploading}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
