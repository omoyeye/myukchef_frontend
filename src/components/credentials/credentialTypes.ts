export interface Credential {
    id: number;
    chefId: number;
    chefName?: string;
    type: string;
    title: string;
    issuer: string | null;
    reference: string | null;
    level: string | null;
    issuedOn: string | null;
    expiresOn: string | null;
    document: string | null;
    hasDocument?: boolean;
    status: 'pending' | 'verified' | 'rejected' | 'expired';
    reviewNote: string | null;
    verifiedAt: string | null;
    showOnProfile: boolean;
    updatedAt: string;
}

/** A verified credential as the public sees it. */
export interface PublicCredential { type: string; title: string; issuer: string | null; level: string | null; issuedOn: string | null; expiresOn: string | null }

export const CREDENTIAL_HELP: Record<string, string> = {
    food_hygiene: 'Level 2 Food Hygiene and Safety for Catering is the usual standard for home cooks. Level 3 is great too.',
    allergen_awareness: 'For example the Food Standards Agency\'s free allergen training.',
    council_registration: 'Food businesses, including home kitchens, must register with their local council at least 28 days before trading.',
    hygiene_rating: 'Your Food Hygiene Rating from the council inspection, as shown on the FSA website.',
    insurance: 'Public and product liability insurance for selling food.',
    dbs_check: 'A Disclosure and Barring Service check. We only record that it was done.',
};

const STATUS: Record<Credential['status'], { label: string; className: string }> = {
    pending: { label: 'Being checked', className: 'bg-amber-100 text-amber-900' },
    verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-900' },
    rejected: { label: 'Needs another look', className: 'bg-red-100 text-red-900' },
    expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};

export const credentialStatus = (c: Pick<Credential, 'status' | 'expiresOn'>) => {
    const soon = c.status === 'verified' && c.expiresOn && new Date(c.expiresOn).getTime() - Date.now() < 30 * 86400_000;
    return soon ? { label: 'Verified · expires soon', className: 'bg-amber-100 text-amber-900' } : STATUS[c.status] ?? STATUS.pending;
};
