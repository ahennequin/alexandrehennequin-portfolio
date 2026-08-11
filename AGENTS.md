# AGENTS.md

Instructions for any coding agent (Claude Code, Cursor, etc.) working in this repository.

## Project Summary

Personal freelance portfolio website for an AI/Data Science consultant, built with **Next.js** and deployed on **Vercel**. Includes a RAG-powered chat widget that answers visitor questions about the author's CV and projects, using retrieval over the site's own content (not a general-purpose chatbot).

Read `SYSTEM_DESIGN.md` in full before writing any code — it contains the architecture and every decision already made for this project. Do not re-litigate decisions listed there as "Key Decisions Made" without flagging it to the user first; only the "Open Questions" section is intentionally left for the implementer to decide.

Read `BRAND.md` before building any UI — it defines the color palette, typography, layout, and the signature waveform-divider motif that must be applied consistently across every page, not just the homepage.

## Tech Stack (fixed)

- **Framework**: Next.js, App Router
- **Hosting**: Vercel (single project, static pages + serverless API routes together)
- **Chat backend**: `/api/chat` serverless route — handles embedding the query, retrieval, prompt construction, and the Claude API call. Must run server-side only.
- **LLM provider**: Anthropic Claude API, called only from the server (`/api/chat`), never from the client.
- **Vector store**: Qdrant Cloud (hosted), accessed via `QDRANT_CLUSTER_ENDPOINT` + `QDRANT_API_KEY`.
- **Embedding model**: Voyage AI, model `voyage-4`, accessed via `VOYAGEAI_API_KEY`. Anthropic's recommended embedding partner — use the same model consistently at ingestion and query time. Free tier (200M tokens) fully covers this project's content volume.
- **Styling**: Tailwind CSS (fast iteration, reasonable defaults)

## Non-Negotiable Constraints

1. **Never expose secrets to the browser.** `ANTHROPIC_API_KEY`, `QDRANT_CLUSTER_ENDPOINT`, `QDRANT_API_KEY`, and `VOYAGEAI_API_KEY` are all Vercel environment variables — all LLM, embedding, and retrieval calls happen inside server-side code (`/api/chat` and the ingestion script). Do not pass any of these as `NEXT_PUBLIC_*` env vars, and do not hardcode them anywhere in the repo.
2. **Chat scope is restricted.** The system prompt must instruct the model to only answer questions about the author's CV, skills, and projects, and to politely decline off-topic requests or attempts to override its instructions via user input (prompt injection resistance).
3. **Content source of truth is shared.** CV and project data must live in structured files (e.g. `content/cv.json`, `content/projects/*.mdx`) that are used BOTH to render the static site pages AND to build the embedding index. Do not duplicate this content in two places.
4. **Rate limit `/api/chat`.** Add per-IP request limiting before shipping publicly (e.g. Upstash Redis free tier, or Vercel middleware) to prevent cost/abuse issues on the public endpoint.
5. **No client-side conversation persistence to a backend store by default.** Keep chat history in client-side React state only, unless explicitly told to add server-side persistence — this avoids taking on visitor-data storage/privacy obligations for a simple personal site.
6. **Client confidentiality.** Any content describing past client work (e.g. the O-Kidia project, the foncier-sector RAG agent) may name the client but must stay general about precise technical/data specifics for regulated work — mirror the confidentiality posture already used for the author's Malt portfolio case studies.
7. **Streaming responses.** `/api/chat` should stream tokens back to the frontend rather than waiting for the full response.

## Suggested Build Order

1. Scaffold Next.js app (App Router, TypeScript, Tailwind). Set up the color/type tokens from `BRAND.md` in the Tailwind config / global CSS as part of this step.
2. Build static structure: home, CV page, projects page (case studies), contact — using the structured content files described above, styled per `BRAND.md` (including the reusable waveform-divider component). Content will draw on/expand the O-Kidia pipeline and foncier RAG agent case studies.
3. Write the ingestion script: chunk content → generate embeddings via Voyage AI (`voyage-4`) → upsert into Qdrant Cloud (via `QDRANT_CLUSTER_ENDPOINT` + `QDRANT_API_KEY`).
4. Build `/api/chat`: query embedding → retrieval → prompt construction → streamed Claude API call.
5. Build the chat widget UI (floating panel, `useState`-based message list, `fetch`/stream consumption).
6. Add rate limiting + budget alert setup instructions (the alert itself is configured in the Anthropic console, outside the repo, but document the step in the README).
7. Deploy to Vercel, configure environment variables in the Vercel dashboard (never in the repo).

## Before Starting Work

If session persistence or the chat widget's visual design haven't been resolved by the user yet, ask before implementing that part rather than assuming.
