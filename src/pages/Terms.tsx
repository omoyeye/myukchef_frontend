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
                                <p>Last updated: 6 November 2026</p>
                                <p>These terms apply when you use MYUKCHEF. Please read them carefully. You must be 18 or over to have an account. Nothing here affects your legal rights as a consumer.</p>
                                {who && <p>MYUKCHEF is operated by {who}.</p>}

                                <h2 className="text-xl font-semibold mt-6 mb-2">1. Ordering and Delivery</h2>
                                <p>All orders are subject to availability. We aim to deliver your food within the estimated timeframe, but delivery times are not guaranteed.</p>

                                <h2 className="text-xl font-semibold mt-6 mb-2">2. Pricing and Payment</h2>
                                <p>Prices shown for food include our service fee. Delivery is shown before you confirm. For one-off orders, you pay when your order arrives or when you collect it. For meal plans, you pay for each delivery you receive. For event bookings, you pay the confirmed total in full to MYUKCHEF before the booking is confirmed.</p>

                                <h2 className="text-xl font-semibold mt-6 mb-2">3. Cancellations and Refunds</h2>
                                <p>You can cancel an order before it starts being prepared. Because food is perishable and made for you, you can't cancel once preparation has started, but if food is faulty, unsafe, not as described or doesn't arrive, you're entitled to a refund or replacement under consumer law. To complain or ask for a refund, email info@myukchef.com and we'll reply as soon as we can.</p>

                                <h2 className="text-xl font-semibold mt-6 mb-2">4. Meal Plans</h2>
                                <p>A meal plan runs for the length you choose and ends on its end date. It does not renew unless you ask us to. A plan starts only when your chef accepts it, and you pay for each delivery you receive. You can change, skip or cancel a delivery up to the cut-off shown on your plan. Deliveries past their cut-off go ahead because your chef has already prepared for them. Prices are fixed when dishes are added to a week.</p>

                                <h2 className="text-xl font-semibold mt-6 mb-2">5. Reviews</h2>
                                <p>Only customers a chef has cooked for can review that chef, and reviews must reflect your genuine experience. We publish positive and negative reviews alike, and may hide a review that is abusive, unlawful or not genuine.</p>

                                <h2 className="text-xl font-semibold mt-6 mb-2">6. Event Bookings</h2>
                                <p>You can ask several chefs to quote for one event. A booking goes ahead for the quotes you confirm, once MYUKCHEF has received your full payment. MYUKCHEF then pays each chef their share. Chefs attend your event where they have said they can, and you can cancel free of charge at any time before you pay.</p>

                                <h2 className="text-xl font-semibold mt-6 mb-2">7. Keeping Contact on MYUKCHEF</h2>
                                <p>Customers and chefs must deal with each other through MYUKCHEF. Phone numbers, email addresses, links and social media details can't be shared in messages, requests, profiles or reviews, and we may remove them. Arranging or paying for a booking outside MYUKCHEF isn't allowed.</p>

                                <h2 className="text-xl font-semibold mt-6 mb-2">8. Governing Law</h2>
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
