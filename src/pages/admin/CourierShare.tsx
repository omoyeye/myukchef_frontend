import { useEffect, useRef, useState } from "react";
import { Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const SEND_EVERY_MS = 15_000;

/** Run on the delivery person's phone: shares their position with this order's customer. */
export const CourierShare = ({ orderId }: { orderId: number }) => {
    const [sharing, setSharing] = useState(false);
    const lastSent = useRef(0);

    useEffect(() => {
        if (!sharing) return;
        if (!navigator.geolocation) {
            toast.error("This device doesn't support location sharing.");
            setSharing(false);
            return;
        }
        const watch = navigator.geolocation.watchPosition(
            (position) => {
                if (Date.now() - lastSent.current < SEND_EVERY_MS) return;
                lastSent.current = Date.now();
                api.patch(`/orders/${orderId}/courier-location`, { lat: position.coords.latitude, lng: position.coords.longitude })
                    .catch((e: Error) => toast.error(e.message));
            },
            () => {
                toast.error("Location access is needed to share live tracking.");
                setSharing(false);
            },
            { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
        );
        return () => navigator.geolocation.clearWatch(watch);
    }, [sharing, orderId]);

    return (
        <Button variant={sharing ? "default" : "outline"} size="sm" className="h-10 w-full text-xs" onClick={() => setSharing((v) => !v)}>
            <Navigation className="mr-1 h-3 w-3" />
            {sharing ? "Sharing live location: stop" : "Share my live location"}
        </Button>
    );
};
