# BOEING WATCH — BUILD PACKAGE FOR CLAUDE CODE

**Hand this file, the V4 prototype HTML, and the agent-prompts/ folder to a Claude Code session. This is the build brief.**

**Status:** Ready to execute. Stage 1 (the static site live on a domain) is ~3-4 hours of agent work. Stage 2 (agents wired up and running) is another ~8-12 hours.

**Source-of-truth references:**
- `boeing_watch_prototype.html` — the design and current frontend code
- `EXPLAINER.md` — plain-English architecture
- `BUDGET.md` — cost ceilings  
- `DOMAINS.md` — domain shortlist (purchase one before starting)
- `agent-prompts/` — six agent specs

---

## ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────┐
│  boeingwatch.org  (Cloudflare Pages — static site)           │
│  · Renders V4 prototype HTML                                  │
│  · Fetches live data from /api/* (Worker)                    │
│  · Reads diary, wire, FOIA, sources from D1 via /api/*       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼ HTTPS
┌──────────────────────────────────────────────────────────────┐
│  api.boeingwatch.org  (Cloudflare Worker — proxy/cache layer) │
│  · /api/counts        — proxy airplanes.live, 30s cache       │
│  · /api/stock         — proxy Yahoo Finance, 60s cache        │
│  · /api/wire          — read events from D1                   │
│  · /api/wire/{id}     — read single event permalink           │
│  · /api/diary/{date}  — read diary by date                    │
│  · /api/wall          — aggregated SDR counts                 │
│  · /api/sdr.csv       — open data export                      │
│  · /api/sdr.json      — open data export                      │
│  · /api/corrections   — corrections log                       │
└──────────┬─────────────────────────────┬─────────────────────┘
           │                             │
           ▼ scheduled triggers         ▼ on-demand
┌────────────────────────────┐  ┌─────────────────────────────┐
│  Cron Workers (agents)     │  │  Cloudflare D1 (SQL DB)     │
│  · sdr-beat-reporter       │  │  · events table             │
│  · diarist (daily 04:00)   │  │  · diary table              │
│  · anomaly-editor (daily)  │  │  · foia_queue table         │
│  · fact-checker (weekly)   │  │  · corrections table        │
│  · compositor (daily 05:30)│  │  · wire_post_queue table    │
│  · wire-operator (5min)    │  │  · methodology_versions     │
└────────────────────────────┘  └─────────────────────────────┘
           │
           ▼ posts to
┌──────────────────────────────────────────────────────────────┐
│  Bluesky · Mastodon · Threads (free APIs)                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Cloudflare R2 (object storage)                               │
│  · /wire/YYYY-MM-DD.pdf  — Daily Wire PDFs                    │
│  · /wire/YYYY-MM-DD/og.png — Open Graph images                │
└──────────────────────────────────────────────────────────────┘
```

---

## REPO STRUCTURE

```
boeingwatch/
├── README.md
├── HANDOFF.md                       ← this file
├── EXPLAINER.md                     ← architecture (for humans)
├── BUDGET.md                        ← cost ceilings
│
├── public/                          ← Cloudflare Pages site
│   ├── index.html                   ← the V4 prototype, modified to call /api/*
│   ├── methodology.html
│   ├── corrections.html
│   ├── about.html
│   ├── sources.html
│   ├── memorial.html                ← the agate-type wall
│   ├── counter.html                 ← the standalone hero counter page
│   ├── wire/                        ← dynamic wire archive (rendered via _routes.json)
│   ├── diary/                       ← dynamic diary archive
│   ├── foia/                        ← FOIA archive (public)
│   ├── data/                        ← static data exports linked from /api
│   └── assets/
│       ├── world.geojson
│       ├── og-default.png
│       └── boeingwatch-favicon.svg
│
├── worker/                          ← Cloudflare Worker (api.boeingwatch.org)
│   ├── wrangler.toml
│   ├── src/
│   │   ├── index.ts                 ← router
│   │   ├── routes/
│   │   │   ├── counts.ts            ← airplanes.live proxy
│   │   │   ├── stock.ts             ← Yahoo Finance proxy
│   │   │   ├── wire.ts              ← list events
│   │   │   ├── wire-detail.ts       ← single event by ID
│   │   │   ├── diary.ts             ← diary by date
│   │   │   ├── wall.ts              ← SDR aggregate data
│   │   │   ├── corrections.ts       ← corrections log
│   │   │   ├── sdr-csv.ts           ← CSV export
│   │   │   └── sdr-json.ts          ← JSON export
│   │   └── lib/
│   │       ├── d1.ts                ← D1 helpers
│   │       ├── cache.ts             ← KV cache helpers
│   │       └── operators.ts         ← operator code → name map
│   └── package.json
│
├── agents/                          ← scheduled jobs (each is its own Worker)
│   ├── sdr-beat-reporter/
│   │   ├── wrangler.toml
│   │   ├── prompt.md                ← from agent-prompts/01
│   │   └── src/index.ts
│   ├── diarist/
│   ├── anomaly-editor/
│   ├── fact-checker/
│   ├── foia-clerk/
│   ├── compositor/
│   └── wire-operator/
│
├── db/
│   ├── schema.sql                   ← D1 schema (events, diary, foia, etc.)
│   ├── seed-victims.sql             ← Lion Air 610 + Ethiopian 302 names
│   └── seed-whistleblowers.sql      ← Barnett, Dean
│
└── .github/
    └── workflows/
        ├── deploy-pages.yml
        ├── deploy-worker.yml
        └── deploy-agents.yml
```

---

## STAGE 1 — STATIC SITE LIVE (Day 1)

**Goal:** boeingwatch.org loads the V4 prototype, real airplanes.live data, full methodology + corrections + sources pages.

### 1.1 — Repo setup
- Create GitHub repo `harrow-lab/boeingwatch` (public)
- Init with README, MIT or CC BY 4.0 license
- Add the V4 prototype HTML as `public/index.html`

### 1.2 — Cloudflare Pages
- In Cloudflare Dashboard → Pages → Connect to Git → select repo
- Build settings: no build command, output directory `public`
- Custom domain: `boeingwatch.org` (registered first, see DOMAINS.md)
- Verify HTTPS auto-provisions
- Verify the page loads at the domain

### 1.3 — Required static pages
Build the four critical credibility pages, each in its own HTML file matching the V4 design system:

- **`/methodology`** — How every count is computed. Data sources. Refresh cadences. Known limitations. Update history. Public link from every footer.
- **`/corrections`** — Public corrections log (initially empty). Each correction includes: date, entry affected, what changed, source of correction.
- **`/about`** — Named author (Bug, Harrow Lab). Mission statement. Conflict-of-interest disclosure. Contact: `corrections@boeingwatch.org`.
- **`/sources`** — The numbered sources list from the prototype, broken out as its own page for permalink.

Methodology page MUST include at minimum these sections:
1. What counts as a "Service Difficulty Report" we display
2. How we classify severity (the three-tier rubric from the SDR Beat Reporter prompt)
3. The 24-hour window definition
4. How we count cumulative SDRs
5. How we identify Boeing-manufactured aircraft
6. Known data limitations (FAA SDR coding inconsistencies, missing corrective-action fields)
7. Our handling of whistleblower memorial entries (only public-record claims, no speculation)
8. Our corrections policy
9. Our open data policy and license (CC BY 4.0 recommended)

### 1.4 — Email setup
- Set up `corrections@boeingwatch.org` (free via Cloudflare Email Routing → forward to Bug's personal email)
- Add to footer of every page

### 1.5 — Verify launch
- Lighthouse score ≥ 95 performance, 100 accessibility
- All links resolve
- OG image renders correctly when link is shared in Bluesky/iMessage
- Mobile responsive verified on iOS Safari and Android Chrome
- Page loads in <1 second on a cold cache

**Stage 1 done.** You can announce here if you want — but it's stronger to wait until Stage 2.

---

## STAGE 2 — LIVE AGENTS (Days 2-14)

**Goal:** All 7 agents (or 6 — Anomaly Editor and Press-Release Skeptic can ship together later) running on schedule, producing the Wire, the Daily PDF, and the cross-platform posts.

### 2.1 — D1 database
- Create D1 database: `wrangler d1 create boeingwatch`
- Apply schema: `wrangler d1 execute boeingwatch --file=db/schema.sql`
- Seed: victims, whistleblowers, initial methodology version

D1 schema (`db/schema.sql`):

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'sdr' | 'anniversary' | 'stock' | 'court' | 'foia' | 'pr' | 'anomaly'
  filed_at TEXT NOT NULL,       -- ISO 8601 UTC
  severity TEXT,                -- 'severe' | 'elevated' | 'noted' | null
  narrative TEXT NOT NULL,
  source_url TEXT,
  raw_data TEXT,                -- JSON of original source data
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_events_filed_at ON events(filed_at DESC);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_severity ON events(severity);

CREATE TABLE diary (
  date TEXT PRIMARY KEY,        -- YYYY-MM-DD
  content TEXT NOT NULL,        -- markdown
  word_count INTEGER,
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  llm_model TEXT,
  approved_by_bug INTEGER DEFAULT 0
);

CREATE TABLE foia_queue (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT,
  draft_content TEXT NOT NULL,
  pdf_path TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'mailed' | 'rejected'
  mailed_at TEXT,
  response_received_at TEXT,
  response_content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  event_id TEXT,
  old_content TEXT,
  new_content TEXT NOT NULL,
  reason TEXT NOT NULL,
  source_url TEXT
);

CREATE TABLE wire_post_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  posted_at TEXT,
  platforms_posted TEXT,
  status TEXT DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE methodology_versions (
  version INTEGER PRIMARY KEY,
  effective_from TEXT NOT NULL,
  content TEXT NOT NULL,
  change_log TEXT
);

CREATE TABLE victims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight TEXT NOT NULL,         -- 'JT610' | 'ET302'
  name TEXT NOT NULL,
  age INTEGER,
  nationality TEXT,
  obituary_fragment TEXT,
  obituary_source TEXT
);

CREATE TABLE whistleblowers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date_of_death TEXT NOT NULL,
  age_at_death INTEGER,
  role TEXT,
  employer TEXT,
  cited_sources TEXT  -- JSON array of source URLs
);

CREATE TABLE anomalies (
  id TEXT PRIMARY KEY,
  detected_at TEXT NOT NULL,
  subject TEXT NOT NULL,
  metric_name TEXT,
  baseline_value REAL,
  current_value REAL,
  sigma REAL,
  supporting_event_ids TEXT,  -- JSON array
  foia_queued INTEGER DEFAULT 0
);
```

### 2.2 — Worker (proxy/API layer)
- Scaffold via `wrangler init worker --type=typescript`
- Implement all `/api/*` routes per the architecture above
- Configure Worker custom domain: `api.boeingwatch.org`
- Add CORS headers (allow only `boeingwatch.org` origin in production)
- Add caching: 30s for `/api/counts`, 60s for `/api/stock`, 5min for `/api/wire`, 1hr for `/api/wall`
- Use Cloudflare KV for cache layer (free tier)

### 2.3 — Frontend integration
- Modify `public/index.html` to call `/api/*` endpoints instead of using only the embedded snapshot
- Keep the embedded snapshot as fallback — if `/api/counts` fails twice, fall back to snapshot and switch the LIVE indicator to SNAPSHOT mode
- Same pattern for stock data

### 2.4 — Agent: SDR Beat Reporter
- Scaffold as separate Worker (`agents/sdr-beat-reporter/`)
- Cron trigger: every hour at :05
- Read from FAA SDR CSV (downloaded nightly to R2 by a sub-agent), filter for past hour
- For each new SDR, call Claude Haiku with the prompt from `agent-prompts/01-sdr-beat-reporter.md`
- Write normalized output to D1 `events` table
- Set Anthropic API key as Worker secret: `wrangler secret put ANTHROPIC_API_KEY`

### 2.5 — Agent: Diarist
- Scaffold as separate Worker (`agents/diarist/`)
- Cron trigger: daily at 04:00 UTC
- Query D1 for past 24h of events
- Call Claude Sonnet with prompt from `agent-prompts/02-diarist.md`
- Run quality gates (word count, prohibited phrases, closing-line check)
- Write to D1 `diary` table

### 2.6 — Agent: Anomaly Editor
- Scaffold as separate Worker (`agents/anomaly-editor/`)
- Cron trigger: daily at 03:00 UTC
- Pure statistical job (no LLM)
- Compute 30-day rolling mean and stddev for SDR counts by aircraft type and by JASC code
- If today's count for any (aircraft_type, JASC) is >2σ above 30-day baseline, write to `anomalies` table
- Trigger FOIA Clerk via D1 event

### 2.7 — Agent: FOIA Clerk
- Scaffold as separate Worker (`agents/foia-clerk/`)
- Triggered by anomaly events
- Read anomaly from `anomalies` table
- Call Claude Sonnet with prompt from `agent-prompts/03-foia-clerk.md`
- Render letter as PDF via Browserless
- Write to `foia_queue` table with status `pending`
- Email Bug (via Resend) with link to review

### 2.8 — Agent: Fact-Checker
- Scaffold as separate Worker (`agents/fact-checker/`)
- Cron trigger: Sunday 02:00 UTC
- Query D1 for past 7 days of events + current methodology + recent corrections
- Call Claude Sonnet with prompt from `agent-prompts/04-fact-checker.md`
- Write audit report to `/admin/audit/YYYY-MM-DD.md` (gated)
- Email Bug with summary

### 2.9 — Agent: Wire Operator
- Scaffold as separate Worker (`agents/wire-operator/`)
- Cron trigger: every 5 minutes
- Pull from `wire_post_queue` where `scheduled_at <= NOW()` and `status = 'queued'`
- For each, dispatch to Bluesky, Mastodon, Threads via their APIs
- No LLM at launch — pure template fills
- Templates from `agent-prompts/05-wire-operator.md`
- Store platform credentials as Worker secrets

### 2.10 — Agent: Compositor
- Scaffold as separate Worker (`agents/compositor/`)
- Cron trigger: daily at 05:30 UTC
- Read diary, past 24h events, generate world map SVG snapshot
- Render HTML template to PDF via Browserless
- Upload PDF to R2 at `/wire/YYYY-MM-DD.pdf`
- Generate OG image, upload to R2 at `/wire/YYYY-MM-DD/og.png`
- Publish HTML version at `/wire/YYYY-MM-DD/`
- Reference: `agent-prompts/06-compositor.md`

### 2.11 — Wire bot accounts (set up in parallel)
- Create Bluesky account `@boeingwatchwire.bsky.social`
- Create Mastodon account on `journa.host` instance
- Create Threads account `@boeingwatchwire`
- Generate API credentials for each, store as Worker secrets
- Post a single "Wire test" message from each to verify

### 2.12 — Verify Stage 2
- Watch the Wire populate over 24 hours
- Verify the diary publishes Sunday morning
- Verify the Daily Wire PDF renders
- Verify Bluesky/Mastodon/Threads posts go out
- Manually trigger an anomaly to verify FOIA Clerk
- Run a Fact-Checker audit manually to verify

**Stage 2 done.** Boeing Watch is now a live, automated accountability dashboard.

---

## STAGE 3 — POLISH AND PRESS OUTREACH (Days 15-45)

(Optional and lower priority. Ship Stages 1-2 first, then re-evaluate.)

### 3.1 — Add Stage-1 features from research
- The Memorial Wall (agate-type page) — `/memorial.html`
- The Counter standalone page — `/counter.html` with dynamic OG image
- The 1-Pixel scroll pages — `/scale/sdr`, `/scale/comp`, `/scale/days`
- The Days Since slab
- The Watching the Watchers page — `/cited-by`
- The embeddable counter widget — `embed.js`

### 3.2 — Add Press-Release Skeptic agent
- Triggered when Boeing publishes a press release (RSS feed monitoring)
- Compares to past statements on the same topic
- Publishes comparison to `/pr-watch`

### 3.3 — Newsletter
- Free Buttondown account (up to 100 subscribers)
- Daily digest auto-sent at 07:00 UTC with link to Daily Wire PDF

### 3.4 — Press outreach
- Hand-mail the Daily Wire PDF (or send the link with a personal note) to:
  - Dominic Gates (Seattle Times)
  - Andrew Tangel (WSJ)
  - Theo Leggett (BBC)
  - Jon Ostrower (The Air Current)
  - Bjorn Fehrm (Leeham News)
  - Sylvia Pfeifer (Financial Times)
- Plus aviation accountability orgs:
  - Foundation for Aviation Safety (Ed Pierson)
  - Government Accountability Project
  - National Whistleblower Center

---

## EXACT INSTRUCTION TO PASTE INTO CLAUDE CODE

```
You are building Boeing Watch, an independent accountability dashboard for The Boeing Company. The full architecture and build sequence are in HANDOFF.md. The frontend design source of truth is boeing_watch_prototype.html. Agent prompts are in agent-prompts/.

Start with Stage 1 (HANDOFF.md §"Stage 1"). Execute in this order:

1. Create the GitHub repo and commit the V4 prototype as public/index.html.
2. Build /methodology.html, /corrections.html, /about.html, /sources.html using the same design system as index.html.
3. Set up Cloudflare Pages deployment from the repo.
4. Configure the custom domain (Bug will tell you which — see DOMAINS.md).
5. Verify the site loads at the domain over HTTPS.
6. Set up Cloudflare Email Routing for corrections@boeingwatch.org → Bug's personal email.

Confirm Stage 1 is complete and live, then ask Bug for permission to proceed to Stage 2.

For Stage 2, follow HANDOFF.md §"Stage 2" precisely. The agent-prompts/ folder contains six agent specifications; implement each as a separate Cloudflare Worker per the spec. Use Claude Haiku for the SDR Beat Reporter and Claude Sonnet for the others (model IDs are in the prompts).

Constraints:
- No build step on the frontend. Vanilla HTML/CSS/JS.
- All Worker logic in TypeScript.
- No analytics SDKs — use Cloudflare Web Analytics.
- Voice rules in the agent prompts apply to all copy you generate. No editorializing.
- Every numeric claim on the public site must have a source URL accessible within one click.
- Every agent must be re-runnable manually via wrangler trigger for debugging.

When you encounter an ambiguous decision, ask Bug. When you encounter a technical decision (which TypeScript framework, which test runner), pick the most boring viable option and proceed. Use Hono for the Worker router. Use Wrangler 3. Use standard SQL in D1 (no ORM).

Document every secret you set in a SECRETS.md file (in the repo, but in .gitignore — keep a list locally for Bug to manage).
```

---

## CHECKLIST BEFORE HANDOFF

Before pasting the above into Claude Code:

- [ ] Domain purchased via Cloudflare Registrar (~$12)
- [ ] Cloudflare account active, payment method on file
- [ ] Anthropic API account active with $10 starting credit
- [ ] GitHub account active
- [ ] V4 prototype HTML file ready to commit (`boeing_watch_prototype.html`)
- [ ] All agent prompt files ready (`agent-prompts/01..06.md`)
- [ ] EXPLAINER.md and BUDGET.md and DOMAINS.md in the same folder
- [ ] Bug's personal email ready for the corrections forward
- [ ] Time blocked: 4 hours for Stage 1, ~3 hours/day for Stage 2 across the first week

Once these are checked, paste the Claude Code instruction above and you're building.
