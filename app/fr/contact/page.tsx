import type { Metadata } from "next";
import ContactPage from "@/components/pages/ContactPage";

export const metadata: Metadata = {
  title: "Contact — Alexandre Hennequin",
  description:
    "Contactez Alexandre Hennequin pour des missions de conseil en IA — systèmes LLM, pipelines RAG et plateformes de données.",
};

export default function Page() {
  return <ContactPage locale="fr" />;
}
