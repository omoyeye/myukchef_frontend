import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Award, CheckCircle2, FileText, Loader2, XCircle } from 'lucide-react';
import { api, openCertificate } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { credentialStatus, type Credential } from './credentialTypes';

const FILTERS = [
    { id: 'pending', label: 'To check' },
    { id: 'verified', label: 'Verified' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'expired', label: 'Expired' },
    { id: '', label: 'All' },
];

/** The Super Admin checks each chef's certificates against the uploaded copy, then verifies or rejects them. */
export function AdminCredentials() {
    const qc = useQueryClient();
    const [status, setStatus] = useState('pending');
    const { data = [], isLoading } = useQuery<Credential[]>({ queryKey: ['admin-credentials', status], queryFn: () => api.get(`/chefs/admin/credentials${status ? `?status=${status}` : ''}`) });
    const [rejecting, setRejecting] = useState<Credential | null>(null);
    const [note, setNote] = useState('');
    const review = useMutation({
        mutationFn: ({ id, status, note }: { id: number; status: 'verified' | 'rejected'; note?: string }) => api.patch(`/chefs/admin/credentials/${id}`, { status, note }),
        onSuccess: (_r, v) => { qc.invalidateQueries({ queryKey: ['admin-credentials'] }); toast.success(v.status === 'verified' ? 'Verified. The chef has been told.' : 'Sent back to the chef.'); },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
                Check each certificate against its copy: the chef's name, the course and level, and the dates. A verified, in-date food hygiene certificate is required
                before a chef's details can be verified. DBS checks have no copy: confirm them on a call or through the DBS Update Service.
            </p>
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter certificates">
                {FILTERS.map((f) => (
                    <button key={f.id} role="tab" aria-selected={status === f.id} onClick={() => setStatus(f.id)}
                        className={cn('h-9 rounded-full border px-3 text-sm', status === f.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary')}>
                        {f.label}
                    </button>
                ))}
            </div>
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            {!isLoading && data.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing here.</p>}
            {data.map((c) => {
                const s = credentialStatus(c);
                return (
                    <Card key={c.id}>
                        <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
                            <div className="min-w-0 space-y-1">
                                <p className="flex flex-wrap items-center gap-2 font-semibold"><Award className="h-4 w-4 text-primary" />{c.chefName}: {c.title}
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.className}`}>{s.label}</span>
                                </p>
                                <p className="text-muted-foreground">
                                    {[c.level && `Level ${c.level}`, c.issuer, c.reference && `No. ${c.reference}`, c.issuedOn && `Issued ${c.issuedOn}`, c.expiresOn && `Expires ${c.expiresOn}`].filter(Boolean).join(' · ')}
                                </p>
                                <p className="text-xs text-muted-foreground">Updated {format(new Date(c.updatedAt), 'd MMM yyyy')}{c.showOnProfile ? ' · Chef wants it on their page' : ' · Hidden from their page'}</p>
                                {c.reviewNote && <p className="text-xs">Note: {c.reviewNote}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {c.hasDocument
                                    ? <Button variant="outline" size="sm" className="h-10" onClick={() => openCertificate(c.id).catch((e: Error) => toast.error(e.message))}><FileText className="mr-1 h-4 w-4" />View copy</Button>
                                    : c.type !== 'dbs_check' && <span className="self-center text-xs text-muted-foreground">No copy uploaded</span>}
                                {c.status !== 'verified' && <Button size="sm" className="h-10" disabled={review.isPending} onClick={() => review.mutate({ id: c.id, status: 'verified' })}><CheckCircle2 className="mr-1 h-4 w-4" />Verify</Button>}
                                {c.status !== 'rejected' && <Button variant="ghost" size="sm" className="h-10 text-destructive" onClick={() => { setRejecting(c); setNote(''); }}><XCircle className="mr-1 h-4 w-4" />{c.status === 'verified' ? 'Withdraw' : 'Reject'}</Button>}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send {rejecting?.title} back</DialogTitle>
                        <DialogDescription>Tell {rejecting?.chefName} what to fix. It comes off their page until it's verified again.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="reject-note">What needs fixing</Label>
                        <Textarea id="reject-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The name on the certificate doesn't match your legal name." />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
                        <Button disabled={!note.trim()} onClick={() => { review.mutate({ id: rejecting!.id, status: 'rejected', note: note.trim() }); setRejecting(null); }}>Send back</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
