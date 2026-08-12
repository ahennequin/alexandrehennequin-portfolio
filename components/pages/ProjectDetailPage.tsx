import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getProject } from "@/lib/content";
import { getMessages, type Locale } from "@/lib/i18n";
import WaveformDivider from "@/components/WaveformDivider";
import Skill from "@/components/Skill";
import ExternalLinkIcon from "@/components/ExternalLinkIcon";

export default async function ProjectDetailPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const project = await getProject(slug, locale);
  if (!project) notFound();
  const t = getMessages(locale);

  const { frontmatter } = project;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_13rem] lg:gap-14">
        <article>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
            {t.project.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {frontmatter.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-graphite">
            {frontmatter.summary}
          </p>
          <WaveformDivider className="mt-8 text-signal" />
          <div className="mdx mt-10">
            <MDXRemote
              source={project.content}
              components={{ Skill }}
              options={{
                mdxOptions: {
                  format: "mdx",
                },
              }}
            />
          </div>
        </article>

        <aside className="order-first text-sm text-graphite lg:order-none lg:border-l lg:border-graphite/20 lg:pl-6">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-graphite">
                {frontmatter.kind === "research"
                  ? t.projects.research
                  : t.projects.client}
              </dt>
              <dd className="mt-1 text-base">
                {frontmatter.clientVisible
                  ? frontmatter.client
                  : t.projects.confidential}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-graphite">
                {t.projects.year}
              </dt>
              <dd className="mt-1 text-base">{frontmatter.year}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-graphite">
                {t.projects.role}
              </dt>
              <dd className="mt-1 text-base">{frontmatter.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-graphite">
                {t.projects.status}
              </dt>
              <dd className="mt-1 text-base">{frontmatter.status}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-graphite">
                {t.projects.stack}
              </dt>
              <dd className="mt-1 text-base">
                <ul className="space-y-1">
                  {frontmatter.tech.map((tech) => (
                    <li key={tech} className="text-ember">
                      {tech}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            {frontmatter.link && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-graphite">
                  {t.projects.link}
                </dt>
                <dd className="mt-1">
                  <Link
                    href={frontmatter.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-signal hover:underline"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    {t.cv.scholar}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </div>
  );
}
