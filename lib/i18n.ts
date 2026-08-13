export type Locale = "en" | "fr";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES: Locale[] = ["en", "fr"];

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}

export function localizedPath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? "/fr" : `/fr${path}`;
}

export const MESSAGES = {
  en: {
    header: {
      home: "Home",
      cv: "CV",
      projects: "Projects",
      contact: "Contact",
    },
    footer: {
      contact: "contact",
      linkedin: "linkedin",
      github: "github",
    },
    home: {
      viewCv: "View CV",
      projects: "Projects",
      focusAreas: "Focus areas",
      selectedProjects: "Selected projects",
      allProjects: "all projects →",
      photoAlt: "Portrait of Alexandre Hennequin",
    },
    cv: {
      eyebrow: "Curriculum vitae",
      summary: "Summary",
      experience: "Experience",
      skills: "Skills",
      education: "Education",
      publications: "Peer-reviewed publications",
      thesis: "Thesis",
      scholar: "Google Scholar",
      languagesInterests: "Languages & interests",
      languages: "Languages",
      interests: "Interests",
      present: "Present",
      impact: "Impact",
      note: "Full professional history available on request.",
      contact: "Get in touch →",
    },
    projects: {
      eyebrow: "Case studies",
      title: "Projects",
      intro:
        "Selected projects — client engagements and published research. Confidentiality applies to regulated client work — names are used where permitted, technical specifics stay general.",
      confidential: "Confidential",
      research: "Research",
      year: "Year",
      client: "Client",
      role: "Role",
      status: "Status",
      stack: "Stack",
      link: "Link",
    },
    project: {
      eyebrow: "Case study",
    },
    contact: {
      eyebrow: "Contact",
      title: "Let's talk",
      intro:
        "Open to consulting engagements — LLM systems, RAG pipelines, and data platform work, from scoping through production.",
      email: "Email",
      linkedin: "LinkedIn",
      github: "GitHub",
      note: "Available for remote and on-site engagements across France and Europe.",
    },
    chat: {
      title: "Portfolio assistant",
      subtitle: "RAG over this site's content",
      close: "close",
      placeholder: "Ask about CV, skills, projects…",
      send: "send",
      ask: "ask ↗",
      greeting:
        "Hi — I'm a RAG assistant that answers questions about Alexandre's CV, skills, and projects from this site's content. Ask me anything about his background or work.",
      suggestions: [
        "What does Alex do?",
        "Tell me about the O-Kidia project",
        "What stack does he use?",
        "What is the foncier RAG project?",
      ],
      error: "Something went wrong. Please try again.",
      networkError: "Could not reach the assistant. Please try again.",
    },
    months: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
  },
  fr: {
    header: {
      home: "Accueil",
      cv: "CV",
      projects: "Projets",
      contact: "Contact",
    },
    footer: {
      contact: "contact",
      linkedin: "linkedin",
      github: "github",
    },
    home: {
      viewCv: "Voir le CV",
      projects: "Projets",
      focusAreas: "Domaines d'intervention",
      selectedProjects: "Projets sélectionnés",
      allProjects: "tous les projets →",
      photoAlt: "Portrait d'Alexandre Hennequin",
    },
    cv: {
      eyebrow: "Curriculum vitae",
      summary: "Résumé",
      experience: "Expérience",
      skills: "Compétences",
      education: "Formation",
      publications: "Publications évaluées par les pairs",
      thesis: "Thèse",
      scholar: "Google Scholar",
      languagesInterests: "Langues & centres d'intérêt",
      languages: "Langues",
      interests: "Centres d'intérêt",
      present: "Aujourd'hui",
      impact: "Impact",
      note: "Historique professionnel complet sur demande.",
      contact: "Contactez-moi →",
    },
    projects: {
      eyebrow: "Études de cas",
      title: "Projets",
      intro:
        "Sélection de projets — missions clients et recherche publiée. La confidentialité s'applique aux missions réglementées — les noms des clients sont cités lorsque c'est autorisé, les détails techniques restent généraux.",
      confidential: "Confidentiel",
      research: "Recherche",
      year: "Année",
      client: "Client",
      role: "Rôle",
      status: "Statut",
      stack: "Stack",
      link: "Lien",
    },
    project: {
      eyebrow: "Étude de cas",
    },
    contact: {
      eyebrow: "Contact",
      title: "Parlons-en",
      intro:
        "Ouvert aux missions de conseil — systèmes LLM, pipelines RAG et plateformes de données, du cadrage à la mise en production.",
      email: "Email",
      linkedin: "LinkedIn",
      github: "GitHub",
      note: "Disponible pour des missions à distance et sur site, partout en France et en Europe.",
    },
    chat: {
      title: "Assistant du portfolio",
      subtitle: "RAG sur le contenu de ce site",
      close: "fermer",
      placeholder: "Posez une question sur le CV, les compétences, les projets…",
      send: "envoyer",
      ask: "demander ↗",
      greeting:
        "Bonjour — je suis un assistant RAG qui répond aux questions sur le CV, les compétences et les projets d'Alexandre, à partir du contenu de ce site. Posez-moi n'importe quelle question sur son parcours ou son travail.",
      suggestions: [
        "Que fait Alex ?",
        "Parle-moi du projet O-Kidia",
        "Quelle stack utilise-t-il ?",
        "C'est quoi le projet RAG foncier ?",
      ],
      error: "Une erreur est survenue. Veuillez réessayer.",
      networkError: "Impossible de joindre l'assistant. Veuillez réessayer.",
    },
    months: [
      "janv.", "févr.", "mars", "avr.", "mai", "juin",
      "juil.", "août", "sept.", "oct.", "nov.", "déc.",
    ],
  },
} as const;

export type Messages = (typeof MESSAGES)[Locale];

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
