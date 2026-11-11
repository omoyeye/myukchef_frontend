/** Uses the phone's share sheet where available, otherwise copies the link. */
export async function shareLink(title: string, text: string, url: string): Promise<"shared" | "copied" | "cancelled"> {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            return "shared";
        } catch {
            return "cancelled";
        }
    }
    await navigator.clipboard.writeText(url);
    return "copied";
}
