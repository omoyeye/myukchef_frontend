import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Loader2, Mail, MessageCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { currentPushSubscription, disablePush, enablePush, isInstalled, isIos, pushSupported } from "@/lib/push";

export const NotificationSettings = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const qc = useQueryClient();
    const [pushOn, setPushOn] = useState(false);
    const [busy, setBusy] = useState(false);

    const { data: preferences } = useQuery<{ emailUpdates: boolean; emailMessages: boolean }>({
        queryKey: ["notification-preferences"],
        queryFn: () => api.get("/notifications/preferences"),
        enabled: open,
    });
    const { data: pushConfig } = useQuery<{ enabled: boolean; publicKey: string | null }>({
        queryKey: ["push-config"],
        queryFn: () => api.get("/notifications/push/key"),
        enabled: open,
    });

    useEffect(() => {
        if (open) currentPushSubscription().then((s) => setPushOn(!!s)).catch(() => setPushOn(false));
    }, [open]);

    const save = useMutation({
        mutationFn: (next: { emailUpdates: boolean; emailMessages: boolean }) => api.put("/notifications/preferences", next),
        onSuccess: (next) => qc.setQueryData(["notification-preferences"], next),
        onError: (e: Error) => toast.error(e.message),
    });

    const togglePush = async (on: boolean) => {
        setBusy(true);
        try {
            if (on) await enablePush(pushConfig!.publicKey!); else await disablePush();
            setPushOn(on);
            toast.success(on ? "Notifications are on for this device" : "Notifications are off for this device");
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const needsInstall = pushSupported() ? false : isIos() && !isInstalled();
    const row = "flex min-h-14 items-center gap-3 rounded-2xl border p-3";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Notification settings</DialogTitle>
                    <DialogDescription>The bell in the app always keeps your latest updates. Password resets and order confirmations are always emailed.</DialogDescription>
                </DialogHeader>
                {!preferences ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-2">
                        <label className={row}>
                            <Mail className="h-5 w-5 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1"><span className="block font-semibold">Email me updates</span><span className="block text-sm text-muted-foreground">Orders, plans, bookings and payments</span></span>
                            <Switch checked={preferences.emailUpdates} onCheckedChange={(emailUpdates) => save.mutate({ ...preferences, emailUpdates })} />
                        </label>
                        <label className={row}>
                            <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1"><span className="block font-semibold">Email me about new messages</span><span className="block text-sm text-muted-foreground">At most one email per chat every 15 minutes</span></span>
                            <Switch checked={preferences.emailMessages} onCheckedChange={(emailMessages) => save.mutate({ ...preferences, emailMessages })} />
                        </label>
                        <div className={row}>
                            <Smartphone className="h-5 w-5 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold">Push notifications on this device</span>
                                <span className="block text-sm text-muted-foreground">
                                    {!pushConfig?.enabled ? "Not available yet."
                                        : needsInstall ? "On iPhone and iPad, add MYUKCHEF to your Home Screen and open it from there first."
                                        : !pushSupported() ? "This browser doesn't support them."
                                        : "Alerts even when the app is closed."}
                                </span>
                            </span>
                            {pushConfig?.enabled && pushSupported() && <Switch aria-label="Push notifications on this device" checked={pushOn} disabled={busy} onCheckedChange={togglePush} />}
                        </div>
                        {pushOn && <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground"><BellRing className="h-4 w-4 shrink-0" />You'll get alerts on this device. Turn them off here at any time.</p>}
                        <Button variant="outline" className="h-11 w-full" onClick={() => onOpenChange(false)}>Done</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
