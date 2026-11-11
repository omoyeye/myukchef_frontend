import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { safeRedirect } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout } from "@/components/layout/Layout";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/common/SEO";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(email, password, "customer");
            toast.success("Welcome back!");
            navigate(safeRedirect(searchParams.get("redirect")));
        } catch (error: any) {
            toast.error(error.message || "Failed to login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <SEO title="Log In" description="Log in to your MYUKCHEF account to track orders and more." />
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-10 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex justify-center mb-4">
                            <div className="h-20 w-20 rounded-2xl bg-white p-2 shadow-sm border overflow-hidden">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Log in to your account</CardTitle>
                        <CardDescription>
                            Enter your email below to login to your account
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Logging in..." : "Log in"}
                            </Button>
                            <div className="text-center text-sm">
                                Don't have an account?{" "}
                                <Link to={`/register${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`} className="font-medium text-primary hover:underline">
                                    Sign up
                                </Link>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">Are you a chef? <Link to="/chef/login" className="font-medium text-primary hover:underline">Sign in to the Chef Portal</Link></p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </Layout>
    );
};

export default Login;
