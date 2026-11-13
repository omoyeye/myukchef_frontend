import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { saveConsent, useConsent } from "@/lib/consent";

export interface MapMarker {
    lat: number;
    lng: number;
    title: string;
    kind?: "chef" | "you" | "destination" | "courier";
    onClick?: () => void;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
export const hasGoogleMaps = !!API_KEY;

const MARKER_COLOURS: Record<NonNullable<MapMarker["kind"]>, string> = {
    chef: "#f8620c",
    you: "#2563eb",
    destination: "#16a34a",
    courier: "#111827",
};

let loading: Promise<any> | null = null;

function loadGoogleMaps() {
    const w = window as any;
    if (w.google?.maps?.importLibrary) return Promise.resolve(w.google.maps);
    loading ??= new Promise((resolve, reject) => {
        w.__initGoogleMaps = () => resolve(w.google.maps);
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&loading=async&region=GB&language=en-GB&callback=__initGoogleMaps`;
        script.async = true;
        script.onerror = () => { loading = null; reject(new Error("Google Maps failed to load")); };
        document.head.appendChild(script);
    });
    return loading;
}

/** Renders nothing without a key or if Google fails, so pages must make sense without a map. */
export const GoogleMap = ({ markers, className = "h-72 w-full rounded-2xl" }: { markers: MapMarker[]; className?: string }) => {
    const container = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const pins = useRef<any[]>([]);
    const [failed, setFailed] = useState(false);
    const markersKey = JSON.stringify(markers.map(({ lat, lng, title, kind }) => [lat, lng, title, kind]));
    // Google's scripts only load once the person has agreed to map cookies.
    const consent = useConsent();
    const allowed = !!consent?.maps;

    useEffect(() => {
        if (!API_KEY || !allowed || !container.current || markers.length === 0) return;
        let cancelled = false;

        (async () => {
            const maps = await loadGoogleMaps();
            const { Map, InfoWindow } = await maps.importLibrary("maps");
            const { Marker } = await maps.importLibrary("marker");
            const { LatLngBounds, SymbolPath } = await maps.importLibrary("core");
            if (cancelled || !container.current) return;

            mapRef.current ??= new Map(container.current, {
                center: { lat: markers[0].lat, lng: markers[0].lng },
                zoom: 13,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                gestureHandling: "cooperative",
            });

            pins.current.forEach((pin) => pin.setMap(null));
            const info = new InfoWindow();
            pins.current = markers.map((m) => {
                const pin = new Marker({
                    map: mapRef.current,
                    position: { lat: m.lat, lng: m.lng },
                    title: m.title,
                    icon: {
                        path: SymbolPath.CIRCLE,
                        scale: 9,
                        fillColor: MARKER_COLOURS[m.kind ?? "chef"],
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                    },
                });
                pin.addListener("click", () => {
                    if (m.onClick) return m.onClick();
                    info.setContent(m.title.replace(/</g, "&lt;"));
                    info.open({ map: mapRef.current, anchor: pin });
                });
                return pin;
            });

            if (markers.length > 1) {
                const bounds = new LatLngBounds();
                markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
                mapRef.current.fitBounds(bounds, 48);
            } else {
                mapRef.current.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
            }
        })().catch((error) => {
            console.error(error);
            setFailed(true);
        });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markersKey, allowed]);

    if (!API_KEY || failed || markers.length === 0) return null;
    if (!allowed) {
        return (
            <div className={`${className} flex flex-col items-center justify-center gap-2 bg-secondary/60 p-4 text-center`} role="region" aria-label="Map">
                <MapPin className="h-6 w-6 text-primary" aria-hidden />
                <p className="max-w-xs text-sm text-muted-foreground">The map uses Google Maps, which may set cookies.</p>
                <button type="button" className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={() => saveConsent({ maps: true })}>
                    Show the map
                </button>
            </div>
        );
    }
    return <div ref={container} className={className} role="region" aria-label="Map" />;
};
