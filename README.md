# Alexandre Hennequin — Portfolio

Personal freelance portfolio site for an AI/Data Science consultant, built with **Next.js** (App Router) and deployed on **Vercel**. Includes a RAG-powered chat widget that answers visitor questions about the author's CV and projects, using retrieval over the site's own content.

Architecture, decisions, and the brand system live in [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) and [`BRAND.md`](./BRAND.md). Read both before changing things.

## Stack

- **Frontend / hosting**: Next.js (App Router) + Tailwind CSS, deployed to Vercel (static pages + serverless API routes).
- **Chat backend**: `app/api/chat` serverless route — embeds the query, retrieves from the vector store, builds the prompt, and streams a Google Gemini response (`gemini-3.6-flash`, AI Studio free tier — chosen so credit abuse on the public endpoint can't run up a bill). Server-side only.
- **Vector store**: Qdrant Cloud (hosted), accessed via `QDRANT_CLUSTER_ENDPOINT` + `QDRANT_API_KEY`.
- **Embeddings**: Voyage AI, model `voyage-4` (same model at ingestion and query time).
- **Content source of truth**: `content/cv.json` + `content/projects/*.mdx` — feed both the rendered pages and the embedding index.

## Environment variables

Create a `.env` file locally (values from the Vercel dashboard in production — never commit them):

```
GEMINI_API_KEY=AIza...            # Google AI Studio key (free tier)
QDRANT_CLUSTER_ENDPOINT=https://xxxxx.qdrant.io
QDRANT_API_KEY=qdrant-...
VOYAGEAI_API_KEY=pa-...
# Optional: override the chat model (defaults to gemini-3.6-flash)
# GEMINI_MODEL=gemini-3.6-flash-lite
# Optional: distributed rate limiting for /api/chat (see below).
# Auto-injected by the Upstash Redis Vercel integration; omit for the
# in-memory fallback used in local dev / CI.
# UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
# UPSTASH_REDIS_REST_TOKEN=...
```

All four keys are Vercel environment variables. The two optional `UPSTASH_REDIS_REST_*` values are too. Nothing is exposed to the browser; there are no `NEXT_PUBLIC_*` secrets.

## Local development

```bash
npm install
npm run ingest      # build the embedding index in Qdrant (needs .env with Qdrant + Voyage keys)
npm run dev         # http://localhost:3000
```

`npm run ingest` chunks `content/`, embeds each chunk with `voyage-4`, recreates the `site_content` collection, and upserts the vectors. Re-run it after editing any content file so the assistant stays in sync with the site.

## Bilingual site (EN / FR)

The site ships both an English and a French version of every page:

- **English** is the default and lives at the root (`/`, `/cv`, `/projects`, `/contact`).
- **French** lives under the `/fr` prefix (`/fr`, `/fr/cv`, ...). Use the `EN`/`FR` toggle in the header to switch while preserving the current page.

Each locale has its own content: `content/cv.json` holds both variants (`{ "en": …, "fr": … }`) and projects are split into `content/projects/en/*.mdx` and `content/projects/fr/*.mdx` (slugs are identical across languages). UI strings live in `lib/i18n.ts` (`MESSAGES` per locale); shared page components in `components/pages/` take a `locale` prop, with thin wrappers at the root and under `app/fr/`.

The chat widget detects the visitor's locale and answers in that language. Retrieval is scoped to the same-language chunks (each indexed chunk carries a `lang` payload), and the system prompt tells the model which language to reply in. Re-run `npm run ingest` after adding or editing translated content so both languages stay in the index.

## The chat assistant

The floating widget (bottom-right) is a live demo of the author's RAG/agentic skillset — the same pattern described in the foncier case study. Flow inside `app/api/chat/route.ts`:

1. Embed the visitor's query (`voyage-4`, same as ingestion).
2. Retrieve the top-5 chunks from Qdrant (`site_content` collection).
3. Build the system prompt (identity, CV/projects scope restriction, prompt-injection resistance, confidentiality posture) + retrieved context + conversation history.
4. Stream the Gemini response back to the widget.

Chat history is kept in client-side React state only — no visitor data is persisted server-side.

## Rate limiting & cost guardrails

- `/api/chat` rate-limits each IP through `lib/rateLimit.ts`, which has two back ends selected automatically:
  - **Distributed (recommended for production):** install the **Upstash Redis** integration from the Vercel Marketplace (Project → Storage / Integrations → Upstash). It auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into the project. With those set, two Redis-backed limiters run per IP — **20 requests / minute** (burst control) and **100 requests / day** (fences the shared Gemini free-tier daily quota, ~1,500 req/day, so one abuser spread across serverless instances can't break chat for everyone). A request is blocked if either limit is hit. Redis errors fail open (request allowed) so an Upstash outage can't take chat down.
  - **In-memory fallback:** if those two env vars are absent (local dev, CI, tests), it falls back to a per-function-instance sliding window (20 req/min) with LRU eviction. Zero setup, no new env vars — but per-instance state, so it under-counts abuse across concurrent instances on Vercel.
- The chat runs on the Gemini API **free tier**, so a burst of abuse costs nothing — it just returns `429`s from Google once the daily/rate quota is hit. If you ever move to a paid Gemini key, set a budget alert in Google AI Studio / Google Cloud billing before shipping publicly. Nothing to configure in this repo.

## Deploy to Vercel

1. Push to the repo and import into Vercel (or `vercel deploy`).
2. Add the four env vars above in Project → Settings → Environment Variables.
3. Run `npm run ingest` once (with the same env vars) to populate the vector index — from your machine or a CI job.
4. Deploy. `app/api/chat` is the only serverless route; everything else is static.

## Content

- `content/cv.json` — structured CV data for both locales (`en` and `fr` keys): experience, skills, education, languages, contact.
- `content/projects/en/*.mdx` + `content/projects/fr/*.mdx` — case studies per language, with frontmatter (client, year, role, stack) and markdown body. Confidentiality posture for regulated client work mirrors the Malt portfolio case studies.
