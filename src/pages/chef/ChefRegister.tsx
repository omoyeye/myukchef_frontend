import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthShell } from "@/components/layout/AuthShell";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/common/SEO";
import { ChefHat } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const ChefRegister = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [form, setForm] = useState({
        name: "", email: "", password: "",
        displayName: "", bio: "", specialty: "",
        phone: "", location: "", yearsExperience: "",
    });

    const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post("/chefs/register", { ...form, acceptTerms: true });
            // auto login as the new chef
            await login(form.email, form.password, "chef");
            toast.success("Application submitted! An admin will review your profile shortly.");
            navigate("/chef/dashboard");
        } catch (err: any) {
            toast.error(err.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell portal="chef">
            <SEO title="Become a Chef" description="Join MYUKCHEF as a partner chef." />
            <div className="container py-10 px-4 max-w-2xl">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <ChefHat className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Become a Partner Chef</CardTitle>
                        <CardDescription>
                            Apply to sell your dishes through MYUKCHEF. Approval takes 1–2 business days.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name *</Label>
                                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Display Name *</Label>
                                    <Input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="Chef Ada" required />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password *</Label>
                                    <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="London, UK" />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Specialty</Label>
                                    <Input value={form.specialty} onChange={(e) => update("specialty", e.target.value)} placeholder="e.g. Modern British, Italian, Caribbean" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Years of Experience</Label>
                                    <Input type="number" value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)} min={0} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Bio</Label>
                                <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell us about your culinary journey..." rows={4} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <label htmlFor="chef-accept" className="flex w-full items-start gap-3 text-sm">
                                <Checkbox id="chef-accept" className="mt-0.5" checked={accepted} onCheckedChange={(on) => setAccepted(!!on)} />
                                <span>I'm 18 or over, I'm registered or will register as a food business before selling, and I agree to the <Link to="/chef/agreement" target="_blank" className="underline">Chef Agreement</Link>, <Link to="/terms" target="_blank" className="underline">Terms</Link> and <Link to="/privacy" target="_blank" className="underline">Privacy Policy</Link>.</span>
                            </label>
                            <Button className="w-full" type="submit" disabled={isLoading || !accepted}>
                                {isLoading ? "Submitting..." : "Submit Application"}
                            </Button>
                            <div className="text-sm text-center text-muted-foreground">
                                Already a chef? <Link to="/chef/login" className="text-primary hover:underline font-medium">Sign in</Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AuthShell>
    );
};

export default ChefRegister;
