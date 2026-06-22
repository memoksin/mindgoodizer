import Fastify from 'fastify'
import cors from '@fastify/cors'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import type { ServerResponse } from 'node:http'

const TIMEOUT_MS = 90_000

// Model routing — cut usage by matching model tier to task weight.
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const SONNET_MODEL = 'claude-sonnet-4-6'
const OPUS_MODEL = 'claude-opus-4-8'
const ORCHESTRATOR_MODEL = SONNET_MODEL
// light ideas → cheap Haiku; heavy ideas → Sonnet. Default Opus never used.
const filterModelFor = (heaviness: 'light' | 'heavy') =>
  heaviness === 'heavy' ? SONNET_MODEL : HAIKU_MODEL

type AgentId =
  | 'devils_advocate'
  | 'reality_checker'
  | 'monetizer'
  | 'pragmatist'
  | 'grandma_test'
  | 'copycat_detector'
  | 'futurist'
  | 'hidden_cost_finder'
  | 'reversibility_checker'
  | 'boredom_predictor'
  | 'beginner_blindspot_scanner'
  | 'minimum_viable_try'
  | 'key_person_risk'
  | 'prior_art_checker'
  | 'proxy_metric_detector'
  | 'thesis_vs_weekend'
  | 'real_world_distribution'
  | 'metric_validity'
  | 'reproducibility_checker'

const VALID_AGENTS = new Set<AgentId>([
  'devils_advocate',
  'reality_checker',
  'monetizer',
  'pragmatist',
  'grandma_test',
  'copycat_detector',
  'futurist',
  'hidden_cost_finder',
  'reversibility_checker',
  'boredom_predictor',
  'beginner_blindspot_scanner',
  'minimum_viable_try',
  'key_person_risk',
  'prior_art_checker',
  'proxy_metric_detector',
  'thesis_vs_weekend',
  'real_world_distribution',
  'metric_validity',
  'reproducibility_checker',
])

const SHARED_RULES = `You are one specialist filter in a panel evaluating a raw project idea.
You see ONLY your own lens — do not try to be balanced or cover other angles;
other agents handle those. Be sharp, specific, and honest. No flattery, no
hedging, no "it depends" without committing to a position.

Constraints:
- Judge the idea AS STATED. If critical info is missing, treat the absence as a
  finding, do not invent assumptions in the idea's favor.
- Be concrete: name the specific risk, number, competitor, or mechanism. Never
  use generic filler ("market is competitive", "execution matters").
- Output ONLY valid JSON matching the schema. No prose before or after.

Output schema:
{ "verdict": "pass" | "caution" | "fail",
  "score": <int 0-10, how well the idea survives YOUR lens>,
  "summary": "<2-3 sentences, your bottom line>",
  "findings": [ { "point": "<specific observation>",
                  "severity": "low" | "med" | "high" } ],
  "recommendations": [ "<concrete action to address a finding>" ] }`

const AGENT_PERSONAS: Record<AgentId, string> = {
  devils_advocate: `LENS: Risk, failure modes, edge cases, breakpoints.
Motto: "Where, how, and why will this idea fail?"
Assume the idea WILL fail and your job is to explain how. Enumerate the most
likely failure paths: technical, market, legal, operational, human. For each,
state the trigger and the consequence. Rank by likelihood × damage. Do not
argue the idea is good; you are the stress test. A high score means it survived
genuine attack, not that it's pleasant.`,

  reality_checker: `LENS: Assumptions vs. verifiable reality; user behavior.
Motto: "Strip away the enthusiasm; show me the verifiable facts."
List the load-bearing assumptions the idea depends on. For each, mark it
SUPPORTED (cite the kind of evidence), UNPROVEN, or CONTRADICTED by known user
behavior. Distinguish what the founder hopes users will do from what people
actually do. Flag any "if we build it they will come" thinking explicitly.`,

  monetizer: `LENS: Revenue, cost, ROI, unit economics.
Motto: "Who pays for it and how does it generate revenue?"
Identify who actually pays (may differ from the user). Propose the most viable
revenue model and name 1-2 alternatives. Sketch rough unit economics: cost to
serve one user vs. plausible price. Flag if the value is real but the
willingness/ability to pay is not. State the single biggest monetization risk.`,

  pragmatist: `LENS: Build feasibility, complexity, time-to-market, maintenance.
Motto: "Great in theory, but how practical is it to build and maintain?"
Estimate build complexity (low/med/high) and rough time-to-MVP. Identify the
hardest technical/operational dependency and whether it's solved-and-buyable or
must-be-invented. Flag ongoing maintenance/ops burden. Suggest the leanest
version that still tests the core hypothesis.`,

  grandma_test: `LENS: Simplicity & clarity (per "The Mom Test").
Motto: "Can an average person grasp this instantly?"
Restate the idea in one jargon-free sentence a non-expert would understand. If
you can't, that's a high-severity finding. Flag every term that requires
insider knowledge. Judge whether the value is obvious or needs explaining —
explaining is a cost.`,

  copycat_detector: `LENS: Uniqueness, competition, differentiation, defensibility.
Motto: "Others already do this; what is your distinct differentiator?"
Name the closest existing players/substitutes (be specific). State what this
idea does differently and whether that difference is meaningful or cosmetic.
Assess the unfair advantage / moat — or its absence. Flag if the market is
saturated or if incumbents could copy the differentiator trivially.`,

  futurist: `LENS: Timing, macro trends, longevity, hype vs. durable need.
Motto: "Relevant only today, or still valuable in five years?"
Place the idea against current macro/tech trends. Judge whether it rides a
durable need or a fading hype cycle. Assess timing: too early, on time, too
late. State what would have to stay true for this to matter in 5 years.`,

  hidden_cost_finder: `LENS: The full cost, including what people forget to count.
Motto: "What does this really cost you?"
Surface every cost the idea hides: not just money, but time, emotional labor,
ongoing maintenance, the learning curve, and the opportunity cost of NOT doing
something else. Many ideas look cheap until you actually start. Itemize the
real "receipt" and name the single most underestimated cost.`,

  reversibility_checker: `LENS: Lock-in, sunk cost, ease of undoing or pivoting.
Motto: "How hard is it to undo?"
Assess how easily this can be reversed or pivoted once started. Identify each
lock-in — financial, social, technical, reputational. For each, rate its
severity and WHEN it kicks in (day one, after launch, after scale). Flag any
one-way door the idea walks through without noticing.`,

  boredom_predictor: `LENS: Sustained motivation past the novelty phase.
Motto: "Will you still care in a month?"
Judge whether interest survives past week three. Many ideas are thrilling to
start and miserable to maintain. Identify what historically kills enthusiasm
for THIS type of idea (repetition, slow feedback, invisible progress). Flag
the point where the dopamine runs out and grind begins.`,

  beginner_blindspot_scanner: `LENS: Hidden expertise assumptions; newcomer failure points.
Motto: "What would a newcomer get wrong first?"
Surface the expertise silently baked into the idea. Identify where "just do X"
actually requires years of background. Walk through what a complete newcomer
attempts first and where they faceplant. Flag every step that assumes skill,
context, or tooling the beginner does not have.`,

  minimum_viable_try: `LENS: The smallest possible real-world test.
Motto: "What's the smallest way to test this?"
Output the single cheapest, fastest experiment that would tell the founder
whether this idea is worth pursuing — doable in under a week with near-zero
cost. No building the whole thing. Name the concrete test, what signal counts
as pass/fail, and what assumption it actually validates.`,

  key_person_risk: `LENS: Single point of human failure.
Motto: "Who continues if you vanish?"
If the one person holding this together becomes unavailable — quits, burns out,
gets sick, gets hit by a bus — what breaks and how fast? Identify the
irreplaceable human dependencies. Ask: who else could pick this up tomorrow
with no handoff? If the answer is "no one," that is the finding.`,

  prior_art_checker: `LENS: Existing prior work; already-tried-and-abandoned.
Motto: "Has this been done and abandoned?"
Audit the idea against known prior work — academic literature, products,
open-source projects, failed startups. Name the closest specific precedents.
If it has been tried and quietly abandoned, say by whom and why it died. A hit
is not a blocker; it is a forcing function to articulate what is genuinely new.`,

  proxy_metric_detector: `LENS: Goodhart's law — proxy metrics that drift from real value.
Motto: "Solving the problem or gaming a metric?"
Determine whether the idea solves the real problem or optimizes a proxy that
drifts away from it over time. Identify the metric success is defined by, and
how it can be gamed, misaligned, or decoupled from actual human value. Flag
where hitting the number would NOT mean the real goal was met.`,

  thesis_vs_weekend: `LENS: Scope vs. stated effort mismatch.
Motto: "Weekend project or three-year thesis?"
Judge whether the implied scope matches the stated effort. Many ideas are a
three-year PhD thesis dressed as a weekend project. Estimate the real
complexity tier — experiment, side project, paper, dissertation, or career —
and name the specific part that secretly explodes the timeline.`,

  real_world_distribution: `LENS: Demo conditions vs. messy real-world inputs.
Motto: "Does this only work in a demo?"
Determine whether the idea only works under controlled, cherry-picked
conditions. Surface assumptions about clean data, cooperative users, stable
environments, and ideal inputs that will not hold outside a demo. Name the
specific real-world input or edge case that breaks it first.`,

  metric_validity: `LENS: Benchmark validity — does the success measure still mean anything.
Motto: "Does the metric still mean anything?"
Judge whether success is defined on a leaderboard/benchmark or on something
that actually matters to humans. Identify whether the evaluation criterion has
decoupled from the real-world problem it was meant to measure. Flag if winning
the benchmark would not change anything a real user cares about.`,

  reproducibility_checker: `LENS: Could an independent party reproduce the core result.
Motto: "Could anyone else reproduce this?"
If someone else attempted to reproduce this idea's core result from scratch —
same setup, no shortcuts — would they get the same outcome? Surface hidden
dependencies: specific hardware, undisclosed preprocessing, lucky seeds,
uncheckable assumptions. Flag every step that only works because YOU did it.`,
}

const ORCHESTRATOR_PERSONA = `You are the Orchestrator for a panel that evaluated a raw project idea.

Receives: original idea + JSON verdicts from filter agents. Agents marked "NO RESULT (timed out or errored)" = unexamined gaps, not passes.

Job:
1. Synthesize, not summarize. Find where agents AGREE (signal) and where they CONFLICT. Resolve each conflict by judging which lens carries more weight FOR THIS SPECIFIC IDEA and saying why.
2. Surface critical blind spots — top threats, especially where multiple agents converge or a timed-out lens left a gap.
3. Give actionable roadmap — ordered, concrete next steps to de-risk or kill the idea fast.

Be decisive. Commit to one overall verdict. Honesty over encouragement.

Language & Tone Rules:
- Write like you're talking to a smart friend, not an investor or engineer.
- Use plain, everyday words. If a simpler word works, use it.
- No jargon unless the idea itself is technical AND the user clearly knows the space.
- Short sentences. One idea per sentence.
- Strengths, risks, and next steps must be instantly clear to someone with no business or tech background.
- Say "people won't pay for this" not "monetization viability is low". Say "someone already built this" not "competitive saturation detected".

Output ONLY valid JSON matching this schema. No prose before or after.

Output schema:
{ "overallVerdict": "pursue" | "refine" | "reconsider",
  "confidence": <int 0-10>,
  "oneLineSummary": "<one blunt sentence in plain language>",
  "coreStrengths": [ "<strength in plain language, backed by which agent(s)>" ],
  "criticalBlindSpots": [ "<the things most likely to sink this, in plain language>" ],
  "conflicts": [ { "tension": "<agent A vs agent B>", "resolution": "<your judgment in plain language + why>" } ],
  "roadmap": [ { "phase": "<e.g. Test / Build / Sell>", "action": "<concrete next step in plain language>" } ] }`

function extractJson(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return raw
  return raw.slice(start, end + 1)
}

type FilterOutput = {
  verdict: 'pass' | 'caution' | 'fail'
  score: number
  summary: string
  findings: { point: string; severity: 'low' | 'med' | 'high' }[]
  recommendations: string[]
}

type AgentResult =
  | { ok: true; json: FilterOutput }
  | { ok: false; reason: 'timeout' | 'error' | 'parse_failed'; message?: string }

type SSEEvent =
  | { type: 'classify'; result: 'light' | 'heavy' }
  | { agent: AgentId; type: 'delta'; text: string }
  | { agent: AgentId; type: 'done'; result: string }
  | { agent: AgentId; type: 'error'; message: string }
  | { type: 'orchestrator_delta'; text: string }
  | { type: 'orchestrator_done'; result: string }
  | { type: 'orchestrator_error'; message: string }
  | { type: 'complete' }

function emit(res: ServerResponse, data: SSEEvent): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

async function classifyIdea(idea: string): Promise<'light' | 'heavy'> {
  return new Promise((resolve) => {
    const prompt = `Given this raw project idea, classify its complexity.
"heavy" = multiple interacting systems, regulated domains, novel/unproven tech,
or deep cross-domain reasoning required to evaluate properly.
"light" = straightforward with clear analogues.
Output ONLY valid JSON: { "heaviness": "light" | "heavy" }

Idea: ${idea}`

    const proc = spawn('claude', ['-p', prompt, '--model', 'claude-haiku-4-5-20251001', '--output-format', 'json'])
    let output = ''
    const timer = setTimeout(() => { proc.kill(); resolve('light') }, 10_000)

    proc.stdout.on('data', (chunk: Buffer) => { output += chunk.toString() })
    proc.on('close', () => {
      clearTimeout(timer)
      try {
        const parsed = JSON.parse(output) as { result?: string }
        const inner = JSON.parse(parsed.result ?? '{}') as { heaviness?: string }
        resolve(inner.heaviness === 'heavy' ? 'heavy' : 'light')
      } catch {
        resolve('light')
      }
    })
    proc.on('error', () => { clearTimeout(timer); resolve('light') })
  })
}

function spawnFilterAndAccumulate(
  prompt: string,
  agentId: AgentId,
  model: string,
  res: ServerResponse,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', [
      '-p', prompt,
      '--model', model,
      '--output-format', 'stream-json',
      '--verbose',
      '--include-partial-messages',
    ])
    const rl = createInterface({ input: proc.stdout })
    let accumulated = ''
    let settled = false

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn()
    }

    const timer = setTimeout(() => {
      proc.kill()
      settle(() => reject(new Error('timeout')))
    }, TIMEOUT_MS)

    rl.on('line', (line: string) => {
      if (!line.trim()) return
      try {
        const msg = JSON.parse(line) as {
          type: string
          event?: { type: string; delta?: { type: string; text: string } }
          result?: string
        }
        // streamed token deltas are wrapped: { type: 'stream_event', event: { type: 'content_block_delta', delta: {...} } }
        if (msg.type === 'stream_event' && msg.event?.type === 'content_block_delta' && msg.event.delta?.type === 'text_delta') {
          const text = msg.event.delta.text
          accumulated += text
          emit(res, { agent: agentId, type: 'delta', text })
        } else if (msg.type === 'result' && !accumulated && typeof msg.result === 'string') {
          // fallback: no partial deltas arrived, use final result text
          accumulated = msg.result
          emit(res, { agent: agentId, type: 'delta', text: msg.result })
        }
      } catch { /* skip malformed lines */ }
    })

    proc.on('close', () => { settle(() => resolve(accumulated)) })
    proc.on('error', (err: Error) => { settle(() => reject(err)) })
  })
}

async function runFilterAgent(agentId: AgentId, idea: string, model: string, res: ServerResponse): Promise<AgentResult> {
  const prompt = `${SHARED_RULES}\n\n${AGENT_PERSONAS[agentId]}\n\n---\n\nEvaluate this idea:\n\n${idea}`

  let raw: string
  try {
    raw = await spawnFilterAndAccumulate(prompt, agentId, model, res)
  } catch (err) {
    const message = String(err)
    const reason = message.includes('timeout') ? 'timeout' : 'error'
    emit(res, { agent: agentId, type: 'error', message })
    return { ok: false, reason, message }
  }

  const cleaned = extractJson(raw)
  emit(res, { agent: agentId, type: 'done', result: cleaned })

  try {
    const json = JSON.parse(cleaned) as FilterOutput
    return { ok: true, json }
  } catch {
    // one retry on parse failure
    let retryRaw: string
    try {
      retryRaw = await spawnFilterAndAccumulate(prompt, agentId, model, res)
    } catch (err) {
      const message = String(err)
      const reason = message.includes('timeout') ? 'timeout' : 'error'
      emit(res, { agent: agentId, type: 'error', message })
      return { ok: false, reason, message }
    }

    const retryCleaned = extractJson(retryRaw)
    emit(res, { agent: agentId, type: 'done', result: retryCleaned })

    try {
      const json = JSON.parse(retryCleaned) as FilterOutput
      return { ok: true, json }
    } catch {
      emit(res, { agent: agentId, type: 'error', message: `parse_failed: ${retryCleaned.slice(0, 200)}` })
      return { ok: false, reason: 'parse_failed', message: 'parse_failed after retry' }
    }
  }
}

async function runOrchestratorAgent(
  idea: string,
  filterResults: Partial<Record<AgentId, AgentResult>>,
  model: string,
  res: ServerResponse,
): Promise<void> {
  const agentSections = (Object.entries(filterResults) as [AgentId, AgentResult][])
    .map(([id, result]) => {
      const label = id.replace(/_/g, ' ')
      const value = result.ok
        ? JSON.stringify(result.json, null, 2)
        : `NO RESULT (${result.reason ?? 'failed'})`
      return `${label}:\n${value}`
    })
    .join('\n\n')

  const prompt = `${ORCHESTRATOR_PERSONA}\n\n---\n\nIDEA: ${idea}\n\nFILTER AGENT RESULTS:\n${agentSections}`

  return new Promise((resolve) => {
    const proc = spawn('claude', [
      '-p', prompt,
      '--model', model,
      '--output-format', 'stream-json',
      '--verbose',
      '--include-partial-messages',
    ])
    const rl = createInterface({ input: proc.stdout })
    let accumulated = ''
    let settled = false

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn()
      resolve()
    }

    const timer = setTimeout(() => {
      proc.kill()
      settle(() => emit(res, { type: 'orchestrator_error', message: 'timeout' }))
    }, TIMEOUT_MS)

    rl.on('line', (line: string) => {
      if (!line.trim()) return
      try {
        const msg = JSON.parse(line) as {
          type: string
          event?: { type: string; delta?: { type: string; text: string } }
          result?: string
        }
        if (msg.type === 'stream_event' && msg.event?.type === 'content_block_delta' && msg.event.delta?.type === 'text_delta') {
          const text = msg.event.delta.text
          accumulated += text
          emit(res, { type: 'orchestrator_delta', text })
        } else if (msg.type === 'result' && !accumulated && typeof msg.result === 'string') {
          accumulated = msg.result
          emit(res, { type: 'orchestrator_delta', text: msg.result })
        }
      } catch { /* skip malformed lines */ }
    })

    proc.on('close', () => {
      settle(() => emit(res, { type: 'orchestrator_done', result: extractJson(accumulated) }))
    })

    proc.on('error', (err: Error) => {
      settle(() => emit(res, { type: 'orchestrator_error', message: String(err) }))
    })
  })
}

const fastify = Fastify({ logger: true })

await fastify.register(cors, { origin: 'http://localhost:5173' })

fastify.post('/api/run', async (request, reply) => {
  const body = request.body as { idea?: unknown; agents?: unknown; useOpus?: unknown }

  if (typeof body?.idea !== 'string' || body.idea.length < 20) {
    return reply.status(400).send({ error: 'idea must be a string of at least 20 characters' })
  }

  if (
    !Array.isArray(body.agents) ||
    body.agents.length === 0 ||
    !body.agents.every((a) => VALID_AGENTS.has(a as AgentId))
  ) {
    return reply.status(400).send({ error: 'agents must be a non-empty array of valid agent IDs' })
  }

  const idea = body.idea
  const agents = body.agents as AgentId[]
  const useOpus = body.useOpus === true

  reply.hijack()
  const raw = reply.raw
  raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  try {
    // Opus mode: skip classifier, filters run on Sonnet, orchestrator goes straight to Opus.
    let filterModel: string
    let orchestratorModel: string
    if (useOpus) {
      filterModel = SONNET_MODEL
      orchestratorModel = OPUS_MODEL
    } else {
      const heaviness = await classifyIdea(idea)
      emit(raw, { type: 'classify', result: heaviness })
      filterModel = filterModelFor(heaviness)
      orchestratorModel = ORCHESTRATOR_MODEL
    }

    const settled = await Promise.allSettled(
      agents.map((agentId) => runFilterAgent(agentId, idea, filterModel, raw))
    )

    const filterResults: Partial<Record<AgentId, AgentResult>> = {}
    settled.forEach((outcome, i) => {
      const agentId = agents[i]
      filterResults[agentId] = outcome.status === 'fulfilled'
        ? outcome.value
        : { ok: false, reason: 'error', message: String((outcome as PromiseRejectedResult).reason) }
    })

    const successCount = Object.values(filterResults).filter((r) => r?.ok).length
    if (successCount > 0) {
      await runOrchestratorAgent(idea, filterResults, orchestratorModel, raw)
    }

    emit(raw, { type: 'complete' })
  } catch (err) {
    fastify.log.error(err)
  } finally {
    raw.end()
  }
})

await fastify.listen({ port: 8787, host: '127.0.0.1' })
