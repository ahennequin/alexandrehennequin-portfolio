import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

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
  languages: { name: string; level: string }[];
  skills: { category: string; items: string[] }[];
  experience: {
    role: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    startDate: string;
    endDate: string;
    details: string;
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
  year: number;
  role: string;
  tech: string[];
  status: string;
};

export type Project = {
  frontmatter: ProjectFrontmatter;
  content: string;
};

let cvCache: CvData | null = null;
let projectsCache: Project[] | null = null;

export async function getCv(): Promise<CvData> {
  if (cvCache) return cvCache;
  const raw = await fs.readFile(path.join(CONTENT_DIR, "cv.json"), "utf-8");
  cvCache = JSON.parse(raw) as CvData;
  return cvCache;
}

export async function getProjects(): Promise<Project[]> {
  if (projectsCache) return projectsCache;
  const files = (await fs.readdir(PROJECTS_DIR)).filter((f) => f.endsWith(".mdx"));
  const projects: Project[] = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(PROJECTS_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    projects.push({ frontmatter: data as unknown as ProjectFrontmatter, content });
  }
  projectsCache = projects.sort((a, b) => (b.frontmatter.year ?? 0) - (a.frontmatter.year ?? 0));
  return projectsCache;
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.frontmatter.slug === slug);
}

export function getProjectFile(slug: string): string {
  return `${slug}.mdx`;
}