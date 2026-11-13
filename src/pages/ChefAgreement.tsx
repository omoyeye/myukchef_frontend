import { Link } from "react-router-dom";
import SEO from "@/components/common/SEO";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const POINTS = [
    ["Your food business", "You're an independent business, not a MYUKCHEF employee. You must be registered with your local council as a food business, follow food hygiene law, and keep your food hygiene training up to date."],
    ["Certificates and checks", "You must hold a food hygiene certificate (Level 2 Food Hygiene and Safety or above) and upload a copy for us to verify before your details are verified. Anything you upload or list, such as council registration, insurance, a hygiene rating or a DBS check, must be genuine, in date and in your own name. Tell us if one lapses or is withdrawn. Verified certificates can show as badges on your public page."],
    ["Allergens", "You must check every dish against all 14 allergens, keep the list accurate, and tell us straight away if a recipe changes. You must give allergen information with the food you deliver or serve."],
    ["Your details", "You must give us accurate details so we can check you, pay you and report to HMRC as the law requires. You're responsible for your own tax."],
    ["Quotes and payment", "Your quote is what the customer pays. MYUKCHEF collects the payment and pays you your quote less the commission shown when you quote."],
    ["Orders, invoices and getting paid", "You move each order from new to cooking to delivered yourself, so the customer always knows where their food is. When you hand it over you add a photo as evidence. Once the customer confirms (or doesn't report a problem within the time shown in your portal, normally 48 hours), MYUKCHEF raises an invoice for your dish sales less our commission (currently 10%, always shown on the invoice). The service and delivery fees stay with MYUKCHEF. You check the invoice and submit it with your name, which confirms you prepared and handed over the food. We then pay you: automatically to your Stripe account if you've connected one, otherwise by bank transfer. You get a digital receipt for every payout. We may hold an invoice while we look into a problem a customer has reported, and won't pay for orders that are refunded."],
    ["Stripe payouts", "If you connect a Stripe account for automatic payouts, you agree to the Stripe Connected Account Agreement, which includes the Stripe Terms of Service. Stripe checks your identity and bank details as the law requires."],
    ["Contact stays on MYUKCHEF", "You must not share phone numbers, emails, links or social media with customers, or take a booking or payment outside MYUKCHEF for a customer you met here."],
    ["Doing what you agreed", "If you accept a plan or your quote is chosen, you must provide it. Tell the customer and MYUKCHEF as early as you can if something changes."],
    ["Suspension", "We may suspend or remove a chef or dish for safety concerns, false information or breaking this agreement."],
    ["Reviews", "Customers you've cooked for can rate you. You can reply publicly, but you must not offer anything in return for a review or post one yourself."],
];

const ChefAgreement = () => (
    <AuthShell portal="chef">
        <SEO noindex title="Chef Agreement" description="The agreement between chefs and MYUKCHEF." />
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="text-2xl">Chef Agreement</CardTitle>
                <p className="text-sm text-muted-foreground">Last updated: 13 November 2026. This works alongside our <Link className="underline" to="/terms">Terms</Link> and <Link className="underline" to="/privacy">Privacy Policy</Link>.</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {POINTS.map(([title, text]) => (
                    <div key={title}>
                        <h2 className="font-semibold">{title}</h2>
                        <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                ))}
                <Link to="/chef/register" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Back to chef sign-up</Link>
            </CardContent>
        </Card>
    </AuthShell>
);

export default ChefAgreement;
