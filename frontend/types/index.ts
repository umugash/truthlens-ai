export type Verdict =
  | "TRUE"
  | "FALSE"
  | "PARTIALLY_TRUE"
  | "MISLEADING"
  | "UNSUPPORTED";

export interface Claim {
  id: number;
  text: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publication_date: string | null;
}

export interface EvidenceItem {
  source_title: string;
  source_url: string;
  summary: string;
  stance: "supports" | "contradicts" | "neutral";
}

export interface ClaimResult {
  claim: Claim;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  evidence: EvidenceItem[];
  sources: SearchResult[];
}

export interface VerificationReport {
  original_text: string;
  claims: ClaimResult[];
  overall_trust_score: number;
  summary: string;
  generated_at: string;
}

export interface HistoryEntry {
  id: string;
  text: string;
  report: VerificationReport;
  createdAt: string;
}

export type VerificationStep =
  | "extract_claims"
  | "search_sources"
  | "analyze_evidence"
  | "reason"
  | "score_confidence"
  | "generate_report";

export const STEP_LABELS: Record<VerificationStep, string> = {
  extract_claims: "Extracting Claims...",
  search_sources: "Searching Sources...",
  analyze_evidence: "Analyzing Evidence...",
  reason: "Reasoning...",
  score_confidence: "Scoring Confidence...",
  generate_report: "Generating Report...",
};

export const VERIFICATION_STEPS: VerificationStep[] = [
  "extract_claims",
  "search_sources",
  "analyze_evidence",
  "reason",
  "score_confidence",
  "generate_report",
];
