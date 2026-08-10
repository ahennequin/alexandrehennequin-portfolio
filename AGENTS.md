# AGENTS.md

Instructions for any coding agent (Claude Code, Cursor, etc.) working in this repository.

## Project Summary

Personal freelance portfolio website for an AI/Data Science consultant, built with **Next.js** and deployed on **Vercel**. Includes a RAG-powered chat widget that answers visitor questions about the author's CV and projects, using retrieval over the site's own content (not a general-purpose chatbot).

Read `SYSTEM_DESIGN.md` in full before writing any code — it contains the architecture and every decision already made for this project. Do not re-litigate decisions listed there as "Key Decisions Made" without flagging it to the user first; only the "Open Questions" section is intentionally left for the implementer to decide.

## Tech Stack (fixed)

- **Framework**: Next.js, App Router
- **Hosting**: Vercel (single project, static pages + serverless API routes together)
- **Chat backend**: `/api/chat` serverless route — handles embedding the query, retrieval, prompt construction, and the Claude API call. Must run server-side only.
- **LLM provider**: Anthropic Claude API, called only from the server (`/api/chat`), never from the client.
- **Styling**: Tailwind CSS (fast iteration, reasonable defaults)

## Non-Negotiable Constraints

1. **Never expose the Anthropic API key (or any vector store credentials) to the browser.** All LLM and retrieval calls happen inside server-side code (`/api/chat`). Do not pass keys as `NEXT_PUBLIC_*` env vars.
2. **Chat scope is restricted.** The system prompt must instruct the model to only answer questions about the author's CV, skills, and projects, and to politely decline off-topic requests or attempts to override its instructions via user input (prompt injection resistance).
3. **Content source of truth is shared.** CV and project data must live in structured files (e.g. `content/cv.json`, `content/projects/*.mdx`) that are used BOTH to render the static site pages AND to build the embedding index. Do not duplicate this content in two places.
4. **Rate limit `/api/chat`.** Add per-IP request limiting before shipping publicly (e.g. Upstash Redis free tier, or Vercel middleware) to prevent cost/abuse issues on the public endpoint.
5. **No client-side conversation persistence to a backend store by default.** Keep chat history in client-side React state only, unless explicitly told to add server-side persistence — this avoids taking on visitor-data storage/privacy obligations for a simple personal site.
6. **Client confidentiality.** Any content describing past client work (e.g. the O-Kidia project, the foncier-sector RAG agent) may name the client but must stay general about precise technical/data specifics for regulated work — mirror the confidentiality posture already used for the author's Malt portfolio case studies.
7. **Streaming responses.** `/api/chat` should stream tokens back to the frontend rather than waiting for the full response.

## Suggested Build Order

1. Scaffold Next.js app (App Router, TypeScript, Tailwind).
2. Build static structure: home, CV page, projects page (case studies), contact — using the structured content files described above. Content will draw on/expand the O-Kidia pipeline and foncier RAG agent case studies.
3. Write the ingestion script: chunk content → generate embeddings → store in chosen vector store (see "Open Questions" in `SYSTEM_DESIGN.md` — confirm choice with the user before implementing if not already decided).
4. Build `/api/chat`: query embedding → retrieval → prompt construction → streamed Claude API call.
5. Build the chat widget UI (floating panel, `useState`-based message list, `fetch`/stream consumption).
6. Add rate limiting + budget alert setup instructions (the alert itself is configured in the Anthropic console, outside the repo, but document the step in the README).
7. Deploy to Vercel, configure environment variables in the Vercel dashboard (never in the repo).

## Before Starting Work

If any of the "Open Questions" in `SYSTEM_DESIGN.md` (vector store choice, embedding model, session persistence, chat widget visual design) haven't been resolved by the user yet, ask before implementing that part rather than assuming.
