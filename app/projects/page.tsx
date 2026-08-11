import Link from "next/link";
import { getProjects } from "@/lib/content";
import WaveformDivider from "@/components/WaveformDivider";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
        Case studies
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Projects
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-graphite">
        Selected engagements. Confidentiality applies to regulated client work —
        names are used where permitted, technical specifics stay general.
      </p>
      <WaveformDivider className="mt-10 text-signal" />

      <div className="mt-12 space-y-6">
        {projects.map((project) => {
          const { frontmatter } = project;
          return (
            <Link
              key={frontmatter.slug}
              href={`/projects/${frontmatter.slug}`}
              className="group grid gap-3 border border-graphite/20 p-6 transition-colors hover:border-signal sm:grid-cols-[1fr_10rem] sm:gap-8"
            >
              <div>
                <h2 className="font-display text-2xl font-semibold group-hover:text-signal">
                  {frontmatter.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-graphite">
                  {frontmatter.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {frontmatter.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-graphite/30 px-2 py-0.5 font-mono text-[11px] text-graphite"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <aside className="font-mono text-xs text-graphite sm:text-right">
                <p>{frontmatter.year}</p>
                <p className="mt-1">{frontmatter.client}</p>
                <p className="mt-1">{frontmatter.status}</p>
              </aside>
            </Link>
          );
        })}
      </div>
    </div>
  );
}