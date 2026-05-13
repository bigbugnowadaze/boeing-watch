# BOEING WATCH — LAUNCH PACKAGE

Everything you need to ship Boeing Watch. Bundled in this folder.

---

## READ IN THIS ORDER

1. **`EXPLAINER.md`** — How the whole system works. Plain English. No code. 10-minute read. Start here.
2. **`BUDGET.md`** — Exact costs. ~$22 upfront, $2-5/month recurring. 3-minute read.
3. **`DOMAINS.md`** — Domain shortlist with verified availability. Pick one before the build. 3-minute read.
4. **`HANDOFF-CLAUDE-CODE.md`** — The actual build package. Hand this + the agent-prompts folder + the V4 prototype HTML to a Claude Code session.

---

## WHAT'S IN THIS PACKAGE

```
launch/
├── README.md                        ← this file
├── EXPLAINER.md                     ← how the system works
├── BUDGET.md                        ← costs and free tiers
├── DOMAINS.md                       ← domain shortlist
├── HANDOFF-CLAUDE-CODE.md           ← build package for Claude Code
└── agent-prompts/
    ├── 01-sdr-beat-reporter.md      ← the SDR normalizer
    ├── 02-diarist.md                ← daily diary author
    ├── 03-foia-clerk.md             ← FOIA letter drafter
    ├── 04-fact-checker.md           ← weekly self-audit
    ├── 05-wire-operator.md          ← cross-platform poster
    └── 06-compositor.md             ← Daily Wire PDF renderer
```

(The prototype HTML — `boeing_watch_prototype.html` — is in `/mnt/user-data/outputs/` from the earlier conversation. Move it into the repo as `public/index.html` during Stage 1.)

---

## QUICK START — DO THIS THIS WEEK

**Today (15 minutes):**
1. Read EXPLAINER.md and BUDGET.md.
2. Skim DOMAINS.md, pick `boeingwatch.org` (or whatever you decided).

**This week (1 hour):**
3. Sign up for Cloudflare. Sign up for Anthropic Console. Sign up for GitHub if you don't have it.
4. Register the domain via Cloudflare Registrar (~$12).
5. Add $10 credit to Anthropic Console.

**Next session with Claude Code (3-4 hours):**
6. Open a Claude Code session.
7. Drop in: HANDOFF-CLAUDE-CODE.md, all six agent-prompts files, the V4 prototype HTML.
8. Paste the "Exact instruction to paste into Claude Code" from the end of HANDOFF-CLAUDE-CODE.md §"Exact instruction".
9. Stage 1 ships: boeingwatch.org is live with the prototype, methodology, corrections, sources, about pages.

**Following week (3-4 hours/day for ~4 days):**
10. Stage 2 ships: agents wired up, Daily Wire PDF rendering, cross-platform posting live.

**Following month:**
11. Stage 3 (optional polish, press outreach).

---

## WHAT BUG ACTUALLY HAS TO DO

You orchestrate. You don't code. Your weekly work is roughly:

- **Daily (5 min):** Read the auto-generated diary. Check corrections inbox.
- **2x/week (30 min each):** Review FOIA queue. Click "approve & print" when appropriate. Mail letters.
- **Weekly (1 hour):** Review the Fact-Checker audit. Fix flagged entries.
- **Monthly (2 hours):** Record the Wire Briefing video. Send press outreach if applicable.

Total: 2-4 hours/week. Spikes during major news events.

The AI does the journalism work that doesn't require judgment. You do the judgment.

---

## WHY THIS SHIPS

The strategy from the prior research:
- **There is no canonical "living corporation accountability" reference site for any company yet.** First mover wins the URL slot.
- **The four credibility constants** (named author, methodology page, corrections policy, sourced citations) are all built into Stage 1.
- **The signature format ("The Wire")** is the convention that other publications will copy. Boeing Watch becomes the noun.
- **The cost** is ~$25 upfront and $5/month recurring. Cloudflare's free tier carries the load.
- **The audience** is BOTH journalists (the AvHerald-voice Wire, the FOIA queue, the methodology discipline) AND the public (the counter, the memorial, the screenshot moments).

**Target launch window:** Last week of July 2026 — Boeing Q2 earnings + the August 2026 MAX 7 certification decision. That gives you ~10 weeks from today to ship Stages 1-2 with margin. Plenty.

---

## QUESTIONS LIKELY TO COME UP

**"Can I just ship Stage 1 first and not do agents?"**
Yes. Stage 1 alone is a credible site. You'd be missing the Wire and the Daily PDF — the things that drive citations — but you'd be live. Agents can come later.

**"What if the FAA changes their SDR system?"**
The SDR Beat Reporter agent's prompt is a markdown file. Bug edits the prompt, redeploys. The site keeps running on cached data while the agent is updated.

**"What if Cloudflare's free tier runs out?"**
Paid tier is $5/month and lifts limits ~100x. Boeing Watch would have to grow to NYT-frontpage-level traffic to hit those limits.

**"What if Boeing sues?"**
Defense playbook in EXPLAINER.md §"What breaks." Short version: methodology + corrections + public-record-only + corrections@ email + counsel on retainer for one letter. The legal precedent for accountability journalism on living corporations is strong (ElonJet, AvHerald, layoffs.fyi all survived).

**"What if it doesn't get cited?"**
Stage 3 is the press outreach. If after 90 days no tier-1 citation has landed, pause feature work and run direct named outreach to the six journalists named in the research (Gates, Tangel, Leggett, Ostrower, Fehrm, Pfeifer) with a printed Daily Wire and a one-line note. That always works.

**"Can I use this same architecture for Walton Meter or Pharma Watch next?"**
Yes. That's the franchise play. Same agents (with retargeted prompts), same infrastructure, different corporation. The Harrow Wire could become a category.

---

## READY?

When you've got Cloudflare + Anthropic + GitHub accounts active and the domain registered, open Claude Code and paste in the instruction at the end of HANDOFF-CLAUDE-CODE.md.

You will be live in 4 hours.

You will be cited in 90 days.

— end —
