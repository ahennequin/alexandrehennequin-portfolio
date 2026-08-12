import { notFound } from "next/navigation";
import { getProjects, getProject } from "@/lib/content";
import ProjectDetailPage from "@/components/pages/ProjectDetailPage";

export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await getProjects("fr");
  return projects.map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug, "fr");
  if (!project) return {};
  return { title: `${project.frontmatter.title} — Alexandre Hennequin` };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug, "fr");
  if (!project) notFound();
  return <ProjectDetailPage locale="fr" slug={slug} />;
}
