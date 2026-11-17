// Same-origin by default: Vite proxies /api in dev, Express serves the app in production.
export const API_URL: string = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'auth-token';

export const session = {
    get token() {
        try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
    },
    set(token: string) { localStorage.setItem(TOKEN_KEY, token); },
    clear() { localStorage.removeItem(TOKEN_KEY); },
};

export const authHeaders = (): Record<string, string> => (session.token ? { Authorization: `Bearer ${session.token}` } : {});

const getHeaders = (headers: Record<string, string> = {}) => ({
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...headers,
});

/** Uploads an image and returns the URL to save with the record. */
export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_URL}/upload`, { method: 'POST', headers: authHeaders(), body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
}

/** Uploads a certificate (PDF or photo) privately. Returns a reference to save, not a public link. */
export async function uploadDocument(file: File): Promise<{ file: string; name: string }> {
    if (file.size > 10 * 1024 * 1024) throw new Error('Please keep the file under 10MB.');
    const formData = new FormData();
    formData.append('document', file);
    const response = await fetch(`${API_URL}/upload/document`, { method: 'POST', headers: authHeaders(), body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data;
}

/** Opens a private certificate in a new tab. It needs the sign-in, so it's fetched rather than linked. */
export async function openCertificate(credentialId: number) {
    const tab = window.open('', '_blank');
    const response = await fetch(`${API_URL}/chefs/credentials/${credentialId}/document`, { headers: authHeaders() });
    if (!response.ok) { tab?.close(); throw new Error('No copy on file'); }
    const url = URL.createObjectURL(await response.blob());
    if (tab) tab.location.href = url; else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Longest kitchen video a chef can upload, in seconds. The server checks this too. */
export const MAX_VIDEO_SECONDS = 60;

/** Reads a video file's length in the browser before it is uploaded. */
export const videoLength = (file: File) => new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("We couldn't read that video. Please try an MP4 or MOV file.")); };
    video.src = url;
});

/** Uploads a kitchen video of up to one minute and returns its URL. */
export async function uploadVideo(file: File): Promise<string> {
    const seconds = await videoLength(file);
    if (seconds > MAX_VIDEO_SECONDS + 1) throw new Error(`Your video is ${Math.round(seconds)} seconds long. Please keep it to one minute.`);
    const formData = new FormData();
    formData.append("video", file);
    const response = await fetch(`${API_URL}/upload/video`, { method: "POST", headers: authHeaders(), body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Upload failed");
    return data.url;
}

export const api = {
    async get(path: string, headers: Record<string, string> = {}) {
        const response = await fetch(`${API_URL}${path}`, {
            headers: getHeaders(headers),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw Object.assign(new Error(error.error || `GET ${path} failed with status ${response.status}`), { status: response.status });
        }
        return response.json();
    },

    async post(path: string, body: any, headers: Record<string, string> = {}) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: getHeaders(headers),
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw Object.assign(new Error(error.error || `POST ${path} failed with status ${response.status}`), { status: response.status });
        }
        return response.json();
    },

    async patch(path: string, body: any, headers: Record<string, string> = {}) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'PATCH',
            headers: getHeaders(headers),
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw Object.assign(new Error(error.error || `PATCH ${path} failed with status ${response.status}`), { status: response.status });
        }
        return response.json();
    },

    async put(path: string, body: any, headers: Record<string, string> = {}) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'PUT',
            headers: getHeaders(headers),
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw Object.assign(new Error(error.error || `PUT ${path} failed with status ${response.status}`), { status: response.status });
        }
        return response.json();
    },

    async delete(path: string, body?: unknown, headers: Record<string, string> = {}) {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'DELETE',
            headers: getHeaders(headers),
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw Object.assign(new Error(error.error || `DELETE ${path} failed with status ${response.status}`), { status: response.status });
        }
        return response.json();
    }
};
