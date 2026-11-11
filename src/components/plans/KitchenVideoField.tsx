import { useState } from "react";
import { Loader2, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadVideo } from "@/lib/api";

/** Upload, replace or remove the up-to-one-minute video of a chef's kitchen. */
export const KitchenVideoField = ({ value, onChange }: { value?: string | null; onChange: (url: string) => void }) => {
    const [busy, setBusy] = useState(false);
    const pick = async (file?: File) => {
        if (!file) return;
        setBusy(true);
        try {
            onChange(await uploadVideo(file));
            toast.success("Video uploaded. Save your profile to show it.");
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="space-y-2 rounded-2xl border p-4">
            <p className="font-semibold">Inside my kitchen</p>
            <p className="text-sm text-muted-foreground">A video of up to one minute showing where you cook. Customers see it on your public page. Keep faces and anything private out of shot.</p>
            {value && <video src={value} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black object-contain" />}
            <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-11 cursor-pointer items-center rounded-md border px-4 text-sm font-medium hover:bg-secondary">
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                    {busy ? "Uploading..." : value ? "Replace video" : "Upload video"}
                    <input type="file" accept="video/mp4,video/quicktime" className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
                </label>
                {value && <Button type="button" variant="ghost" className="h-11 text-destructive" onClick={() => onChange("")}><Trash2 className="mr-2 h-4 w-4" />Remove</Button>}
            </div>
            <p className="text-xs text-muted-foreground">MP4 or MOV, up to one minute and 100MB.</p>
        </div>
    );
};
