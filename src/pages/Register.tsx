import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
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

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            await register(formData.name, formData.email, formData.password, searchParams.get("ref") ?? undefined);
            toast.success("Account created", { description: "We've emailed you a link to confirm your address." });
            navigate(safeRedirect(searchParams.get("redirect")));
        } catch (error: any) {
            toast.error(error.message || "Failed to register");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <SEO title="Sign Up" description="Create an account at MYUKCHEF to order from local chefs and book them for your events." />
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-10 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                        <CardDescription>
                            Enter your information below to create your account
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <label htmlFor="accept-terms" className="flex w-full items-start gap-3 text-sm">
                                <Checkbox id="accept-terms" className="mt-0.5" checked={accepted} onCheckedChange={(on) => setAccepted(!!on)} />
                                <span>I'm 18 or over and agree to the <Link to="/terms" target="_blank" className="underline">Terms</Link> and <Link to="/privacy" target="_blank" className="underline">Privacy Policy</Link>.</span>
                            </label>
                            <Button className="w-full" type="submit" disabled={isLoading || !accepted}>
                                {isLoading ? "Creating account..." : "Sign Up"}
                            </Button>
                            <div className="text-center text-sm">
                                Already have an account?{" "}
                                <Link to={`/login${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`} className="font-medium text-primary hover:underline">
                                    Log in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </Layout>
    );
};

export default Register;
