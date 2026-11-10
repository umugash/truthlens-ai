"""Prompt templates for TruthLens AI agents."""

CLAIM_EXTRACTION_PROMPT = """You are a claim extraction specialist. Analyze the following text and extract ONLY factual, verifiable claims.

Rules:
- Split into independent factual claims
- Ignore opinions, predictions, and subjective statements
- Each claim should be self-contained and verifiable via web search
- Return ONLY valid JSON, no markdown or explanation

Text:
{text}

Return a JSON array with this exact structure:
[
  {{"id": 1, "text": "factual claim here"}},
  {{"id": 2, "text": "another factual claim"}}
]

If no factual claims exist, return an empty array: []
"""

EVIDENCE_ANALYSIS_PROMPT = """You are an evidence analyst. Analyze how a search result relates to a specific claim.

Claim: {claim}

Search Results:
Title: {title}
URL: {url}
Snippet: {snippet}
Publication Date: {publication_date}

Determine if this source supports, contradicts, or is neutral regarding the claim.
Provide a brief summary of the relevant evidence.

Return ONLY valid JSON:
{{
  "summary": "brief summary of relevant evidence from this source",
  "stance": "supports" | "contradicts" | "neutral"
}}
"""

BATCH_EVIDENCE_ANALYSIS_PROMPT = """You are an evidence analyst. Analyze how each search result relates to the claim.

Claim: {claim}

Search Results:
{sources_text}

For each search result, determine if it supports, contradicts, or is neutral regarding the claim, and provide a brief summary of the evidence.

Return ONLY a valid JSON array corresponding to each source by index:
[
  {{
    "index": 0,
    "summary": "brief summary of evidence",
    "stance": "supports" | "contradicts" | "neutral"
  }}
]
"""

REASONING_PROMPT = """You are a fact-checking reasoning agent. Based on collected evidence, determine the verdict and confidence for a claim.

Claim: {claim}

Evidence collected:
{evidence_json}

Determine the verdict using these categories:
- TRUE: Evidence strongly supports the claim
- FALSE: Evidence strongly contradicts the claim
- PARTIALLY_TRUE: Claim contains some truth but is incomplete or oversimplified
- MISLEADING: Claim is technically related but presented in a deceptive way
- UNSUPPORTED: Insufficient evidence to verify

Also determine a confidence score (0-100) based on:
- Source quality and credibility
- Number of corroborating sources and agreement among them
- Direct relevance and recency of evidence

Return ONLY valid JSON:
{{
  "verdict": "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "MISLEADING" | "UNSUPPORTED",
  "confidence": 85,
  "reasoning": "detailed explanation of your verdict based on the evidence"
}}
"""

CONFIDENCE_PROMPT = """You are a confidence scoring agent. Assign a confidence score (0-100) for a fact-check verdict.

Claim: {claim}
Verdict: {verdict}
Reasoning: {reasoning}

Evidence summary:
{evidence_summary}

Score based on:
- Source quality and credibility (major news outlets, official sources score higher)
- Number of corroborating sources
- Agreement among sources
- Recency and relevance of sources

Return ONLY valid JSON:
{{
  "confidence": 85,
  "factors": "brief explanation of scoring factors"
}}
"""

REPORT_SUMMARY_PROMPT = """You are a report generation agent. Write an executive summary for a fact-check report.

Original text analyzed:
{original_text}

Results:
{results_json}

Overall trust score: {overall_trust_score}

Write a concise 2-3 sentence executive summary of the verification findings.
Return ONLY the summary text, no JSON or markdown.
"""
