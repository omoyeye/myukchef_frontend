import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/AuthShell";
import { Portal, PORTALS } from "@/lib/portals";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/common/SEO";
import { api } from "@/lib/api";

const ResetPassword = ({ portal = "customer" }: { portal?: Portal }) => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!token) {
            toast.error("Invalid token");
            return;
        }

        setIsLoading(true);

        try {
            await api.post("/auth/reset-password", { token, newPassword: password });
            toast.success("Password reset successfully!");
            navigate(PORTALS[portal].login);
        } catch (error: any) {
            toast.error(error.message || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <AuthShell portal={portal}>
                <SEO title="Invalid Link" description="This password reset link is invalid or has expired." />
                <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-10 px-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-destructive">Invalid Link</CardTitle>
                            <CardDescription>This password reset link is invalid or has expired.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Link to={PORTALS[portal].login}><Button variant="outline">Back to Login</Button></Link>
                        </CardFooter>
                    </Card>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell portal={portal}>
            <SEO title="Reset Password" description="Create a new password for your MYUKCHEF account." />
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-10 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                        <CardDescription>
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AuthShell>
    );
};

export default ResetPassword;
