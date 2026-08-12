import Link from "next/link";
import { getCv } from "@/lib/content";
import { getMessages, localizedPath, type Locale } from "@/lib/i18n";
import WaveformDivider from "@/components/WaveformDivider";
import ExternalLinkIcon from "@/components/ExternalLinkIcon";

function formatDate(iso: string, months: readonly string[]): string {
  if (!/^\d{4}-\d{2}$/.test(iso)) return iso;
  const [year, month] = iso.split("-");
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function dateRange(
  start: string,
  end: string,
  months: readonly string[],
  presentLabel: string
): string {
  return `${formatDate(start, months)} — ${
    end === "Present" ? presentLabel : formatDate(end, months)
  }`;
}

export default async function CvPage({ locale }: { locale: Locale }) {
  const cv = await getCv(locale);
  const t = getMessages(locale);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
        {t.cv.eyebrow}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {cv.name}
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-graphite">
        {cv.titles.join(" · ")} — {cv.location}
      </p>
      <WaveformDivider className="mt-10 text-signal" />

      <section className="mt-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          {t.cv.summary}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed">{cv.summary}</p>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          {t.cv.experience}
        </h2>
        <div className="mt-6 space-y-12">
          {cv.experience.map((exp) => (
            <div
              key={`${exp.role}-${exp.company}`}
              className="grid gap-2 sm:grid-cols-[1fr_11rem] sm:gap-8"
            >
              <div>
                <h3 className="font-display text-2xl font-semibold">
                  {exp.role}
                </h3>
                <p className="mt-1 font-mono text-sm text-graphite">
                  {exp.company}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed">
                  {exp.challenge}
                </p>
                <ul className="mt-3 space-y-2 text-[15px] leading-relaxed">
                  {exp.actions.map((action) => (
                    <li key={action} className="flex gap-3">
                      <span className="mt-[9px] block h-1 w-1 shrink-0 rounded-full bg-signal" />
                      {action}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-l-2 border-signal pl-4">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
                    {t.cv.impact}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[15px] font-medium leading-relaxed text-signal">
                    {exp.impact.map((impact) => (
                      <li key={impact}>{impact}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <aside className="font-mono text-xs text-graphite sm:pt-2 sm:text-right">
                <p>{dateRange(exp.startDate, exp.endDate, t.months, t.cv.present)}</p>
                <p className="mt-1">{exp.location}</p>
              </aside>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          {t.cv.skills}
        </h2>
        <div className="mt-6 grid gap-10 sm:grid-cols-2">
          {cv.skills.map((category) => (
            <div key={category.category}>
              <h3 className="font-display text-lg font-semibold">
                {category.category}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {category.items.map((item) => (
                  <span
                    key={item}
                    className="border border-graphite/30 px-2.5 py-1 font-mono text-[11px] text-graphite"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
            {t.cv.education}
          </h2>
          <Link
            href={cv.scholar}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-signal hover:underline"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            {t.cv.scholar}
          </Link>
        </div>
        <div className="mt-6 space-y-6">
          {cv.education.map((edu) => (
            <div
              key={edu.degree}
              className="grid gap-2 sm:grid-cols-[1fr_11rem] sm:gap-8"
            >
              <div>
                <h3 className="font-display text-xl font-semibold">
                  {edu.degree}
                </h3>
                <p className="mt-1 text-[15px] text-graphite">
                  {edu.institution} — {edu.details}
                </p>
                {edu.link && (
                  <Link
                    href={edu.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-signal hover:underline"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    {t.cv.thesis}
                  </Link>
                )}
              </div>
              <aside className="font-mono text-xs text-graphite sm:text-right">
                <p>
                  {edu.startDate} — {edu.endDate}
                </p>
              </aside>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          {t.cv.languagesInterests}
        </h2>
        <div className="mt-6 grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-lg font-semibold">
              {t.cv.languages}
            </h3>
            <ul className="mt-3 space-y-1.5 font-mono text-xs text-graphite">
              {cv.languages.map((lang) => (
                <li key={lang.name}>
                  {lang.name} — {lang.level}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">
              {t.cv.interests}
            </h3>
            <ul className="mt-3 space-y-1.5 font-mono text-xs text-graphite">
              {cv.interests.map((interest) => (
                <li key={interest}>{interest}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <p className="mt-16 font-mono text-xs text-graphite">
        {t.cv.note}{" "}
        <Link
          href={localizedPath(locale, "/contact")}
          className="text-signal hover:underline"
        >
          {t.cv.contact}
        </Link>
      </p>
    </div>
  );
}
