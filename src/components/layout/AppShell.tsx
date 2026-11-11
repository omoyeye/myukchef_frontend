import { Component, ErrorInfo, ReactNode, useEffect, useState } from "react";
import { Loader2, WifiOff } from "lucide-react";

export const PageLoader = () => (
    <div role="status" aria-label="Loading" className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

export const OfflineBanner = () => {
    const [offline, setOffline] = useState(!navigator.onLine);
    useEffect(() => {
        const update = () => setOffline(!navigator.onLine);
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);
    if (!offline) return null;
    return (
        <div role="status" className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-foreground px-4 pb-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] text-xs font-medium text-background">
            <WifiOff className="h-3.5 w-3.5" /> You're offline. Ordering will work again when you reconnect.
        </div>
    );
};

/** Shows a way back instead of a blank page, including when a new release replaces old files. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("App error:", error, info.componentStack);
    }

    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="max-w-sm text-muted-foreground">Please reload the page. If it keeps happening, email info@myukchef.com.</p>
                <button onClick={() => window.location.reload()} className="min-h-11 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
                    Reload
                </button>
            </div>
        );
    }
}
