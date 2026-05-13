# THE COMPOSITOR — AGENT PROMPT

**Job:** Render the Daily Wire PDF newspaper every morning at 06:00 UTC. A 4-page A3 broadsheet with the day's diary, SDR list, world map snapshot, and citations.
**Runs:** Daily at 06:00 UTC via Cloudflare Worker cron.
**Model:** None — this is rendering, not generation. Uses outputs from the Diarist + SDR Beat Reporter + map state.
**Inputs:** Yesterday's diary entry, the past 24h SDRs, a live map render, the day's citations.
**Outputs:** A PDF at `/wire/YYYY-MM-DD.pdf` in R2; a permalink card image at `/wire/YYYY-MM-DD/og.png`.

---

## CORE PRINCIPLE

The Daily Wire PDF is the artifact reporters print and pin. It must look like an evidence document, not a marketing piece. Newspaper conventions throughout:

- A3 portrait, single column on front; multi-column inside
- EB Garamond throughout (no sans-serif on the body)
- DM Mono for the masthead, page numbers, and timestamps
- All-caps Bebas Neue stencil for the headline number on the front
- Bone cream background; oxblood and warm charcoal as the only color accents
- Folio number, edition date, and Zulu timestamp on every page

---

## PAGE STRUCTURE

### Page 1 — The Front

```
┌───────────────────────────────────────────────────────────────┐
│                                                                │
│                    THE BOEING WATCH WIRE                       │
│              an independent accountability daily               │
│                                                                │
│   No. 0128 · 12 May 2026 · 04:00 UTC                          │
│   ────────────────────────────────────────────────────────    │
│                                                                │
│                                                                │
│                     858                                        │
│              DAYS SINCE THE                                    │
│              DOOR PLUG BLOWOUT                                 │
│                                                                │
│                                                                │
│     ────────────────────────────────────────────────          │
│                                                                │
│   THE DIARY — 12 MAY 2026                                     │
│                                                                │
│   [Diary entry rendered in EB Garamond 11pt, justified,        │
│    no images, 350-450 words, single column]                    │
│                                                                │
│                                                                │
│                                                                │
│   Time since last severe SDR: 06:25:14                         │
│   Cumulative Boeing-aircraft SDRs since 5 Jan 2024: 12,734    │
│                                                                │
│                                                                │
│   boeingwatch.org    ·    corrections@boeingwatch.org          │
└───────────────────────────────────────────────────────────────┘
```

The big stenciled number on the front is whichever counter is most striking that day. Choose by priority:

1. If a severe SDR was filed in the past 24h, the number is "Time since last severe SDR" reset clock.
2. If today is an anniversary, the number is the year count and the subject is the anniversary subject.
3. If the Anomaly Editor fired today, the number is the sigma value above baseline.
4. Default: "Days since the door plug blowout."

The Compositor decides automatically based on the day's events.

### Page 2 — The Ledger

A two-column page listing every SDR from the past 24 hours, in canonical sentence-stem form. Each entry is rendered as a short paragraph:

```
SDR 2026-12345 · 22:08 UTC
A Southwest Airlines 737-8, registration N8709Q, performing flight WN1234
from KDAL to KMSY with 174 souls on board, experienced a cabin pressuri-
zation warning at FL370, performed an emergency descent, and diverted to
KIAH. Severity: severe.
```

Twelve to twenty entries per page typically. If more, continue on page 3.

### Page 3 — The Map

A single full-page render of the Boeing Watch world map at 06:00 UTC: every 737 MAX aircraft currently aloft as an oxblood dot on a cream basemap. Caption underneath: number of aircraft visible, time of the snapshot, top three operators.

### Page 4 — The Citations

Two-column citations page listing every source linked in today's diary and yesterday's events. Each citation includes outlet, byline, date, and full URL. Same EB Garamond agate type used in the NYT "Incalculable Loss" front page.

Page footer on every page:

```
THE BOEING WATCH WIRE — No. 0128 — 12 May 2026 — page N of 4
boeingwatch.org · corrections@boeingwatch.org · CC BY 4.0 — share freely with attribution
```

---

## RENDERING PIPELINE

1. **04:30 UTC:** The Diarist publishes the day's diary entry to D1.
2. **05:30 UTC:** A pre-render Worker assembles all inputs:
   - Pull the diary from D1
   - Query the past 24h of SDRs from D1
   - Query airplanes.live for the current world map state, save as a static SVG
   - Pull the citations linked in the diary
3. **05:45 UTC:** A Browserless.io headless Chrome instance renders an HTML template (`print.html`) populated with the above data to PDF.
4. **05:55 UTC:** The PDF is uploaded to R2 at `/wire/YYYY-MM-DD.pdf`.
5. **06:00 UTC:** A canonical link goes live at `boeingwatch.org/wire/YYYY-MM-DD.pdf` and an Open Graph image at `/wire/YYYY-MM-DD/og.png`.
6. **06:30 UTC:** The Wire Operator posts the daily digest with the PDF link.

---

## OUTPUT FORMATS

For each daily edition, the Compositor produces three artifacts:

1. **The PDF** at `/wire/YYYY-MM-DD.pdf` — for download, print, and journalist filing.
2. **The Open Graph image** at `/wire/YYYY-MM-DD/og.png` — a 1200×630 image showing the front-page top half (the number + diary lead). This is what social media platforms render when the link is shared. The image must be screenshot-survivable: tweet-croppable, readable at 600px wide.
3. **The HTML version** at `/wire/YYYY-MM-DD/` — for accessibility and indexing. Same content as the PDF but in semantic HTML, with proper headings, alt text on the map (a descriptive paragraph for screen readers), and machine-readable metadata.

---

## ARCHIVE

Every daily edition is archived permanently. URLs never change. Year 1 alone produces 365 PDFs at ~500 KB each = ~180 MB. Way under the R2 free tier (10 GB).

A `/wire` index page lists every edition with date, the front-page number, and a one-line abstract pulled from the diary's first sentence.

---

## NEVER DO THIS

- **Never include photos.** Bone-cream agate type only. The NYT "Incalculable Loss" precedent: refusing photography is the move.
- **Never use color beyond oxblood and burnt amber.** No greens, no blues, no charts with rainbow palettes.
- **Never miss a day.** If the Diarist fails to produce a diary, the Compositor publishes a no-diary edition with the structured event data only, plus a single sentence: "The Diarist failed to produce an entry today. The data below is unedited; corrections may follow." Transparency is the rule.
- **Never republish a previous day's edition under a new date.** Every edition is unique.
- **Never embed JavaScript in the PDF.** Static rendering only.

---

## OPTIONAL ENHANCEMENTS (LATER)

- **Weekly omnibus edition** every Sunday, a 16-page review of the week's events.
- **Quarterly print edition** — same pipeline, but A2 trim and printed via Mixam, mailed to ~200 named reporters.
- **Annual yearbook** — same pipeline, but a perfect-bound book of all 365 editions for the year, generated at year-end and available via Lulu.
- **Editions in additional languages** — Mandarin and Spanish versions of the diary translated by an LLM, for international reach. Defer until English version has reach.

---

## DEPENDENCY: BROWSERLESS.IO

The Compositor depends on a headless Chrome instance to render HTML → PDF. Three options:

1. **Browserless.io free tier** — 1,000 sessions/month free. Boeing Watch needs ~30/month (one per day). Way under. Sign up at browserless.io, get an API token, store in Worker secret.
2. **Self-hosted Puppeteer** — heavier, requires hosting Puppeteer somewhere (Fly.io free tier works). Skip unless Browserless rate-limits become an issue.
3. **Cloudflare Browser Rendering** (Workers Browser Rendering API) — newer, paid only at scale, but generous free tier. Native to the Cloudflare ecosystem so no third-party dependency. Consider when out of Browserless free tier.

For launch: use Browserless. Switch if needed.
