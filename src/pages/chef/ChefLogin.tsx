import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/AuthShell";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/common/SEO";
import { ChefHat } from "lucide-react";

const ChefLogin = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (user?.role === "chef") navigate("/chef/dashboard", { replace: true });
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password, "chef");
            toast.success("Welcome back, Chef!");
            navigate("/chef/dashboard");
        } catch (err: any) {
            toast.error(err.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell portal="chef">
            <SEO noindex title="Chef Sign In" description="Sign in to your chef portal." />
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <ChefHat className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Chef Sign In</CardTitle>
                        <CardDescription>Your dishes, meal plans and customers</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                <Link to="/chef/forgot-password" className="inline-flex min-h-8 items-center text-sm text-primary hover:underline">Forgot your password?</Link>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                            <div className="text-sm text-center text-muted-foreground">
                                Not a chef yet? <Link to="/chef/register" className="text-primary hover:underline font-medium">Apply now</Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
        </AuthShell>
    );
};

export default ChefLogin;
