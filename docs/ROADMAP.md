# Mindgoodizer — Roadmap

---

## 1. Foundation

### 1.1. Project Scaffold
#### 1.1.1. Init repo with Vite + React 18 + TypeScript; add Fastify sidecar skeleton; wire `concurrently` dev runner; add `.env.example` with `ANTHROPIC_API_KEY` placeholder.

### 1.2. Sidecar Core (`server/index.ts`)
#### 1.2.1. Implement `POST /api/run` — validate `{ idea, agents }`, open SSE stream, add per-agent `AbortController` with 90s timeout, wire `Promise.allSettled` over N parallel Anthropic streaming calls, emit `{ agent, type, text|result|message }` events.

### 1.3. Haiku Classifier
#### 1.3.1. Add single non-streaming Haiku call before filter agents start; classify idea as `"light" | "heavy"`; store result to route Orchestrator model (`sonnet` vs `opus`).

---

## 2. Agent Pipeline

### 2.1. Filter Agents
#### 2.1.1. Wire all 7 filter agents (Devil's Advocate, Reality Checker, Monetizer, Pragmatist, Grandma Test, Copycat Detector, Futurist) with shared rules prepended; set temperature 0.7, max_tokens 1500; enforce JSON output schema with one client-side retry on parse failure.

### 2.2. Orchestrator Agent
#### 2.2.1. After all filter agents settle, build orchestrator input from successful results + `"NO RESULT (timed out)"` markers for failures; run Orchestrator at temperature 0.3, max_tokens 2500; emit structured `OrchestratorReport` via SSE; skip entirely if 0 filter agents succeeded.

### 2.3. Partial Failure Handling
#### 2.3.1. Ensure each agent failure stays isolated — siblings continue streaming; failed agents recorded as `{ failed: true, reason }` in the stored record; Orchestrator receives gap markers and surfaces them as unexamined blind spots.

---

## 3. Frontend

### 3.1. Control Center
#### 3.1.1. Build idea textarea (min 20 chars to enable Run), 4 locked core-agent indicators, 3 niche toggles (default off), and Run button that shows `"Evaluating (N agents)…"` and locks during a run.

### 3.2. Parallel Dashboard
#### 3.2.1. Implement `useReducer` state machine (`config → running → complete`); render responsive agent card grid driven purely from `Record<AgentId, AgentState>`; each card reflects `idle | streaming | done | error | timeout` with live token append, verdict badge, collapsible findings, and per-card Retry button.

### 3.3. Orchestrator Card & History Panel
#### 3.3.1. Add full-width Orchestrator card that stays `idle` until filter cards settle then streams the synthesized report (verdict, strengths, blind spots, conflicts table, roadmap); implement IndexedDB persistence (`idb`) with History panel showing past runs (snippet + date + verdict badge), click-to-load read-only, per-item delete with confirm, and "Clear all".
