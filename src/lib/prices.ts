import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

/**
 * The service fee is compulsory, so every food price the customer sees includes it.
 * The server still works out the same final total.
 */
export const useMenuPrices = () => {
    const { data: settings } = useQuery<any>({ queryKey: ["site-settings"], queryFn: () => api.get("/settings"), staleTime: 300_000 });
    const percent = Number(settings?.delivery_config?.serviceFeePercent ?? 10);
    return { serviceFeePercent: percent, withFee: (price: number) => price * (1 + percent / 100) };
};
