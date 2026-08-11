import { getCv } from "@/lib/content";
import WaveformDivider from "@/components/WaveformDivider";

export default async function ContactPage() {
  const cv = await getCv();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
        Contact
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Let&apos;s talk
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-graphite">
        Open to consulting engagements — LLM systems, RAG pipelines, and data
        platform work, from scoping through production. Based in Lyon, working
        remotely.
      </p>
      <WaveformDivider className="mt-10 text-signal" />

      <div className="mt-12 max-w-2xl space-y-6">
        {[
          {
            label: "Email",
            value: cv.email,
            href: `mailto:${cv.email}`,
          },
          {
            label: "LinkedIn",
            value: "linkedin.com/in/alexandrehennequin",
            href: "https://www.linkedin.com/in/alexandrehennequin",
          },
          {
            label: "GitHub",
            value: "github.com/alexandrehennequin",
            href: "https://github.com/alexandrehennequin",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-1 border-b border-graphite/20 pb-6 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-graphite">
              {item.label}
            </span>
            <a
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={
                item.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="font-mono text-sm text-ink hover:text-signal"
            >
              {item.value}
            </a>
          </div>
        ))}
      </div>

      <p className="mt-10 max-w-2xl font-mono text-xs leading-relaxed text-graphite">
        {cv.location}. Available for remote and on-site engagements across
        France and Europe.
      </p>
    </div>
  );
}