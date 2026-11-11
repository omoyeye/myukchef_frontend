import { useState, useEffect } from 'react';
import { X, Download, Star, Zap, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const PWAInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the default browser prompt
            e.preventDefault();
            // Store the event so it can be triggered later
            setInstallPrompt(e);

            // Check if user has already dismissed it this session or globally
            const dismissed = localStorage.getItem('pwa-prompt-dismissed');
            if (!dismissed) {
                // Show our custom prompt after a short delay
                setTimeout(() => setIsVisible(true), 3000);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Also check if already installed
        window.addEventListener('appinstalled', () => {
            setInstallPrompt(null);
            setIsVisible(false);
        });

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;

        // Show the browser's install prompt
        installPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setIsVisible(false);
        } else {
            console.log('User dismissed the install prompt');
        }

        setInstallPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        // Remember dismissal for 7 days
        localStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    if (!isVisible || isDismissed) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[100] md:bottom-6 md:right-6 md:left-auto md:max-w-md animate-in slide-in-from-bottom-10 duration-500">
            <Card className="bg-gradient-to-br from-orange-600 to-red-700 text-white border-none shadow-2xl overflow-hidden relative group">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                    onClick={handleDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>

                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-inner shrink-0 rotate-3 group-hover:rotate-0 transition-transform">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                    Get MYUKCHEF Faster! <Zap className="h-5 w-5 fill-yellow-400 text-yellow-400 animate-pulse" />
                                </h3>
                                <p className="text-sm text-orange-50 font-medium">
                                    Install our app for a smoother, faster ordering experience and exclusive home-screen deals.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 text-[10px] uppercase font-bold tracking-widest text-orange-200">
                                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-orange-200" /> Premium Access</span>
                                <span className="flex items-center gap-1"><Bell className="h-3 w-3 fill-orange-200" /> Live Track Orders</span>
                            </div>

                            <Button
                                onClick={handleInstallClick}
                                className="w-full bg-white text-orange-700 hover:bg-orange-50 font-bold py-6 text-base shadow-lg hover:shadow-xl transition-all"
                            >
                                <Download className="mr-2 h-5 w-5" />
                                Install MYUKCHEF
                            </Button>
                        </div>
                    </div>
                </CardContent>

                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -top-6 -left-6 h-24 w-24 bg-red-400/20 rounded-full blur-2xl" />
            </Card>
        </div>
    );
};
