-- ═══════════════════════════════════════════════════════════════════
-- WHISTLEBLOWERS SEED — named, public-record entries only.
-- Apply with:
--   wrangler d1 execute boeingwatch --remote --file=db/seed-whistleblowers.sql
-- ═══════════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO whistleblowers
  (id, name, date_of_death, age_at_death, role, employer, cited_sources)
VALUES
  (
    1,
    'John Barnett',
    '2024-03-09',
    62,
    'Quality manager',
    'Boeing',
    '["https://en.wikipedia.org/wiki/John_Barnett_(whistleblower)","https://www.npr.org/2024/03/12/1238033573/boeing-whistleblower-john-barnett-dead","https://www.nbcnews.com/news/us-news/family-boeing-whistleblower-settles-lawsuit-maker-death-rcna206653"]'
  ),
  (
    2,
    'Joshua Dean',
    '2024-05-01',
    45,
    'Quality auditor',
    'Spirit AeroSystems',
    '["https://www.seattletimes.com/business/whistleblower-josh-dean-of-boeing-supplier-spirit-aerosystems-has-died/","https://www.npr.org/2024/05/02/1248693512/boeing-whistleblower-josh-dean-dead","https://www.cbsnews.com/news/joshua-dean-boeing-whistleblower-dies-sudden-illness/","https://time.com/6973635/boeing-spirit-aerosystems-whistleblower-josh-dean-dead/"]'
  );
