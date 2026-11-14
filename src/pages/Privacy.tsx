import { Layout } from "@/components/layout/Layout";
import SEO from "@/components/common/SEO";
import { companyLine, useCompanyInfo } from "@/components/common/CompanyDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CONTACT_EMAIL } from "@/lib/site";
import { Loader2 } from "lucide-react";

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-2 mt-6 text-xl font-semibold">{children}</h2>;

const Privacy = () => {
    const { data: settings, isLoading } = useQuery<any>({
        queryKey: ['site-settings'],
        queryFn: () => api.get('/settings'),
    });
    const company = useCompanyInfo();
    const content = settings?.privacy_policy;
    const who = companyLine(company);

    return (
        <Layout>
            <SEO title="Privacy Policy" description="How MYUKCHEF collects, uses and protects your personal information." />
            <div className="container px-4 py-8">
                <Card className="mx-auto max-w-4xl">
                    <CardHeader><CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle></CardHeader>
                    <CardContent className="max-w-none space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : content ? (
                            <div className="whitespace-pre-wrap">{content}</div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">Last updated: 13 November 2026</p>
                                <H>Who we are</H>
                                <p>MYUKCHEF connects customers with independent local chefs. We decide how your information is used, so we are its controller under UK data protection law. {who && `${who}. `}Contact us at <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>

                                <H>What we collect, and why</H>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Account details</strong> (name, email, password stored in scrambled form), to run your account, because it's needed for our contract with you.</li>
                                    <li><strong>Orders, meal plans and event bookings</strong> (dishes, dates, venue, delivery address, phone number), to deliver what you've asked for and to keep financial records we're legally required to keep.</li>
                                    <li><strong>Messages</strong> between you and chefs, to arrange your food. We automatically check them for phone numbers, emails and links, because contact details can't be shared on MYUKCHEF. This is in our legitimate interest in keeping people safe and bookings on the platform.</li>
                                    <li><strong>Reviews</strong> you choose to post. Your first name and last initial are shown publicly.</li>
                                    <li><strong>Location</strong>, if you choose "Use my location", to show nearby chefs. It stays on your device and is sent only when searching. Live courier location is used only while your order is on its way.</li>
                                    <li><strong>Notification choices and push details</strong>, to send the alerts you've asked for.</li>
                                    <li><strong>Messages about an order</strong> between you and its chefs, kept with the order. Contact details are removed automatically.</li>
                                    <li><strong>Error reports.</strong> If a page or the app crashes, it sends us what went wrong and on which page, so we can fix it. They don't include your name or what you typed.</li>
                                    <li><strong>Payments.</strong> When you pay by card, Stripe handles your card details; we receive only the result, the amount and a reference, never your full card number. We use them to take payment, give refunds and keep financial records.</li>
                                    <li><strong>Chef details</strong> (legal name, date of birth, address, tax reference, food safety records, bank details), to check chefs, pay them and meet our legal reporting duties to HMRC.</li>
                                    <li><strong>Chef certificates and checks.</strong> Chefs upload copies of food hygiene certificates, council registration and insurance so our team can verify them. Copies are stored privately and only the chef and our team can open them; customers only see that a certificate is verified. For DBS checks we never keep a copy, because it holds criminal record information: we only record that a check was done and when, and we rely on our legitimate interest in keeping customers safe and the chef's agreement.</li>
                                    <li><strong>Chef invoices and payouts</strong> (amounts, commission, the name a chef signs with, payout references), to pay chefs, give both sides a receipt and keep the records tax law requires. If a chef connects Stripe for payouts, Stripe collects identity and bank details directly and checks them as the law requires.</li>
                                </ul>

                                <H>Dietary and allergy details</H>
                                <p>Allergies and dietary needs can reveal information about your health or beliefs, which the law treats as especially sensitive. We only use them with your explicit agreement, which we ask for when you give them, and only to find suitable food and tell your chef. Our AI suggestions only receive them if you tick the box asking for AI suggestions. You can withdraw agreement by cancelling your plan or deleting your account, and without it you can still use MYUKCHEF but we can't tailor food to those needs.</p>

                                <H>Who we share it with</H>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li><strong>Your chefs</strong> see only what they need: your first name, what you asked for and your dietary needs. They see your delivery address once they've accepted a plan or while they're cooking and delivering an order for you, and an event venue once it's paid. When they hand over an order they take a photo of it, which our team checks before paying them. Customers are asked to confirm delivery; if they don't reply in time, we treat the order as received. They never see your phone number or email.</li>
                                    <li><strong>Service providers</strong> who work for us: our website host, our payment provider Stripe (card payments, refunds and chef payouts), email and SMS providers (including Brevo), mapping and postcode services (Google Maps, postcodes.io), push notification services (Expo for the phone app, and Google, Apple and Mozilla for browsers), and, if you ask for AI suggestions, our AI providers (Vercel and Anthropic).</li>
                                    <li><strong>HMRC and other authorities</strong>, where the law requires it.</li>
                                </ul>
                                <p>Some providers may process data outside the UK. Where they do, we rely on the safeguards UK law requires. We don't sell your information or use it for third-party advertising.</p>

                                <H>How long we keep it</H>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li>Notifications: 12 months.</li>
                                    <li>Messages, closed support requests and addresses on finished orders: 24 months.</li>
                                    <li>Financial records, including payments, refunds, chef invoices and receipts: as long as tax law requires, usually 6 years, without your name once your account is deleted.</li>
                                    <li>Chef certificate copies: while the chef sells with us, and deleted when they remove the certificate or it's replaced.</li>
                                    <li>Your account: until you delete it.</li>
                                </ul>

                                <H>Cookies and browser storage</H>
                                <p>We don't use advertising or tracking cookies. We store a few things in your browser because the site needs them: your sign-in, your basket, a meal plan or event draft, your chosen location, and your cookie choice. Google Maps only loads if you agree to it, because Google may set its own cookies. You can change your choice at any time. The full list is in our <a className="underline" href="/cookies">Cookie Policy</a>.</p>

                                <H>Your rights</H>
                                <p>You can ask to see, correct, delete or move your information, and to object to or limit how we use it. You can download your data and delete your account yourself under My account, Overview. For anything else, email us. If you're unhappy, please tell us first. You can also complain to the Information Commissioner's Office at ico.org.uk.</p>

                                <H>Children</H>
                                <p>MYUKCHEF is for people aged 18 and over. Accounts can't be created for children.</p>

                                <H>Security</H>
                                <p>We use encrypted connections and scrambled passwords, and restrict who can see private details. No system is perfectly secure, so please use a unique password. We'll tell you and the regulator if a breach puts you at risk, as the law requires.</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default Privacy;
