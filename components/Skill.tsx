import type { ReactNode } from "react";

export default function Skill({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-ember">{children}</span>;
}
