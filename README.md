# Alexandre Hennequin — Portfolio

Personal freelance portfolio site for an AI/Data Science consultant, built with **Next.js** (App Router) and deployed on **Vercel**. Includes a RAG-powered chat widget that answers visitor questions about the author's CV and projects, using retrieval over the site's own content.

Architecture, decisions, and the brand system live in [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) and [`BRAND.md`](./BRAND.md). Read both before changing things.

## Stack

- **Frontend / hosting**: Next.js (App Router) + Tailwind CSS, deployed to Vercel (static pages + serverless API routes).
- **Chat backend**: `app/api/chat` serverless route — embeds the query, retrieves from the vector store, builds the prompt, and streams an Anthropic Claude response. Server-side only.
- **Vector store**: Qdrant Cloud (hosted), accessed via `QDRANT_CLUSTER_ENDPOINT` + `QDRANT_API_KEY`.
- **Embeddings**: Voyage AI, model `voyage-4` (same model at ingestion and query time).
- **Content source of truth**: `content/cv.json` + `content/projects/*.mdx` — feed both the rendered pages and the embedding index.

## Environment variables

Create a `.env` file locally (values from the Vercel dashboard in production — never commit them):

```
ANTHROPIC_API_KEY=sk-ant-...
QDRANT_CLUSTER_ENDPOINT=https://xxxxx.qdrant.io
QDRANT_API_KEY=qdrant-...
VOYAGEAI_API_KEY=pa-...
# Optional: override the chat model (defaults to claude-3-5-haiku-latest)
# CLAUDE_MODEL=claude-3-5-sonnet-latest
```

All four keys are Vercel environment variables. Nothing is exposed to the browser; there are no `NEXT_PUBLIC_*` secrets.

## Local development

```bash
npm install
npm run ingest      # build the embedding index in Qdrant (needs .env with Qdrant + Voyage keys)
npm run dev         # http://localhost:3000
```

`npm run ingest` chunks `content/`, embeds each chunk with `voyage-4`, recreates the `site_content` collection, and upserts the vectors. Re-run it after editing any content file so the assistant stays in sync with the site.

## The chat assistant

The floating widget (bottom-right) is a live demo of the author's RAG/agentic skillset — the same pattern described in the foncier case study. Flow inside `app/api/chat/route.ts`:

1. Embed the visitor's query (`voyage-4`, same as ingestion).
2. Retrieve the top-5 chunks from Qdrant (`site_content` collection).
3. Build the system prompt (identity, CV/projects scope restriction, prompt-injection resistance, confidentiality posture) + retrieved context + conversation history.
4. Stream the Claude response back to the widget.

Chat history is kept in client-side React state only — no visitor data is persisted server-side.

## Rate limiting & cost guardrails

- `/api/chat` limits each IP to 20 requests / minute via an in-memory sliding window (`lib/rateLimit.ts`). This is per-function-instance state — adequate for a personal site. For hard guarantees across instances, swap the store for Upstash Redis (free tier).
- Set a **budget alert** in the Anthropic console (Console → Cost → Budgets) to cap spend before shipping publicly. Configure this in the Anthropic dashboard, not in this repo.

## Deploy to Vercel

1. Push to the repo and import into Vercel (or `vercel deploy`).
2. Add the four env vars above in Project → Settings → Environment Variables.
3. Run `npm run ingest` once (with the same env vars) to populate the vector index — from your machine or a CI job.
4. Deploy. `app/api/chat` is the only serverless route; everything else is static.

## Content

- `content/cv.json` — structured CV data (experience, skills, education, languages, contact).
- `content/projects/*.mdx` — case studies with frontmatter (client, year, role, stack) and markdown body. Confidentiality posture for regulated client work mirrors the Malt portfolio case studies.
