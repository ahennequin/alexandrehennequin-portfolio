// Per-lead link tracking for the Lead CRM (OUT-7).
//
// Outreach messages carry `https://alexandrehennequin.com/r/<code>`. Following
// that link redirects to the home page and reports a signed `click` to the CRM.
// Nothing else is tracked: no cookie, no open pixels, no third-party trackers.
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

/** Report timeout. Reports always run after the response is sent. */
export const REPORT_TIMEOUT_MS = 3000;

// Mail security scanners, link previewers and scripts follow links on their
// own; their requests are not reported.
const BOT_PATTERN = /bot|crawl|spider|preview|scan|monitor|curl|wget|python|headless|http-client|fetch/i;

export type CrmEvent = {
  eventId: string;
  code: string;
  kind: "click";
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

export function newClick(code: string): CrmEvent {
  return { eventId: randomUUID(), code, kind: "click" };
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
 * it hands the `click` report to `schedule`, which runs it after the response
 * is sent (`after()` in the route handler).
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
    try {
      schedule(() => reportToCrm(newClick(code), deps));
    } catch {
      // Scheduling must never break the redirect.
    }
  }

  return new Response(null, { status: 302, headers });
}
