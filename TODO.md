# TODO — Architecture deepening

From the architecture review on 2026-08-27. Candidate 1 (collapse the answer
pipeline into `lib/retrieval.ts`) and Candidate 2 (give the chunk payload one
owned schema in `lib/vectorIndex.ts`) are done. The two below are queued.

Vocabulary: **module** (interface + implementation), **interface** (everything a
caller must know), **deep** (much behaviour, small interface), **shallow**
(interface ~ implementation), **seam** (where behaviour can be swapped without
editing in place), **adapter** (satisfies an interface at a seam), **leverage**
(capability per unit of interface learned), **locality** (change/bugs concentrate
in one place).

---

## 3 · Deepen i18n with the operations callers reimplement — `Worth exploring`

**Files:** `lib/i18n.ts`, `components/SiteHeader.tsx`, `components/SiteFooter.tsx`,
`components/ChatWidget.tsx`, `components/HtmlLangSetter.tsx`

**Problem:** `pathname.startsWith("/fr") ? "fr" : "en"` appears in 5 places across
4 client components; localized-path math is hand-rolled twice
(`SiteHeader.switchTo`, `SiteFooter` `contactHref`). The i18n module exposes
`localizedPath` / `isLocale` / `LOCALES` / `getMessages` but not the two
operations every caller actually needs. The logic lives inside client components,
so testing it means rendering them.

**Solution:**
- Add pure functions beside `localizedPath`:
  - `localeFromPathname(pathname: string): Locale`
  - `switchLocalePath(pathname: string, target: Locale): string`
- Optionally a `useLocale()` hook wrapping `usePathname()` for the client
  components.
- Replace the 5 inline ternaries and the 2 hand-rolled path helpers with calls.

**Wins:** locale rule changes in one file (locality); pure functions → table
tests, no render; one implementation, 5 call sites (leverage).

**Scope note:** collapsing the 8 duplicated `app/…` / `app/fr/…` route pairs into
one `[locale]` segment is a separate, larger App-Router change — `Speculative`,
and it fights `generateStaticParams` + per-locale metadata. Not part of this item.

---

## 4 · Leave the content module a seam for fixtures — `Speculative`

**Files:** `lib/content.ts`

**Problem:** `cvFileCache` (module `let`) and `projectsCache` (module `Map`) make
every downstream test share process-global state; there is no seam to substitute
fixture content. `getProjectFile()` is exported and never called — dead interface.

**Solution:**
- Now: delete `getProjectFile`.
- Later (only once something downstream is actually tested): a
  `createContentSource({ root })` factory, or a reader adapter — fs +
  `gray-matter` in prod, in-memory fixtures in tests. Caches held per instance,
  not on the module.

**Wins:** two adapters justify the seam (fs vs fixtures); cache lifetime stops
being process-global; drop one dead export from the interface.
