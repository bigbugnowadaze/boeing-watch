-- ═══════════════════════════════════════════════════════════════════
-- METHODOLOGY VERSION SEED — record v1.0 of the methodology
-- Apply with:
--   wrangler d1 execute boeingwatch --remote --file=db/seed-methodology.sql
-- ═══════════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO methodology_versions
  (version, effective_from, content, change_log)
VALUES
  (
    1,
    '2026-05-13T00:00:00Z',
    '# Boeing Watch Methodology v1.0

The full v1.0 methodology is published at https://boeingwatch.org/methodology.

This row records the version as in effect from 13 May 2026. The
front-end content is the source of truth for human readers; this row
exists so the Fact-Checker agent can detect drift between the published
page and the database-recorded version.',
    'Initial methodology published. Covers §01-§09: SDR inclusion rules, severity rubric, 24h window, cumulative counting, Boeing-aircraft identification, known data limitations, memorial entries, corrections policy, CC BY 4.0 open data.'
  );
