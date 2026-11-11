import { Link } from "react-router-dom";
import SEO from "@/components/common/SEO";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const POINTS = [
    ["Your food business", "You're an independent business, not a MYUKCHEF employee. You must be registered with your local council as a food business, follow food hygiene law, and keep your food hygiene training up to date."],
    ["Allergens", "You must check every dish against all 14 allergens, keep the list accurate, and tell us straight away if a recipe changes. You must give allergen information with the food you deliver or serve."],
    ["Your details", "You must give us accurate details so we can check you, pay you and report to HMRC as the law requires. You're responsible for your own tax."],
    ["Quotes and payment", "Your quote is what the customer pays. MYUKCHEF collects the payment and pays you your quote less the commission shown when you quote."],
    ["Orders and getting paid", "You move each order from new to cooking to delivered yourself, so the customer always knows where their food is. When you hand it over you add a photo as evidence. MYUKCHEF pays you your dish prices once our team has checked it, and the service and delivery fees stay with MYUKCHEF."],
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
                <p className="text-sm text-muted-foreground">Last updated: 6 November 2026. This works alongside our <Link className="underline" to="/terms">Terms</Link> and <Link className="underline" to="/privacy">Privacy Policy</Link>.</p>
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
