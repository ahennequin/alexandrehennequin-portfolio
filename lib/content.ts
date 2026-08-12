import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import type { Locale } from "./i18n";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PROJECTS_DIR = path.join(CONTENT_DIR, "projects");

export type CvData = {
  name: string;
  titles: string[];
  tagline: string;
  summary: string;
  email: string;
  location: string;
  linkedin: string;
  github: string;
  scholar: string;
  languages: { name: string; level: string }[];
  skills: { category: string; items: string[] }[];
  experience: {
    role: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    challenge: string;
    actions: string[];
    impact: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
    details: string;
    link?: string;
  }[];
  interests: string[];
};

export type ProjectFrontmatter = {
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  client: string;
  clientVisible: boolean;
  kind?: "delivery" | "research";
  year: number;
  role: string;
  tech: string[];
  status: string;
  link?: string;
};

export type Project = {
  frontmatter: ProjectFrontmatter;
  content: string;
};

type CvFile = Record<Locale, CvData>;

let cvFileCache: CvFile | null = null;
const projectsCache = new Map<Locale, Project[]>();

export async function getCv(locale: Locale = "en"): Promise<CvData> {
  if (!cvFileCache) {
    const raw = await fs.readFile(path.join(CONTENT_DIR, "cv.json"), "utf-8");
    cvFileCache = JSON.parse(raw) as CvFile;
  }
  return cvFileCache[locale] ?? cvFileCache.en;
}

export async function getProjects(locale: Locale = "en"): Promise<Project[]> {
  if (projectsCache.has(locale)) return projectsCache.get(locale)!;
  const dir = path.join(PROJECTS_DIR, locale);
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".mdx"));
  const projects: Project[] = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);
    projects.push({ frontmatter: data as unknown as ProjectFrontmatter, content });
  }
  const sorted = projects.sort(
    (a, b) => (b.frontmatter.year ?? 0) - (a.frontmatter.year ?? 0)
  );
  projectsCache.set(locale, sorted);
  return sorted;
}

export async function getProject(
  slug: string,
  locale: Locale = "en"
): Promise<Project | undefined> {
  const projects = await getProjects(locale);
  return projects.find((p) => p.frontmatter.slug === slug);
}

export function getProjectFile(slug: string, locale: Locale = "en"): string {
  return `${locale}/${slug}.mdx`;
}
