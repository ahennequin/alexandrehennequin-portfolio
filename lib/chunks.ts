import { createHash } from "node:crypto";
import { getCv, getProjects } from "./content.ts";
import { LOCALES, type Locale } from "./i18n.ts";

export type Chunk = {
  id: string;
  text: string;
  metadata: {
    source: "cv" | "project";
    section: string;
    title: string;
    slug?: string;
    key?: string;
    lang: Locale;
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
  return sections
    .filter((s) => s.body.trim().length > 0)
    .map((s) => ({ ...s, body: s.body.replace(/<\/?[a-zA-Z][^>]*>/g, "") }));
}

async function buildChunksForLocale(locale: Locale): Promise<Chunk[]> {
  const cv = await getCv(locale);
  const projects = await getProjects(locale);
  const chunks: Chunk[] = [];

  const overviewKey = `${locale}-cv-overview`;
  chunks.push({
    id: uuidFromKey(overviewKey),
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
      key: overviewKey,
      lang: locale,
    },
  });

  for (const exp of cv.experience) {
    const key = `${locale}-cv-exp-${slugify(exp.company)}`;
    chunks.push({
      id: uuidFromKey(key),
      text: [
        `${exp.role} at ${exp.company}, ${exp.location}`,
        `Period: ${exp.startDate} — ${exp.endDate}.`,
        `Challenge: ${exp.challenge}`,
        "Actions:",
        ...exp.actions.map((a) => `- ${a}`),
        "Impact:",
        ...exp.impact.map((i) => `- ${i}`),
      ].join("\n"),
      metadata: {
        source: "cv",
        section: "Experience",
        title: `${exp.role} — ${exp.company}`,
        key,
        lang: locale,
      },
    });
  }

  for (const skill of cv.skills) {
    const key = `${locale}-cv-skills-${slugify(skill.category)}`;
    chunks.push({
      id: uuidFromKey(key),
      text: `Skills — ${skill.category}: ${skill.items.join(", ")}.`,
      metadata: {
        source: "cv",
        section: "Skills",
        title: `Skills — ${skill.category}`,
        key,
        lang: locale,
      },
    });
  }

  for (const edu of cv.education) {
    const key = `${locale}-cv-edu-${slugify(edu.institution)}`;
    chunks.push({
      id: uuidFromKey(key),
      text: `${edu.degree}, ${edu.institution}, ${edu.startDate} — ${edu.endDate}. ${edu.details}.`,
      metadata: {
        source: "cv",
        section: "Education",
        title: `${edu.degree} — ${edu.institution}`,
        key,
        lang: locale,
      },
    });
  }

  const languagesKey = `${locale}-cv-languages`;
  chunks.push({
    id: uuidFromKey(languagesKey),
    text: `Languages: ${cv.languages
      .map((l) => `${l.name} (${l.level})`)
      .join(", ")}.`,
    metadata: {
      source: "cv",
      section: "Languages",
      title: "Languages",
      key: languagesKey,
      lang: locale,
    },
  });

  const interestsKey = `${locale}-cv-interests`;
  chunks.push({
    id: uuidFromKey(interestsKey),
    text: `Interests: ${cv.interests.join(", ")}.`,
    metadata: {
      source: "cv",
      section: "Interests",
      title: "Interests",
      key: interestsKey,
      lang: locale,
    },
  });

  for (const project of projects) {
    const m = project.frontmatter;
    const clientLabel = m.clientVisible ? m.client : "Confidential";
    const orgLabel = m.kind === "research" ? "Affiliation" : "Client";
    const overviewKey = `${locale}-project-${m.slug}-overview`;

    chunks.push({
      id: uuidFromKey(overviewKey),
      text: [
        `${m.title}.`,
        `${orgLabel}: ${clientLabel}. Year: ${m.year}. Role: ${m.role}. Status: ${m.status}.`,
        `Stack: ${m.tech.join(", ")}.`,
        m.summary,
      ].join("\n"),
      metadata: {
        source: "project",
        section: "Overview",
        title: m.title,
        slug: m.slug,
        key: overviewKey,
        lang: locale,
      },
    });

    for (const section of splitMdxSections(project.content)) {
      const key = `${locale}-project-${m.slug}-${slugify(section.heading)}`;
      chunks.push({
        id: uuidFromKey(key),
        text: `${m.title} — ${section.heading}.\n\n${section.body}`,
        metadata: {
          source: "project",
          section: section.heading,
          title: m.title,
          slug: m.slug,
          key,
          lang: locale,
        },
      });
    }
  }

  return chunks;
}

export async function buildChunks(): Promise<Chunk[]> {
  const perLocale = await Promise.all(LOCALES.map(buildChunksForLocale));
  return perLocale.flat();
}
