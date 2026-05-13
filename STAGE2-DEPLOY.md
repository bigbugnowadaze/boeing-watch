# STAGE 2A — DEPLOY RUNBOOK

The Stage 2A code (D1 database, /api/* routes, SDR Beat Reporter agent) is committed. This is the click/command list to get it running on Cloudflare.

Total time: ~15 minutes. Cost: $0 (everything is free-tier; Anthropic spend kicks in only when you POST real SDRs through the agent).

---

## Prerequisites

- The Stage 1 site is live at `boeingwatch.org` (yes — done).
- Node.js 20+ and `npm` installed locally. Check with `node -v && npm -v`.
- The repo cloned locally with `git clone https://github.com/bigbugnowadaze/boeing-watch.git && cd boeing-watch`.

---

## 1. Install dev dependencies and authenticate Wrangler

```sh
npm install
npx wrangler login
```

The login flow opens a browser. Sign in with the same Cloudflare account that hosts `boeingwatch.org`. The token is stored in `~/.config/.wrangler/`.

---

## 2. Create the D1 database

```sh
npx wrangler d1 create boeingwatch
```

Output looks like:

```
✅ Successfully created DB 'boeingwatch'
[[d1_databases]]
binding = "DB"
database_name = "boeingwatch"
database_id = "abcdef12-3456-7890-abcd-ef1234567890"   ← copy this
```

Paste the `database_id` into **`wrangler.jsonc`** in the `d1_databases` block, replacing `REPLACE_WITH_D1_DATABASE_ID`.

---

## 3. Create the KV namespace

```sh
npx wrangler kv namespace create CACHE
```

Output:

```
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "CACHE"
id = "fedcba9876543210fedcba9876543210"   ← copy this
```

Paste the `id` into **`wrangler.jsonc`** in the `kv_namespaces` block, replacing `REPLACE_WITH_KV_NAMESPACE_ID`.

---

## 4. Apply the schema and seed data

```sh
npm run db:schema          # creates tables on the REMOTE database
npm run db:seed            # seeds whistleblowers + methodology v1
```

Verify:

```sh
npx wrangler d1 execute boeingwatch --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Expected output: a list with `events`, `diary`, `corrections`, `foia_queue`, `wire_post_queue`, `methodology_versions`, `victims`, `whistleblowers`, `anomalies`, `failed_normalizations`.

> The `victims` table is intentionally empty for Stage 2. The 346 names need to be transcribed from the KNKT and Ethiopian CAA reports — see `db/seed-victims.sql`. The Memorial Wall (Stage 3) renders against this table; the SDR pipeline does not depend on it.

---

## 5. Set the two Worker secrets

These never go in the repo. Set them via Wrangler — they're stored encrypted on Cloudflare.

```sh
# Anthropic API key — the SDR Beat Reporter calls Claude Haiku with this.
# Get it from https://console.anthropic.com/settings/keys
npx wrangler secret put ANTHROPIC_API_KEY

# Admin token — guards /admin/sdr/ingest and /admin/health. Just a long random
# string only you know. Generate one with:
#   openssl rand -hex 32
npx wrangler secret put ADMIN_TOKEN
```

Each command prompts for the value. Paste, hit Enter. Save the `ADMIN_TOKEN` in your password manager — it's the only way to call the admin endpoints.

---

## 6. Commit the wrangler.jsonc updates and push

The two ID swaps from steps 2 and 3 are the only edits that need to land in the repo.

```sh
git add wrangler.jsonc
git commit -m "chore: wire D1 database_id and KV id into wrangler.jsonc"
git push
```

Cloudflare auto-deploys from `main` within ~30 seconds. Watch the Workers & Pages → boeing-watch → Deployments tab.

---

## 7. Verify the deploy

Run these from a terminal. Replace `<ADMIN_TOKEN>` with the value you set in step 5.

```sh
# Sanity: D1 reachable, KV writable, Anthropic key present
curl -sS https://boeingwatch.org/admin/health \
  -H "Authorization: Bearer <ADMIN_TOKEN>" | jq

# Live aircraft proxy — should return ~400-500 aircraft, cached 30s
curl -sS https://boeingwatch.org/api/counts | jq '{count, fetched_at}'

# BA share price — should return current quote, cached 60s
curl -sS https://boeingwatch.org/api/stock | jq

# Empty wire (no SDRs ingested yet) — should return { count: 0, events: [] }
curl -sS https://boeingwatch.org/api/wire | jq

# Wall aggregate — all zeros until SDRs land
curl -sS https://boeingwatch.org/api/wall | jq

# Corrections log — empty
curl -sS https://boeingwatch.org/api/corrections | jq
```

The front page should still render at https://boeingwatch.org — the live counter now reads through `/api/counts` instead of going direct to airplanes.live.

---

## 8. First end-to-end agent test — push one SDR through

This is the load-bearing check: it verifies the SDR Beat Reporter agent talks to Claude Haiku, parses the JSON output, and writes a row to D1.

```sh
curl -sS -X POST https://boeingwatch.org/admin/sdr/ingest \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  --data @db/sample-sdrs.json | jq
```

Expected response: `{"processed":3,"written":3,"skipped":0,"failed":0,"details":[...]}`.

Cost: ~$0.001 (three Haiku calls, ~500 input tokens each).

Then verify the rows landed:

```sh
curl -sS https://boeingwatch.org/api/wire | jq '.events[] | {sdr_id: .id, severity, narrative: .narrative[:80]}'
curl -sS https://boeingwatch.org/api/wall | jq
```

You should see three SDRs in the wire and the wall counters at 3 / 3 / 1 (total / 737 MAX / severe). If any record came back `failed`, the reason is in `.details[].reason` — typical first-run causes are: missing `ANTHROPIC_API_KEY` (set it in step 5), wrong model ID (we use `claude-haiku-4-5`), or the model returning prose instead of JSON (the prompt template is strict; report the raw output and I'll tighten it).

---

## 9. Cron is now firing

The `triggers.crons` block in `wrangler.jsonc` schedules `5 * * * *` — every hour at five past. Right now the cron handler is a **stub**: it logs that it fired and pings D1, but it doesn't fetch any SDRs.

Wiring the real FAA SDR fetcher is the next chunk (Stage 2B). When you're ready for that, ping me and we'll either:

- Write a nightly fetcher that downloads the FAA SDR CSV to R2 and chunks it through `/admin/sdr/ingest`, or
- Connect to a third-party SDR feed if a cleaner one exists (an open question — the FAA's public-facing endpoint is a search form, not an API).

You can manually trigger the existing stub from Wrangler at any time:

```sh
npx wrangler triggers --trigger "5 * * * *" send
```

…and tail the logs:

```sh
npx wrangler tail
```

---

## 10. Things to watch over the next 24 hours

- **`/admin/health`** should keep returning all-`ok` checks. If `anthropic_key` flips to `missing`, the secret got dropped — set it again.
- **Cloudflare dashboard → Workers & Pages → boeing-watch → Logs** should show `[cron] sdr-beat-reporter fired at …` once per hour.
- **Anthropic Console → Usage** should show no spend (the cron stub doesn't call the API) until you start posting SDRs via `/admin/sdr/ingest`.
- **Cloudflare Web Analytics** should keep recording front-page traffic. If it drops, the `/_headers` CSP may need a tweak.

---

## Rollback

If Stage 2 misbehaves and you want to revert to the Stage 1 static-only state:

```sh
git revert <commit-hash>
git push
```

Cloudflare redeploys. The site keeps serving from `public/` exactly as it did before Stage 2 — the front-end falls back to the embedded SNAPSHOT when `/api/counts` fails, so nothing visible to readers breaks even if the Worker is down.

To wipe the D1 database (only do this if you want to start over):

```sh
npx wrangler d1 execute boeingwatch --remote --command "DROP TABLE events; DROP TABLE diary; DROP TABLE corrections; DROP TABLE foia_queue; DROP TABLE wire_post_queue; DROP TABLE methodology_versions; DROP TABLE victims; DROP TABLE whistleblowers; DROP TABLE anomalies; DROP TABLE failed_normalizations;"
npm run db:schema
npm run db:seed
```
