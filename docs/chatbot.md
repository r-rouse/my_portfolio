# Portfolio Chatbot

A RAG-style portfolio assistant that answers questions about Randall's background using content from markdown files in the `content/` directory. The assistant is grounded in portfolio materials and instructed not to fabricate information.

## Overview

Visitors open a floating chat widget on the portfolio homepage. Questions are sent to a backend API, which retrieves relevant portfolio context and calls OpenAI to generate a concise answer.

```
┌─────────────┐     POST /api/chat      ┌──────────────┐
│  Chat UI    │ ──────────────────────► │  API Route   │
│  (React)    │ ◄────────────────────── │  route.ts    │
└─────────────┘     { answer }          └──────┬───────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    ▼                            ▼                            ▼
             ┌─────────────┐            ┌───────────────┐            ┌─────────────┐
             │ Chat Service│            │  Retrieval    │            │   OpenAI    │
             │  chat.ts    │───────────►│  Service      │            │  Adapter    │
             └─────────────┘            └───────┬───────┘            └─────────────┘
                                                 │
                                                 ▼
                                         ┌───────────────┐
                                         │ content/*.md  │
                                         │ Knowledge Base│
                                         └───────────────┘
```

## Architecture layers

Each layer has a single responsibility and can be swapped independently.

| Layer | Location | Responsibility |
|-------|----------|----------------|
| UI | `src/components/ChatWidget.tsx`, `ChatWindow.tsx`, `ChatInput.tsx`, `ChatMessage.tsx` | Widget toggle, message list, input handling |
| Client service | `src/services/chatService.ts` | `fetch` wrapper — UI never calls the API directly |
| API route | `app/api/chat/route.ts` | HTTP entry point, request validation |
| Chat service | `lib/ai/chat.ts` | Orchestrates retrieval + LLM generation |
| Retrieval | `lib/rag/retrieveContext.ts` | Loads and selects portfolio context |
| Knowledge base | `lib/rag/loadDocuments.ts` | Reads `content/*.md` from disk |
| Chunking | `lib/rag/chunkDocuments.ts` | Splits documents into retrievable sections |
| Prompts | `lib/ai/prompts.ts` | System prompt and message assembly |
| LLM adapter | `lib/ai/openai.ts` | OpenAI client — provider can be swapped here |
| Types | `lib/types/chat.ts` | Shared request/response/message types |

## Knowledge base

Portfolio facts live in markdown files under `content/`:

| File | Contents |
|------|----------|
| `bio.md` | Background summary |
| `resume.md` | Resume details |
| `experience.md` | Work history |
| `projects.md` | Project descriptions |
| `skills.md` | Technical skills |

**To update what the assistant knows**, edit these files. No code changes are required unless you add new files (then update `KNOWLEDGE_BASE_FILES` in `lib/rag/loadDocuments.ts`).

## Retrieval (Phase 1)

Current implementation loads all documents, chunks them on markdown `##` headings, and injects the full knowledge base into the LLM prompt.

```ts
// lib/rag/retrieveContext.ts — simplified flow
const documents = await loadDocuments();
const chunks = chunkDocuments(documents);
return chunks.map(c => `[Source: ${c.source}]\n${c.content}`).join('\n\n---\n\n');
```

### Planned Phase 2 (vector search)

The retrieval function signature is stable for a future upgrade:

```
User Question → Embedding → Vector DB → Top K Chunks → LLM
```

TODO markers in the codebase indicate where embeddings, vector search, reranking, and citations will be added.

## Prompting

The system prompt (`lib/ai/prompts.ts`) instructs the model to:

- Answer **only** from supplied portfolio context
- Never fabricate experience, employers, projects, or dates
- Respond with a fixed fallback when information is missing:
  > "I don't have that information in Randall's portfolio materials."
- Keep answers concise and conversational

Context is injected as a separate user message so the system prompt stays stable across requests.

## API

### `POST /api/chat`

**Request:**

```json
{
  "message": "What projects has Randall built?"
}
```

**Response (200):**

```json
{
  "answer": "Randall has built projects including..."
}
```

**Errors:**

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "error": "Message is required" }` | Empty or missing message |
| 500 | `{ "error": "Failed to generate a response" }` | OpenAI or server error |

## Environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini    # optional, defaults to gpt-4o-mini
API_PORT=3001               # optional, defaults to 3001
```

The API key is only used server-side and is never exposed to the browser.

## Running locally

```bash
npm run dev
```

This starts:

1. **Vite** on port `5173` — serves the React frontend
2. **Express** on port `3001` — serves `/api/*` routes

Vite proxies `/api` requests to the Express server (see `vite.config.js`).

To run only one part:

```bash
npm run dev:client   # frontend only
npm run dev:api      # API only
```

## UI components

### ChatWidget

Floating button in the bottom-right corner. Toggles the chat window open/closed. Fires a `chat_opened` analytics event when opened.

### ChatWindow

Main chat panel with:

- Message history (user + assistant turns)
- Loading indicator while waiting for a response
- Auto-scroll to the latest message

### ChatInput

Text input with send button. Disabled while a request is in flight.

## Client service

```ts
import { sendChatMessage } from '../services/chatService';

const answer = await sendChatMessage('Tell me about Randall\'s IBM experience');
```

This is the only function UI components should use to communicate with the backend. To switch to WebSocket streaming later, update this module without touching UI code.

## Production deployment

The API routes are written as standard `Request`/`Response` handlers so they can be:

- Mounted by the existing Express server (`server/dev-server.ts`)
- Migrated to serverless functions (Vercel, Netlify, AWS Lambda)
- Moved to a Next.js App Router project with minimal changes

Deploy the static Vite build (`dist/`) alongside the API server, or host API routes on your platform of choice.

## Analytics integration

Chat usage is instrumented for the analytics dashboard:

| Event | When | Metadata |
|-------|------|----------|
| `chat_opened` | User opens the widget | — |
| `chat_message_sent` | User sends a message | `messageLength` |
| `chat_response_received` | AI reply arrives | `messageLength`, `responseTimeMs`, `responseLength` |

No message content is stored. See [Analytics](./analytics.md) for details.

## Future improvements

Tracked as TODOs in the codebase:

- Vector embedding search for targeted retrieval
- Streaming responses via OpenAI streaming API
- Source citations in answers using chunk metadata
- Conversation history sent to the API for multi-turn context
