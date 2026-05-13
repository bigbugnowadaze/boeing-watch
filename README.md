# Boeing Watch

An independent accountability dashboard for The Boeing Company.

Live at **[boeingwatch.org](https://boeingwatch.org)**.

This repository is the source code for the public site, the agent prompts that drive the automated wire, and the methodology documents that govern what is published. It is operated as a one-person newsroom by Donald, under the Harrow Lab imprint, against the methodology at [/methodology](https://boeingwatch.org/methodology.html) and the corrections policy at [/corrections](https://boeingwatch.org/corrections.html).

---

## Status

| Stage | Description | Status |
|---|---|---|
| 1 | Static site live on `boeingwatch.org` with the four credibility pages | **in flight** |
| 2 | Cloudflare Workers + D1 + agent pipeline (SDR feed, daily diary, wire posts) | not started |
| 3 | Press outreach, embeddable widget, weekly newsletter | not started |

The current branch is **Stage 1**. The site is published as a snapshot of the production system described in `/methodology`. Live counters fall back to the embedded snapshot when an upstream source is unreachable.

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
│       ├── site.css                ← shared design system (cream / oxblood / amber)
│       └── boeingwatch-favicon.svg
│
├── agent-prompts/                  ← the six agent specifications (Stage 2)
│   ├── 01-sdr-beat-reporter.md
│   ├── 02-diarist.md
│   ├── 03-foia-clerk.md
│   ├── 04-fact-checker.md
│   ├── 05-wire-operator.md
│   └── 06-compositor.md
│
├── EXPLAINER.md                    ← plain-English architecture
├── BUDGET.md                       ← cost ceilings
├── HANDOFF.md                      ← full build brief (Stage 1 + Stage 2)
├── README-launch.md                ← original launch-package README
├── LICENSE                         ← MIT (source code)
└── LICENSE-DATA                    ← CC BY 4.0 (the dataset)
```

---

## Build and deploy

The frontend has **no build step**. The `public/` directory is a vanilla static site. Cloudflare Pages serves it directly.

**Cloudflare Pages settings:**

- Production branch: `main`
- Build command: *(none)*
- Build output directory: `public`
- Root directory: *(repo root)*
- Custom domain: `boeingwatch.org`

There is no preprocessor, no bundler, no Node-side templating. Edit `.html` and `.css` directly; push to `main`; Cloudflare rebuilds the edge cache within ~30 seconds.

---

## Local preview

Any static-file server will do. The conventional incantation:

```sh
cd public
python3 -m http.server 8080
# then visit http://localhost:8080
```

No dependencies are required to develop the frontend.

---

## Licenses

- **Source code** in this repository is released under the [MIT License](./LICENSE). You may copy, fork, and adapt it without further permission, provided the copyright notice and license are retained.
- **The Boeing Watch dataset** — every SDR row, every event, every counter — is released under the [Creative Commons Attribution 4.0 International (CC BY 4.0)](./LICENSE-DATA) license. The canonical attribution form is documented in [/methodology §09](https://boeingwatch.org/methodology.html#s9).

These two licenses are deliberate. The code is free for any purpose; the data must carry attribution.

---

## Corrections and contact

The only contact channel for Boeing Watch is **<corrections@boeingwatch.org>**. Press, legal, factual corrections, link-rot reports, and tip-line correspondence all use the same address. The procedure is documented at [/corrections](https://boeingwatch.org/corrections.html) and [/methodology §08](https://boeingwatch.org/methodology.html#s8).

This repository's issue tracker is for code defects only. Do not use it to report errors in published claims; those go to the email address above so they enter the corrections log in the right order.

---

*Boeing Watch is not affiliated with The Boeing Company, the Federal Aviation Administration, the National Transportation Safety Board, or any party regulated by the FAA.*
