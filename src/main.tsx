import { startErrorReporting } from "./lib/errorReporting";
import { captureInstallPrompt } from "./lib/pwa";
import { createRoot } from "react-dom/client";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/bricolage-grotesque/500.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/bricolage-grotesque/800.css";
import App from "./App.tsx";
import "./index.css";

startErrorReporting();
// Before React starts, so the browser's "install this app" offer is never missed.
captureInstallPrompt();
// Any picture that fails to load (a removed photo, a dead link) shows a neat food placeholder instead
// of a broken-image icon with its alt text. Once only, so a missing placeholder can't loop.
document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.fallback) return;
    img.dataset.fallback = "1";
    img.srcset = "";
    img.src = "/dish-placeholder.svg";
}, true);
createRoot(document.getElementById("root")!).render(<App />);
