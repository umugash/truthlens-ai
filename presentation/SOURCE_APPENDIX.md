# TruthLens AI — Technical Source Appendix

Every implementation claim in the presentation was checked against the repository at commit `ae5fc66`. This appendix lists the files and symbols behind each claim, along with code details worth knowing before faculty questions.

## 1. Execution paths

| Path | Entry | Used when | Orchestration |
|---|---|---|---|
| **A — deployed** | `frontend/app/api/verify/route.ts` (`POST`) | Always in production: `frontend/lib/api.ts` posts to the relative `/api/verify` unless `NEXT_PUBLIC_API_URL` is set | Inline TypeScript; `Promise.all` within each stage; `export const maxDuration = 60` |
| **B — backend** | `backend/app/api/routes.py` (`POST /api/verify`, `POST /api/verify/stream`) | Only when the frontend's `NEXT_PUBLIC_API_URL` points at the FastAPI service (for example, local development) | LangGraph `StateGraph` in `backend/app/agents/graph.py` |

Both paths return the same `VerificationReport` shape: `backend/app/types/models.py` and `frontend/types/index.ts`.

## 2. File-by-file

### Frontend (Next.js 16.2, React 19.2, TypeScript, Tailwind CSS v4)
| File | What it establishes |
|---|---|
| `app/api/verify/route.ts` | `extractJson()` (strips code fence, then `JSON.parse`, then regex); `callGemini()` (REST `v1beta/models/{model}:generateContent`, `temperature: 0.1`); `callTavily()` (`search_depth: "basic"`, `max_results: 5`, `include_answer: false`, returns `[]` on any error). Stage 1 falls back to the whole text as one claim. Stage 4 returns `UNSUPPORTED/15` with no LLM call when there is no evidence; parse failure gives `UNSUPPORTED/20`; missing confidence defaults to 50. Trust score uses `Math.round`. The summary has a template fallback. **No retries, no cache.** |
| `app/api/health/route.ts` | `GET /api/health` |
| `lib/api.ts` | `verifyText()`; `API_BASE = process.env.NEXT_PUBLIC_API_URL \|\| ""` |
| `app/page.tsx` | Three-state UI (`landing` / `loading` / `results`); requires ≥ 10 characters; saves to history |
| `components/loading-animation.tsx` | Advances one step every **1.5 s** with `setInterval`. The `currentStep` prop exists but `page.tsx` never passes it, so the animation is **not** linked to server progress |
| `components/results-page.tsx`, `claim-card.tsx` | Trust score card, summary, Copy / PDF / JSON buttons; verdict badge, confidence, reasoning, expandable evidence with stance badges, source links |
| `components/history-panel.tsx`, `lib/history.ts` | `localStorage` key `truthlens_history`, newest first, **max 20** entries |
| `lib/export.ts` | `exportReportToPDF()` (jsPDF), `downloadJSON()` (Blob), `copyReportToClipboard()` |
| `components/theme-toggle.tsx`, `theme-provider.tsx` | `next-themes`, system default, class-based dark mode |
| `types/index.ts` | TS interfaces; `VERIFICATION_STEPS`, `STEP_LABELS` |

### Backend (Python, FastAPI 0.115, Pydantic 2.10, LangGraph 0.2.60, google-generativeai 0.8.3, tavily-python 0.5.0)
| File | What it establishes |
|---|---|
| `app/agents/graph.py` | `GraphState(TypedDict)` with 7 keys; `TruthLensWorkflow._build_graph()` with 6 nodes, `set_entry_point("extract_claims")`, 6 linear edges ending in `END`; nodes return `{**state, key: …}` and pass objects through `model_dump()`; `asyncio.gather` inside `reason` and `score_confidence`; `run()` uses `ainvoke` |
| `app/agents/claim_extraction.py` | `extract_claims()`; raises `ValueError` if the output is not a JSON array (the route turns this into HTTP 422) |
| `app/agents/search_agent.py` | `search_for_claims()`; query `f"fact check verify: {claim.text}"`, `max_results=5`, `asyncio.gather`; returns `[]` per claim on error |
| `app/agents/evidence_agent.py` | `_analyze_claim_evidence()`: one batched prompt per claim, snippets cut to 400 characters, mapped back by index, invalid stance becomes `neutral`, on exception every source is `neutral` and `summary = snippet[:300]` |
| `app/agents/reasoning_agent.py` | `reason_over_evidence()`: no evidence → `UNSUPPORTED/15`; invalid verdict → `UNSUPPORTED`; confidence clamped, default 70 (65 if non-numeric); parse failure → `UNSUPPORTED/20` |
| `app/agents/confidence_agent.py` | `score_confidence()` **fast path**: if `initial_confidence > 0`, it returns the clamped value (capped at 20 when there is no evidence). The heuristic `40 + agreement·40 + min(4·n, 20)` and the `CONFIDENCE_PROMPT` LLM call only run when the initial confidence is ≤ 0 or missing |
| `app/agents/report_agent.py` | `compute_overall_trust_score()`: weights TRUE 1.0, PARTIALLY_TRUE 0.7, MISLEADING 0.3, UNSUPPORTED 0.5, FALSE 0.0; `int()` truncation; `generate_report()` makes the summary call on `original_text[:500]` |
| `app/api/routes.py` | `/api/health`, `/api/verify` (5-minute report cache keyed on the lower-cased text; `ValueError` → 422, other errors → 500), `/api/verify/stream` (SSE `data:` events per node from `graph.astream`, then `complete` or `error`) |
| `app/services/llm.py` | `LLMProvider` ABC; `GeminiProvider`: `MAX_RETRIES = 5`, rate-limit (`ResourceExhausted`) delay parsed from "retry in Ns", otherwise `min(2·1.5^attempt, 10)`; other errors wait `1 + 0.5·attempt` s; `Semaphore(5)`; 10-minute module-level cache keyed by the SHA-256 of the prompt; `temperature 0.1`. `OpenAIProvider` is a placeholder that raises `NotImplementedError` |
| `app/services/tavily.py` | `TavilySearchService.search()`: 10-minute cache keyed `query::max_results::depth`; tries `AsyncTavilyClient`, then the sync client via `asyncio.to_thread`, then returns `[]`; maps `content` to `snippet` and `published_date` to `publication_date` |
| `app/types/models.py` | `Verdict` enum; `Claim`, `SearchResult`, `EvidenceItem` (stance `Literal`), `ClaimResult` (`confidence` 0–100), `VerificationReport` (`overall_trust_score` 0–100), `VerificationRequest` (10–10,000 characters). `WorkflowState` is defined but **not used** by the graph |
| `app/utils/prompts.py` | `CLAIM_EXTRACTION_PROMPT`, `BATCH_EVIDENCE_ANALYSIS_PROMPT`, `REASONING_PROMPT`, `CONFIDENCE_PROMPT`, `REPORT_SUMMARY_PROMPT`. `EVIDENCE_ANALYSIS_PROMPT` (one call per source) is **not used** |
| `app/utils/json_helpers.py` | `extract_json()`: direct parse, then fenced block, then regex `[…]` / `{…}` |
| `app/config.py` | `Settings`: `gemini_model = "gemini-flash-lite-latest"`, `tavily_search_depth = "basic"`, `cors_origins` |
| `app/main.py` | FastAPI app, `CORSMiddleware`, Uvicorn entry point |

## 3. README vs code discrepancies

- The README lists **caching** and **streaming progress** as future work. The FastAPI backend already implements both, but the deployed path uses neither.
- The README suggests `GEMINI_MODEL=gemini-2.0-flash`; the code default is `gemini-flash-lite-latest`. The production value is a Vercel environment setting that isn't visible in the repository.
- The README says the system "plans tasks". The code has a fixed, linear pipeline with no planning or conditional routing.

## 4. Live-run evidence (`assets/live-run-report.json`)

Captured from the deployed site on 2026-11-17 at 02:29 UTC, using the app's built-in example text. The run took 10.9 s, measured from the browser.

| # | Claim | Verdict | Conf. | Stances S/C/N |
|---|---|---|---|---|
| 1 | Apple has acquired OpenAI in a $50 billion deal. | FALSE | 95 | 0/0/5 |
| 2 | The acquisition was announced yesterday. | UNSUPPORTED | 100 | 0/0/5 |
| 3 | ChatGPT will be integrated into all Apple devices starting next month. | FALSE | 95 | 0/4/1 |
| 4 | CEO Tim Cook confirmed the deal at a press conference in Cupertino. | UNSUPPORTED | 95 | 0/0/5 |

Trust score: (0 + 0.5·1.00 + 0 + 0.5·0.95) / 4 · 100 = 24.375, which rounds to **24**, the value the app displayed.

Observations used on the limitations slide:
- Claim 2's sources concern FACT II Acquisition Corp., an unrelated company. The claim lost its subject during extraction.
- Claim 3's results 1–3 are the same Business Insider URL with different query strings, so the sources are not independent.
- All 20 results have `publication_date: null`, and claim 3's evidence is 2024 coverage.

## 5. References

1. TruthLens AI source code — https://github.com/umugash/truthlens-ai (commit ae5fc66)
2. TruthLens AI live deployment — https://frontend-xi-kohl-41.vercel.app
3. LangGraph documentation — https://langchain-ai.github.io/langgraph/
4. Gemini API documentation — https://ai.google.dev/gemini-api/docs
5. Tavily documentation — https://docs.tavily.com
6. FastAPI documentation — https://fastapi.tiangolo.com
7. Pydantic documentation — https://docs.pydantic.dev
8. Next.js documentation — https://nextjs.org/docs
9. Vercel Functions documentation — https://vercel.com/docs/functions
10. J. Thorne, A. Vlachos, C. Christodoulopoulos, A. Mittal. "FEVER: a Large-scale Dataset for Fact Extraction and VERification." NAACL-HLT 2018.
11. C. Guo, G. Pleiss, Y. Sun, K. Q. Weinberger. "On Calibration of Modern Neural Networks." ICML 2017.

References 3–9 are the documentation for the technologies the code uses. References 10–11 are cited only to frame the proposed evaluation.
