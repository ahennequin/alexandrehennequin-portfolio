import type { Metadata } from "next";
import PrivacyPage from "@/components/pages/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy — Alexandre Hennequin",
  description:
    "How Alexandre Hennequin processes the data of professionals he contacts and of visitors to this site, and how to exercise your rights.",
};

export default function Page() {
  return <PrivacyPage locale="en" />;
}
