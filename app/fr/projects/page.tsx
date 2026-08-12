import type { Metadata } from "next";
import ProjectsPage from "@/components/pages/ProjectsPage";

export const metadata: Metadata = {
  title: "Projets — Alexandre Hennequin",
  description:
    "Études de cas d'Alexandre Hennequin : pipelines de données Airflow et fondation ML pour O-Kidia, agent RAG pour un client du secteur foncier.",
};

export default function Page() {
  return <ProjectsPage locale="fr" />;
}
