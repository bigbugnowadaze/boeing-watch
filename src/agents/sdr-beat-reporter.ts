/**
 * THE SDR BEAT REPORTER
 *
 * Job: transform raw FAA Service Difficulty Reports into the canonical
 * Boeing Watch sentence stem, classify severity, and write to D1.
 *
 * Voice: aviation incident registrar — same register as The Aviation
 * Herald. Present-perfect tense, zero editorializing, all times UTC.
 *
 * Inputs:  raw SDR rows from the FAA SDR database (JSON-parsed CSV).
 * Outputs: one normalized row per SDR in D1.events.
 *
 * Model: Claude Haiku 4.5 (`claude-haiku-4-5`).
 * Spec:  agent-prompts/01-sdr-beat-reporter.md
 *
 * Run modes
 *   1. Scheduled cron (hourly :05) — fetches the previous hour of SDRs
 *      from R2 (Stage-2-B work) and processes each.
 *   2. POST /admin/sdr/ingest — manual injection of a JSON array of
 *      raw SDRs. Used for development and for the one-off backfill of
 *      the 5-Jan-2024-onward history. Requires ADMIN_TOKEN.
 *
 * The fetch step (Stage-2-B) is stubbed for v1. The processing step
 * (this file) is the load-bearing piece that needs careful prompt-
 * engineering and we want to nail it first.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../env";
import { resolveOperator } from "../lib/operators";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 600;

/** Raw SDR shape as it comes out of the FAA system (after CSV parse). */
export type RawSdr = {
  report_id: string;
  received_date: string;        // YYYY-MM-DD
  submission_time?: string;     // HH:MM (UTC)
  operator_code?: string | null;
  aircraft_make?: string | null;
  aircraft_model?: string | null;
  aircraft_serial?: string | null;
  narrative_raw: string;
  jasc_code?: string | null;
  stage_of_operation?: string | null;
};

/** What the SDR Beat Reporter produces. */
export type NormalizedSdr = {
  sdr_id: string;
  filed_at: string;             // ISO 8601 UTC
  operator: string;
  aircraft_type: string;
  registration: string;
  narrative: string;
  severity: "severe" | "elevated" | "noted";
  raw_jasc_code: string | null;
  source_url: string;
};

/** Skip and error envelopes the agent may return instead of a record. */
type AgentSkip = { skip: true; reason: string };
type AgentError = { error: string };

const SYSTEM_PROMPT = `You are the SDR Beat Reporter for Boeing Watch, an independent accountability dashboard. Your only job is to transform raw FAA Service Difficulty Report data into the canonical Boeing Watch sentence stem.

You write in the voice of an aviation incident registrar — the same voice as The Aviation Herald (Simon Hradecky). The voice is:
- Present-perfect tense
- Zero editorializing
- Factual, dated, sourced
- No adjectives unless from the source record
- All times in Zulu (UTC)
- All registrations in standard format (e.g., N12345, EI-IGM)

You will receive a JSON object with raw SDR fields. You will produce exactly one JSON object back, conforming to the schema below. Do not produce explanations, only the JSON.

## SENTENCE STEM

The narrative field of your output must follow this exact form:

"A {operator} {aircraft_type}, registration {registration}, {flight_phase} {flight_context}, {event_description}. Filed FAA SDR {sdr_id} on {date_zulu}."

Examples of correct narratives:
- "A Southwest Airlines 737-8, registration N8709Q, performing flight WN1234 from KDAL to KMSY with 174 souls on board, declared an emergency at FL370 after a cabin pressurization warning and diverted to KIAH. Filed FAA SDR 2026-12345 on 2026-05-11T22:08:00Z."
- "An American Airlines 737-8, registration N987AA, during pre-departure inspection at KDFW, was found to have a hydraulic leak in the No. 2 system. Filed FAA SDR 2026-12347 on 2026-05-12T06:42:00Z."

## SEVERITY CLASSIFICATION

Classify each SDR into one of three tiers based on the narrative:

- "severe" — any of: in-flight engine shutdown, depressurization, fire indication, structural failure, emergency descent, return-to-base under emergency, fatal injury, hull loss, MCAS-related anomaly, primary flight control failure, dual-system failure
- "elevated" — any of: divert (non-emergency), pre-departure abort, single-system anomaly during flight, flight-control irregularity, smoke in cabin without fire, severe turbulence event
- "noted" — routine maintenance findings, deferred items, post-flight inspection anomalies with no operational impact

## OUTPUT SCHEMA

Return exactly this JSON object:

{
  "sdr_id": "<the FAA SDR ID, verbatim>",
  "filed_at": "<ISO 8601 UTC timestamp>",
  "operator": "<standardized operator name>",
  "aircraft_type": "<Boeing type designator: 737-8, 737-9, 737-7, 737-10, 787-8, 787-9, 787-10, 777-200, 777-300, etc.>",
  "registration": "<tail number, standard format>",
  "narrative": "<the canonical sentence-stem narrative>",
  "severity": "<severe | elevated | noted>",
  "raw_jasc_code": "<JASC code from source if present>",
  "source_url": "<FAA SDR system URL for this record>"
}

## RULES YOU MUST NOT BREAK

1. Never invent a fact not in the source data. If a field is missing, use null or omit; never fabricate.
2. Never speculate about cause. The narrative reports what is in the SDR record, nothing more.
3. Never characterize Boeing, the FAA, the operator, or any individual. The facts speak.
4. If the source data is ambiguous, set severity to "noted" and flag in the narrative. Do not guess.
5. If the SDR is not for a Boeing-manufactured aircraft, return: { "skip": true, "reason": "not Boeing manufactured" }
6. If you cannot parse the source data, return: { "error": "<plain-English description>" }
7. Output JSON only. No prose. No markdown. No code fences.`;

/**
 * Build the user-side payload the model sees. We pre-resolve the
 * operator code so the LLM never has to guess the airline name.
 */
function buildAgentInput(raw: RawSdr): string {
  const enriched = {
    ...raw,
    _resolved_operator:
      raw.operator_code ? resolveOperator(raw.operator_code) : null,
    _source_url: `https://av-info.faa.gov/sdrx/SearchSDRSDB.aspx?ID=${encodeURIComponent(raw.report_id)}`,
  };
  return JSON.stringify(enriched);
}

/** Parse the model's response. Accepts the three documented shapes. */
function parseAgentOutput(
  text: string,
): NormalizedSdr | AgentSkip | AgentError {
  const trimmed = text.trim();
  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return { error: `agent returned non-JSON: ${trimmed.slice(0, 120)}` };
  }
  if (typeof json !== "object" || json === null) {
    return { error: "agent returned non-object JSON" };
  }
  const obj = json as Record<string, unknown>;
  if (obj.skip === true && typeof obj.reason === "string") {
    return { skip: true, reason: obj.reason };
  }
  if (typeof obj.error === "string") {
    return { error: obj.error };
  }
  // Validate the success shape.
  const required = [
    "sdr_id", "filed_at", "operator", "aircraft_type",
    "registration", "narrative", "severity", "source_url",
  ] as const;
  for (const k of required) {
    if (typeof obj[k] !== "string") {
      return { error: `missing or non-string field: ${k}` };
    }
  }
  const severity = obj.severity as string;
  if (severity !== "severe" && severity !== "elevated" && severity !== "noted") {
    return { error: `invalid severity: ${severity}` };
  }
  return {
    sdr_id: obj.sdr_id as string,
    filed_at: obj.filed_at as string,
    operator: obj.operator as string,
    aircraft_type: obj.aircraft_type as string,
    registration: obj.registration as string,
    narrative: obj.narrative as string,
    severity,
    raw_jasc_code: typeof obj.raw_jasc_code === "string"
      ? (obj.raw_jasc_code as string)
      : null,
    source_url: obj.source_url as string,
  };
}

/**
 * Call Claude Haiku to normalize a single SDR. Returns the normalized
 * record, a skip sentinel (not Boeing), or an error envelope. The
 * caller decides whether to write to D1 or to failed_normalizations.
 */
export async function normalizeOneSdr(
  raw: RawSdr,
  env: Env,
): Promise<NormalizedSdr | AgentSkip | AgentError> {
  if (!env.ANTHROPIC_API_KEY) {
    return { error: "ANTHROPIC_API_KEY not set" };
  }
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildAgentInput(raw) }],
    });
    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) return { error: "agent returned no text block" };
    return parseAgentOutput(textBlock.text);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return { error: `anthropic ${err.status}: ${err.message}` };
    }
    return { error: `anthropic call failed: ${String(err)}` };
  }
}

/**
 * Persist a normalized SDR to D1.events. Existing rows are replaced —
 * the FAA may re-issue a record with the same id when amending.
 */
export async function writeNormalizedSdr(
  rec: NormalizedSdr,
  raw: RawSdr,
  env: Env,
): Promise<void> {
  await env.DB.prepare(
    `INSERT OR REPLACE INTO events
       (id, type, filed_at, severity, narrative, source_url, raw_data,
        operator, aircraft_type, registration, raw_jasc_code)
     VALUES (?, 'sdr', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      rec.sdr_id,
      rec.filed_at,
      rec.severity,
      rec.narrative,
      rec.source_url,
      JSON.stringify(raw),
      rec.operator,
      rec.aircraft_type,
      rec.registration,
      rec.raw_jasc_code,
    )
    .run();
}

/** Write a failed normalization for weekly Fact-Checker review. */
export async function writeFailedNormalization(
  source: string,
  raw: unknown,
  error: string,
  env: Env,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO failed_normalizations (source, raw_input, error)
     VALUES (?, ?, ?)`,
  )
    .bind(source, JSON.stringify(raw), error)
    .run();
}

/**
 * Top-level: process a batch of raw SDRs. Returns counts so the caller
 * can log or report. Never throws — bad records land in
 * failed_normalizations.
 */
export type BatchResult = {
  processed: number;
  written: number;
  skipped: number;
  failed: number;
  details: Array<{
    report_id: string;
    outcome: "written" | "skipped" | "failed";
    reason?: string;
  }>;
};

export async function processSdrBatch(
  rawSdrs: RawSdr[],
  env: Env,
): Promise<BatchResult> {
  const result: BatchResult = {
    processed: 0,
    written: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };
  for (const raw of rawSdrs) {
    result.processed += 1;
    const out = await normalizeOneSdr(raw, env);
    if ("skip" in out && out.skip) {
      result.skipped += 1;
      result.details.push({
        report_id: raw.report_id,
        outcome: "skipped",
        reason: out.reason,
      });
      continue;
    }
    if ("error" in out) {
      result.failed += 1;
      await writeFailedNormalization("sdr-beat-reporter", raw, out.error, env);
      result.details.push({
        report_id: raw.report_id,
        outcome: "failed",
        reason: out.error,
      });
      continue;
    }
    try {
      await writeNormalizedSdr(out, raw, env);
      result.written += 1;
      result.details.push({ report_id: raw.report_id, outcome: "written" });
    } catch (err) {
      result.failed += 1;
      await writeFailedNormalization(
        "sdr-beat-reporter-d1-write",
        raw,
        String(err),
        env,
      );
      result.details.push({
        report_id: raw.report_id,
        outcome: "failed",
        reason: String(err),
      });
    }
  }
  return result;
}
