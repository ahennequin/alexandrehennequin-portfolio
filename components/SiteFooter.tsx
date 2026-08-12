"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import ExternalLinkIcon from "@/components/ExternalLinkIcon";

export default function SiteFooter() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/fr") ? "fr" : "en";
  const t = getMessages(locale);
  const contactHref = locale === "fr" ? "/fr/contact" : "/contact";

  return (
    <footer className="border-t border-graphite/20">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8 font-mono text-xs text-graphite sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Alexandre Hennequin — Marseille, France</p>
        <div className="flex items-center gap-5">
          <Link href={contactHref} className="hover:text-signal">
            {t.footer.contact}
          </Link>
          <a
            href="https://www.linkedin.com/in/alexandrehennequin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-signal"
          >
            <ExternalLinkIcon className="h-3 w-3" />
            {t.footer.linkedin}
          </a>
          <a
            href="https://github.com/alexandrehennequin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-signal"
          >
            <ExternalLinkIcon className="h-3 w-3" />
            {t.footer.github}
          </a>
        </div>
      </div>
    </footer>
  );
}
