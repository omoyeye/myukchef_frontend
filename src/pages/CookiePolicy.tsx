import { Layout } from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { openCookieSettings, useConsent } from '@/lib/consent';
import { CONTACT_EMAIL } from '@/lib/site';

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-2 mt-6 text-xl font-semibold">{children}</h2>;

const ROWS: [string, string, string, string][] = [
    ['Sign-in', 'Essential', 'Keeps you signed in on this device (auth-token)', 'Until you sign out, up to 14 days'],
    ['Basket', 'Essential', 'Remembers what\'s in your basket', 'Until you check out or clear it'],
    ['Drafts', 'Essential', 'Saves a meal plan or event request you\'re part-way through', 'Until you send it'],
    ['Location', 'Essential', 'Your chosen postcode or area, to show nearby chefs', 'Until you change it'],
    ['Cookie choice', 'Essential', 'Remembers this choice (myukchef-consent)', '12 months, or until you change it'],
    ['Install prompt', 'Essential', 'Remembers you closed the "install the app" prompt', 'Until you clear it'],
    ['Offline copy', 'Essential', 'A copy of the site\'s files so pages load quickly and work offline', 'Updated with each new version'],
    ['Google Maps', 'Optional (Maps)', 'Shows chef locations and live delivery. Google may set its own cookies and receives your IP address', 'Set by Google, see Google\'s privacy policy'],
    ['Stripe', 'Essential, at payment only', 'When you pay, you go to Stripe\'s page. Stripe uses cookies there to prevent fraud', 'Set by Stripe'],
];

/** What MYUKCHEF stores in your browser and why, as UK law (PECR and UK GDPR) requires. */
const CookiePolicy = () => {
    const consent = useConsent();
    return (
        <Layout>
            <SEO title="Cookie Policy" description="The cookies and browser storage MYUKCHEF uses, and how to change your choice." />
            <div className="container px-4 py-8">
                <Card className="mx-auto max-w-4xl">
                    <CardHeader><CardTitle className="text-3xl font-bold">Cookie Policy</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">Last updated: 13 November 2026</p>
                        <p>
                            Cookies and similar browser storage are small pieces of information a website keeps on your device. We only use what the site needs to work,
                            plus Google Maps if you agree. We don't use advertising, analytics or tracking cookies, and we never sell your information.
                        </p>

                        <H>Your choice</H>
                        <p>
                            {consent
                                ? `You chose ${consent.maps ? 'to allow' : 'not to allow'} Google Maps on ${new Date(consent.decidedAt).toLocaleDateString('en-GB')}.`
                                : "You haven't made a choice yet, so nothing optional is loaded."}
                        </p>
                        <Button className="h-11" onClick={openCookieSettings}>Change cookie settings</Button>

                        <H>What we use</H>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[36rem] text-left text-sm">
                                <thead><tr className="border-b text-xs uppercase text-muted-foreground"><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">What it does</th><th className="py-2">How long</th></tr></thead>
                                <tbody>
                                    {ROWS.map(([name, type, what, how]) => (
                                        <tr key={name} className="border-b align-top"><td className="py-2 pr-3 font-semibold">{name}</td><td className="py-2 pr-3">{type}</td><td className="py-2 pr-3">{what}</td><td className="py-2">{how}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <H>Essential storage</H>
                        <p>The law lets us use storage that's strictly necessary for something you've asked for, like signing in or keeping your basket, without asking first. You can still clear it in your browser settings, but the site won't work properly without it.</p>

                        <H>The phone app</H>
                        <p>The MYUKCHEF app doesn't use cookies. It keeps your sign-in in your phone's secure storage and your basket on the device. Maps in the app use your phone's own map service.</p>

                        <H>Questions</H>
                        <p>Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See our <a className="underline" href="/privacy">Privacy Policy</a> for how we use personal information.</p>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default CookiePolicy;
