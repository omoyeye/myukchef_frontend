import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { API_URL, authHeaders } from '@/lib/api';

/**
 * Downloads one of MYUKCHEF's branded PDF invoices or receipts. They need the person's sign-in (or a
 * guest's tracking code), so the file is fetched and then saved, rather than linked to.
 *
 *   path: "orders/12", "events/3", "plan-weeks/40" or "payouts/7"
 */
export async function downloadDocument(path: string, token?: string | null) {
    const query = token ? `?t=${encodeURIComponent(token)}` : '';
    const response = await fetch(`${API_URL}/documents/${path}${query}`, { headers: authHeaders() });
    if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "We couldn't make that document. Please try again.");
    }
    const name = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ?? 'MYUKCHEF-document.pdf';
    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

interface Props extends Omit<ButtonProps, 'onClick'> {
    path: string;
    token?: string | null;
    label?: string;
    iconOnly?: boolean;
}

export function DocumentButton({ path, token, label = 'Download PDF', iconOnly, variant = 'outline', className, ...rest }: Props) {
    const [busy, setBusy] = useState(false);
    const run = async () => {
        setBusy(true);
        try { await downloadDocument(path, token); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
    };
    const Icon = busy ? Loader2 : Download;
    return (
        <Button type="button" variant={variant} className={className} onClick={run} disabled={busy} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined} {...rest}>
            <Icon className={`${iconOnly ? '' : 'mr-2 '}h-4 w-4${busy ? ' animate-spin' : ''}`} />
            {!iconOnly && label}
        </Button>
    );
}
