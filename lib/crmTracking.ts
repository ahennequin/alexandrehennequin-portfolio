// Per-lead link tracking for the Lead CRM (OUT-7).
//
// Outreach messages carry `https://alexandrehennequin.com/r/<code>`. Following
// that link redirects to the home page and reports a signed `click` to the CRM;
// pages viewed afterwards in the same browsing session are reported as
// `visit`s. Nothing else is tracked: no open pixels, no third-party trackers.
//
// Server-side only. `CRM_TRACKING_SECRET` must never reach the browser.
//
// Contract: POST <CRM_URL>/api/portfolio-events with
//   X-Portfolio-Timestamp: <unix seconds>
//   X-Portfolio-Signature: hex HMAC-SHA256("<timestamp>.<raw body>", secret)
// Failures are ignored: a lost report only loses a statistic.

import { createHmac, randomUUID } from "node:crypto";

/** 10 lowercase hex characters, one per Lead. */
export const CODE_PATTERN = /^[0-9a-f]{10}$/;

/** Session cookie remembering the code, so later page views can be reported. */
export const REF_COOKIE = "lc_ref";
/** 30 minutes: one browsing session. */
export const REF_COOKIE_MAX_AGE = 1800;

/** Report timeout. Reports always run after the response is sent. */
export const REPORT_TIMEOUT_MS = 3000;

// Mail security scanners, link previewers and scripts follow links on their
// own; their requests are not reported.
const BOT_PATTERN = /bot|crawl|spider|preview|scan|monitor|curl|wget|python|headless|http-client|fetch/i;

export type CrmEvent = {
  eventId: string;
  code: string;
  kind: "click" | "visit";
  path?: string;
};

export type ReportDeps = {
  crmUrl?: string;
  secret?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

export function isValidCode(code: unknown): code is string {
  return typeof code === "string" && CODE_PATTERN.test(code);
}

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

/** Hex HMAC-SHA256 of `<timestamp>.<body>`, keyed with the shared secret. */
export function signReport(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function newEvent(code: string, kind: CrmEvent["kind"], path?: string): CrmEvent {
  return path === undefined
    ? { eventId: randomUUID(), code, kind }
    : { eventId: randomUUID(), code, kind, path };
}

/**
 * Sends one signed report to the CRM. Never throws and never rejects: an unset
 * configuration, network error, timeout or non-2xx answer is silently ignored.
 * Returns whether a request was attempted and answered with 2xx (for tests).
 */
export async function reportToCrm(event: CrmEvent, deps: ReportDeps = {}): Promise<boolean> {
  const crmUrl = deps.crmUrl ?? process.env.CRM_URL;
  const secret = deps.secret ?? process.env.CRM_TRACKING_SECRET;
  if (!crmUrl || !secret) return false;

  try {
    const body = JSON.stringify(event);
    const timestamp = String(Math.floor((deps.now ?? Date.now)() / 1000));
    const response = await (deps.fetchImpl ?? fetch)(
      new URL("/api/portfolio-events", crmUrl),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Portfolio-Timestamp": timestamp,
          "X-Portfolio-Signature": signReport(secret, timestamp, body),
        },
        body,
        signal: AbortSignal.timeout(REPORT_TIMEOUT_MS),
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Handles `GET /r/<code>`: always answers with a 302 to the home page (the
 * destination never carries the code). For a valid code and a non-bot visitor,
 * it sets the session cookie and hands the `click` report to `schedule`, which
 * runs it after the response is sent (`after()` in the route handler).
 */
export function handleLeadLink(
  requestUrl: string,
  code: string,
  userAgent: string | null,
  schedule: (task: () => Promise<unknown>) => void,
  deps: ReportDeps = {}
): Response {
  const headers = new Headers({
    Location: new URL("/", requestUrl).toString(),
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
  });

  if (isValidCode(code) && !isLikelyBot(userAgent)) {
    const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
    headers.append(
      "Set-Cookie",
      `${REF_COOKIE}=${code}; Path=/; Max-Age=${REF_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`
    );
    try {
      schedule(() => reportToCrm(newEvent(code, "click"), deps));
    } catch {
      // Scheduling must never break the redirect.
    }
  }

  return new Response(null, { status: 302, headers });
}

/**
 * Whether a request through the proxy is a page view worth a `visit` report:
 * a GET for a page (not an asset, API call or prefetch) by a non-bot visitor
 * carrying a valid session cookie.
 */
export function visitToReport(request: {
  method: string;
  pathname: string;
  refCookie: string | undefined;
  headers: Headers;
}): CrmEvent | null {
  const { method, pathname, refCookie, headers } = request;
  if (method !== "GET" || !isValidCode(refCookie)) return null;
  if (isLikelyBot(headers.get("user-agent"))) return null;
  if (
    headers.get("next-router-prefetch") ||
    headers.get("purpose") === "prefetch" ||
    headers.get("sec-purpose")?.includes("prefetch")
  ) {
    return null;
  }
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/r/") ||
    /\.[^/]+$/.test(pathname)
  ) {
    return null;
  }
  return newEvent(refCookie, "visit", pathname);
}
