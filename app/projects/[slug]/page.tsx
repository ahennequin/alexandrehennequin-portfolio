import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getProjects, getProject } from "@/lib/content";
import WaveformDivider from "@/components/WaveformDivider";

export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return { title: `${project.frontmatter.title} — Alexandre Hennequin` };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const { frontmatter } = project;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_11rem] lg:gap-14">
        <article>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
            Case study
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
              options={{
                mdxOptions: {
                  format: "mdx",
                },
              }}
            />
          </div>
        </article>

        <aside className="order-first font-mono text-xs text-graphite lg:order-none lg:border-l lg:border-graphite/20 lg:pl-6">
          <dl className="space-y-4">
            <div>
              <dt className="uppercase tracking-[0.15em] text-graphite">
                Client
              </dt>
              <dd className="mt-1">
                {frontmatter.clientVisible
                  ? frontmatter.client
                  : "Confidential"}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.15em] text-graphite">Year</dt>
              <dd className="mt-1">{frontmatter.year}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.15em] text-graphite">Role</dt>
              <dd className="mt-1">{frontmatter.role}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.15em] text-graphite">
                Status
              </dt>
              <dd className="mt-1">{frontmatter.status}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.15em] text-graphite">
                Stack
              </dt>
              <dd className="mt-1">
                <ul className="space-y-1">
                  {frontmatter.tech.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}