import Link from "next/link";
import { getCv, getProjects } from "@/lib/content";
import { getMessages, localizedPath, type Locale } from "@/lib/i18n";
import WaveformDivider from "@/components/WaveformDivider";

export default async function HomePage({ locale }: { locale: Locale }) {
  const cv = await getCv(locale);
  const projects = await getProjects(locale);
  const t = getMessages(locale);

  return (
    <div className="mx-auto max-w-4xl px-6">
      <section className="py-20 sm:py-28">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          {cv.titles.join(" · ")}
        </p>
        <h1 className="mt-6 font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
          {cv.name}
        </h1>
        <p className="mt-6 max-w-xl font-display text-xl leading-relaxed text-graphite sm:text-2xl">
          {cv.tagline}
        </p>
        <WaveformDivider className="mt-10 text-signal" />
        <p className="mt-10 max-w-2xl text-lg leading-relaxed">{cv.summary}</p>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.15em] text-graphite">
          {cv.location}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={localizedPath(locale, "/cv")}
            className="border border-signal px-5 py-2.5 text-sm font-medium text-signal transition-colors hover:bg-signal hover:text-paper"
          >
            {t.home.viewCv}
          </Link>
          <Link
            href={localizedPath(locale, "/projects")}
            className="border border-graphite/30 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            {t.home.projects}
          </Link>
        </div>
      </section>

      <section className="border-t border-graphite/20 py-16 sm:py-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          {t.home.focusAreas}
        </h2>
        <div className="mt-8 grid gap-10 sm:grid-cols-2">
          {cv.skills.slice(0, 4).map((category) => (
            <div key={category.category}>
              <h3 className="font-display text-lg font-semibold">
                {category.category}
              </h3>
              <ul className="mt-3 space-y-1.5 font-mono text-xs text-graphite">
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-graphite/20 py-16 sm:py-20">
        <div className="flex items-end justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
            {t.home.selectedProjects}
          </h2>
          <Link
            href={localizedPath(locale, "/projects")}
            className="font-mono text-xs text-graphite hover:text-signal"
          >
            {t.home.allProjects}
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {projects.slice(0, 3).map((project) => (
            <Link
              key={project.frontmatter.slug}
              href={localizedPath(locale, `/projects/${project.frontmatter.slug}`)}
              className="group border border-graphite/20 p-6 transition-colors hover:border-signal"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-graphite">
                {project.frontmatter.client} · {project.frontmatter.year}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold group-hover:text-signal">
                {project.frontmatter.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-graphite">
                {project.frontmatter.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
