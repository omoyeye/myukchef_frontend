import { Layout } from "@/components/layout/Layout";
import { companyLine, useCompanyInfo } from "@/components/common/CompanyDetails";
import SEO from "@/components/common/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

const Terms = () => {
    const who = companyLine(useCompanyInfo());
    const { data: settings, isLoading } = useQuery<any>({
        queryKey: ['site-settings'],
        queryFn: () => api.get('/settings'),
    });

    const content = settings?.terms_of_service;

    return (
        <Layout>
            <SEO title="Terms of Service" description="Terms of Service for MYUKCHEF" />
            <div className="container py-20">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : content ? (
                            <div className="whitespace-pre-wrap">{content}</div>
                        ) : (
                            <>
                                <p>Last updated: 13 November 2026</p>
                                <p>These terms apply when you use MYUKCHEF, on our website or app. Please read them carefully. You must be 18 or over to have an account. Nothing here affects your legal rights as a consumer.</p>
                                {who && <p>MYUKCHEF is operated by {who}.</p>}
                                <p>MYUKCHEF is a marketplace. The food is cooked by independent chefs who sell through MYUKCHEF. We check every chef before they can sell, take your payment, pass your order to the chef and handle any problems.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">1. Ordering and delivery</h2>
                                <p>All orders are subject to availability. Each chef cooks their own dishes and delivers them, or has them ready to collect. You can follow every chef's progress on your order page, and we tell you by email, notification and text at each step. Delivery times are estimates, not guarantees.</p>
                                <p>The delivery fee depends on the size of your order and is always shown before you pay. Larger orders may have their own delivery arrangement, which we also show at checkout. There may be a minimum order for delivery.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">2. Prices and payment</h2>
                                <p>Prices shown for food include our service fee. You pay the full total by card when you place a one-off order. Card payments are handled by Stripe, so we never see or store your full card details. Your order only goes to the chefs once your payment succeeds. You can choose when you want your food, from the times your chefs are cooking, and add a tip, which goes to your chefs in full. If you don't finish paying within an hour, the order is released and nothing is charged. If card payment is ever unavailable, we'll tell you at checkout how to pay instead.</p>
                                <p>For meal plans, you pay for each delivery you receive. For event bookings, you pay the confirmed total in full to MYUKCHEF before the booking is confirmed.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">3. Confirming delivery, cancellations and refunds</h2>
                                <p>When a chef hands over your food, they take a photo of it and we ask you to confirm it arrived, or to tell us if something is wrong. If you don't reply within the time shown in the message (normally 48 hours), we treat the order as received so the chef can be paid. You can still contact us about a problem after that, and your consumer rights are not affected.</p>
                                <p>You can cancel an order yourself, from your order page, until a chef starts preparing it. Because food is perishable and made for you, you can't cancel once preparation has started, but if food is faulty, unsafe, not as described or doesn't arrive, you're entitled to a refund or replacement under consumer law. When we cancel a paid order, we refund it in full to the card you paid with. Refunds usually take 5 to 10 working days to show. To complain or ask for a refund, email info@myukchef.com.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">4. Meal plans</h2>
                                <p>A meal plan runs for the length you choose and ends on its end date. It does not renew unless you ask us to. A plan starts only when your chef accepts it, and you pay for each delivery you receive. You can change, skip or cancel a delivery up to the cut-off shown on your plan. Deliveries past their cut-off go ahead because your chef has already prepared for them. Prices are fixed when dishes are added to a week.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">5. Our chefs</h2>
                                <p>Every chef is reviewed by MYUKCHEF before they can sell. Chefs must hold a food hygiene certificate and be registered with their local council as a food business. Badges such as "Food hygiene verified" mean our team has checked the chef's certificate. Chefs remain responsible for the food they prepare, including its safety and allergen information.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">6. Reviews</h2>
                                <p>Only customers a chef has cooked for can review that chef, and reviews must reflect your genuine experience. We publish positive and negative reviews alike, and may hide a review that is abusive, unlawful or not genuine.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">7. Event bookings</h2>
                                <p>You can ask several chefs to quote for one event. A booking goes ahead for the quotes you confirm, once MYUKCHEF has received your full payment. MYUKCHEF then pays each chef their share. Chefs attend your event where they have said they can, and you can cancel free of charge at any time before you pay.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">8. Keeping contact on MYUKCHEF</h2>
                                <p>Customers and chefs must deal with each other through MYUKCHEF. Phone numbers, email addresses, links and social media details can't be shared in messages, requests, profiles or reviews, and we may remove them. Arranging or paying for a booking outside MYUKCHEF isn't allowed.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">9. Terms for chefs</h2>
                                <p>If you sell through MYUKCHEF, the Chef Agreement also applies. In short: MYUKCHEF collects the customer's payment and keeps a commission, shown in your chef portal, from your sales (currently 10% on one-off orders). Once your food is delivered and confirmed, we raise an invoice for your sales less our commission. You check and submit it, and we pay you, through Stripe if you've connected a Stripe account, or otherwise by bank transfer, with a receipt for your records. If you connect Stripe, you also agree to the Stripe Connected Account Agreement. You're responsible for your own tax, and we report seller income to HMRC as the law requires.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">10. Cookies and privacy</h2>
                                <p>How we use personal information is explained in our <a className="underline" href="/privacy">Privacy Policy</a>, and the cookies we use are listed in our <a className="underline" href="/cookies">Cookie Policy</a>.</p>
                                <h2 className="text-xl font-semibold mt-6 mb-2">11. Governing law</h2>
                                <p>These terms are governed by the law of England and Wales. If you live elsewhere in the UK, you keep the protections of your local law and can bring a claim in your local courts.</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default Terms;
