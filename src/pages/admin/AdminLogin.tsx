import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/common/SEO";

const AdminLogin = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // If already logged in as admin, redirect to dashboard
    useEffect(() => {
        if (user?.isAdmin) {
            navigate("/admin");
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(email, password, "admin");
            toast.success("Welcome back");
            navigate("/admin");
        } catch (error: any) {
            toast.error(error.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
            <SEO noindex title="Super Admin Sign In" description="Authorized personnel login for MYUKCHEF admin portal." />
            <div className="absolute top-8 left-8">
                <Button variant="ghost" asChild className="text-slate-400 hover:text-white">
                    <Link to="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Store
                    </Link>
                </Button>
            </div>

            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/20 rounded-full">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Super Admin</CardTitle>
                    <CardDescription className="text-slate-400">
                        Sign in to run MYUKCHEF. There is no public sign-up for this portal.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="username"
                                placeholder="you@myukchef.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-primary"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white focus:ring-primary"
                                required
                            />
                            <Link to="/admin/forgot-password" className="inline-flex min-h-8 items-center text-sm text-slate-300 hover:text-white hover:underline">Forgot your password?</Link>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full text-lg h-12 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" type="submit" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <p className="absolute bottom-8 text-slate-500 text-sm">
                Authorized use only. All activities are logged.
            </p>
        </div>
    );
};

export default AdminLogin;
