# Agent Backlog

Optional filter agents for future implementation. Same JSON output schema as existing agents. Each is a standalone lens — toggle in UI, skill in `skills/`.

Priority: **10 = most valuable, 0 = lowest urgency.**

---

## The Receipt (`hidden-cost-finder`)

Surfaces all costs people forget: time, emotional labor, maintenance, learning curve, opportunity cost. Kills ideas that look cheap until you actually start.

**Priority: 9**

---

## No Take-Backs (`reversibility-checker`)

How easy is it to undo or pivot? Flags lock-ins — financial, social, technical — before you're committed. Rates each lock-in by severity and when it kicks in.

**Priority: 8**

---

## Week Four (`boredom-predictor`)

Will interest sustain past week 3? Identifies what historically kills enthusiasm for this type of idea. Flags ideas that are exciting to start but miserable to maintain.

**Priority: 7**

---

## The Intern (`beginner-blindspot-scanner`)

What would a complete newcomer get wrong first? Surfaces hidden expertise assumptions baked into the idea. Flags where "just do X" actually requires years of background.

**Priority: 7**

---

## The Napkin Test (`minimum-viable-try`)

What is the smallest possible test of this idea before any real commitment? Outputs one concrete experiment doable in under a week with near-zero cost.

**Priority: 9**

---

## Hit By A Bus (`key-person-risk`)

If the one person holding this together becomes unavailable — quits, burns out, gets sick — what breaks and how fast? Flags ideas with a single point of human failure. Asks: who else could pick this up tomorrow with no handoff? If the answer is "no one," that's the finding.

**Priority: 8**

---

## Already On ArXiv (`prior-art-checker`)

Has this idea been published, tried, and quietly abandoned? Audits the idea against known prior work in academic literature and industry. A finding here is not a blocker — it is a forcing function to articulate what is genuinely new.

**Priority: 8**

---

## Goodhart's Ghost (`proxy-metric-detector`)

Is the idea solving the real problem or optimizing a proxy that drifts away from it over time? Flags ideas where success is defined by a metric that can be gamed, misaligned, or decoupled from actual human value.

**Priority: 9**

---

## Scope Creep (`thesis-vs-weekend`)

Is this a three-year PhD thesis dressed as a weekend project? Flags ideas where the implied scope is wildly inconsistent with the stated effort. Outputs a realistic complexity tier: experiment, paper, dissertation, or career.

**Priority: 8**

---

## The Demo Effect (`real-world-distribution`)

Does this idea only work under controlled, cherry-picked conditions? Flags assumptions about clean data, cooperative users, stable environments, and ideal inputs that will not hold outside a demo setting.

**Priority: 9**

---

## The Benchmark Trap (`metric-validity`)

Is success defined on a leaderboard or on something that actually matters to humans? Flags ideas where the evaluation criterion is a proxy benchmark that has decoupled from the real-world problem it was designed to measure.

**Priority: 8**

---

## The Replication Crisis (`reproducibility-checker`)

If someone else attempted to reproduce this idea's core result from scratch — same setup, no shortcuts — would they get the same outcome? Flags hidden dependencies on specific hardware, undisclosed data preprocessing, or uncheckable assumptions.

**Priority: 7**
