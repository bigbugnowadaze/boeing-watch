-- ═══════════════════════════════════════════════════════════════════
-- BOEING WATCH — D1 SCHEMA
--
-- Apply with:
--   wrangler d1 execute boeingwatch --remote --file=db/schema.sql
--
-- The file is idempotent: it uses CREATE TABLE IF NOT EXISTS and
-- CREATE INDEX IF NOT EXISTS, so re-running it is safe.
-- ═══════════════════════════════════════════════════════════════════

-- ─── events ────────────────────────────────────────────────────────
-- One row per published event on the wire. SDRs, anniversaries, stock
-- moves, court filings, FOIA receipts, anomaly flags, press releases.
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,             -- 'sdr' | 'anniversary' | 'stock' | 'court' | 'foia' | 'pr' | 'anomaly'
  filed_at TEXT NOT NULL,         -- ISO 8601 UTC, e.g. '2026-05-13T14:08:00Z'
  severity TEXT,                  -- 'severe' | 'elevated' | 'noted' | NULL
  narrative TEXT NOT NULL,        -- the canonical sentence-stem narrative
  source_url TEXT,
  raw_data TEXT,                  -- JSON of original source data (for audit)
  operator TEXT,                  -- e.g. 'Southwest Airlines'
  aircraft_type TEXT,             -- e.g. '737-8', '787-9'
  registration TEXT,              -- e.g. 'N8709Q'
  raw_jasc_code TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_events_filed_at ON events(filed_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_events_aircraft_type ON events(aircraft_type);

-- ─── diary ────────────────────────────────────────────────────────
-- One row per day. Written by the Diarist agent.
CREATE TABLE IF NOT EXISTS diary (
  date TEXT PRIMARY KEY,          -- 'YYYY-MM-DD'
  content TEXT NOT NULL,          -- markdown body
  word_count INTEGER,
  generated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  llm_model TEXT,
  approved_by_bug INTEGER DEFAULT 0  -- 1 if Bug has reviewed and approved
);

-- ─── foia_queue ───────────────────────────────────────────────────
-- One row per FOIA letter drafted by the FOIA Clerk. NEVER auto-sends.
CREATE TABLE IF NOT EXISTS foia_queue (
  id TEXT PRIMARY KEY,
  anomaly_id TEXT,
  draft_content TEXT NOT NULL,
  pdf_path TEXT,                  -- R2 path, e.g. '/foia/2026-05-13-001.pdf'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'mailed' | 'rejected'
  mailed_at TEXT,
  response_received_at TEXT,
  response_content TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_foia_status ON foia_queue(status);

-- ─── corrections ──────────────────────────────────────────────────
-- Public corrections log. Append-only.
CREATE TABLE IF NOT EXISTS corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,             -- 'YYYY-MM-DD' the correction was made
  event_id TEXT,                  -- FK to events.id if applicable
  field TEXT,                     -- which field was corrected, e.g. 'severity'
  old_content TEXT,
  new_content TEXT NOT NULL,
  reason TEXT NOT NULL,
  source_url TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_corrections_date ON corrections(date DESC);

-- ─── wire_post_queue ──────────────────────────────────────────────
-- Cross-platform posting queue. The Wire Operator drains this every
-- five minutes.
CREATE TABLE IF NOT EXISTS wire_post_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,     -- ISO 8601 UTC; post only when NOW() >= scheduled_at
  posted_at TEXT,
  platforms_posted TEXT,          -- JSON array of platforms that succeeded
  status TEXT NOT NULL DEFAULT 'queued',  -- 'queued' | 'posted' | 'failed' | 'skipped'
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
CREATE INDEX IF NOT EXISTS idx_wire_status_scheduled ON wire_post_queue(status, scheduled_at);

-- ─── methodology_versions ─────────────────────────────────────────
-- Append-only log of methodology updates. Front-end can render a diff
-- between any two versions.
CREATE TABLE IF NOT EXISTS methodology_versions (
  version INTEGER PRIMARY KEY,
  effective_from TEXT NOT NULL,   -- ISO 8601 UTC
  content TEXT NOT NULL,          -- the full methodology markdown at this version
  change_log TEXT,                -- short human-readable summary
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ─── victims ──────────────────────────────────────────────────────
-- The 346 named dead from JT610 and ET302. Seeded once from public
-- accident reports and family obituaries. See seed-victims.sql.
CREATE TABLE IF NOT EXISTS victims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flight TEXT NOT NULL,           -- 'JT610' | 'ET302'
  name TEXT NOT NULL,
  age INTEGER,
  nationality TEXT,
  obituary_fragment TEXT,
  obituary_source TEXT
);
CREATE INDEX IF NOT EXISTS idx_victims_flight ON victims(flight);

-- ─── whistleblowers ───────────────────────────────────────────────
-- John Barnett, Joshua Dean, and any future entries. See
-- seed-whistleblowers.sql.
CREATE TABLE IF NOT EXISTS whistleblowers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date_of_death TEXT NOT NULL,    -- 'YYYY-MM-DD'
  age_at_death INTEGER,
  role TEXT,
  employer TEXT,
  cited_sources TEXT              -- JSON array of source URLs
);

-- ─── anomalies ────────────────────────────────────────────────────
-- One row per Anomaly Editor detection. Triggers the FOIA Clerk.
CREATE TABLE IF NOT EXISTS anomalies (
  id TEXT PRIMARY KEY,
  detected_at TEXT NOT NULL,
  subject TEXT NOT NULL,          -- short description of the metric
  metric_name TEXT,
  baseline_value REAL,
  current_value REAL,
  sigma REAL,                     -- how many standard deviations above baseline
  supporting_event_ids TEXT,      -- JSON array of events.id values
  foia_queued INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_anomalies_detected ON anomalies(detected_at DESC);

-- ─── failed_normalizations ────────────────────────────────────────
-- When the SDR Beat Reporter cannot parse an SDR, it lands here for
-- weekly human review (the Fact-Checker agent inspects this table).
CREATE TABLE IF NOT EXISTS failed_normalizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,           -- which agent failed
  raw_input TEXT,                 -- the source data that couldn't be parsed
  error TEXT,                     -- the agent's error description
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
