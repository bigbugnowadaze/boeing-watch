# BOEING WATCH — LAUNCH BUDGET

*All prices in USD. Verified May 2026. Subject to change — re-check before purchasing.*

---

## TL;DR

**Upfront: $12-15** (domain registration only)
**Monthly: $0-3** for first 90 days, $3-8 once agents are running, $5-15 at full Stage 3.

You can launch Stage 1 (the static site live on your own domain) for **$12**. Everything else is free until you're ready to add the agents.

---

## YOUR $20-25 — WHERE IT GOES

**$12 — Domain registration via Cloudflare Registrar** (one-time, year one)
Cloudflare Registrar sells domains at wholesale registry cost. No markup. .org domains are ~$10-12/yr, .com is ~$10/yr, .net is ~$11/yr. Renewals same price.

**Remaining $8-13 — Pre-funded Anthropic API credit**
Top up an Anthropic API account with $5-10. This funds the first 2-3 months of agent runs. Reload as needed. (Note: most agent work can be done via your existing Claude.ai subscription if you trigger jobs manually with Cowork. The API funding is for the *automated* hourly/daily crons.)

That's it. You can launch under $25.

---

## EVERYTHING ELSE IS FREE FOR LAUNCH

| Service | What it does | Free tier | Hits limit when? |
|---|---|---|---|
| **Cloudflare Pages** | Hosts the static site | Unlimited bandwidth, 500 builds/mo, 100MB site | Never at this scale |
| **Cloudflare Workers** | Runs scheduled agents | 100K requests/day, 10ms CPU/request | Never (Boeing Watch uses ~50/day) |
| **Cloudflare D1** | SQL database for events | 5 GB storage, 5M reads/day | Never (Boeing Watch DB ~100MB year 1) |
| **Cloudflare R2** | File storage (PDFs) | 10 GB storage, 1M Class A ops/mo | Never |
| **Cloudflare KV** | Fast cache | 100K reads/day, 1K writes/day | Never |
| **Cloudflare Cron Triggers** | Schedules the agents | Unlimited triggers | Never |
| **Cloudflare Web Analytics** | Traffic stats (privacy-first) | Free, no cookies | Never |
| **GitHub (public repo)** | Source code | Free for public | Never |
| **GitHub Actions** | CI/CD | 2,000 min/mo on free public repos | Never (deploys are ~30 sec each) |
| **airplanes.live API** | Live aircraft data | Free, no auth, CORS-enabled | Generous community limits |
| **FAA SDR data** | Service Difficulty Reports | Public domain, CSV downloads | Never |
| **NASA ASRS** | Aviation Safety Reports | Free CSV exports | 10,000/query but plenty |
| **SEC EDGAR** | Boeing financial filings | Free public XBRL | Never |
| **OpenSecrets** | Boeing PAC, lobbying | Free | Never |
| **Bluesky / Mastodon** | Wire bot posting | Free API | Never |
| **Buttondown** | Newsletter (up to 100 subs) | Free | When you cross 100 subs (then $9/mo) |
| **Resend** | Transactional email | 100 emails/day | Never at this scale |

**Total monthly free-tier value: ~$200-500/mo if billed at full price. You pay $0.**

---

## RECURRING COSTS

### Tier 1: Bare minimum (launch through Day 30)
| Item | Cost |
|---|---|
| Domain renewal | ~$1/mo amortized |
| Total | **~$1/mo** |

### Tier 2: Full agent automation (Day 30+)
| Item | Cost |
|---|---|
| Domain renewal | ~$1/mo |
| Anthropic API (Haiku for SDR normalizer, Sonnet for diary/FOIA) | ~$2-5/mo at expected volume |
| Total | **~$3-6/mo** |

### Tier 3: Print + reach (Day 90+, optional)
| Item | Cost |
|---|---|
| Tier 2 baseline | $3-6/mo |
| Browserless.io for PDF rendering (free tier likely enough) | $0-5/mo |
| First quarterly print mailing (Mixam or Newspaper Club, ~200 copies) | $200-400/qtr = $67-133/mo amortized |
| Total | **$70-145/mo** |

Skip Tier 3 until reach justifies it. The print mailing is a Stage 3 commitment, not a launch requirement.

### Tier 4: Reach maxing (Year 2+, optional)
| Item | Cost |
|---|---|
| Tier 3 baseline | $70-145/mo |
| X / Twitter API Basic tier (only if X reach becomes essential) | $100/mo |
| Cloudflare Workers Paid (if you outgrow free tier — unlikely) | $5/mo |
| Annual print yearbook POD production | ~$30/mo amortized |
| Total | **$205-280/mo** |

---

## ANTHROPIC API USAGE ESTIMATES

The agent workloads, in approximate tokens per month:

| Agent | Frequency | Tokens (in+out) per run | Monthly total | Est. cost (Haiku) | Est. cost (Sonnet) |
|---|---|---|---|---|---|
| SDR Beat Reporter | hourly | ~650 | ~470K | <$0.50 | ~$3 |
| Diarist | daily | ~10,500 | ~315K | <$0.30 | ~$2 |
| FOIA Clerk | ~6/mo | ~3,000 | ~18K | <$0.05 | <$0.50 |
| Fact-Checker | weekly | ~22,000 | ~95K | <$0.10 | <$1 |
| Press-Release Skeptic | ~6/mo | ~6,000 | ~36K | <$0.05 | <$0.50 |
| **Total** | | | **~935K** | **~$1-2** | **~$7-8** |

**Recommendation:** Use Haiku for SDR Reporter and Press-Release Skeptic (template work, doesn't need creative prose). Use Sonnet for Diarist, FOIA Clerk, Fact-Checker (these need judgment). Expected monthly spend: **$2-5**.

Verify current API pricing at console.anthropic.com before launch — pricing changes occasionally.

---

## WHAT YOU CAN SKIP UNTIL LATER

These are recommended in the research but **do not need to ship at launch**:

- **Twitter/X bot** — defer indefinitely. $100/month and ElonJet-suspension risk. Use Bluesky + Mastodon + Threads instead.
- **Print mailing** — defer to Day 90+ when you can show reach. Quarterly mailing costs ~$300 each.
- **SMS alerts** — defer indefinitely. 10DLC compliance burden outweighs reach.
- **AR features** — never ship. Gimmick.
- **Live community video calls** — defer to year 2. Use recorded monthly Wire Briefing until then.
- **Annual yearbook POD book** — ship at year 1 anniversary, not before. Need a full year of data.

---

## A NOTE ON HIDDEN COSTS

Three things to plan for that are easy to miss:

1. **Domain privacy / WHOIS proxy.** Cloudflare Registrar includes WHOIS privacy free. Other registrars charge $10-15/yr. Use Cloudflare.

2. **Legal "first letter" budget.** Boeing's lawyers will likely send a polite warning letter within 6 months of meaningful reach. Budget $200-500 to have a friendly attorney review the methodology page and draft a standard response letter once. This is insurance, not recurring cost. Many SF/Seattle media-law attorneys will do this pro bono for an accountability project.

3. **Your time.** 2-4 hours/week of your attention is the real recurring cost. Treat that as part of the budget. If you can't sustain it, the agents will keep running but the editorial credibility will erode.

---

## LAUNCH PURCHASE LIST (DO THIS WEEK)

1. **Open a Cloudflare account** (if you don't have one — free)
2. **Register domain via Cloudflare Registrar** — see DOMAINS.md for shortlist — ~$12
3. **Open an Anthropic Console account** (console.anthropic.com)
4. **Add a payment method, top up $10** — this funds the agent runs
5. **Hand the BUILD-PACKAGE.md to Claude Code** — it will scaffold the repo, deploy to Cloudflare Pages, and walk you through connecting the domain

Total spend: ~$22. You're live.

The rest accrues over months at single-digit dollars.
