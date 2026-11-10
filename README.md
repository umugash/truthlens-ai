# TruthLens AI

**TruthLens AI** is an autonomous multi-agent fact verification system. It is not a chatbot — it is an AI agent pipeline that plans tasks, performs internet searches, gathers evidence, reasons over that evidence, assigns confidence scores, and produces structured verification reports.

🚀 **Live Production App**: [https://frontend-xi-kohl-41.vercel.app](https://frontend-xi-kohl-41.vercel.app)  
📦 **GitHub Repository**: [https://github.com/umugash/truthlens-ai](https://github.com/umugash/truthlens-ai)

## Architecture

```
truthlens-ai/
├── backend/                 # FastAPI + LangGraph agent pipeline
│   └── app/
│       ├── agents/          # Individual agent modules + LangGraph workflow
│       ├── api/             # REST API routes (standard + SSE streaming)
│       ├── services/        # LLM (Gemini) and Tavily search services with caching
│       ├── types/           # Pydantic models
│       └── utils/           # Prompts and JSON helpers
├── frontend/                # Next.js App Router UI & Serverless API
│   ├── app/                 # Pages, layout, and native serverless /api routes
│   ├── components/          # React components (UI + feature)
│   ├── lib/                 # API client, history, export utilities
│   └── types/               # TypeScript type definitions
└── README.md
```

## Agent Pipeline (LangGraph Workflow)

The verification pipeline runs six specialized agents in sequence:

```
Input Text
    │
    ▼
┌─────────────────────┐
│ 1. Claim Extraction │  Split text into verifiable factual claims
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 2. Search Agent     │  Tavily web search per claim (top 5 results)
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 3. Evidence Agent   │  Summarize sources; classify supports/contradicts/neutral
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 4. Reasoning Agent  │  Determine verdict: TRUE/FALSE/PARTIALLY_TRUE/MISLEADING/UNSUPPORTED
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 5. Confidence Agent │  Score 0-100 based on source quality and agreement
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 6. Report Agent     │  Assemble final report with overall trust score
└─────────────────────┘
```

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Gemini API Key** — [Google AI Studio](https://aistudio.google.com/apikey)
- **Tavily API Key** — [Tavily](https://tavily.com/)

## Installation

### 1. Clone and enter the project

```bash
cd truthlens-ai
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
GEMINI_MODEL=gemini-2.0-flash
CORS_ORIGINS=http://localhost:3000
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.local.example .env.local
```

## Running Locally

Start both services in separate terminals:

**Terminal 1 — Backend (port 8000):**

```bash
cd backend
venv\Scripts\activate   # or source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend (port 3000):**

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## API Endpoints

| Method | Endpoint       | Description                    |
|--------|----------------|--------------------------------|
| GET    | `/api/health`  | Health check                   |
| POST   | `/api/verify`  | Run full verification pipeline |

**Example request:**

```bash
curl -X POST http://localhost:8000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"text": "Apple acquired OpenAI for $50 billion."}'
```

## Features

- **Multi-agent pipeline** — LangGraph orchestrates six specialized agents
- **Web search** — Tavily API gathers real-time evidence
- **Structured reports** — Verdicts, confidence scores, evidence, and sources per claim
- **Overall trust score** — Weighted aggregate across all claims
- **Dark mode** — System-aware theme toggle
- **Export** — Copy report, download JSON, export PDF
- **History** — Local storage of past verifications
- **Responsive design** — Works on desktop and mobile

## Swapping LLM Providers

The LLM layer is abstracted in `backend/app/services/llm.py`. To switch from Gemini to OpenAI:

1. Install the OpenAI SDK: `pip install openai`
2. Implement `OpenAIProvider.generate()` in `llm.py`
3. Change the provider in `get_llm_provider("openai")`

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend  | FastAPI, Python                     |
| Agents   | LangGraph                           |
| LLM      | Google Gemini (swappable)           |
| Search   | Tavily Search API                   |

## Future Improvements

- **Streaming progress** — WebSocket/SSE for real-time agent step updates
- **Source credibility scoring** — Domain reputation and fact-check database integration
- **Batch verification** — Process multiple articles in parallel
- **User accounts** — Persistent history with authentication
- **OpenAI provider** — Complete the OpenAI LLM adapter
- **Rate limiting** — Protect API from abuse
- **Caching** — Cache search results for repeated claims
- **Multilingual support** — Verify claims in non-English text

## License

MIT
