import { Award, BadgeCheck, ShieldCheck } from 'lucide-react';
import type { PublicCredential } from './credentialTypes';

const ICONS: Record<string, typeof Award> = { food_hygiene: ShieldCheck, dbs_check: BadgeCheck };

/** A chef's certificates and checks that MYUKCHEF has verified, as shown on their public page. */
export function VerifiedCredentials({ credentials, firstName }: { credentials: PublicCredential[]; firstName: string }) {
    if (!credentials.length) return null;
    return (
        <section aria-labelledby="checks-heading" className="mt-8 rounded-[2rem] border bg-card p-5 md:p-7">
            <h2 id="checks-heading" className="flex items-center gap-2 font-display text-xl font-extrabold"><BadgeCheck className="h-5 w-5 text-primary" />Trained and checked</h2>
            <p className="mt-1 text-sm text-muted-foreground">{firstName}'s certificates and checks, verified by the MYUKCHEF team.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {credentials.map((c, i) => {
                    const Icon = ICONS[c.type] ?? Award;
                    return (
                        <li key={i} className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3">
                            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                            <div className="text-sm">
                                <p className="font-semibold">{c.title}{c.level && c.type !== 'hygiene_rating' ? ` (Level ${c.level})` : ''}{c.type === 'hygiene_rating' && c.level ? `: ${c.level} out of 5` : ''}</p>
                                <p className="text-muted-foreground">
                                    {[c.issuer, c.issuedOn && `since ${new Date(c.issuedOn).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`, c.expiresOn && `valid to ${new Date(c.expiresOn).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

/** A small badge for chef cards and headers. */
export const HygieneBadge = ({ className = '' }: { className?: string }) => (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900 ${className}`}>
        <ShieldCheck className="h-3 w-3" aria-hidden />Food hygiene verified
    </span>
);
