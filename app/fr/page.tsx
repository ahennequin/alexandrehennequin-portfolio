import type { Metadata } from "next";
import HomePage from "@/components/pages/HomePage";

export const metadata: Metadata = {
  title: "Alexandre Hennequin — Consultant IA & Data Science",
  description:
    "Consultant indépendant en IA/Data Science basé à Marseille, France — formé à la recherche en sciences cognitives (PhD, CNRS), construit des systèmes LLM, des pipelines RAG et des plateformes de données fiables en production.",
};

export default function Page() {
  return <HomePage locale="fr" />;
}
