# Boeing Watch

An independent accountability dashboard for The Boeing Company.

Live at **[boeingwatch.org](https://boeingwatch.org)**.

This repository is the source code for the public site, the agent prompts that drive the automated wire, and the methodology documents that govern what is published. It is operated as a one-person newsroom by Donald, under the Harrow Lab imprint, against the methodology at [/methodology](https://boeingwatch.org/methodology.html) and the corrections policy at [/corrections](https://boeingwatch.org/corrections.html).

---

## Status

| Stage | Description | Status |
|---|---|---|
| 1 | Static site live on `boeingwatch.org` with the four credibility pages | **shipped** |
| 2 | Cloudflare Workers + D1 + agent pipeline (SDR feed, daily diary, wire posts) | not started |
| 3 | Press outreach, embeddable widget, weekly newsletter | not started |

Stage 1 ships the site as a snapshot of the production system described in `/methodology`. Live counters fall back to the embedded snapshot when an upstream source is unreachable.

---

## Layout

```
boeing-watch/
├── public/                         ← deployed to Cloudflare Pages
│   ├── index.html                  ← the front-page dashboard
│   ├── methodology.html            ← §01–§09 + change log
│   ├── corrections.html            ← public corrections log
│   ├── about.html                  ← named editor, mission, COI
│   ├── sources.html                ← canonical numbered sources
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── _headers                    ← Cloudflare Pages security + cache headers
│   └── assets/
│       ├── site.css                ← shared design system
│       └── boeingwatch-favicon.svg
│
├── agent-prompts/                  ← the six agent specs (Stage 2)
├── HANDOFF.md, EXPLAINER.md, BUDGET.md, README-launch.md
├── CLOUDFLARE-SETUP.md             ← click-by-click runbook
├── CHANGELOG.md
├── LICENSE                         ← MIT (source code)
└── LICENSE-DATA                    ← CC BY 4.0 (the dataset)
```

---

## Build and deploy

The frontend has **no build step**. The `public/` directory is a vanilla static site. Cloudflare Pages serves it directly.

**Cloudflare Pages settings:**

- Production branch: whichever branch is the repo default
- Build command: *(none)*
- Build output directory: `public`
- Root directory: *(repo root)*
- Custom domain: `boeingwatch.org`

There is no preprocessor, no bundler, no Node-side templating. Edit `.html` and `.css` directly; push; Cloudflare rebuilds the edge cache within ~30 seconds.

---

## Local preview

```sh
cd public
python3 -m http.server 8080
# visit http://localhost:8080
```

No dependencies required.

---

## Licenses

- **Source code** is MIT — see [`LICENSE`](./LICENSE).
- **The Boeing Watch dataset** — every SDR row, every event, every counter — is CC BY 4.0 — see [`LICENSE-DATA`](./LICENSE-DATA). The canonical attribution form is in [/methodology §09](https://boeingwatch.org/methodology.html#s9).

---

## Corrections and contact

The only contact channel is **<corrections@boeingwatch.org>**. The full procedure is at [/corrections](https://boeingwatch.org/corrections.html) and [/methodology §08](https://boeingwatch.org/methodology.html#s8).

The repository issue tracker is for code defects. Errors in published claims go to the email address above so they enter the corrections log in the right order.

---

*Boeing Watch is not affiliated with The Boeing Company, the Federal Aviation Administration, the National Transportation Safety Board, or any party regulated by the FAA.*
