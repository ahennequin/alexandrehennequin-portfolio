# BRAND.md — Visual Identity

Design system for the portfolio site. Read alongside `SYSTEM_DESIGN.md` and `AGENTS.md`. This file governs every visual decision — colors, type, layout, and the signature motif — and should be applied consistently across all pages, not just the homepage.

## 1. Brief

Audience is dual and the design has to work for both without compromise: enterprise decision-makers evaluating a consultant for regulated, high-stakes work (healthcare, finance, medtech, defense), and researchers/academics who should read the site as intellectually serious, not a sales page. The resolution is to ground the visual language in the author's actual background — a PhD in speech/signal processing — rather than in generic "AI consultant" visual tropes (which cluster around three clichés: warm cream + terracotta, near-black + neon accent, or dense broadsheet-newspaper columns; this design deliberately avoids all three).

## 2. Color

| Name | Hex | Role |
|---|---|---|
| Ink | `#12161B` | Primary text; dark-mode surfaces |
| Paper | `#F6F5F1` | Background — cool, neutral off-white (deliberately not a warm cream, to avoid reading as an AI-generated-site tell) |
| Signal | `#1C7C8C` | The one real accent color — deep teal-cyan, reads like a trace on an oscilloscope/spectrogram rather than a marketing color. Used for links, active states, the waveform motif, eyebrow labels |
| Graphite | `#6B6F73` | Secondary text, hairline rules, metadata/annotation text |
| Ember | `#C1622C` | Single-use signature highlight only (e.g. one emphasized data point, one peak marker) — never a primary or repeated color. Deliberately distinct from Anthropic's clay accent (#D97757) |

Usage rule: Signal is the only color that should appear more than once per screen as an accent. Ember appears at most once per page/section — if it's used more than that, it stops being a signature and starts being decoration.

Dark mode: invert around Ink/Paper (Ink becomes the background, Paper-tinted near-white becomes text) — Signal and Ember hold their hue in both modes; only lighten them slightly if contrast against a dark background requires it.

## 3. Typography

| Role | Typeface | Notes |
|---|---|---|
| Display (headings) | Spectral (or Source Serif 4 as fallback) | Technical/editorial serif in the register of scientific journal typesetting — signals "paper," not "landing page" |
| Body / UI | Inter (or IBM Plex Sans) | Clean grotesk, the industry-professional register, used for all running text, nav, buttons |
| Data / labels / annotations | IBM Plex Mono | Used for stack names, dates, metrics, tags, margin annotations — signals technical fluency and doubles as the "marginalia" styling described in layout below |

All three load from Google Fonts. Load only the weights actually used (avoid pulling full variable-font families if only 2–3 weights are needed, for page-weight reasons).

## 4. Signature motif — the waveform divider

A thin horizontal waveform/signal-trace line, used in place of plain hairline rules or numbered markers for structural breaks (between sections, above/below case study headers, etc.).

- This is not decoration — it is a literal reference to the author's actual PhD subject (speech signal processing), which is what makes it read as authentic to a researcher rather than as an arbitrary flourish.
- Render as a simple SVG polyline, stroke color `Signal` (`#1C7C8C`), stroke-width ~1.5px, no fill.
- Keep the waveform irregular/organic-looking (varying peak heights and spacing) rather than a repeating sine pattern — it should read as a real signal, not a generic squiggle icon.
- Use sparingly: as a section divider and in the hero, not scattered throughout the page as ambient decoration.

## 5. Layout

- Single-column reading width for main content (like a paper, not a dense multi-column broadsheet grid).
- A slim right-hand margin/annotation column alongside project case studies and CV entries, styled in `IBM Plex Mono` at small size (client sector, stack, dates) — evokes real manuscript margin notes while staying scannable for a time-pressed industry reader.
- Generous whitespace; the waveform motif and Ember highlight are the only places the design "speaks loudly" — everything else stays quiet and disciplined.

## 6. Reference tile

A style tile mockup was generated during design discussion (color swatches + hero treatment showing the waveform divider, Spectral display type, and IBM Plex Mono metadata line) — use it as the visual reference when implementing the actual components; recreate the same proportions and hierarchy rather than reinterpreting from this text alone.

## 7. Implementation notes for the agent

- Define the 5 colors as CSS variables (e.g. `--color-ink`, `--color-paper`, `--color-signal`, `--color-graphite`, `--color-ember`) at the Tailwind config / global CSS level — do not hardcode hex values in components.
- Build the waveform divider as a single reusable component (e.g. `<WaveformDivider />`) that renders the SVG polyline, so the motif stays visually consistent everywhere it's used rather than being redrawn ad hoc per page.
- Respect the "Signal is the only repeated accent, Ember is single-use" rule when implementing — don't let Ember creep into buttons, links, or repeated UI elements.
