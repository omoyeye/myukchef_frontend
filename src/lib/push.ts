import { api } from "./api";

export const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

const toKey = (base64: string) => {
    const raw = atob(base64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64.length % 4)) % 4));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const registration = async () => {
    const existing = await navigator.serviceWorker.getRegistration();
    if (!existing) throw new Error("Notifications work in the installed or live app, not in the development preview.");
    return existing;
};

export async function currentPushSubscription() {
    if (!pushSupported()) return null;
    const existing = await navigator.serviceWorker.getRegistration();
    return existing ? existing.pushManager.getSubscription() : null;
}

/** Call from a tap: browsers refuse a permission request made any other way. */
export async function enablePush(publicKey: string) {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notifications are blocked. You can allow them in your browser or phone settings.");
    const sw = await registration();
    const subscription = await sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) });
    await api.post("/notifications/push", subscription.toJSON());
}

export async function disablePush() {
    const subscription = await currentPushSubscription();
    if (!subscription) return;
    await api.delete("/notifications/push", { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
}
