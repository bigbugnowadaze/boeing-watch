# BOEING WATCH — HOW IT WORKS

*A plain-English explainer of the architecture. No code required to read this.*

---

## THE METAPHOR

Boeing Watch is a one-person newsroom where the reporters are LLM agents and the printing press is a free Cloudflare server. You orchestrate. They write. The site reads.

Think of it like running a small independent magazine:
- **The Building** — Cloudflare Pages, the free static site hosting where the website lives
- **The Loading Dock** — Cloudflare Workers, which run small scheduled jobs (the agents)
- **The Morgue** (newspaper jargon for archive) — Cloudflare D1, a free SQL database that stores every event Boeing Watch has ever published
- **The Wire** — the canonical, time-stamped, reverse-chronological feed of every event
- **The Reporters** — LLM agents, each with one job, each running on a schedule
- **You (Bug)** — the publisher. You read the morning diary, approve FOIA letters before they mail, and respond to corrections. ~2-4 hours per week.

---

## THE REPORTERS (LLM AGENTS)

There are seven agents. Each has one job, one prompt, one schedule. They don't talk to each other; they all write to and read from the same database.

### 1. THE SDR BEAT REPORTER

**What it does:** Every hour, fetches the latest FAA Service Difficulty Reports for Boeing aircraft. For each new SDR, rewrites the raw text into the canonical AvHerald-style sentence stem ("A Southwest Airlines 737-8, registration N8709Q, performing flight WN1234 from KDAL to KMSY with 174 souls on board, declared an emergency at FL370 after..."). Classifies severity. Writes to the database.

**Where it runs:** Cloudflare Worker, hourly cron trigger.

**LLM it uses:** Claude Haiku (cheapest, fast).

**What it costs:** Pennies per month. ~24 SDRs/day × ~500 input tokens × ~150 output tokens = trivial.

**Why it matters:** This is the canonical voice. Every entry on Boeing Watch reads in the same sentence stem. That voice is what makes it citable.

### 2. THE DIARIST

**What it does:** Every morning at 04:00 UTC, reads the last 24 hours of events from the database and writes a single 400-word diary entry in a sober, dated voice. Publishes to `/diary/YYYY-MM-DD`. This becomes the front page of the Daily Wire PDF.

**Where it runs:** Cloudflare Worker, daily cron.

**LLM it uses:** Claude Sonnet (better prose).

**What it costs:** ~$0.10/month.

**Why it matters:** The diary is what reporters quote. It also becomes the AI-narrated daily summary if you ever add audio.

### 3. THE ANOMALY EDITOR

**What it does:** Every night, runs statistical change-point detection on the SDR time series. If today's rate is more than 2 standard deviations above the 30-day baseline, fires an alert. This agent is **not** an LLM — it's pure statistics (Python, CUSUM algorithm). Fast and cheap.

**Where it runs:** Cloudflare Worker, daily cron.

**LLM it uses:** None.

**What it costs:** $0.

**Why it matters:** This is what surfaces the story before journalists notice it themselves. When the rate spikes, the FOIA Clerk drafts a letter and the bot posts an alert.

### 4. THE FOIA CLERK

**What it does:** When the Anomaly Editor fires an alert, this agent drafts a FOIA request letter against a fixed template. The letter goes into a queue at `/foia` where you (Bug) review it with one click and mail it. **Never auto-sends.** Your one-click approval is the editorial gate.

**Where it runs:** Cloudflare Worker, triggered by anomalies.

**LLM it uses:** Claude Sonnet.

**What it costs:** ~$0.05 per draft. Maybe 4-8 drafts per month.

**Why it matters:** A standing FOIA queue is what real accountability newsrooms have. It signals seriousness.

### 5. THE FACT-CHECKER

**What it does:** Once a week, reads the methodology pages and the past week's published entries. Flags inconsistencies (e.g., "the methodology says severe SDRs are classified by JASC code X but entry SDR-12345 was tagged severe with a different code"). Queues findings for your review.

**Where it runs:** Cloudflare Worker, weekly cron.

**LLM it uses:** Claude Sonnet.

**What it costs:** ~$0.25/week.

**Why it matters:** Self-audit. Boeing's lawyers will eventually try to find an inconsistency. This agent finds them first.

### 6. THE WIRE OPERATOR

**What it does:** When a new event is published (severe SDR, anniversary, hearing, executive comp disclosure), this agent formats it into a platform-specific post and pushes to Bluesky, Mastodon, and Threads via their APIs on a 60-minute delay. **No X/Twitter at launch** — paid API, and ElonJet's suspension history makes it risky for accountability bots.

**Where it runs:** Cloudflare Worker, event-triggered.

**LLM it uses:** None for the core posting (templates only). Could optionally use Haiku to vary the wording slightly per platform, but plain templates work fine.

**What it costs:** $0 for Bluesky, Mastodon, Threads. (X is ~$100/month and is deferred indefinitely.)

**Why it matters:** Reach multiplier. ElonJet hit ~530K followers on one mechanical trick.

### 7. THE COMPOSITOR

**What it does:** Every morning at 06:00 UTC, generates a 4-page PDF newspaper of the previous 24 hours and uploads it to `/wire/YYYY-MM-DD.pdf`. Front page is the diary; pages 2-4 are the SDR list in agate type, the live map snapshot, and the citations footer. This is the artifact reporters print and pin to their walls.

**Where it runs:** Cloudflare Worker (using Puppeteer via a remote browser service like Browserless, free tier).

**LLM it uses:** None directly — uses the Diarist's output.

**What it costs:** $0 if Browserless free tier is sufficient (likely yes), otherwise ~$5/month.

**Why it matters:** Print artifacts are what convert dashboards into citations.

---

## THE INFRASTRUCTURE

Everything above runs on Cloudflare's free tier:

| Service | What it does | Free tier limit | Boeing Watch usage |
|---|---|---|---|
| **Cloudflare Pages** | Hosts the website | Unlimited bandwidth, 500 builds/month | Way under |
| **Cloudflare Workers** | Runs the agents on schedules | 100,000 requests/day | ~50/day (way under) |
| **Cloudflare D1** | SQL database for events | 5 GB, 5M reads/day, 100K writes/day | Way under |
| **Cloudflare R2** | File storage (PDFs, images) | 10 GB | Way under |
| **Cloudflare KV** | Fast cache for hot data | 100K reads/day, 1K writes/day | Way under |
| **Cron Triggers** | Schedules the agents | Unlimited | Used: 7 agents on schedules |

**Why Cloudflare:** Free tier handles this. Everything is in one dashboard. Same vendor as your other Harrow Lab sites (writetool.live). Workers run at the edge — fast everywhere.

---

## DATA FLOW (THE PIPES)

Top to bottom:

```
EXTERNAL DATA SOURCES
├── FAA SDR feed                    (every hour, free)
├── airplanes.live                  (every 30s, free, CORS-enabled)
├── Yahoo Finance (BA stock)        (every 60s, via Worker proxy)
├── NTSB / OSHA / SEC EDGAR feeds   (daily, free)
└── Google News                     (daily, for citations)
                  ↓
          THE AGENTS
          (Workers, scheduled)
                  ↓
          CLOUDFLARE D1
          (event database)
                  ↓
          CLOUDFLARE PAGES
          (the website)
                  ↓
                YOU
          (read on phone or desktop)
                  ↓
       PUBLIC + JOURNALISTS
   (read site, embed widgets, cite)
```

The browser fetches from D1 via Workers; nothing on the server is dynamic except the data layer. The site loads instantly because the static HTML is already cached at the edge.

---

## WHAT YOU ACTUALLY DO

Your job, week-to-week:

**Daily (~5 min):** Read the diary. Check the corrections inbox. If a tip came in, decide whether to verify it.

**Twice a week (~30 min each):** Review the FOIA queue. Click "approve & print" on any that look right. Mail the letters.

**Weekly (~1 hour):** Read the Fact-Checker's audit. Approve or revise any flagged entries. Update the methodology page if a new edge case appeared.

**Monthly (~2 hours):** Record the Wire Briefing (15-min screen-share video). Post to YouTube/Bluesky. Send the monthly print mailing if you're at Stage 3.

**As needed:** Respond to journalist outreach. Update sources. Add new memorial entries.

**Total: 2-4 hours/week** during normal weeks. Spikes during major news events.

---

## WHAT BREAKS, WHAT TO DO

**The FAA SDR feed goes down:** The site keeps running on the last cached state. The SDR Beat Reporter retries hourly. You don't need to do anything.

**airplanes.live changes their API:** The hero counter falls back to the embedded snapshot. The site shows "SNAPSHOT MODE" in the topbar. Repair: open the agent prompt for the airplanes.live integration, paste the new API shape, redeploy.

**An LLM agent hallucinates an entry:** The Fact-Checker should catch it in the weekly audit. If you catch it sooner via corrections inbox: edit the entry directly in the D1 database (one SQL command from Claude Code), or delete it and let it re-process next cycle.

**Boeing's lawyers send a letter:** You have a corrections policy and a methodology page. Reply on letterhead: "Every fact on Boeing Watch is sourced from public records cited at the corresponding URL. We will correct any factual error within 24 hours of receiving documentation. Please specify the entry and the corrected fact." Almost always, that ends it. Keep a counsel-on-call on retainer for $0 (a friendly attorney willing to write one letter if escalated).

**Cloudflare's free tier limits get hit:** This would require Boeing Watch to be substantially more popular than expected. If it happens, the Workers paid tier is $5/month and lifts limits by 100x.

**You go on vacation:** The agents keep running. Set up a Bluesky/email alert for the FOIA queue so urgent items don't sit. Everything else is fine for two weeks unattended.

---

## THE CRITICAL FACT

You are **not building this yourself**. Claude Code builds it from the build package. Cowork helps you maintain it. You orchestrate, approve, and represent the project publicly. The agents do the journalism work that doesn't require judgment. You do the judgment.

The whole point of this design is that one person + AI agents + free Cloudflare infrastructure can produce a citable primary accountability source. Nobody has built this yet for any living corporation. You will.
