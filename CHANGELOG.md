# Changelog

All notable changes to Boeing Watch are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Date stamps are UTC.

---

## [1.1.0] — 2026-05-13 — Stage 2A

The foundation for the automated wire. Adds the Worker API layer, D1
database, and the first agent (SDR Beat Reporter). No agents are firing
on cron yet — the SDR Beat Reporter runs on demand via
`/admin/sdr/ingest` and on a stubbed cron trigger pending the FAA
fetcher (Stage 2B).

### Added — Worker (`src/`)
- `src/index.ts` — Hono router serving `/api/*` and routing everything
  else to static assets. Cron handler dispatches scheduled agents.
- `src/env.ts` — typed bindings (D1, KV, ASSETS, secrets)
- `src/lib/cache.ts` — read-through KV cache wrapper
- `src/lib/operators.ts` — ICAO operator code → airline name map
- `src/lib/cors.ts` — CORS allow-list (boeingwatch.org only in prod)
- `src/routes/counts.ts` — `/api/counts` proxy for airplanes.live (KV
  cached 30s)
- `src/routes/stock.ts` — `/api/stock` proxy for Yahoo Finance BA (KV
  cached 60s)
- `src/routes/wire.ts` — `/api/wire` and `/api/wire/:id` reading from D1
- `src/routes/wall.ts` — `/api/wall` SDR aggregate counts
- `src/routes/corrections.ts` — `/api/corrections` log reader
- `src/routes/exports.ts` — `/api/sdr.csv` and `/api/sdr.json`
  open-data dumps (CC BY 4.0)

### Added — first agent
- `src/agents/sdr-beat-reporter.ts` — normalizes raw FAA Service
  Difficulty Reports to the canonical sentence stem, classifies
  severity per the three-tier rubric, writes to D1. Uses Claude Haiku
  4.5 (`claude-haiku-4-5`).

### Added — D1 schema (`db/`)
- `db/schema.sql` — 10 tables: events, diary, foia_queue, corrections,
  wire_post_queue, methodology_versions, victims, whistleblowers,
  anomalies, failed_normalizations
- `db/seed-whistleblowers.sql` — John Barnett, Joshua Dean
- `db/seed-methodology.sql` — methodology v1.0 row
- `db/seed-victims.sql` — stub; the 346 names from JT610 and ET302 must
  be transcribed from the KNKT and Ethiopian CAA reports separately
- `db/sample-sdrs.json` — three synthetic SDRs for first-run testing

### Added — admin endpoints (auth: `ADMIN_TOKEN`)
- `POST /admin/sdr/ingest` — push a batch of raw SDRs through the SDR
  Beat Reporter pipeline. Used for the one-off backfill and for
  development.
- `GET /admin/health` — sanity probe (D1 reachable, KV writable,
  Anthropic key present)

### Changed — frontend
- `public/index.html` — live counter now reads from `/api/counts`
  instead of going direct to `api.airplanes.live`. Existing
  snapshot-fallback behavior unchanged: after two consecutive `/api`
  failures the topbar flips from LIVE to SNAPSHOT.
- `public/index.html` — added `fetchStock()` polling `/api/stock` every
  60s; soft-fails to the embedded snapshot.

### Added — repo metadata
- `package.json` — `hono`, `@anthropic-ai/sdk` as deps; `wrangler`,
  `typescript`, `@cloudflare/workers-types` as dev deps; npm scripts
  for D1 schema/seed and Wrangler workflow.
- `tsconfig.json` — strict TypeScript targeting ES2022 with Workers
  types
- `wrangler.jsonc` — D1 binding (`DB`), KV binding (`CACHE`), Worker
  entrypoint (`src/index.ts`), hourly cron (`5 * * * *`)
- `STAGE2-DEPLOY.md` — click-by-click runbook for the Cloudflare
  steps Donald has to run locally (D1 create, KV create, schema apply,
  secret put, deploy verify)

### Deferred to Stage 2B
- The FAA SDR fetcher (the cron job currently logs and exits — no SDRs
  are pulled from the FAA)
- The Diarist agent (daily 04:00 UTC)
- The Anomaly Editor (nightly statistics)
- The FOIA Clerk (triggered by anomalies)
- The Fact-Checker (weekly self-audit)
- The Wire Operator (cross-platform posting)
- The Compositor (Daily Wire PDF)
- The 346 victim names (transcription work, manual)

---

## [1.0.0] — 2026-05-13 — Stage 1

First public release. The static site goes live at
[boeingwatch.org](https://boeingwatch.org) via Cloudflare Pages.

### Added — frontend (`public/`)
- `index.html` (the V4 prototype, footer wired to the four credibility
  pages, OG + favicon + canonical metadata added)
- `methodology.html` covering the nine required sections — what counts
  as an SDR, the three-tier severity rubric, the 24-hour window,
  cumulative SDR counting, Boeing-aircraft identification, known data
  limitations, memorial-entry handling, corrections policy, the
  CC BY 4.0 open-data license
- `corrections.html` — empty public log with intake procedure, future-entry
  template, and out-of-scope guardrails
- `about.html` — named editor (Donald, Harrow Lab), mission statement,
  six itemized COI disclosures, the four credibility constants
- `sources.html` — the eighteen numbered citations from the prototype,
  broken out as a permalinked page grouped by subject
- `assets/site.css` — shared warm-cream / oxblood / burnt-amber design
  system
- `_headers` — HSTS, CSP, frame protection, asset caching
- `robots.txt`, `sitemap.xml`, `boeingwatch-favicon.svg`

### Added — repo metadata
- `README.md` describing layout, deploy settings, licenses, and contact
- `LICENSE` (MIT) for source code
- `LICENSE-DATA` (CC BY 4.0) for the dataset, with the canonical
  attribution form
- `.gitignore` for OS junk, editors, future Wrangler/Node scaffolding,
  and `SECRETS.md`
- `CLOUDFLARE-SETUP.md` — click-by-click runbook for Pages, custom
  domain, Email Routing for `corrections@boeingwatch.org`, and
  Web Analytics

### Reference docs (copied unchanged from the launch package)
- `HANDOFF.md`, `EXPLAINER.md`, `BUDGET.md`, `README-launch.md`
- `agent-prompts/01..06.md`

### Operating constraints in force
- No build step on the frontend. Vanilla HTML/CSS/JS only.
- No analytics SDKs. Cloudflare Web Analytics handles aggregate stats.
- No third-party tracking. No fonts beyond Google Fonts (loaded with
  `preconnect`).
- All copy follows the voice rules in the agent prompts — sober, dated,
  factual, no editorializing.

### Deferred to Stage 2 (gated on Anthropic API credits)
- `api.boeingwatch.org` Worker — proxy/cache layer for SDR, stock, wire,
  diary, wall, corrections endpoints
- D1 database (events, diary, foia_queue, corrections, anomalies,
  victims, whistleblowers, methodology_versions)
- R2 bucket for Daily Wire PDFs and Open Graph images
- The six scheduled agents — SDR Beat Reporter, Diarist,
  Anomaly Editor, FOIA Clerk, Fact-Checker, Wire Operator, Compositor
- Bluesky / Mastodon / Threads bot accounts
- The Daily Wire PDF render pipeline
