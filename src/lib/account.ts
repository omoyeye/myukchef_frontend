import { api } from "./api";

/** Saves everything held about the signed-in person as a file. */
export async function downloadMyData() {
    const data = await api.get("/auth/me/export");
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "myukchef-my-data.json";
    link.click();
    URL.revokeObjectURL(url);
}
