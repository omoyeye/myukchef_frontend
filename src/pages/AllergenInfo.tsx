import { Layout } from "@/components/layout/Layout";
import { ALLERGENS } from "@/lib/allergens";
import SEO from "@/components/common/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

const AllergenInfo = () => {
    const { data: settings, isLoading } = useQuery<any>({
        queryKey: ['site-settings'],
        queryFn: () => api.get('/settings'),
    });

    const content = settings?.allergen_info;

    const commonAllergens = ALLERGENS.map((a) => ({ name: a.label, foundIn: a.foundIn }));

    return (
        <Layout>
            <SEO title="Allergen Information" description="Allergen Information for MYUKCHEF" />
            <div className="container py-20">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Allergen Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : content ? (
                            <div className="whitespace-pre-wrap">{content}</div>
                        ) : (
                            <>
                                <p className="text-muted-foreground">
                                    Every dish on MYUKCHEF is made by an independent chef, who must check it against the 14 allergens below before it can go on sale. You'll see the result on each dish, at checkout, in your order confirmation and on your tracking page. Chefs' kitchens may handle other allergens, so we can't promise any dish is completely free from them.
                                </p>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Allergen</TableHead>
                                                <TableHead>Commonly Found In</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {commonAllergens.map((allergen) => (
                                                <TableRow key={allergen.name}>
                                                    <TableCell className="font-semibold">{allergen.name}</TableCell>
                                                    <TableCell>{allergen.foundIn}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                                    <h3 className="font-bold text-primary mb-2">Important Note:</h3>
                                    <p className="text-sm">
                                        If you have a severe allergy, please contact us before you order, or message your chef about your meal plan or event. Don't rely on the listing alone, and always check when your food arrives.
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default AllergenInfo;
