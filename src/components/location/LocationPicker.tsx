import { FormEvent, useState } from "react";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserLocation } from "@/lib/location";

export const LocationPicker = ({ heading = "See who's near you" }: { heading?: string }) => {
    const { location, isLocating, useDeviceLocation, searchLocation, clearLocation } = useUserLocation();
    const [query, setQuery] = useState("");

    const useDevice = () => useDeviceLocation().catch((e: Error) => toast.error(e.message));
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        searchLocation(query).then(() => setQuery("")).catch((err: Error) => toast.error(err.message));
    };

    if (location) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2 pl-3">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <p className="min-w-0 flex-1 truncate text-sm">Near <span className="font-semibold">{location.label}</span></p>
                <Button type="button" variant="ghost" size="sm" className="h-10 shrink-0" onClick={clearLocation}>
                    <X className="mr-1 h-4 w-4" />Change
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2 rounded-xl border bg-card p-3">
            <p className="text-sm font-semibold">{heading}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" className="h-11 shrink-0" disabled={isLocating} onClick={useDevice}>
                    {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}Use my location
                </Button>
                <form onSubmit={submit} className="flex min-w-0 flex-1 gap-2">
                    <Input
                        aria-label="Postcode or town"
                        placeholder="Postcode or town"
                        autoComplete="postal-code"
                        className="h-11 min-w-0"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button type="submit" className="h-11 shrink-0" disabled={isLocating || !query.trim()}>Search</Button>
                </form>
            </div>
        </div>
    );
};
