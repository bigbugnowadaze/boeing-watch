/**
 * ICAO operator code → airline name.
 *
 * The SDR Beat Reporter resolves codes server-side before calling the
 * LLM (saves tokens; the LLM never has to guess). Extend this list as
 * new operators appear in the FAA SDR feed.
 *
 * Source: agent-prompts/01-sdr-beat-reporter.md
 */
export const OPERATORS: Record<string, string> = {
  SWA: "Southwest Airlines",
  AAL: "American Airlines",
  UAL: "United Airlines",
  ASA: "Alaska Airlines",
  ACA: "Air Canada",
  WJA: "WestJet",
  RYR: "Ryanair",
  NKS: "Spirit Airlines",
  JBU: "JetBlue Airways",
  SCX: "Sun Country Airlines",
  HAL: "Hawaiian Airlines",
  CCA: "Air China",
  CSN: "China Southern Airlines",
  CES: "China Eastern Airlines",
  CXA: "Xiamen Airlines",
  AIC: "Air India",
  IGO: "IndiGo",
  TUI: "TUI fly",
  NOZ: "Norwegian Air",
  ICE: "Icelandair",
  TVF: "Transavia France",
  FDB: "flydubai",
  SVA: "Saudia",
  MAS: "Malaysia Airlines",
  GLO: "GOL",
  CFG: "Condor",
  COP: "Copa Airlines",
  KZR: "Air Astana",
  PGT: "Pegasus Airlines",
  THY: "Turkish Airlines",
  OMA: "Oman Air",
};

export function resolveOperator(code: string | null | undefined): string {
  if (!code) return "Unknown operator";
  const up = code.toUpperCase().trim();
  return OPERATORS[up] ?? `Operator ${up}`;
}
