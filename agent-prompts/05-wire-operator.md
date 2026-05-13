# THE WIRE OPERATOR — AGENT PROMPT

**Job:** Cross-post Boeing Watch events to Bluesky, Mastodon, and Threads using fixed templates on a 60-minute aggregation delay.
**Runs:** Event-triggered (when an event is published to the Wire) but with a deliberate 60-minute delay.
**Model:** None for core posting (pure templates). Optional Haiku for platform-specific wording variants.
**Inputs:** A normalized event from the D1 `events` table.
**Outputs:** Posts to Bluesky (AT Protocol), Mastodon (REST API), and Threads (Graph API).

---

## CORE PRINCIPLE

The Wire Operator is **not an LLM agent for the basic case.** It's a template engine. Every event type maps to one platform-specific template. The LLM only enters the picture for the rare bespoke post (e.g., a hand-curated commentary on a major event Bug writes himself).

Templates are stored as markdown files. The Worker reads the template, fills in the event data, and posts.

---

## TEMPLATES BY EVENT TYPE

### Template: Severe SDR

**Bluesky (300 char limit):**
```
SDR {sdr_id} · {date_zulu}

{narrative_truncated_to_220_chars}

Source: {boeingwatch_url}
```

**Mastodon (500 char limit):**
```
🛫 SERVICE DIFFICULTY REPORT — {sdr_id}

{narrative_full}

Severity: {severity}
Filed: {filed_at}

Read at Boeing Watch: {boeingwatch_url}
```

**Threads (500 char limit, no link previews in feed):**
```
SDR {sdr_id} — Boeing {aircraft_type}

{narrative_truncated_to_350_chars}

Full record: boeingwatch.org/wire/{event_id}
```

---

### Template: Anniversary

**All platforms:**
```
{N} years ago today: {subject}.

{single_fragment_phrase}

{boeingwatch_url}
```

Example output: "8 years ago today: Lion Air Flight 610. 189 souls aboard a 737 MAX 8 lost when MCAS activated. boeingwatch.org/dead#lion-air-610"

---

### Template: Stock movement >2%

**All platforms:**
```
BA {ticker_action} {delta_pct}% today, closing at ${close}.

Days since the door plug blowout: {days_since}.
Days since the last severe SDR: {days_since_severe}.

{boeingwatch_url}
```

---

### Template: FOIA filed

**All platforms:**
```
Boeing Watch has filed FOIA request {foia_id} with the FAA.

Subject: {subject}
Asking about: {anomaly_summary_one_line}

The letter and our anomaly analysis: {boeingwatch_url}/foia/{foia_id}
```

---

### Template: FAA action (new airworthiness directive, hearing, etc.)

**All platforms:**
```
FAA — {action_type}: {subject}

{narrative_one_paragraph}

Source: {source_url}
Boeing Watch analysis: {boeingwatch_url}
```

---

### Template: Anomaly detected

**All platforms:**
```
ANOMALY — {subject}.

Current: {current_metric}
Baseline: {baseline_metric}
Deviation: {sigma}σ above baseline.

Detail and source data: {boeingwatch_url}
```

---

## THE 60-MINUTE DELAY

**Why:** ElonJet's original Twitter account was suspended in December 2022 over "real-time location" policies. Bluesky, Mastodon, and Threads don't have the same rules, but they could. The 60-minute delay means Boeing Watch posts are aggregated, not real-time tracking, and survives the strictest interpretation of any platform's anti-tracking policy.

**Mechanism:** When an event is written to the `events` table, a row is inserted into `wire_post_queue` with `scheduled_at = NOW() + INTERVAL '60 minutes'`. A separate Worker runs every 5 minutes, picks up scheduled posts, and dispatches them. Result: every Bluesky/Mastodon/Threads post lands 60 ± 5 minutes after the underlying event.

---

## POSTING APIS

### Bluesky (AT Protocol)
- Endpoint: `https://bsky.social/xrpc/com.atproto.repo.createRecord`
- Auth: app password (free; create at https://bsky.app/settings/app-passwords)
- Rate limit: generous (~50 posts/day per account, way more than needed)
- Cost: $0
- Library: `@atproto/api` for Node, but a direct fetch works fine

### Mastodon (REST API)
- Endpoint: `https://{instance}/api/v1/statuses`
- Auth: access token from a registered application
- Choose instance: `mastodon.social` (general), `journa.host` (journalists), `mastodon.online`
- Rate limit: 300 posts/5min — overkill for our needs
- Cost: $0
- Library: direct fetch

### Threads (Graph API)
- Endpoint: `https://graph.threads.net/v1.0/{ig-user-id}/threads`
- Auth: Long-lived access token (requires Threads developer app — free)
- Rate limit: 250 posts/24h
- Cost: $0 but setup is the most complex of the three
- **Note:** Threads API became generally available in 2024 and is now stable.

### X (Twitter)
- **Skip at launch.** API Basic tier is $100/month. Use only if Boeing Watch is generating clear demand for X reach.
- If/when adding: the same templates work, with a 280-char limit.

---

## DAILY DIGEST POST (06:30 UTC each morning)

In addition to event-triggered posts, the Wire Operator publishes one fixed digest post at 06:30 UTC, 30 minutes after the Daily Wire PDF drops:

**All platforms:**
```
The Boeing Watch Wire, {date_long}.

{diary_lead_sentence}

{counters_one_line}

Read today's edition: {pdf_url}
Read the full Wire: {boeingwatch_url}
```

This gives reporters a single daily anchor point to subscribe to.

---

## NEVER POST

The Wire Operator must filter out:
- Any event with `severity: "noted"` (too granular, would spam the feed)
- Any event with `verification_status: "unverified"` (corrections risk)
- Any event flagged by the Fact-Checker as "pending review"
- Any anniversary on a day where a severe SDR was also posted within the previous 4 hours (avoid memorial fatigue)
- Any post that would result in three or more posts within one hour (deduplicate aggressively)

The cadence target: roughly 3-8 posts per day across all platforms. Anything more is noise. Anything less is fine.

---

## OPTIONAL: LLM-DRIVEN VARIATION (DEFER)

In a later iteration, the Wire Operator can use Claude Haiku to lightly vary the wording between platforms — Bluesky's audience is more terse, Mastodon's is more verbose, Threads' is more casual. The variation must never alter facts; only register and length.

For launch, **plain templates only.** Variation is a Stage 2 enhancement.

---

## QUEUE TABLE SCHEMA

```sql
CREATE TABLE wire_post_queue (
  id INTEGER PRIMARY KEY,
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
```

When a post succeeds: `status = 'posted'`, `posted_at` set, `platforms_posted` lists the platforms.
When a post fails: `retry_count++`, `last_error` set, retry up to 3 times with exponential backoff.

---

## ARCHIVE EVERY POST

Every successful Wire post is archived at `/wire-posts/YYYY-MM-DD.json` for transparency. The archive includes the platform, the post URL, the underlying event, and the dispatch timestamp. This is what reporters will use to verify that Boeing Watch's social presence matches its database — and is itself a form of public accountability for the project.
