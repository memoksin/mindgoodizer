# Mindgoodizer — UI/UX Functional Blueprint

Single-page React app. Three regions: Control Center, Parallel Dashboard,
History. No routing — panels toggle.

---

## 1. Control Center

- **Idea textarea**: large, autofocus, placeholder with an example. Min ~20
  chars to enable Run (validation at boundary).
- **Core agents**: 4 mandatory filters shown always-on (locked, visibly active —
  not toggleable).
- **Niche toggles**: 3 switches (Grandma Test, Copycat Detector, Futurist),
  default off.
- **Run button**: disabled while a run is in flight or idea is empty. Shows
  "Evaluating (N agents)…" during run.
- **Active config** = 4 core + checked niche agents.

```
┌────────────────────────────────────────────┐
│ Describe your idea                         │
│ ┌────────────────────────────────────────┐ │
│ │ [textarea]                             │ │
│ └────────────────────────────────────────┘ │
│ Core: ● Devil's Advocate ● Reality Checker │
│       ● Monetizer ● Pragmatist             │
│ Niche: ☐ Grandma ☐ Copycat ☐ Futurist      │
│                       [ Run Evaluation → ] │
└────────────────────────────────────────────┘
```

---

## 2. Parallel Dashboard

- Responsive grid of **agent cards**, one per active agent + one Orchestrator
  card (full width, below the filters).
- Each card renders purely from its `AgentState`:

| State       | Card shows                                                                             |
| ----------- | -------------------------------------------------------------------------------------- |
| `idle`      | Agent name + motto, dimmed                                                             |
| `streaming` | Live-appending tokens, spinner, pulsing border                                         |
| `done`      | Verdict badge (pass/caution/fail color), score, collapsible findings + recommendations |
| `error`     | Red banner + message + Retry button (re-runs just that agent)                          |
| `timeout`   | Amber "Timed out" + Retry                                                              |

- **Orchestrator card** stays `idle` until all filter cards leave `streaming`,
  then streams, then renders the structured report (verdict, strengths, blind
  spots, conflicts table, roadmap list).

```
┌─Devil's Adv─┐ ┌─Reality─────┐ ┌─Monetizer──┐ ┌─Pragmatist─┐
│ ⚠ caution 6 │ │ ⟳ streaming │ │ ✓ pass 8   │ │ ✗ fail 3   │
│ findings ▸  │ │ ...text...  │ │ findings ▸ │ │ Retry ↻    │
└─────────────┘ └─────────────┘ └────────────┘ └────────────┘
┌─Orchestrator (full width)──────────────────────────────────┐
│ idle until filters complete → REFINE (conf 7)              │
│ Strengths · Blind spots · Conflicts · Roadmap              │
└────────────────────────────────────────────────────────────┘
```

---

## 3. State Transitions (frontend reducer)

```
appState: "config" | "running" | "complete"

config  --Run-->            running   (open SSE, all agents → streaming/idle)
running --SSE delta-->       running   (append text to agent.partial)
running --SSE done-->        running   (agent → done with result)
running --SSE error/timeout->running   (that agent → error/timeout)
running --all filters settled & orchestrator done--> complete (save to IndexedDB)
complete --Retry(agent)-->   running   (re-run single agent; re-run orchestrator after)
complete --New idea-->       config
```

State shape:

```ts
{ appState, idea, config: AgentId[],
  agents: Record<AgentId, { status, partial: string, result?: AgentResult }>,
  orchestrator: { status, partial, result? } }
```

---

## 4. Persistence & History

- IndexedDB store `reports` (schema in doc 01). Saved automatically on
  `complete`.
- **History panel**: list of past runs (idea snippet + date `YYYY-MM-DD` +
  overall verdict badge), newest first. Click → loads full report read-only
  into the dashboard. Delete per item (confirm) + "Clear all".
- Operations: `saveReport`, `listReports`, `getReport(id)`, `deleteReport(id)`.

```
History
┌────────────────────────────────────────┐
│ "AI tutor for…"   2026-06-21  [REFINE] 🗑│
│ "B2B invoice…"    2026-06-20  [PURSUE] 🗑│
└────────────────────────────────────────┘
```

---

## 5. Loading & error UX rules

- Never block the whole UI for one slow agent — cards are independent.
- Run button locked during run; History/New disabled mid-run.
- If 0 filters succeed: dashboard shows a single error state, Orchestrator card
  shows "Skipped — no agent results", nothing saved.
- Retry re-runs only the failed agent, then re-runs the Orchestrator with the
  updated set.

skipped: dark/light toggle, export-to-PDF, history search/filter — add when asked.
