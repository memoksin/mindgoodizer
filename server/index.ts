import Fastify from 'fastify'
import cors from '@fastify/cors'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import type { ServerResponse } from 'node:http'

const TIMEOUT_MS = 90_000

type AgentId =
  | 'devils_advocate'
  | 'reality_checker'
  | 'monetizer'
  | 'pragmatist'
  | 'grandma_test'
  | 'copycat_detector'
  | 'futurist'

const VALID_AGENTS = new Set<AgentId>([
  'devils_advocate',
  'reality_checker',
  'monetizer',
  'pragmatist',
  'grandma_test',
  'copycat_detector',
  'futurist',
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
}

type SSEEvent =
  | { type: 'classify'; result: 'light' | 'heavy' }
  | { agent: AgentId; type: 'delta'; text: string }
  | { agent: AgentId; type: 'done'; result: string }
  | { agent: AgentId; type: 'error'; message: string }
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

    const proc = spawn('claude', ['-p', prompt, '--output-format', 'json'])
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

async function runFilterAgent(agentId: AgentId, idea: string, res: ServerResponse): Promise<void> {
  const prompt = `${SHARED_RULES}\n\n${AGENT_PERSONAS[agentId]}\n\n---\n\nEvaluate this idea:\n\n${idea}`

  return new Promise((resolve) => {
    const proc = spawn('claude', ['-p', prompt, '--output-format', 'stream-json'])
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
      settle(() => emit(res, { agent: agentId, type: 'error', message: 'timeout' }))
    }, TIMEOUT_MS)

    rl.on('line', (line: string) => {
      if (!line.trim()) return
      try {
        const event = JSON.parse(line) as {
          type: string
          delta?: { type: string; text: string }
        }
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          accumulated += event.delta.text
          emit(res, { agent: agentId, type: 'delta', text: event.delta.text })
        }
      } catch { /* skip malformed lines */ }
    })

    proc.on('close', () => {
      settle(() => emit(res, { agent: agentId, type: 'done', result: accumulated }))
    })

    proc.on('error', (err: Error) => {
      settle(() => emit(res, { agent: agentId, type: 'error', message: String(err) }))
    })
  })
}

const fastify = Fastify({ logger: true })

await fastify.register(cors, { origin: 'http://localhost:5173' })

fastify.post('/api/run', async (request, reply) => {
  const body = request.body as { idea?: unknown; agents?: unknown }

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

  reply.hijack()
  const raw = reply.raw
  raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  try {
    const heaviness = await classifyIdea(idea)
    emit(raw, { type: 'classify', result: heaviness })

    await Promise.allSettled(agents.map((agentId) => runFilterAgent(agentId, idea, raw)))

    emit(raw, { type: 'complete' })
  } catch (err) {
    fastify.log.error(err)
  } finally {
    raw.end()
  }
})

await fastify.listen({ port: 8787, host: '127.0.0.1' })
