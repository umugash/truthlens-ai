// Speaker notes + timing for every slide. Single source for the .pptx notes and the presenter script.
// dur = target speaking time (m:ss). Notes are written to be spoken, not read verbatim.

module.exports = [
  // 1
  {
    title: "TruthLens AI — Title",
    dur: "0:40",
    notes: `Good morning. My name is Mugash Priyan, from the M.Tech Integrated CSE Data Science programme, and this is my final project for Agent Technology: TruthLens AI, a multi-agent claim-verification system.

The whole talk is built around one question, which you can see at the bottom of the slide: how do we turn a piece of unstructured information — a news paragraph, a social-media post, a forwarded message — into a structured, evidence-backed verification report, using a set of coordinated AI agents?

The application is deployed and working, and everything I show today comes from the actual source code in the GitHub repository and from a real run of the live site, which I captured on 17 November. Where the code does something less impressive than the README suggests, I will say so.

Let me start with why this problem matters.`,
  },
  // 2
  {
    title: "The information verification problem",
    dur: "0:55",
    notes: `Information today reaches people through many channels at once — news sites, social media, messaging groups, blogs — and a lot of it arrives as short, confident text with no sources attached.

The message on the left is the example built into my app. It reads as one piece of news, but it actually makes four separate factual assertions: that Apple acquired OpenAI for fifty billion dollars, that this was announced yesterday, that ChatGPT comes to all Apple devices next month, and that Tim Cook confirmed it at a press conference. Each of these needs a different search, and each can have a different truth value.

That is the core difficulty. A search result may support only part of the message, sources can disagree, and the reader has to do all the comparison by hand. A fluent generated answer can also sound convincing without making its evidence easy to inspect.

So my starting point is that verification should happen at the level of individual claims, not the whole article. If you summarise the whole text, one false claim hidden among true ones simply gets averaged away.

Next, what tools people already use for this.`,
  },
  // 3
  {
    title: "Existing approaches and their limitations",
    dur: "1:05",
    notes: `I want to be fair to the existing tools, because each of them is good at something.

Search engines like Google and Bing are excellent at discovery: they find and rank relevant pages very quickly. But the user still has to break the message into claims, read each page, and decide what it means.

General-purpose assistants like ChatGPT and Gemini can now browse the web and cite sources, and they synthesise very well. Their strength is flexibility. The limitation for this task is that the workflow depends on how the user prompts: whether the text gets decomposed, whether evidence positions are kept, and what format comes back changes from one conversation to the next.

Professional fact-checking platforms, such as Snopes, PolitiFact or Google's Fact Check Explorer, give the highest-quality verdicts, because trained people produce them. But they only cover claims somebody has already checked, and that takes time.

TruthLens sits in a different place. It is not a new model — it actually uses Gemini internally. What it adds is a fixed, repeatable application workflow that separates claim extraction, retrieval, evidence classification, reasoning, confidence and reporting into explicit stages. Its own limitation is equally important: it depends on Gemini and Tavily, and I have not benchmarked its accuracy.

That leads to the gap I set out to address.`,
  },
  // 4
  {
    title: "Research gap and problem statement",
    dur: "0:50",
    notes: `Here is the formal problem statement. In one sentence: design and implement a multi-agent system that decomposes unstructured text into independently verifiable claims, retrieves external evidence, evaluates supporting and contradicting information, reasons over it, estimates confidence, and produces an explainable report.

Read the four boxes from left to right. The existing problem is that verification is manual and happens at the level of whole documents. The gap is the lack of an inspectable, claim-by-claim pipeline in which the intermediate results — which claims were found, which sources, which stances — are kept as data instead of disappearing inside one long answer.

The direction I chose is to give each step its own agent and pass structured state between them. The objective is a deployed, working application, not just a notebook.

Notice what the objective does not say: it does not claim higher accuracy than existing tools. That would need a benchmark, and I come back to that in the evaluation slide.

So what exactly did I build?`,
  },
  // 5
  {
    title: "Proposed solution and objectives",
    dur: "1:00",
    notes: `TruthLens takes any pasted text — news, a social post, a WhatsApp-style forward — and runs it through seven capabilities: extract the factual claims, search the web for each one, decide where each source stands, reach a verdict, attach a confidence, aggregate the results, and produce a report with source links.

The verdict space is deliberately five categories, not two. TRUE and FALSE are obvious. PARTIALLY_TRUE covers claims that are right in part but incomplete. MISLEADING covers claims that are technically related to the facts but framed deceptively. These definitions on the right are taken word for word from the reasoning prompt in the code.

The one I want to stress is UNSUPPORTED. A missing search result is not proof that something is false. If the search returns nothing for a claim, the code does not even call the language model — it returns UNSUPPORTED directly with a low confidence of fifteen. And in the trust score, UNSUPPORTED gets a neutral weight of 0.5, so a lack of evidence neither rewards nor punishes the text.

This matters academically, because treating absence of evidence as falsity is one of the classic errors in automated fact-checking.

Now let me show how the system is actually put together — and this is where the code turned out to be more interesting than the README.`,
  },
  // 6
  {
    title: "Overall system architecture",
    dur: "1:20",
    notes: `When I inspected the repository carefully, I found two execution paths, and I want to present them honestly rather than merge them into one picture.

The top path, in solid lines, is what the deployed site actually runs. The browser loads the Next.js app from Vercel. When you press Verify, the API client in lib/api.ts posts to /api/verify. Because no external API URL is configured in production, that request goes to a Next.js serverless route on Vercel — route.ts — which implements all six stages in TypeScript and calls the Gemini and Tavily REST APIs directly.

The bottom path, dashed, is the Python backend: a FastAPI service running a LangGraph StateGraph with six nodes, plus service classes for Gemini and Tavily. The frontend only uses it if the NEXT_PUBLIC_API_URL environment variable points to it — for example during local development.

Both paths return exactly the same VerificationReport shape: the Pydantic models in the backend and the TypeScript interfaces in the frontend have the same fields. The browser then saves the report in local storage as history.

Why two paths? The serverless route makes the app deployable as a single Vercel project with no separate server, while the LangGraph backend is the more explicitly agent-oriented architecture with caching, retries and a streaming endpoint. The trade-off is that the pipeline logic is duplicated, which I list as technical debt later.

First, though: why split the work into agents at all?`,
  },
  // 7
  {
    title: "Why an agent-based architecture?",
    dur: "0:55",
    notes: `The obvious alternative is one big prompt: give the model the text and ask, "Is this true?" That is the grey row at the top.

TruthLens instead uses the pipeline in the lower row. Each stage has one job, its own prompt and a typed output, and those outputs are explicit intermediate representations: a list of claims, search results per claim, a stance label per source, and a verdict per claim.

The advantages are on the left: separation of concerns, independent analysis of each claim, the ability to look at exactly where something went wrong, and the possibility of improving one stage — say, swapping in a better retriever — without touching the others.

The trade-offs on the right are real. More stages mean more API calls: for N claims, up to 2N + 2 Gemini calls and N Tavily calls per request. That means more latency and cost, and an error early on, such as a badly extracted claim, flows through everything after it.

The key point is the line at the bottom: decomposition makes the system inspectable and maintainable. It does not, by itself, make it more accurate, and I don't claim that it does.

Let me now go through the six stages.`,
  },
  // 8
  {
    title: "Six specialised stages",
    dur: "1:20",
    notes: `This table is the core of the system, mapped to the actual files in backend/app/agents.

Claim extraction takes raw text and returns a list of Claim objects, each with an id and text. It is separate because everything after it works one claim at a time.

The search agent turns each claim into a Tavily query and returns up to five results per claim. It uses no language model at all — it is pure input and output — so network failures stay contained here.

The evidence agent is where relevance becomes stance. For each claim, it sends all the sources to Gemini in one batched call and gets back a summary and a stance per source: supports, contradicts or neutral.

The reasoning agent reads the claim together with that evidence and produces the verdict, a written explanation and an initial confidence.

The confidence agent is the stage I need to describe carefully. In practice it validates and clamps the confidence from the reasoning stage; its own heuristic and LLM branch only runs when that initial confidence is zero or missing. I'll show the exact code on the confidence slide.

Finally, the report agent computes the overall trust score with a fixed formula, asks Gemini for a short summary and timestamps the report.

In the deployed TypeScript route, stages four and five are merged: the confidence comes directly from the reasoning call.

Next, how LangGraph ties these together.`,
  },
  // 9
  {
    title: "Workflow orchestration with LangGraph",
    dur: "1:15",
    notes: `LangGraph is a library for building LLM applications as graphs: you define a shared state type, register functions as nodes, and connect them with edges. The compiled graph runs the nodes and passes the state between them.

In graph.py, the state is a TypedDict called GraphState with seven keys: the original text, the claims, the search results, the evidence, the claim results, the report and the current step. The diagram shows which node writes which key. Every node is an async function that receives the full state and returns it with its own key updated, using the spread pattern you can see in the code.

The graph is a simple directed acyclic graph: one entry point, six nodes, straight edges and then END. There are no conditional edges and no loops. I want to be precise here — this is a deterministic, workflow-style multi-agent system, not autonomous agents that plan their own steps.

Why use a graph for a straight line? Three reasons. The state is explicit and inspectable at every step. The same compiled graph supports ainvoke for the normal endpoint and astream for the streaming endpoint, which emits an event after each node. And it gives a natural place to add conditional routing later — for example, searching again with a reformulated query when a claim gets no evidence. That last part is future work.

One implementation detail: between nodes, Pydantic objects are converted to plain dictionaries with model_dump and rebuilt in the next node. That keeps the state serialisable.

Now each stage in detail, starting with claim extraction.`,
  },
  // 10
  {
    title: "Claim extraction",
    dur: "1:00",
    notes: `Claim extraction is a single Gemini call. The prompt, in prompts.py, gives four rules: split the text into independent factual claims, ignore opinions, predictions and subjective statements, make each claim self-contained and searchable, and return only JSON in the form of a list of objects with an id and text. The temperature is set low, at 0.1, so the output is as stable as the model allows.

Language models don't always return clean JSON, so the extract_json helper tries three strategies in order: parse the raw text, then look for a markdown code fence, then use a regular expression to find the first array or object.

The two paths handle failure differently. The FastAPI agent raises an error, which becomes HTTP 422. The deployed route is more forgiving: if extraction fails or returns nothing, it treats the whole input as a single claim.

On the right is the real output from my live run. The four claims are sensible, but look at claim two: "The acquisition was announced yesterday." The word "acquisition" has lost its subject. The prompt asks for self-contained claims, and the model didn't fully manage it here. You will see on the limitations slide exactly what that did to the search.

Next, retrieval.`,
  },
  // 11
  {
    title: "External evidence retrieval with Tavily",
    dur: "1:00",
    notes: `A language model's built-in knowledge stops at its training cutoff and has gaps, so verification needs external retrieval. I use Tavily, a search API designed for LLM applications that returns cleaned page content along with URLs.

Each claim gets its own query: the string "fact check verify:" followed by the claim text. The request asks for at most five results, uses basic search depth, and turns Tavily's own generated answer off, so that the system reasons only over sources and not over another model's summary. Each result is mapped to a SearchResult object with a title, URL, snippet and publication date where Tavily provides one.

The searches are independent, so they run in parallel: asyncio.gather in Python and Promise.all in TypeScript. Total search time is therefore roughly the slowest single search, not the sum of all of them.

On reliability, the Python service has a ten-minute in-memory cache keyed on the query, result count and depth, and if the async client fails it retries once with the synchronous client in a background thread. The deployed route has no cache: any error returns an empty list.

Why search per claim rather than once per article? A single query mixing four assertions brings back pages about the most prominent topic and misses the others. Per-claim queries keep retrieval focused.

But retrieved does not mean relevant, which brings us to evidence analysis.`,
  },
  // 12
  {
    title: "Evidence analysis and classification",
    dur: "1:05",
    notes: `This is the stage I consider most important, because it stops search results from being treated as automatic proof.

For each claim, the evidence agent builds one prompt containing all of its sources, numbered, each with a title, URL and a snippet cut to 400 characters. Gemini returns a JSON list with, for each index, a short summary and a stance: supports, contradicts or neutral. The code maps the answers back by index, replaces any invalid stance with neutral, and if parsing fails completely, marks every source neutral and uses the raw snippet as the summary. Batching all sources for a claim into one call — rather than one call per source — cuts the number of LLM calls from five per claim to one.

The table in the middle is illustrative, to show the meaning of the three labels. The bar chart on the right is real data from my live run: three of the claims got five neutral sources each, and the claim about ChatGPT arriving next month got four contradicting sources and one neutral.

The resulting EvidenceItem records are what make the system traceable. The reasoning stage reads them, the UI shows each one with a coloured stance badge, and the JSON export keeps them for later inspection.

Next, how a verdict is produced from that evidence.`,
  },
  // 13
  {
    title: "Reasoning agent — verdict generation",
    dur: "1:00",
    notes: `The reasoning agent receives the claim plus its evidence as a JSON array, and the prompt defines the five verdicts and asks the model to weigh source quality, agreement between sources, relevance and recency. It returns a verdict, a confidence from 0 to 100, and a written explanation.

The output is validated before use. If the verdict is not one of the five allowed values, it becomes UNSUPPORTED. The confidence is clamped to the range 0 to 100. If the JSON can't be parsed at all, the result is UNSUPPORTED with a confidence of twenty. And if there is no evidence, the model is never called.

I want to be clear that this is semantic judgement by a language model, not formal logic. It can read nuance — for example, a source that confirms the partnership but not the acquisition. But it can also go beyond the stance labels. In my live run, claim one had five neutral sources and still came out FALSE with ninety-five per cent confidence, because the model reasoned that the evidence showed a partnership rather than a takeover. That is a reasonable conclusion here, but it shows the verdict is not a mechanical count of stances.

The example on the right is the real output for claim three, ChatGPT next month. Let me now explain how the numbers are combined.`,
  },
  // 14
  {
    title: "Confidence scoring and overall trust score",
    dur: "1:20",
    notes: `There are two numbers. The per-claim confidence comes from the reasoning model. The overall trust score is calculated by a fixed formula, which you can see here.

Each verdict has a weight: TRUE 1, PARTIALLY_TRUE 0.7, UNSUPPORTED 0.5, MISLEADING 0.3, FALSE 0. For each claim I multiply the weight by its confidence as a fraction, average over all claims, and scale to 100. The intuition is that the verdict says how good the claim is, and the confidence says how sure we are. MISLEADING ranks below UNSUPPORTED because a deceptive framing is worse than simply missing evidence.

The worked example is my real run. The two FALSE claims contribute zero. The two UNSUPPORTED claims contribute 0.5 times 1.00 and 0.5 times 0.95. The average is 0.24375, so the score is 24, which is exactly what the app displayed.

Now the honest part. In the backend, score_confidence has a fast path: if the reasoning stage already returned a positive confidence, it just clamps it and returns it, capped at twenty when there is no evidence. The heuristic and the second LLM prompt only run if that confidence is zero or missing. So this is not an independent second model or a learned calibration step. The deployed route doesn't have the stage at all.

There are two more caveats. Neither number is a calibrated probability. And the formula mixes uncertainty with falsity: a TRUE claim at fifty per cent confidence scores lower than an UNSUPPORTED claim at a hundred per cent. Also, the deployed route rounds, while the backend truncates with int, so the same inputs can differ by one point.

Next, the report that holds all of this.`,
  },
  // 15
  {
    title: "Report generation and structured output",
    dur: "0:50",
    notes: `The final output is a VerificationReport. It holds the original text, a list of claim results, the overall trust score, a summary and a generation timestamp. Each claim result nests the claim, the verdict, the confidence, the reasoning, the classified evidence and the raw search sources.

On the left is a trimmed excerpt from the real JSON my run produced. On the right is the schema. The important engineering point is that the same structure is defined twice and kept identical: as Pydantic models in models.py, which validate types and ranges — confidence and trust score are constrained to 0 to 100 — and as TypeScript interfaces in types/index.ts, which the frontend compiler checks.

The summary is the only free-text part of the report. Gemini writes it from the first five hundred characters of the input and the list of results, and the deployed route has a template summary as a fallback if that call fails.

Because the output is structured, the same object drives the user interface, the PDF and JSON exports, the clipboard copy and the local history. It could also be fed into another program without any parsing.

Let me show what the user actually sees.`,
  },
  // 16
  {
    title: "Frontend engineering and user experience",
    dur: "0:55",
    notes: `These are real screenshots of the deployed site. The frontend is Next.js with the App Router, React 19, TypeScript, Tailwind CSS and shadcn-style UI components.

page.tsx is a small state machine with three states: landing, loading and results. LandingPage holds the text area with a character counter and the built-in example. ResultsPage shows the trust score card, the summary and the export buttons. Each ClaimCard shows the verdict badge, the confidence, the reasoning, an expandable evidence list with stance badges, and clickable source links. HistoryPanel is a slide-over panel that reads the last twenty reports from the browser's local storage. ThemeToggle switches between light and dark mode using next-themes, and the layout works on mobile, as the phone screenshot shows.

The exports run entirely in the browser: jsPDF builds the PDF, the JSON download uses a Blob, and the copy button formats a plain-text report.

One honest detail: the loading animation is not connected to the server. It moves to the next step on a 1.5-second timer, because the deployed route returns one response at the end. The backend's streaming endpoint could drive it with real step events, but the frontend doesn't use it yet.

Now the server side in more detail.`,
  },
  // 17
  {
    title: "Backend engineering, API design and reliability",
    dur: "0:55",
    notes: `This table compares the two server implementations on the engineering concerns that matter in production.

For validation, the FastAPI path uses a Pydantic request model that requires 10 to 10,000 characters and returns 422 otherwise. The deployed route checks for at least five characters, and the UI won't submit fewer than ten.

On reliability, the backend has much more. GeminiProvider retries up to five times; on a rate-limit error it reads the "retry in N seconds" hint from the error message and waits that long, otherwise it backs off exponentially, capped at ten seconds. A semaphore limits it to five concurrent Gemini calls. There are three in-memory caches: whole reports for five minutes, LLM responses keyed by a SHA-256 hash of the prompt for ten minutes, and search results for ten minutes. Those caches live in one process, so they are lost on restart and not shared between workers.

The deployed route has no retries and no cache, but it falls back gracefully at each stage, and its execution limit on Vercel is set to sixty seconds.

The backend also exposes POST /api/verify/stream, which sends Server-Sent Events from graph.astream after each node. That works as a backend capability, but again, the deployed UI doesn't call it.

In both paths, the API keys are server-side environment variables and never reach the browser.

Here is the deployed data flow end to end.`,
  },
  // 18
  {
    title: "Deployment and end-to-end data flow",
    dur: "0:50",
    notes: `This sequence diagram follows one request through the deployed system.

The browser posts the text to /api/verify on Vercel. The serverless function makes one Gemini call to extract claims. It then fires N Tavily searches in parallel, then N Gemini evidence calls in parallel, then N reasoning calls in parallel. It computes the trust score locally, with no model call, makes one more Gemini call for the summary, and returns the JSON. The browser renders it and saves it to local storage.

So for N claims, the cost is up to 2N plus 2 Gemini calls and N Tavily calls. In my live run, with four claims, that was ten Gemini calls and four searches, and the whole thing took 10.9 seconds measured from the browser. That is a single observation, not a benchmark — latency depends on the number of claims and on the APIs' load at the time.

The stages are sequential and parallel only inside each stage, so the end-to-end time is roughly the sum of the slowest call in each stage.

Now let me step back and compare this design with the tools people would normally use.`,
  },
  // 19
  {
    title: "TruthLens AI vs Google Search vs ChatGPT / Gemini",
    dur: "1:15",
    notes: `This is the question I expect from the panel: if Gemini and ChatGPT can already search the web and cite sources, why build TruthLens?

The table compares the three approaches on seven dimensions. Google helps you discover ranked pages; the reasoning is done by the human. ChatGPT and Gemini can decompose, search and reason very capably — but whether they do, and in what format, depends on the prompt, the product, the plan and the tools enabled, and those features change often. TruthLens makes each of these steps a fixed stage with a fixed schema.

So the honest answer is that TruthLens does not replace the intelligence of Gemini — it is Gemini underneath. It is the difference between a general-purpose capability and a purpose-built workflow. A user could reproduce most of this by hand with a chatbot and a search engine. They would have to prompt for decomposition, then search each claim, then ask about each source, then ask for a verdict, then copy everything into a report — and do it the same way every time. TruthLens encodes that procedure once.

What it gives you is consistency: the same stages, the same five verdicts, per-claim records with evidence positions preserved, and an exportable report.

What I can't claim is that it is more accurate. Showing that would need a labelled benchmark against these baselines, which is in my evaluation plan.

Next, why I chose each component.`,
  },
  // 20
  {
    title: "Why these methods were selected",
    dur: "0:50",
    notes: `This matrix shows each major design choice as a requirement, the choice I made, why, the alternative I considered and the trade-off I accepted.

A few highlights. I used the Gemini API rather than training a model, because the tasks — extraction, stance and verdict — are things a strong general model does well without task-specific training data, which I didn't have. The cost is dependence on one vendor and on its rate limits.

I used Tavily rather than relying on the model's memory, because verification needs current, citable sources. The cost is that the evidence is only as good as the snippets in Tavily's index.

LangGraph gives explicit typed state and streaming on the backend, while the deployed path is a hand-written TypeScript chain. Having both is a trade-off: one deployment unit, but duplicated logic.

The three-way stance labels and the weighted average are deliberately simple and explainable. A natural-language-inference model or a learned aggregator might be more precise, but it would be harder to justify without evaluation data.

None of these choices were compared experimentally. These are design arguments, not measured results.

Now the most important slide for academic honesty: the limitations.`,
  },
  // 21
  {
    title: "Limitations and failure modes",
    dur: "1:10",
    notes: `I've grouped the limitations into nine cards, and the ones tagged "seen in live run" actually happened in the run I captured.

Model outputs can be wrong — the system is only as reliable as Gemini's judgement. Claim splitting can lose context: "The acquisition was announced yesterday" lost its subject, and Tavily returned pages about a completely unrelated company, FACT II Acquisition Corp. Evidence is snippet-level: the model never reads the full articles. Source independence isn't modelled: for the ChatGPT claim, three of the five results were the same Business Insider article under different URL query strings, so one source was effectively counted three times.

Recency is weak. All twenty results had no publication date, and the evidence prompt doesn't include dates anyway. The ChatGPT claim was judged against 2024 coverage saying "later this year", even though the claim says "next month" relative to an unknown date.

Confidence isn't calibrated. One claim came back UNSUPPORTED with a hundred per cent confidence — confident that the evidence was insufficient, which shows the confidence measures certainty in the verdict, not truth.

Two failure modes are quieter. If Tavily is down or rate-limited, the deployed route returns no results, and every claim silently becomes UNSUPPORTED. And the JSON fallbacks, which make the system robust, can also hide errors.

Finally, this is a decision-support tool. It doesn't replace professional fact-checkers or reading the primary source.

So how would I measure and fix these?`,
  },
  // 22
  {
    title: "Evaluation strategy and future work",
    dur: "0:55",
    notes: `Everything on this slide is proposed, not done. I haven't run a formal evaluation, and I am not reporting any accuracy numbers.

The evaluation plan on the left tests each stage separately, which the modular design makes possible. Claim extraction can be measured with precision, recall and F1 against human-annotated claims. Stance classification and final verdicts can be measured with accuracy and macro-F1 on a labelled dataset — FEVER-style data, plus a set of recent news claims, because FEVER is built from Wikipedia. Confidence calibration can be measured with reliability diagrams, expected calibration error and the Brier score, following Guo and colleagues. The baselines would be a single Gemini prompt, a single prompt with search, and a person searching manually. I would also measure latency, cost per claim, and robustness to conflicting or planted sources.

The roadmap on the right follows from the limitations. First, build the benchmark and calibrate the confidence. Second, improve the evidence: URL de-duplication, source credibility and independence, putting primary sources first, and passing dates to the model. Third, product work: wire the UI to the streaming endpoint, merge the two pipelines into one, add batch verification, accounts and multilingual support.

Now let me show the actual system running.`,
  },
  // 23
  {
    title: "Demonstration — live run (1/2)",
    dur: "0:55",
    notes: `If the network allows, I'll run this live; if not, these are screenshots from a real run of the deployed site on 17 November 2026. Please note that a live run can differ from these images, because the deployed route doesn't cache, search results change over time, and the model isn't fully deterministic even at a low temperature.

In step one, I paste the app's built-in example message and press Verify. Step two is the loading screen walking through the six stage labels — remember, that is a timed animation, not live progress. After 10.9 seconds, step three shows the report: an overall trust score of 24 out of 100, a generated summary, and the four extracted claims.

The table at the bottom is the actual result: claim one, the acquisition, FALSE at ninety-five per cent; claim two, announced yesterday, UNSUPPORTED at a hundred; claim three, ChatGPT next month, FALSE at ninety-five; and claim four, Tim Cook's press conference, UNSUPPORTED at ninety-five. Two FALSE and two UNSUPPORTED is a sensible outcome for a fabricated story — and notice that nothing was labelled TRUE.

Let me open the evidence.`,
  },
  // 24
  {
    title: "Demonstration — evidence, sources and export (2/2)",
    dur: "0:55",
    notes: `This is claim three with its evidence expanded. Each source has a stance badge and a one-line summary written by the evidence agent. Four sources contradict the claim, including Apple's own newsroom post, which says ChatGPT arrives "later this year", and one source is neutral because it mentions the integration but gives no timeline. Below that are the source links, which open the original pages so a user can check them.

You can also see two of the limitations from earlier, in the real output: the first three entries are the same Business Insider article, and the sources are from 2024.

On the right is the PDF the Export PDF button produced, with the score, the summary, and each claim with its verdict, confidence, reasoning and top sources. Next to it is the history panel, which shows the stored report with its score and verdict chips. The JSON download contains the full structure I showed on the report slide.

So, in one run, we saw unstructured text become four claims, twenty sources, twenty stance judgements, four verdicts and one exportable report.

Let me conclude.`,
  },
  // 25
  {
    title: "Conclusion and contributions",
    dur: "0:50",
    notes: `To conclude, the problem I addressed is that verifying unstructured information is manual and document-level. My contribution is a working, deployed system that makes it claim-level and explicit.

Concretely: a six-stage pipeline with clearly separated roles, orchestrated as a LangGraph state graph in the backend and as a serverless TypeScript pipeline in production; per-claim retrieval with Tavily; explicit evidence stance records; LLM-based reasoning across five verdicts, including a principled UNSUPPORTED outcome; a transparent, documented trust-score formula; and a report schema shared by both implementations.

I learned three main lessons. Structured intermediate state is what makes an LLM system debuggable — every limitation I showed you, I found by reading those intermediate records. Robust parsing and fallbacks are essential, but they need monitoring, or they hide failures. And you should measure before claiming accuracy.

My closing position is this. TruthLens shows that coordinated, specialised LLM agents can turn unstructured text into a structured, inspectable verification record. Whether that record is more accurate than the alternatives is an empirical question, and the evaluation plan I proposed is how I would answer it.

Thank you.`,
  },
  // 26
  {
    title: "Questions and discussion",
    dur: "0:15",
    notes: `Thank you for listening. I'm happy to take questions — and the live application and the full source code are at the two links on the screen.

[Prepared answers, if asked:]
• "Is it really agentic?" — It is a workflow-style multi-agent system: specialised LLM-backed roles with shared state, orchestrated deterministically. No agent plans its own steps or chooses tools; conditional routing is future work. (Slide 9.)
• "Why not just ask Gemini?" — Slide 19: same model, but a fixed procedure, schema and per-claim records. No accuracy claim without a benchmark.
• "Which path is deployed?" — The Next.js serverless route. LangGraph runs in the FastAPI backend when NEXT_PUBLIC_API_URL is set. (Slide 6.)
• "Is the confidence a probability?" — No. It is generated by the model and not calibrated; the backend confidence stage mostly passes it through. (Slide 14.)
• "Which Gemini model?" — The code default is gemini-flash-lite-latest at temperature 0.1. The production value is a Vercel environment setting that isn't visible in the repository.`,
  },
];
