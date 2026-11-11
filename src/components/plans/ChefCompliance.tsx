import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock, Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { downloadMyData } from "@/lib/account";

export const COMPLIANCE_GROUPS = [
    {
        title: "About you",
        hint: "HMRC requires platforms to collect and report these details for the people who sell through them.",
        fields: [
            ["legalName", "Full legal name"], ["dateOfBirth", "Date of birth", "date"], ["addressLine", "Home or business address"], ["city", "Town or city"], ["postcode", "Postcode"],
            ["taxReference", "National Insurance number or UTR"],
        ],
    },
    {
        title: "Food safety",
        hint: "Food businesses, including home cooks, need to register with their local council before trading.",
        fields: [
            ["localAuthority", "Council you're registered with"], ["registeredOn", "Date you registered", "date"], ["hygieneCertificate", "Food hygiene certificate (course and level)"], ["insurance", "Public liability insurer (optional)"],
        ],
    },
    {
        title: "Where to pay you",
        hint: "MYUKCHEF sends your event payouts here.",
        fields: [
            ["bankAccountName", "Account name"], ["bankSortCode", "Sort code"], ["bankAccountNumber", "Account number"],
        ],
    },
] as const;

export const ChefCompliance = () => {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery<any>({ queryKey: ["chef-compliance"], queryFn: () => api.get("/chefs/me/compliance") });
    const [form, setForm] = useState<Record<string, string>>({});
    useEffect(() => { if (data) setForm(data); }, [data]);

    const save = useMutation({
        mutationFn: () => api.put("/chefs/me/compliance", form),
        onSuccess: (next: any) => { qc.setQueryData(["chef-compliance"], next); toast.success(next.complete ? "Saved. Our team will check your details." : "Saved. Please finish the remaining details when you can."); },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading) return <Skeleton className="h-64 w-full rounded-3xl" />;

    return (
        <form className="max-w-3xl space-y-5" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <div className={`flex items-start gap-3 rounded-2xl p-4 ${data?.verified ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`}>
                {data?.verified ? <BadgeCheck className="h-5 w-5 shrink-0" /> : <Clock className="h-5 w-5 shrink-0" />}
                <p className="text-sm"><span className="font-bold">{data?.verified ? "Verified by MYUKCHEF." : data?.complete ? "Waiting for our team to check." : "Please complete these details."}</span> {data?.verified ? "If you change anything, we'll check it again." : "We need them to keep customers safe, pay you and meet our legal duties."}</p>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4 shrink-0" />Private. Only you and the MYUKCHEF team can see these details.</p>
            {COMPLIANCE_GROUPS.map((group) => (
                <fieldset key={group.title} className="rounded-3xl border bg-card p-5">
                    <legend className="px-1 font-display text-lg font-bold">{group.title}</legend>
                    <p className="mb-3 text-sm text-muted-foreground">{group.hint}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {(group.fields as readonly (readonly string[])[]).map(([key, label, type]) => (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={`comp-${key}`}>{label}</Label>
                                <Input id={`comp-${key}`} type={type ?? "text"} autoComplete="off" className="h-11" value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                            </div>
                        ))}
                    </div>
                </fieldset>
            ))}
            <div className="flex flex-wrap gap-2">
                <Button type="submit" className="h-11" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save details"}</Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => downloadMyData().catch((e: Error) => toast.error(e.message))}><Download className="mr-2 h-4 w-4" />Download my data</Button>
            </div>
        </form>
    );
};
