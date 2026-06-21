# Mindgoodizer — System Architecture Document (SAD)

Local web app that runs a raw project idea through a pool of critical LLM
"filter" agents (Claude API) in parallel, then synthesizes their verdicts via an
Orchestrator. Local-first, single-user, no cloud backend.

---

## 1. Runtime & Stack Strategy

### Decision: Vite + React frontend + thin local Node sidecar. **Not** browser-only.

| Option | Verdict | Why |
|--------|---------|-----|
| Pure client-side React calling Anthropic SDK from browser | ❌ Rejected | API key ships inside client JS (readable in devtools/bundle). SDK refuses browser calls unless you set `dangerouslyAllowBrowser`/`anthropic-dangerous-direct-browser-access`, which exists precisely because it's unsafe. Also no place to centralize retry/timeout/rate-limit logic. |
| React + local Node sidecar (Fastify, ~80–120 LOC) | ✅ **Chosen** | Key stays in `.env` server-side. One streaming proxy endpoint. CORS trivial (same machine). Sidecar owns concurrency, timeouts, partial-failure handling. |
| Full framework backend (Nest, etc.) | ❌ Overkill | YAGNI for a single-user local tool. |

**Stack:**
- Frontend: Vite + React 18 + TypeScript. State: `useReducer` + context (single screen, no Redux).
- Sidecar: Node + Fastify + `@anthropic-ai/sdk`. One file. Streams via SSE.
- Persistence: **IndexedDB** (via `idb`), not LocalStorage — reports are large and LocalStorage's ~5MB string cap + sync API don't fit. IndexedDB is the native platform DB; no ORM.
- Run: `npm run dev` starts Vite (5173) + sidecar (8787) concurrently.

```
~/mindgoodizer
├── server/index.ts        # sidecar: /api/run (SSE), holds ANTHROPIC_API_KEY
├── src/                   # React app
├── .env                   # ANTHROPIC_API_KEY=...  (gitignored)
└── prompts/               # the 8 system prompts (see doc 02)
```

---

## 2. Data Flow & Pipeline Lifecycle

```
[User] raw idea + active-agent config
   │  POST /api/run  { idea, agents: ["devils_advocate", ...] }
   ▼
[Sidecar] validates input → opens SSE stream
   │
   ├─ Promise.allSettled over N agent calls (parallel, streaming each)
   │     each agent → Claude API (stream:true)
   │        every token → SSE event { agent, type:"delta", text }
   │        on done     → SSE event { agent, type:"done", result }
   │        on fail     → SSE event { agent, type:"error", message }
   │
   ▼  (after all settled)
[Sidecar] builds orchestrator input = { idea, [agent results that succeeded] }
   │     → Claude API (Orchestrator, stream:true)
   │        → SSE events { agent:"orchestrator", ... }
   ▼
[Frontend] renders live cards; on orchestrator done →
   │     assembles final Report object
   ▼
[IndexedDB] save({ id, idea, config, agentResults, report, createdAt })
```

**Key rule:** the Orchestrator runs **after** the filter agents settle (it needs
their outputs). Filter agents themselves are fully parallel. Orchestrator
receives only successful agent outputs; failed agents are passed as explicit
"NO RESULT (timed out)" markers so it can reason about gaps.

---

## 3. State & Concurrency Management

- **Parallelism:** `Promise.allSettled`, not `Promise.all` — one rejection must
  not abort siblings. Each agent is an independent streaming task.
- **Streaming multiplex:** single SSE connection; every event tagged with its
  `agent` id. Frontend reducer routes deltas to the matching card.
- **Per-agent state machine:** `idle → streaming → done | error | timeout`.
  Stored as `Record<agentId, AgentState>`. Cards render purely from this map.
- **Timeouts:** per-agent `AbortController`, 90s default. Timeout → that agent's
  state becomes `timeout`; others unaffected.
- **Partial failure:** Orchestrator still runs if ≥1 filter agent succeeded.
  If 0 succeed → surface error, skip orchestrator. Report records which agents
  failed.
- **Retries:** SDK has built-in retry on 429/5xx; leave default + one manual
  guard. ponytail: SDK retry covers most of it.
- **Concurrency cap:** max 7 filter agents is well under typical tier limits;
  no client-side queue needed. ponytail: add p-limit only if you hit 429s.

---

## 4. Data Schemas

**Run request (frontend → sidecar):**
```ts
{ idea: string, agents: AgentId[] }   // agents = active subset of the 7
```

**SSE event:**
```ts
{ agent: AgentId | "orchestrator",
  type: "delta" | "done" | "error" | "timeout",
  text?: string, result?: AgentResult, message?: string }
```

**AgentResult** (each filter agent returns this JSON — see doc 02):
```ts
{ verdict: "pass"|"caution"|"fail", score: number /*0-10*/,
  summary: string, findings: { point: string, severity: "low"|"med"|"high" }[],
  recommendations: string[] }
```

**Stored record (IndexedDB, store `reports`, keyPath `id`):**
```ts
{ id: string, idea: string, config: AgentId[],
  agentResults: Record<AgentId, AgentResult | { failed: true, reason: string }>,
  report: OrchestratorReport, createdAt: number /* epoch ms */ }
```

**OrchestratorReport:**
```ts
{ overallVerdict: "pursue"|"refine"|"reconsider", confidence: number,
  coreStrengths: string[], criticalBlindSpots: string[],
  conflicts: { tension: string, resolution: string }[],
  roadmap: { phase: string, action: string }[], oneLineSummary: string }
```

---

## 5. Local Execution Strategy

1. `cp .env.example .env` → paste `ANTHROPIC_API_KEY`.
2. `npm install && npm run dev` (concurrently runs sidecar + Vite).
3. Open `localhost:5173`. Sidecar at `localhost:8787` is the only network egress.
4. No auth, no DB server, no Docker. Everything else lives in the browser.

skipped: cloud deploy, multi-user, auth — add when it stops being a local tool.
