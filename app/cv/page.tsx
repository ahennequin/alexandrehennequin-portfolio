import Link from "next/link";
import { getCv } from "@/lib/content";
import WaveformDivider from "@/components/WaveformDivider";

function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}$/.test(iso)) return iso;
  const [year, month] = iso.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function dateRange(start: string, end: string): string {
  return `${formatDate(start)} — ${end === "Present" ? "Present" : formatDate(end)}`;
}

export default async function CvPage() {
  const cv = await getCv();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
        Curriculum vitae
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
          Summary
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed">{cv.summary}</p>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          Experience
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
                <ul className="mt-4 space-y-2 text-[15px] leading-relaxed">
                  {exp.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3">
                      <span className="mt-[9px] block h-1 w-1 shrink-0 rounded-full bg-signal" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
              <aside className="font-mono text-xs text-graphite sm:pt-2 sm:text-right">
                <p>{dateRange(exp.startDate, exp.endDate)}</p>
                <p className="mt-1">{exp.location}</p>
              </aside>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          Skills
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
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          Education
        </h2>
        <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_11rem] sm:gap-8">
          <div>
            <h3 className="font-display text-xl font-semibold">
              {cv.education[0]?.degree}
            </h3>
            <p className="mt-1 text-[15px] text-graphite">
              {cv.education[0]?.institution} — {cv.education[0]?.details}
            </p>
          </div>
          <aside className="font-mono text-xs text-graphite sm:text-right">
            <p>
              {cv.education[0]?.startDate} — {cv.education[0]?.endDate}
            </p>
          </aside>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          Languages & interests
        </h2>
        <div className="mt-6 grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-lg font-semibold">Languages</h3>
            <ul className="mt-3 space-y-1.5 font-mono text-xs text-graphite">
              {cv.languages.map((lang) => (
                <li key={lang.name}>
                  {lang.name} — {lang.level}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Interests</h3>
            <ul className="mt-3 space-y-1.5 font-mono text-xs text-graphite">
              {cv.interests.map((interest) => (
                <li key={interest}>{interest}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <p className="mt-16 font-mono text-xs text-graphite">
        Full professional history available on request.{" "}
        <Link href="/contact" className="text-signal hover:underline">
          Get in touch →
        </Link>
      </p>
    </div>
  );
}