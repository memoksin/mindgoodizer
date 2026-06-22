# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Behavior Rules

- **Communication:** Always use caveman mode (terse, no filler, fragments OK). Never use pleasantries or hedging.
- **Sub-agents:** Only spawn sub-agents for mid/heavy tasks (multi-file refactors, full-feature implementations, deep analysis). Simple reads, edits, lookups, single-file fixes — do directly without delegation.

## What This Is

Mindgoodizer is a local-first single-user web app. A user submits a raw project idea; it runs through a pool of critical LLM filter agents in parallel, then an Orchestrator synthesizes their verdicts into a final report. No cloud backend, no auth, no multi-user.

## Planned Stack

- **Frontend:** Vite + React 18 + TypeScript. State via `useReducer` + context (no Redux — single screen).
- **Sidecar:** Node + Fastify + `claude` CLI (spawned via `child_process`). One file (`server/index.ts`). Streams via SSE. Auth via Claude subscription — no API key needed.
- **Persistence:** IndexedDB via `idb` (not LocalStorage — reports are large).
- **Dev runner:** `concurrently` starts both processes.

Why a sidecar instead of pure browser: sidecar owns concurrency, timeouts, and partial-failure handling; `claude` CLI requires a local process.

## Commands (once implemented)

```bash
bun install
bun run dev               # Vite on :5173 + sidecar on :8787
```

## Architecture

### Data Flow

```
POST /api/run { idea, agents: ["devils_advocate", ...] }
  → sidecar opens SSE stream
  → Promise.allSettled over N parallel agent calls (each streams tokens back)
  → SSE events: { agent, type: "delta"|"done"|"error", text }
  → after all filter agents settle → Orchestrator runs (receives only successful results + "NO RESULT" markers for failures)
  → frontend assembles final Report → saves to IndexedDB
```

### Frontend State Machine

`appState`: `"config"` → `"running"` → `"complete"` → back to `"config"` or retry a single agent.

State shape:
```ts
{ appState, idea, config: AgentId[],
  agents: Record<AgentId, { status, partial: string, result?: AgentResult }>,
  orchestrator: { status, partial, result? } }
```

Agent card statuses: `idle | streaming | done | error | timeout`. Retry re-runs only the failed agent, then re-runs Orchestrator with the updated set.

### UI Regions (single page, no routing)

1. **Control Center** — idea input + agent toggle checkboxes + Run button
2. **Parallel Dashboard** — responsive grid of agent cards + one full-width Orchestrator card below
3. **History** — panel toggle showing past runs from IndexedDB

### Agent Skills (`skills/`)

Each agent has a `SKILL.md` with: lens description, motto, rules, and a strict JSON output schema. Agents output **only** valid JSON — no prose. Rules shared across all agents:
- Judge the idea as stated; missing info is a finding, not a reason to assume best case.
- Be concrete (name actual competitors, specific risks, real numbers).

Current agents: `devils-advocate`, `reality-checker`, `monetizer`, `pragmatist`, `copycat-detector`, `grandma-test`, `futurist`, `orchestrator`.

Orchestrator is special: runs after all filter agents settle, receives their structured results, outputs: `verdict`, `strengths`, `blind_spots`, `conflicts` table, `roadmap`.

### Key Design Constraints

- Filter agents run fully in parallel; Orchestrator waits for all to settle.
- If 0 filter agents succeed: show error state, skip Orchestrator, save nothing.
- Sidecar is the only network egress (`:8787`). Frontend never calls Anthropic directly.
- `docs/` contains the authoritative design docs: `01-system-architecture.md`, `02-prompt-book.md`, `03-ui-blueprint.md`. Read these before making structural decisions.
