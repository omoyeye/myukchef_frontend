import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { downloadMyData } from "@/lib/account";
import { api } from "@/lib/api";

/** Customers can download or delete their own data without having to ask. */
export const AccountData = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");

    const remove = useMutation({
        mutationFn: () => api.delete("/auth/me", { password }),
        onSuccess: () => { toast.success("Your account has been deleted"); logout(); navigate("/"); },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <section aria-labelledby="your-data-heading" className="rounded-3xl border bg-background p-5">
            <h3 id="your-data-heading" className="font-semibold text-lg">Your data</h3>
            <p className="mt-1 text-sm text-muted-foreground">Download a copy of what we hold about you, or close your account.</p>
            <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" className="h-11" onClick={() => downloadMyData().catch((e: Error) => toast.error(e.message))}><Download className="mr-2 h-4 w-4" />Download my data</Button>
                <Button variant="ghost" className="h-11 text-destructive hover:text-destructive" onClick={() => { setPassword(""); setOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete my account</Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); remove.mutate(); }}>
                        <DialogHeader>
                            <DialogTitle>Delete your account?</DialogTitle>
                            <DialogDescription>This removes your details, addresses, reviews, saved chefs and messages, and can't be undone. Order and booking totals stay on record without your name, as we must keep them for our accounts. Please cancel any active plans or bookings first.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="delete-password">Enter your password to confirm</Label>
                            <Input id="delete-password" type="password" autoComplete="current-password" required className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" className="h-11" onClick={() => setOpen(false)}>Keep my account</Button>
                            <Button type="submit" variant="destructive" className="h-11" disabled={remove.isPending}>{remove.isPending ? "Deleting..." : "Delete my account"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
};
