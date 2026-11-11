import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Only ever returns to a page on this site, so a crafted login link can't send someone elsewhere. */
export const safeRedirect = (path: string | null, fallback = "/profile") =>
  path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : fallback;
