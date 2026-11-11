import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/common/SEO';
import { toast } from 'sonner';

const SearchOrder = () => {
    const [orderId, setOrderId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) {
            toast.error("Please enter a valid Order ID");
            return;
        }

        setIsSearching(true);
        // Simulate a small delay for "sweet" UX
        setTimeout(() => {
            navigate(`/order-tracker/${orderId.trim()}`);
        }, 800);
    };

    return (
        <Layout>
            <SEO
                title="Track Your Order"
                description="Check the real-time status of your MYUKCHEF order."
            />
            <div className="bg-secondary/20 min-h-[80vh] flex flex-col items-center justify-center px-4 py-20">
                <div className="max-w-xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">

                    <div className="text-center space-y-4">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow-warm border mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground italic flex items-center justify-center gap-2">
                            WHERE'S MY <span className="text-primary uppercase">ORDER?</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto">
                            Enter your Order ID below to see its latest status.
                        </p>
                    </div>

                    <Card className="border-none shadow-2xl overflow-hidden">
                        <CardContent className="p-0">
                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row p-2">
                                <div className="relative flex-1">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Enter Order ID (e.g. 104)"
                                        className="h-16 pl-12 border-none focus-visible:ring-0 text-lg font-medium"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isSearching}
                                    className="h-16 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg group transition-all"
                                >
                                    {isSearching ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            Track Now
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                        <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-xl bg-background/50 backdrop-blur-sm border shadow-sm">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Package className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-sm">Packed with Love</h3>
                            <p className="text-xs text-muted-foreground">Straight from the kitchen to your table.</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-xl bg-background/50 backdrop-blur-sm border shadow-sm">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-sm">Live Status Updates</h3>
                            <p className="text-xs text-muted-foreground">See each step, from the kitchen to your door.</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-xl bg-background/50 backdrop-blur-sm border shadow-sm">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Search className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-sm">Guest Tracking</h3>
                            <p className="text-xs text-muted-foreground">No account? No problem. Track instantly.</p>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default SearchOrder;
