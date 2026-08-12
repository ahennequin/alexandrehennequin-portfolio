"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMessages, type Locale } from "@/lib/i18n";
import FlagIcon, { type FlagCountry } from "@/components/FlagIcon";

const LANG_LINKS: { code: Locale; label: string; flag: FlagCountry }[] = [
  { code: "en", label: "EN", flag: "gb" },
  { code: "fr", label: "FR", flag: "fr" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/fr") ? "fr" : "en";
  const t = getMessages(locale);

  const links = [
    { href: "/", label: t.header.home },
    { href: "/cv", label: t.header.cv },
    { href: "/projects", label: t.header.projects },
    { href: "/contact", label: t.header.contact },
  ];

  function switchTo(code: Locale): string {
    if (code === locale) return pathname;
    if (code === "fr") return pathname === "/" ? "/fr" : `/fr${pathname}`;
    return pathname.startsWith("/fr") ? pathname.slice(3) || "/" : pathname;
  }

  return (
    <header className="border-b border-graphite/20">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link
          href={locale === "fr" ? "/fr" : "/"}
          className="font-mono text-sm font-medium tracking-tight text-ink"
        >
          Alexandre Hennequin
        </Link>
        <nav className="flex items-center gap-5">
          {links.map((link) => {
            const href = locale === "fr" && link.href !== "/" ? `/fr${link.href}` : link.href;
            const active =
              link.href === "/"
                ? pathname === "/" || pathname === "/fr"
                : pathname.startsWith(href);
            return (
              <Link
                key={link.href}
                href={href}
                className={`text-sm transition-colors ${active
                  ? "text-signal"
                  : "text-graphite hover:text-ink"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="h-4 w-px bg-graphite/30" />
          {LANG_LINKS.map((lang) => {
            const active = lang.code === locale;
            return (
              <Link
                key={lang.code}
                href={switchTo(lang.code)}
                className={`flex items-center gap-1.5 font-mono text-xs transition-colors ${active
                  ? "text-signal"
                  : "text-graphite hover:text-ink"
                  }`}
              >
                <FlagIcon country={lang.flag} className="h-3 w-auto" />
                {lang.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
