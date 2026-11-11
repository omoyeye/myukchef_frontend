import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/AuthShell";
import { Portal, PORTALS } from "@/lib/portals";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/common/SEO";
import { api } from "@/lib/api";

const ForgotPassword = ({ portal = "customer" }: { portal?: Portal }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post("/auth/forgot-password", { email });
            toast.success("Password reset link sent!");
            setIsSubmitted(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to send reset email");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell portal={portal}>
            <SEO noindex title="Forgot Password" description="Reset your MYUKCHEF account password." />
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
                        <CardDescription>
                            Enter your email address and we'll send you a link to reset your password
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {!isSubmitted ? (
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
                            ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                    Check your email for a reset link. You can close this page.
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            {!isSubmitted && (
                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            )}
                            <div className="text-center text-sm">
                                <Link to={PORTALS[portal].login} className="font-medium text-primary hover:underline">
                                    Back to login
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
        </AuthShell>
    );
};

export default ForgotPassword;
