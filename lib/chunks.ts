import { createHash } from "node:crypto";
import { getCv, getProjects } from "./content.ts";

export type Chunk = {
  id: string;
  text: string;
  metadata: {
    source: "cv" | "project";
    section: string;
    title: string;
    slug?: string;
    key?: string;
  };
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uuidFromKey(key: string): string {
  const hash = createHash("sha256").update(key).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

type MdxSection = { heading: string; body: string };

function splitMdxSections(content: string): MdxSection[] {
  const sections: MdxSection[] = [];
  const lines = content.split("\n");
  let current: MdxSection | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { heading: line.replace(/^##\s+/, ""), body: "" };
    } else if (current) {
      current.body = current.body ? `${current.body}\n${line}` : line;
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.body.trim().length > 0);
}

export async function buildChunks(): Promise<Chunk[]> {
  const cv = await getCv();
  const projects = await getProjects();
  const chunks: Chunk[] = [];

  chunks.push({
    id: uuidFromKey("cv-overview"),
    text: [
      cv.name,
      cv.titles.join(", "),
      cv.tagline,
      cv.summary,
      `${cv.location}. Contact: ${cv.email}.`,
    ].join("\n"),
    metadata: {
      source: "cv",
      section: "Overview",
      title: `${cv.name} — Overview`,
      key: "cv-overview",
    },
  });

  for (const exp of cv.experience) {
    const key = `cv-exp-${slugify(exp.company)}`;
    chunks.push({
      id: uuidFromKey(key),
      text: [
        `${exp.role} at ${exp.company}, ${exp.location}`,
        `Period: ${exp.startDate} — ${exp.endDate}.`,
        ...exp.highlights.map((h) => `- ${h}`),
      ].join("\n"),
      metadata: {
        source: "cv",
        section: "Experience",
        title: `${exp.role} — ${exp.company}`,
        key,
      },
    });
  }

  for (const skill of cv.skills) {
    const key = `cv-skills-${slugify(skill.category)}`;
    chunks.push({
      id: uuidFromKey(key),
      text: `Skills — ${skill.category}: ${skill.items.join(", ")}.`,
      metadata: {
        source: "cv",
        section: "Skills",
        title: `Skills — ${skill.category}`,
        key,
      },
    });
  }

  for (const edu of cv.education) {
    const key = `cv-edu-${slugify(edu.institution)}`;
    chunks.push({
      id: uuidFromKey(key),
      text: `${edu.degree}, ${edu.institution}, ${edu.startDate} — ${edu.endDate}. ${edu.details}.`,
      metadata: {
        source: "cv",
        section: "Education",
        title: `${edu.degree} — ${edu.institution}`,
        key,
      },
    });
  }

  chunks.push({
    id: uuidFromKey("cv-languages"),
    text: `Languages: ${cv.languages
      .map((l) => `${l.name} (${l.level})`)
      .join(", ")}.`,
    metadata: {
      source: "cv",
      section: "Languages",
      title: "Languages",
      key: "cv-languages",
    },
  });

  chunks.push({
    id: uuidFromKey("cv-interests"),
    text: `Interests: ${cv.interests.join(", ")}.`,
    metadata: {
      source: "cv",
      section: "Interests",
      title: "Interests",
      key: "cv-interests",
    },
  });

  for (const project of projects) {
    const m = project.frontmatter;
    const clientLabel = m.clientVisible ? m.client : "Confidential";
    const overviewKey = `project-${m.slug}-overview`;

    chunks.push({
      id: uuidFromKey(overviewKey),
      text: [
        `${m.title}.`,
        `Client: ${clientLabel}. Year: ${m.year}. Role: ${m.role}. Status: ${m.status}.`,
        `Stack: ${m.tech.join(", ")}.`,
        m.summary,
      ].join("\n"),
      metadata: {
        source: "project",
        section: "Overview",
        title: m.title,
        slug: m.slug,
        key: overviewKey,
      },
    });

    for (const section of splitMdxSections(project.content)) {
      const key = `project-${m.slug}-${slugify(section.heading)}`;
      chunks.push({
        id: uuidFromKey(key),
        text: `${m.title} — ${section.heading}.\n\n${section.body}`,
        metadata: {
          source: "project",
          section: section.heading,
          title: m.title,
          slug: m.slug,
          key,
        },
      });
    }
  }

  return chunks;
}