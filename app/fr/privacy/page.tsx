import type { Metadata } from "next";
import PrivacyPage from "@/components/pages/PrivacyPage";

export const metadata: Metadata = {
  title: "Confidentialité — Alexandre Hennequin",
  description:
    "Comment Alexandre Hennequin traite les données des professionnels qu'il contacte et des visiteurs de ce site, et comment exercer vos droits.",
};

export default function Page() {
  return <PrivacyPage locale="fr" />;
}
