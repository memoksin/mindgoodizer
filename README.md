<p align="center">
  <img src="public/logo.png" alt="Mindgoodizer Logo" width="200" />
</p>

# Mindgoodizer

> Yet another council app for you!

A local-first idea validator. Throw a raw project idea at a council of critical LLM agents — each attacks it from a different angle — then an Orchestrator synthesizes their verdicts into a final report.

## ⚠️ Status: Early Beta

This was vibe-coded in ~3 hours. It works, but rough edges exist. Bugs will happen. UI may break. The agent pipeline is solid; everything around it is held together with optimism.

If something breaks — open an issue or just refresh. PRs welcome.

## Why

Most idea-validation tools either coddle you or give generic feedback. Mindgoodizer runs your idea through adversarial specialists in parallel: a Devil's Advocate, a Reality Checker, a Copycat Detector, a Grandma Test, and more. The Orchestrator then reconciles their findings into an honest verdict with blind spots, conflicts, and a roadmap.

No cloud backend. No account. Your API key stays on your machine.

## When to Use

- You have a raw project idea and want brutal, structured critique before committing to it
- You want parallel expert perspectives in seconds, not days
- You want the output saved locally so you can compare runs over time

## Stack

- **Frontend:** Vite + React 18 + TypeScript
- **Sidecar:** Node + Fastify (streams agent output via SSE)
- **LLM:** Claude API via `claude` CLI (spawned by sidecar)
- **Persistence:** IndexedDB — runs saved locally, no server

## Setup

```bash
bun install
bun run dev     # Vite on :5173 + sidecar on :8787
```

Open `http://localhost:5173`.

## Usage

1. Type your idea in the **Control Center**
2. Toggle which agents you want (all on by default)
3. Hit **Run** — watch agents stream in parallel
4. Read the **Orchestrator** synthesis at the bottom
5. Past runs are in the **History** panel

## Agents

| Agent | Lens |
|---|---|
| Devil's Advocate | Finds fatal flaws |
| Reality Checker | Validates assumptions against reality |
| Monetizer | Identifies revenue paths |
| Pragmatist | Estimates effort vs. payoff |
| Copycat Detector | Spots existing competitors |
| Grandma Test | Checks clarity and accessibility |
| Futurist | Projects long-term trajectory |
| **Orchestrator** | Synthesizes all verdicts |

## Requirements

- [Bun](https://bun.sh) (or Node 20+)
- [Claude CLI](https://claude.ai/download) with an active Claude subscription (the sidecar spawns `claude` directly — no API key needed)
