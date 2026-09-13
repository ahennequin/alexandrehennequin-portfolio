import { getCv } from "@/lib/content";
import { getMessages, type Locale } from "@/lib/i18n";
import WaveformDivider from "@/components/WaveformDivider";
import CalendlyEmbed from "@/components/CalendlyEmbed";

const CALENDLY_URL =
  "https://calendly.com/alexandredothennequin/new-meeting?hide_event_type_details=1&hide_gdpr_banner=1";

export default async function ContactPage({ locale }: { locale: Locale }) {
  const cv = await getCv(locale);
  const t = getMessages(locale);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
        {t.contact.eyebrow}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {t.contact.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-graphite">
        {t.contact.intro}
      </p>
      <WaveformDivider className="mt-10 text-signal" />

      <div className="mt-12 max-w-2xl space-y-6">
        {[
          {
            label: t.contact.email,
            value: cv.email,
            href: `mailto:${cv.email}`,
          },
          {
            label: t.contact.linkedin,
            value: cv.linkedin.replace(/^https?:\/\//, "").replace(/\/$/, ""),
            href: cv.linkedin,
          },
          {
            label: t.contact.github,
            value: cv.github.replace(/^https?:\/\//, "").replace(/\/$/, ""),
            href: cv.github,
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
        {cv.location}. {t.contact.note}
      </p>

      <WaveformDivider className="mt-16 text-signal" />

      <div className="mt-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          {t.contact.schedule}
        </h2>
        <div className="mt-6">
          <CalendlyEmbed url={CALENDLY_URL} />
        </div>
      </div>
    </div>
  );
}
