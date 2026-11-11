import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { api } from "@/lib/api";

export interface UserLocation {
    lat: number;
    lng: number;
    label: string;
}

const STORAGE_KEY = "myukchef-location";

const readStored = (): UserLocation | null => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    } catch {
        return null;
    }
};

interface LocationContextValue {
    location: UserLocation | null;
    isLocating: boolean;
    useDeviceLocation: () => Promise<void>;
    searchLocation: (query: string) => Promise<void>;
    clearLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
    const [location, setLocation] = useState<UserLocation | null>(readStored);
    const [isLocating, setIsLocating] = useState(false);

    const save = useCallback((next: UserLocation | null) => {
        setLocation(next);
        try {
            if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            else localStorage.removeItem(STORAGE_KEY);
        } catch {
            // The saved location is only a convenience.
        }
    }, []);

    const useDeviceLocation = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Your device doesn't support location. Enter a postcode instead."));
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setIsLocating(false);
                    save({ lat: position.coords.latitude, lng: position.coords.longitude, label: "Your location" });
                    resolve();
                },
                (error) => {
                    setIsLocating(false);
                    reject(new Error(error.code === error.PERMISSION_DENIED
                        ? "Location access is off. Enter a postcode instead."
                        : "We couldn't get your location. Enter a postcode instead."));
                },
                { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
            );
        });
    }, [save]);

    const searchLocation = useCallback(async (query: string) => {
        setIsLocating(true);
        try {
            const point = await api.get(`/location/geocode?q=${encodeURIComponent(query)}`);
            save({ lat: point.lat, lng: point.lng, label: point.label || query.toUpperCase() });
        } finally {
            setIsLocating(false);
        }
    }, [save]);

    const value = useMemo(
        () => ({ location, isLocating, useDeviceLocation, searchLocation, clearLocation: () => save(null) }),
        [location, isLocating, useDeviceLocation, searchLocation, save],
    );
    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useUserLocation = () => {
    const context = useContext(LocationContext);
    if (!context) throw new Error("useUserLocation must be used inside LocationProvider");
    return context;
};

/** The chef list, nearest first when the customer's location is known. */
export const chefsPath = (location: UserLocation | null) => (location ? `/chefs?lat=${location.lat}&lng=${location.lng}` : "/chefs");

export const formatMiles = (miles: number) => (miles < 0.5 ? "Under 1 mile away" : `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} miles away`);
