import type { CSSProperties } from "react";

/** Sets when a .hero-rise element starts, so hero content arrives one piece at a time. */
export const heroDelay = (ms: number) => ({ "--hero-delay": `${ms}ms` }) as CSSProperties;
