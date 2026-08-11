import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-graphite/20">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8 font-mono text-xs text-graphite sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Alexandre Hennequin — Lyon, France</p>
        <div className="flex items-center gap-5">
          <Link href="/contact" className="hover:text-signal">
            contact
          </Link>
          <a
            href="https://www.linkedin.com/in/alexandrehennequin"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-signal"
          >
            linkedin ↗
          </a>
          <a
            href="https://github.com/alexandrehennequin"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-signal"
          >
            github ↗
          </a>
        </div>
      </div>
    </footer>
  );
}