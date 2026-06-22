# Contributing

## Requirements

- [Bun](https://bun.sh) (or Node 20+)
- [Claude CLI](https://claude.ai/download) with active subscription

## Setup

```bash
bun install && bun run dev   # Vite :5173 + sidecar :8787
# or
npm install && npm run dev
```

<!-- AUTO-GENERATED from package.json scripts -->
| Command | Bun | npm |
|---------|-----|-----|
| Start dev (both) | `bun run dev` | `npm run dev` |
| Client only | `bun run dev:client` | `npm run dev:client` |
| Server only | `bun run dev:server` | `npm run dev:server` |
| Production build | `bun run build` | `npm run build` |
| Preview build | `bun run preview` | `npm run preview` |
<!-- END AUTO-GENERATED -->

## Commit Style

Conventional commits. No attribution lines.

```
<type>(<optional scope>): <short description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat: add futurist agent
feat(ui): move orchestrator card above agent grid
fix: handle empty SSE chunks
docs: update architecture diagram
refactor: extract agent runner into separate module
```

Rules:
- Lowercase description
- No period at end
- Scope optional; use it when change is clearly isolated to one area (e.g. `ui`, `server`, `agents`)
- Body only when the *why* isn't obvious from the title
- No `Co-Authored-By` or AI attribution lines

## Code Rules

- TypeScript strict mode — no `any`
- Immutable patterns — never mutate in place, return new objects
- Small files (<800 lines), small functions (<50 lines)
- No hardcoded magic numbers — use named constants
- No silent error swallowing — handle or rethrow explicitly
- No speculative abstractions — YAGNI

## Project Constraints

- Sidecar is the only network egress — frontend never calls Claude directly
- Filter agents run in parallel; Orchestrator waits for all to settle
- If 0 filter agents succeed: error state, skip Orchestrator, save nothing
- Persistence is IndexedDB only — no server, no cloud

## PRs

- Title matches commit style above
- Description: what changed + why + how to test
- Keep PRs focused — one logical change per PR
