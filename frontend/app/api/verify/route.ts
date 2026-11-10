import { NextRequest, NextResponse } from "next/server";
import {
  Claim,
  ClaimResult,
  EvidenceItem,
  SearchResult,
  Verdict,
  VerificationReport,
} from "@/types";

export const maxDuration = 60; // Allow up to 60s execution on Vercel

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

function extractJson(text: string): unknown {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try regex matching JSON array or object
    const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Could not extract JSON from model response");
  }
}

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  return text || "";
}

async function callTavily(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: false,
      }),
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return (data.results || []).map((item: Record<string, unknown>) => ({
      title: (item.title as string) || "Untitled",
      url: (item.url as string) || "",
      snippet: (item.content as string) || (item.snippet as string) || "",
      publication_date: (item.published_date as string) || null,
    }));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text?.trim();

    if (!text || text.length < 5) {
      return NextResponse.json(
        { detail: "Text is required and must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Step 1: Claim Extraction
    const extractPrompt = `You are a claim extraction specialist. Analyze the following text and extract ONLY factual, verifiable claims.

Rules:
- Split into independent factual claims
- Ignore opinions, predictions, and subjective statements
- Each claim should be self-contained and verifiable via web search
- Return ONLY valid JSON, no markdown or explanation

Text:
${text}

Return a JSON array with this exact structure:
[
  {"id": 1, "text": "factual claim here"},
  {"id": 2, "text": "another factual claim"}
]

If no factual claims exist, return an empty array: []
`;

    let claims: Claim[] = [];
    try {
      const extractRes = await callGemini(extractPrompt);
      const parsed = extractJson(extractRes);
      if (Array.isArray(parsed)) {
        claims = parsed.map((item, idx) => ({
          id: typeof item.id === "number" ? item.id : idx + 1,
          text: String(item.text || "").trim(),
        })).filter((c) => c.text.length > 0);
      }
    } catch {
      // Fallback single claim
      claims = [{ id: 1, text }];
    }

    if (claims.length === 0) {
      claims = [{ id: 1, text }];
    }

    // Step 2: Search sources concurrently
    const searchPromises = claims.map(async (claim) => {
      const results = await callTavily(`fact check verify: ${claim.text}`, 5);
      return { claimId: claim.id, results };
    });
    const searchEntries = await Promise.all(searchPromises);
    const searchMap = new Map<number, SearchResult[]>();
    for (const entry of searchEntries) {
      searchMap.set(entry.claimId, entry.results);
    }

    // Step 3: Analyze Evidence concurrently (batched per claim)
    const evidencePromises = claims.map(async (claim) => {
      const results = searchMap.get(claim.id) || [];
      if (results.length === 0) {
        return { claimId: claim.id, evidence: [] };
      }

      const sourcesText = results
        .map(
          (r, i) =>
            `[${i}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet.slice(0, 400)}`
        )
        .join("\n\n");

      const prompt = `You are an evidence analyst. Analyze how each search result relates to the claim.

Claim: ${claim.text}

Search Results:
${sourcesText}

For each search result, determine if it supports, contradicts, or is neutral regarding the claim, and provide a brief summary of the evidence.

Return ONLY a valid JSON array corresponding to each source by index:
[
  {
    "index": 0,
    "summary": "brief summary of evidence",
    "stance": "supports" | "contradicts" | "neutral"
  }
]
`;

      const evidenceItems: EvidenceItem[] = [];
      try {
        const resText = await callGemini(prompt);
        const parsed = extractJson(resText);
        const parsedMap = new Map<number, { summary?: string; stance?: string }>();
        if (Array.isArray(parsed)) {
          parsed.forEach((item, idx) => {
            if (typeof item === "object" && item !== null) {
              const pos = typeof item.index === "number" ? item.index : idx;
              parsedMap.set(pos, item);
            }
          });
        }

        results.forEach((r, i) => {
          const p = parsedMap.get(i);
          let stance: "supports" | "contradicts" | "neutral" = "neutral";
          if (p?.stance === "supports" || p?.stance === "contradicts" || p?.stance === "neutral") {
            stance = p.stance;
          }
          evidenceItems.push({
            source_title: r.title,
            source_url: r.url,
            summary: p?.summary || r.snippet.slice(0, 300),
            stance,
          });
        });
      } catch {
        results.forEach((r) => {
          evidenceItems.push({
            source_title: r.title,
            source_url: r.url,
            summary: r.snippet.slice(0, 300),
            stance: "neutral",
          });
        });
      }

      return { claimId: claim.id, evidence: evidenceItems };
    });

    const evidenceEntries = await Promise.all(evidencePromises);
    const evidenceMap = new Map<number, EvidenceItem[]>();
    for (const entry of evidenceEntries) {
      evidenceMap.set(entry.claimId, entry.evidence);
    }

    // Step 4 & 5: Reason and Score Confidence concurrently
    const reasonPromises = claims.map(async (claim) => {
      const evidence = evidenceMap.get(claim.id) || [];
      const sources = searchMap.get(claim.id) || [];

      if (evidence.length === 0) {
        return {
          claim,
          verdict: "UNSUPPORTED" as Verdict,
          confidence: 15,
          reasoning: "Insufficient evidence available from web search to verify this claim.",
          evidence: [],
          sources: [],
        };
      }

      const evidenceJson = JSON.stringify(
        evidence.map((e) => ({
          source: e.source_title,
          url: e.source_url,
          summary: e.summary,
          stance: e.stance,
        })),
        null,
        2
      );

      const prompt = `You are a fact-checking reasoning agent. Based on collected evidence, determine the verdict and confidence for a claim.

Claim: ${claim.text}

Evidence collected:
${evidenceJson}

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
{
  "verdict": "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "MISLEADING" | "UNSUPPORTED",
  "confidence": 85,
  "reasoning": "detailed explanation of your verdict based on the evidence"
}
`;

      let verdict: Verdict = "UNSUPPORTED";
      let confidence = 50;
      let reasoning = "Unable to determine verdict from available evidence.";

      try {
        const resText = await callGemini(prompt);
        const parsed = extractJson(resText) as Record<string, unknown>;
        const rawVerdict = String(parsed.verdict || "UNSUPPORTED").toUpperCase();
        if (["TRUE", "FALSE", "PARTIALLY_TRUE", "MISLEADING", "UNSUPPORTED"].includes(rawVerdict)) {
          verdict = rawVerdict as Verdict;
        }
        reasoning = String(parsed.reasoning || reasoning);
        const rawConf = Number(parsed.confidence);
        if (!isNaN(rawConf)) {
          confidence = Math.max(0, Math.min(100, Math.round(rawConf)));
        }
      } catch {
        verdict = "UNSUPPORTED";
        confidence = 20;
      }

      // Fast calibration
      if (evidence.length === 0) {
        confidence = 10;
      }

      return {
        claim,
        verdict,
        confidence,
        reasoning,
        evidence,
        sources,
      };
    });

    const claimResults: ClaimResult[] = await Promise.all(reasonPromises);

    // Step 6: Generate Final Report
    const verdictWeights: Record<Verdict, number> = {
      TRUE: 1.0,
      PARTIALLY_TRUE: 0.7,
      MISLEADING: 0.3,
      UNSUPPORTED: 0.5,
      FALSE: 0.0,
    };

    let totalWeight = 0;
    for (const r of claimResults) {
      const weight = verdictWeights[r.verdict] ?? 0.5;
      totalWeight += weight * (r.confidence / 100);
    }
    const overallTrustScore = Math.max(
      0,
      Math.min(100, Math.round((totalWeight / claimResults.length) * 100))
    );

    const resultsJson = claimResults
      .map(
        (r) =>
          `- Claim: ${r.claim.text}\n  Verdict: ${r.verdict}\n  Confidence: ${r.confidence}%`
      )
      .join("\n");

    const reportPrompt = `You are a report generation agent. Write an executive summary for a fact-check report.

Original text analyzed:
${text.slice(0, 500)}

Results:
${resultsJson}

Overall trust score: ${overallTrustScore}

Write a concise 2-3 sentence executive summary of the verification findings.
Return ONLY the summary text, no JSON or markdown.
`;

    let summary = `Verification complete for ${claimResults.length} claims. Overall trust score is ${overallTrustScore}/100.`;
    try {
      const summaryRes = await callGemini(reportPrompt);
      const cleaned = summaryRes.trim().replace(/^["']|["']$/g, "");
      if (cleaned.length > 10) {
        summary = cleaned;
      }
    } catch {
      // Use default summary
    }

    const report: VerificationReport = {
      original_text: text,
      claims: claimResults,
      overall_trust_score: overallTrustScore,
      summary,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
