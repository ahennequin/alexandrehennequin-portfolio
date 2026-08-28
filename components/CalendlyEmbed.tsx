"use client";

import { useCallback, useRef } from "react";
import Script from "next/script";

const CALENDLY_SCRIPT_SRC =
  "https://assets.calendly.com/assets/external/widget.js";
const CALENDLY_CSS_SRC =
  "https://assets.calendly.com/assets/external/widget.css";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
      }) => void;
    };
  }
}

export default function CalendlyEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Runs after widget.js has loaded AND on every mount — including the remount
  // that a locale switch triggers, when the script is already cached and its
  // one-time auto-scan of `.calendly-inline-widget` elements won't fire again.
  // Clear the container first so a re-init doesn't stack a second iframe.
  const mountWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container || !window.Calendly) return;
    container.innerHTML = "";
    window.Calendly.initInlineWidget({ url, parentElement: container });
  }, [url]);

  return (
    <>
      <link rel="stylesheet" href={CALENDLY_CSS_SRC} />
      <div
        ref={containerRef}
        className="rounded-sm border border-graphite/20"
        style={{ minWidth: "320px", height: "700px" }}
      />
      <Script
        src={CALENDLY_SCRIPT_SRC}
        strategy="lazyOnload"
        onReady={mountWidget}
      />
    </>
  );
}
