"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HtmlLangSetter() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = pathname.startsWith("/fr") ? "fr" : "en";
  }, [pathname]);

  return null;
}
