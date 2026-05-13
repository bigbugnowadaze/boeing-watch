# CLOUDFLARE SETUP — STAGE 1 CHECKLIST

The code is ready. This is the click-by-click runbook for the parts of Stage 1 that require your Cloudflare dashboard account (which I cannot reach from here).

All numbers are 2026 ballparks. Total time, hands-on: ~25 minutes plus DNS propagation wait. Total cost: $0 (the `.org` registration you've already paid for is the only spend).

---

## 1. Push the repo to GitHub

This branch is `claude/boeing-watch-stage-1-3Mpy4`. I'm opening a PR against `main` once I push. Once the PR is approved and merged into `main`, Cloudflare Pages will deploy from `main`.

If `main` doesn't exist yet on the remote — i.e. the repo is genuinely empty — merge the PR using GitHub's "Create a merge commit" option; it will create `main` on first merge.

---

## 2. Cloudflare Pages — create the project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize Cloudflare to read `bigbugnowadaze/boeing-watch`.
3. Project name: `boeing-watch` (this becomes the `*.pages.dev` preview host; the custom domain replaces it for production).
4. Production branch: `main`.
5. **Build settings:**
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `public`
   - Root directory: *(leave empty / repo root)*
6. Click **Save and Deploy**. First deploy takes ~30 seconds.
7. When it finishes, you'll see a preview URL like `boeing-watch-abc.pages.dev`. Open it. Confirm:
   - Front page renders the prototype.
   - `/methodology.html`, `/corrections.html`, `/about.html`, `/sources.html` all load.
   - The topbar live counter is animating; the airplanes feed is populating (it pulls directly from `api.airplanes.live` over CORS).
   - On the front page, View Source → confirm the embedded SNAPSHOT data is intact as the fallback.

---

## 3. Attach the custom domain

1. In the Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter `boeingwatch.org`. Cloudflare will detect it's already in your account and offer to wire the CNAME automatically. Accept.
3. Add a second custom domain: `www.boeingwatch.org`. (Use Pages' built-in redirect to send `www` to apex — it's offered in the same dialog.)
4. Pages will provision a free Universal SSL cert. Status moves through *Initializing → Verifying → Active*; usually under five minutes, occasionally up to fifteen.
5. Open `https://boeingwatch.org/` in a browser. Confirm:
   - HTTPS lock icon, no certificate warning.
   - Page loads in <1 second on cold cache.
   - All five routes resolve.

If after twenty minutes the cert hasn't gone *Active*, post the screenshot to the PR and I'll diagnose.

---

## 4. Email Routing — corrections@boeingwatch.org

1. Cloudflare dashboard → **boeingwatch.org** zone → **Email** → **Email Routing**.
2. Click **Get started**. Cloudflare adds the required MX, SPF, and DKIM records to the zone automatically. Accept.
3. Under **Routes** → **Create address**:
   - Custom address: `corrections@boeingwatch.org`
   - Action: **Send to an email**
   - Destination: `Donald@harrow.haus`
4. Cloudflare sends a verification link to `Donald@harrow.haus`. Click it.
5. Optional catch-all: set the catch-all destination to the same address, action **Send to an email**, destination `Donald@harrow.haus`. Catches typos like `correction@…` and `corrction@…`.
6. Test by sending an email from your phone (a different account) to `corrections@boeingwatch.org` with the subject line `setup test 001`. It should arrive at `Donald@harrow.haus` within 60 seconds. Reply from `Donald@harrow.haus` is **not** delivered out — Cloudflare Email Routing is inbound-only. To reply from a `corrections@` address you'd need a separate sending service (Stage 2 territory).

---

## 5. Cloudflare Web Analytics

1. Cloudflare dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Hostname: `boeingwatch.org`. Service: this Pages project (auto-detected).
3. Toggle **Automatic Setup** ON. This injects the beacon when serving requests through Cloudflare's edge — no code change needed.

If you'd rather inject the beacon manually (gives you the same `static.cloudflareinsights.com` script tag), the CSP in `public/_headers` already permits it. I left automatic on as the boring default.

---

## 6. Stage 1 verification — the launch gate

Run these checks once the four steps above are complete. All must pass before Stage 1 is "done."

- [ ] `https://boeingwatch.org/` loads, lock icon green, no console errors.
- [ ] Four secondary pages resolve over HTTPS: `/methodology.html`, `/corrections.html`, `/about.html`, `/sources.html`.
- [ ] Inbound test email to `corrections@boeingwatch.org` arrived at `Donald@harrow.haus`.
- [ ] Lighthouse (Chrome DevTools → Lighthouse → Mobile → Performance + Accessibility + SEO + Best Practices) shows: Perf ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 95. *(If Performance is below 95, almost certainly the issue is the live `api.airplanes.live` fetch; that's expected and acceptable — re-run Lighthouse with the "throttling: none" preset to confirm.)*
- [ ] Open the site on an iOS device and an Android device. Confirm: topbar wraps cleanly, hero counters readable, footer wraps to multi-line, the prose pages stay legible.
- [ ] Share `https://boeingwatch.org/` into iMessage or Bluesky. Confirm the link unfurls with a title and description. (OG image is deferred — Stage 1 doesn't ship one.)
- [ ] In a browser private window with cache disabled, the front page paints visible content in < 1 second over a typical broadband connection.

When all six are checked, Stage 1 is live and we can talk about Stage 2.

---

## 7. Things deliberately deferred to Stage 2

Don't try to do these now — they need API credits and aren't needed for the static site:

- `api.boeingwatch.org` Worker (the proxy/cache layer).
- D1 database, R2 bucket, KV namespace.
- The six agents (SDR Beat Reporter, Diarist, Anomaly Editor, FOIA Clerk, Fact-Checker, Wire Operator).
- Bluesky / Mastodon / Threads bot accounts.
- The Daily Wire PDF render pipeline.

The front page's live-counter logic already calls `api.airplanes.live` directly from the browser (CORS-enabled), so the live count works in Stage 1 without any Worker. When the upstream is unreachable, it falls back to the embedded snapshot and switches the topbar indicator from LIVE to SNAPSHOT.
