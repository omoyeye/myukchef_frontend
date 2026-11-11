import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, ChefHat, ShieldCheck, Star, Wallet } from "lucide-react";
import { Portal } from "@/lib/portals";
import { Layout } from "./Layout";

const BackToSite = ({ className }: { className: string }) => (
    <Link to="/" className={`inline-flex min-h-11 items-center gap-2 text-sm font-medium ${className}`}>
        <ArrowLeft className="h-4 w-4" />Back to MYUKCHEF
    </Link>
);

/** Gives each portal's sign-in pages their own look, so people can see where they are signing in. */
export const AuthShell = ({ portal, children }: { portal: Portal; children: ReactNode }) => {
    if (portal === "customer") {
        return (
            <Layout>
                <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-10">{children}</div>
            </Layout>
        );
    }

    if (portal === "admin") {
        return (
            <div className="flex min-h-dvh flex-col bg-slate-950 px-4 py-4">
                <BackToSite className="self-start text-slate-400 hover:text-white" />
                <div className="flex flex-1 items-center justify-center py-8">{children}</div>
            </div>
        );
    }

    return (
        <div className="grid min-h-dvh lg:grid-cols-2">
            <aside className="relative hidden overflow-hidden bg-ink p-12 text-ink-foreground lg:flex lg:flex-col lg:justify-between">
                <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-[110px]" />
                <div className="relative flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1"><img src="/logo.png" alt="" className="h-full w-full object-contain" /></span>
                    <span className="font-display text-xl font-extrabold">MYUK<span className="text-primary">CHEF</span> Chef Portal</span>
                </div>
                <div className="relative">
                    <h2 className="font-display text-5xl font-extrabold leading-tight">Your kitchen.<br /><span className="text-primary">Your customers.</span></h2>
                    <ul className="mt-8 space-y-4 text-ink-foreground/80">
                        <li className="flex items-center gap-3"><CalendarDays className="h-5 w-5 shrink-0 text-primary" />Weekly meal plans, with a cook sheet for each day</li>
                        <li className="flex items-center gap-3"><Wallet className="h-5 w-5 shrink-0 text-primary" />Your dishes, your prices, your delivery area</li>
                        <li className="flex items-center gap-3"><Star className="h-5 w-5 shrink-0 text-primary" />Ratings from the customers you actually cook for</li>
                    </ul>
                </div>
                <p className="relative flex items-center gap-2 text-sm text-ink-foreground/60"><ShieldCheck className="h-4 w-4" />Every chef is reviewed before going live</p>
            </aside>
            <main className="flex flex-col bg-background px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <BackToSite className="text-muted-foreground hover:text-primary" />
                    <span className="flex items-center gap-1.5 text-sm font-bold text-primary lg:hidden"><ChefHat className="h-4 w-4" />Chef Portal</span>
                </div>
                <div className="flex flex-1 items-center justify-center py-8">{children}</div>
            </main>
        </div>
    );
};
