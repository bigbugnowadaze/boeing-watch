# Changelog

All notable changes to Boeing Watch are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Date stamps are UTC.

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
