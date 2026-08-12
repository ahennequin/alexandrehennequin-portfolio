import type { Metadata } from "next";
import CvPage from "@/components/pages/CvPage";

export const metadata: Metadata = {
  title: "CV — Alexandre Hennequin",
  description:
    "Parcours d'Alexandre Hennequin : consultant indépendant en IA et Data Science, anciennement Lead Data Scientist chez O-Kidia, docteur en sciences cognitives.",
};

export default function Page() {
  return <CvPage locale="fr" />;
}
