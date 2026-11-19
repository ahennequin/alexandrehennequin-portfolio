// Reports `visit`s to the Lead CRM (OUT-7) for pages viewed after following a
// per-lead link. Runs only for requests carrying the `lc_ref` session cookie
// set by /r/<code>; every other visitor is untouched. Reports are sent after
// the response via waitUntil and never block or fail the page.

import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { REF_COOKIE, reportToCrm, visitToReport } from "@/lib/crmTracking";

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const visit = visitToReport({
    method: request.method,
    pathname: request.nextUrl.pathname,
    refCookie: request.cookies.get(REF_COOKIE)?.value,
    headers: request.headers,
  });
  if (visit) event.waitUntil(reportToCrm(visit));
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: "/((?!api/|_next/|r/|.*\\..*).*)",
      has: [{ type: "cookie", key: "lc_ref" }],
    },
  ],
};
