import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  handleLeadLink,
  isValidCode,
  reportToCrm,
  signReport,
  visitToReport,
  type CrmEvent,
} from "./crmTracking.ts";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const SECRET = "test-secret-0123456789abcdefghijklmnop";

test("code format: exactly 10 lowercase hex characters", () => {
  assert.equal(isValidCode("3f9a1c0b2e"), true);
  assert.equal(isValidCode("0000000000"), true);
  for (const bad of ["3F9A1C0B2E", "3f9a1c0b2", "3f9a1c0b2e0", "3f9a1c0b2g", "", "../etc/pas", " 3f9a1c0b2e", undefined, 42]) {
    assert.equal(isValidCode(bad), false, String(bad));
  }
});

test("signature: hex HMAC-SHA256 of '<timestamp>.<raw body>' keyed with the secret", () => {
  const body = '{"eventId":"8c1d0c52-5d0e-4a8e-9b0e-3d1f2a7c9e11","code":"3f9a1c0b2e","kind":"click"}';
  const expected = createHmac("sha256", SECRET).update(`1700000000.${body}`).digest("hex");
  assert.equal(signReport(SECRET, "1700000000", body), expected);
  assert.match(expected, /^[0-9a-f]{64}$/);
});

test("report: signed POST to <CRM_URL>/api/portfolio-events matching the contract", async () => {
  let captured: { url: string; init: RequestInit } | undefined;
  const fetchImpl = (async (url: URL, init: RequestInit) => {
    captured = { url: String(url), init };
    return new Response('{"result":"recorded"}', { status: 200 });
  }) as unknown as typeof fetch;
  const event: CrmEvent = { eventId: "8c1d0c52-5d0e-4a8e-9b0e-3d1f2a7c9e11", code: "3f9a1c0b2e", kind: "click" };

  const ok = await reportToCrm(event, { crmUrl: "https://crm.example.com", secret: SECRET, fetchImpl, now: () => 1_700_000_000_500 });

  assert.equal(ok, true);
  assert.ok(captured);
  assert.equal(captured.url, "https://crm.example.com/api/portfolio-events");
  assert.equal(captured.init.method, "POST");
  const headers = new Headers(captured.init.headers);
  const body = captured.init.body as string;
  assert.deepEqual(JSON.parse(body), event);
  assert.ok(Buffer.byteLength(body) <= 2048);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("x-portfolio-timestamp"), "1700000000");
  assert.equal(
    headers.get("x-portfolio-signature"),
    createHmac("sha256", SECRET).update(`1700000000.${body}`).digest("hex")
  );
});

test("report: does nothing when CRM_URL or the secret is unset", async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    return new Response(null);
  }) as unknown as typeof fetch;
  const event: CrmEvent = { eventId: "abcdefgh", code: "3f9a1c0b2e", kind: "click" };
  assert.equal(await reportToCrm(event, { crmUrl: "https://crm.example.com", secret: "", fetchImpl }), false);
  assert.equal(await reportToCrm(event, { crmUrl: "", secret: SECRET, fetchImpl }), false);
  assert.equal(calls, 0);
});

test("report: never throws when the CRM is down or refuses", async () => {
  const event: CrmEvent = { eventId: "abcdefgh", code: "3f9a1c0b2e", kind: "click" };
  const down = (async () => {
    throw new TypeError("fetch failed: ECONNREFUSED");
  }) as unknown as typeof fetch;
  const refusing = (async () => new Response(null, { status: 503 })) as unknown as typeof fetch;
  assert.equal(await reportToCrm(event, { crmUrl: "https://crm.example.com", secret: SECRET, fetchImpl: down }), false);
  assert.equal(await reportToCrm(event, { crmUrl: "https://crm.example.com", secret: SECRET, fetchImpl: refusing }), false);
  assert.equal(await reportToCrm(event, { crmUrl: "not a url", secret: SECRET, fetchImpl: down }), false);
});

test("redirect: 302 to the home page with the cookie, click scheduled after the response", async () => {
  const scheduled: Array<() => Promise<unknown>> = [];
  const response = handleLeadLink("https://alexandrehennequin.com/r/3f9a1c0b2e", "3f9a1c0b2e", BROWSER_UA, (task) => scheduled.push(task), {
    crmUrl: "https://crm.example.com",
    secret: SECRET,
    fetchImpl: (async () => new Response(null)) as unknown as typeof fetch,
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://alexandrehennequin.com/");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /^lc_ref=3f9a1c0b2e; Path=\/; Max-Age=1800; HttpOnly; SameSite=Lax; Secure$/);
  assert.equal(scheduled.length, 1);
  assert.equal(await scheduled[0](), true);
});

test("redirect: works and returns at once when the CRM is down or unreachable", async () => {
  // A CRM that never answers: the redirect must not wait for it.
  const hanging = ((_: URL, init: RequestInit) =>
    new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason)))) as unknown as typeof fetch;
  const failing = (async () => {
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;

  for (const fetchImpl of [hanging, failing]) {
    const pending: Promise<unknown>[] = [];
    const response = handleLeadLink("https://alexandrehennequin.com/r/3f9a1c0b2e", "3f9a1c0b2e", BROWSER_UA, (task) => pending.push(task()), {
      crmUrl: "https://crm.example.com",
      secret: SECRET,
      fetchImpl,
    });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://alexandrehennequin.com/");
    // The background report settles to false instead of rejecting.
    assert.deepEqual(await Promise.all(pending), [false]);
  }
});

test("redirect: works with the secret unset and when scheduling itself throws", () => {
  const unset = handleLeadLink("https://alexandrehennequin.com/r/3f9a1c0b2e", "3f9a1c0b2e", BROWSER_UA, (task) => void task(), { crmUrl: "", secret: "" });
  assert.equal(unset.status, 302);
  const broken = handleLeadLink("https://alexandrehennequin.com/r/3f9a1c0b2e", "3f9a1c0b2e", BROWSER_UA, () => {
    throw new Error("after() unavailable");
  });
  assert.equal(broken.status, 302);
  assert.equal(broken.headers.get("location"), "https://alexandrehennequin.com/");
});

test("redirect: invalid codes and bots are redirected without cookie or report", () => {
  for (const [code, ua] of [
    ["3F9A1C0B2E", BROWSER_UA],
    ["nothex!!!!", BROWSER_UA],
    ["3f9a1c0b2e", "Mozilla/5.0 (compatible; Googlebot/2.1)"],
    ["3f9a1c0b2e", "Barracuda link scanner"],
    ["3f9a1c0b2e", null],
  ] as const) {
    let scheduled = 0;
    const response = handleLeadLink("https://alexandrehennequin.com/r/x", code, ua, () => scheduled++);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://alexandrehennequin.com/");
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(scheduled, 0);
  }
});

test("redirect: no Secure flag on plain-http local development", () => {
  const response = handleLeadLink("http://localhost:3000/r/3f9a1c0b2e", "3f9a1c0b2e", BROWSER_UA, () => {});
  assert.doesNotMatch(response.headers.get("set-cookie") ?? "", /Secure/);
});

test("visit: page GETs with a valid cookie only, never assets, API calls or prefetches", () => {
  const base = { method: "GET", refCookie: "3f9a1c0b2e", headers: new Headers({ "user-agent": BROWSER_UA }) };
  const visit = visitToReport({ ...base, pathname: "/projects/rag-chat" });
  assert.ok(visit);
  assert.equal(visit.kind, "visit");
  assert.equal(visit.code, "3f9a1c0b2e");
  assert.equal(visit.path, "/projects/rag-chat");
  assert.match(visit.eventId, /^[A-Za-z0-9_-]{8,100}$/);

  assert.equal(visitToReport({ ...base, pathname: "/api/chat" }), null);
  assert.equal(visitToReport({ ...base, pathname: "/_next/static/chunk.js" }), null);
  assert.equal(visitToReport({ ...base, pathname: "/portrait.jpg" }), null);
  assert.equal(visitToReport({ ...base, pathname: "/r/3f9a1c0b2e" }), null);
  assert.equal(visitToReport({ ...base, method: "POST", pathname: "/cv" }), null);
  assert.equal(visitToReport({ ...base, refCookie: undefined, pathname: "/cv" }), null);
  assert.equal(visitToReport({ ...base, refCookie: "forged-val", pathname: "/cv" }), null);
  assert.equal(
    visitToReport({ ...base, headers: new Headers({ "user-agent": BROWSER_UA, "next-router-prefetch": "1" }), pathname: "/cv" }),
    null
  );
  assert.equal(visitToReport({ ...base, headers: new Headers({ "user-agent": "curl/8.0" }), pathname: "/cv" }), null);
});
