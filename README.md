# Subscription & Recurring-Spend Guardian — Advanced Hackathon Version

This version adds:

- OpenAI LLM reasoning through LangChain/OpenAI
- LangGraph workflow orchestration
- Transaction CSV ingestion
- Email `.eml` / `.txt` scanning
- Deterministic guardrails that override LLM recommendations
- React + Vite frontend
- FastAPI backend
- Human approval endpoint
- Explicit execution trace
- Sample data

## Architecture

React UI
  |
  v
FastAPI
  |
  v
LangGraph
  |
  +--> Ingest transactions
  |
  +--> Scan emails
  |
  +--> LLM reasoning
  |
  +--> Deterministic guardrails
  |
  +--> Action/approval layer
  |
  +--> Result + trace

## 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
# macOS/Linux: cp .env.example .env
```

Put your OpenAI API key in `.env`:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
```

Run:

```bash
python run.py
```

Backend: http://localhost:8000

## 2. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## CSV format

At minimum:

```csv
merchant,amount
StreamFlix,14.99
```

Recommended:

```csv
date,merchant,amount,category
2026-09-01,StreamFlix,14.99,streaming
```

## Email scanning

Upload `.eml` files or plain `.txt` email exports. The scanner looks for:

- free trials converting to paid
- renewal/cancellation language
- price increase messages

## Safety architecture

The LLM never has final authority over protected categories or amounts above
the auto-action limit. Those checks are deterministic and happen after LLM
reasoning.

Duplicate services are escalated rather than autonomously cancelled because
the agent cannot know which service the user prefers.

The `/api/approval` endpoint is a demo stub. It records approval but does NOT
connect to a real merchant account. A production implementation should add
OAuth, merchant APIs, authentication, audit logs, retries and explicit
confirmation.

## Test

Use:

`data/sample_transactions.csv`

and run the frontend audit.
