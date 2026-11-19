// Per-lead link from Lead CRM outreach messages (OUT-7): /r/<10 hex chars>.
// Redirects to the home page and reports the click after the response is sent,
// so an unreachable CRM or an unset secret never delays or breaks the redirect.

import { after, type NextRequest } from "next/server";
import { handleLeadLink } from "@/lib/crmTracking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  return handleLeadLink(
    request.url,
    code,
    request.headers.get("user-agent"),
    (task) => after(task)
  );
}

// Link checkers often probe with HEAD: redirect without recording anything.
export async function HEAD(request: NextRequest) {
  return handleLeadLink(request.url, "", null, () => {});
}
