# Portfolio Documentation

Technical documentation for the portfolio chatbot and analytics features.

## Contents

| Document | Description |
|----------|-------------|
| [Chatbot](./chatbot.md) | RAG-powered portfolio assistant — architecture, knowledge base, API, and UI |
| [Analytics](./analytics.md) | Event instrumentation, storage, dashboard, and privacy model |

## Quick start

```bash
# Install dependencies
npm install

# Set environment variables (see chatbot.md)
cp .env.example .env   # if .env.example exists, or create .env manually

# Run frontend + API server together
npm run dev
```

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/` | Main portfolio |
| `http://localhost:5173/analytics` | Real-time analytics dashboard |
| `http://localhost:3001/api/chat` | Chat API (proxied via Vite in dev) |
| `http://localhost:3001/api/analytics` | Analytics API |

## Project layout (chat + analytics)

```
content/                  # Knowledge base markdown (chatbot)
lib/
  ai/                     # LLM orchestration and prompts
  rag/                    # Document loading, chunking, retrieval
  analytics/              # Event types, storage, client tracking
app/
  api/chat/route.ts       # POST /api/chat
  api/analytics/route.ts  # POST + GET /api/analytics
  analytics/page.tsx      # /analytics route page
src/
  components/Chat*.tsx    # Chat widget UI
  components/analytics/   # Dashboard components
  hooks/usePortfolioAnalytics.ts
  services/               # Client API wrappers
server/dev-server.ts      # Express server mounting API routes
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite frontend + Express API (ports 5173 + 3001) |
| `npm run dev:client` | Frontend only |
| `npm run dev:api` | API server only |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview production build |
