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
createRoot(document.getElementById("root")!).render(<App />);
