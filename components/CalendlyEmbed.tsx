"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

const CALENDLY_SCRIPT_SRC =
  "https://assets.calendly.com/assets/external/widget.js";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidgets: () => void;
    };
  }
}

export default function CalendlyEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // On client-side navigation the script may already be present; re-run the
  // initializer so the widget mounts into a freshly rendered container.
  useEffect(() => {
    if (window.Calendly && containerRef.current) {
      window.Calendly.initInlineWidgets();
    }
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="calendly-inline-widget rounded-sm border border-graphite/20"
        data-url={url}
        style={{ minWidth: "320px", height: "700px" }}
      />
      <Script src={CALENDLY_SCRIPT_SRC} strategy="lazyOnload" />
    </>
  );
}
