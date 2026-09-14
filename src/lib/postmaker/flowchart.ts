import type { FlowGraph, FlowNode } from './types';

const COLS = 8;
const COL_W = 190;
const GAP = 46;
export const VIEW_W = COLS * (COL_W + GAP) + GAP;
export const NODE_H = 120;
export const ROW_H = 138;
export const COL_TOP = 128;
export const MAX_ROWS = 3;

export const FlowCaptions = [
  'WHO & THE REALITY',
  'ATTENTION & RECOGNITION',
  'PROBLEM, FRAME & COST',
  'MEANING & DESIRE',
  'BELIEF & TRUST',
  'VALUE & OFFER',
  'ACTION & CONVERSION',
  'DISTRIBUTION & THE LOOP',
];

interface Row {
  label: string;
  q: string;
  detail: string;
  kind: string;
  col: number;
  row: number;
}

// Column-major order (down each column, then on to the next) so the arrow
// chain reads left to right, column by column.
const ROWS: Row[] = [
  // ---- col 0: WHO & THE REALITY ----
  {
    label: 'WHO',
    q: 'Who exactly is reading?',
    detail: 'Never "everyone". A specific person: a founder juggling email, chat, CRM, docs and AI tools. Write the segment in one sentence and exclude at least one adjacent segment.',
    kind: 'person',
    col: 0,
    row: 0,
  },
  {
    label: 'WHAT IS ACTUALLY WRONG',
    q: 'What is happening right now?',
    detail: 'Situation = what they do today. Problem = what is really wrong. Desire = what they want. Belief = what they currently think. Objection = why they might reject. Alternative = what happens without you.',
    kind: 'reality',
    col: 0,
    row: 1,
  },
  {
    label: 'ONE DESIRED ACTION',
    q: 'What do you want them to do?',
    detail: 'Read, reply, click, book or buy. Do not write a single word until WHO → SITUATION → PROBLEM → DESIRE → BELIEF → OBJECTION → ALTERNATIVE → ACTION are all clear.',
    kind: 'person',
    col: 0,
    row: 2,
  },
  // ---- col 1: ATTENTION & RECOGNITION ----
  {
    label: 'HOOK MASTERY',
    q: 'Why did they stop?',
    detail: 'Earn the next second with 7 honest devices: pattern interruption, contradiction, specific recognition, curiosity, stakes, unexpected comparison, direct question. Make the brain ask the question you can answer.',
    kind: 'attention',
    col: 1,
    row: 0,
  },
  {
    label: 'ATTENTION PAYOFF RULE',
    q: 'Did you create clickbait debt?',
    detail: 'Never create curiosity your next lines cannot satisfy. A strong hook demands a strong explanation. "This will change everything" — then nothing — is dead trust.',
    kind: 'attention',
    col: 1,
    row: 1,
  },
  {
    label: 'RECOGNITION FORMULA',
    q: 'Do they think: this is about me?',
    detail: 'WHEN [specific situation] → YOU EXPERIENCE [specific behavior]. "Businesses struggle" is weak. "You open your laptop and spend 20 minutes figuring out what changed overnight" creates a mental picture.',
    kind: 'recognition',
    col: 1,
    row: 2,
  },
  // ---- col 2: PROBLEM, FRAME & COST ----
  {
    label: 'COST OF THE PROBLEM',
    q: 'Why does this matter to me?',
    detail: 'Relevance turns "that is me" into "and this matters". Connect the situation to the consequence: "You switch between apps, so part of your day is spent finding context instead of doing the work."',
    kind: 'relevance',
    col: 2,
    row: 0,
  },
  {
    label: 'TENSION & PAIN LADDER',
    q: 'Where is the gap?',
    detail: 'Tension = distance between current state and desired state. Dig pain deeper: problem → friction → consequence → economic → emotional → performance → strategic → future. Stop where evidence stops — never exaggerate pain.',
    kind: 'tension',
    col: 2,
    row: 1,
  },
  {
    label: 'FRAME & REFRAME',
    q: 'What is the problem really?',
    detail: '"You think the problem is X. The deeper problem is Y." Test the reframe first: is it true, useful, explainable, provable? Reframing is discovering a more useful interpretation — not lying.',
    kind: 'problem',
    col: 2,
    row: 2,
  },
  // ---- col 3: MEANING & DESIRE ----
  {
    label: 'MEANING',
    q: 'Why does this explain everything?',
    detail: '"Every tool only sees its own data → no tool understands the whole situation → the human becomes the context layer." The last sentence is what creates meaning.',
    kind: 'meaning',
    col: 3,
    row: 0,
  },
  {
    label: 'DESIRE LADDER',
    q: 'What do they actually buy?',
    detail: 'Feature → function → outcome → consequence → life impact → identity. People buy the change: control, certainty, speed, status, freedom, safety, confidence, progress, belonging. Sell the outcome, not the feature.',
    kind: 'desire',
    col: 3,
    row: 1,
  },
  {
    label: 'THE 10 MAJOR FRAMES',
    q: 'Which interpretation wins?',
    detail: 'Problem, cost, opportunity, contrast, identity, status, mechanism, enemy (a process, not a person), future, simplicity. Same reality, different meaning, different perceived value.',
    kind: 'framing',
    col: 3,
    row: 2,
  },
  // ---- col 4: BELIEF & TRUST ----
  {
    label: 'BELIEF STACK',
    q: 'Can this actually happen?',
    detail: 'Claim → Explanation → Mechanism → Demonstration → Evidence → Proof. That is how "sounds good" becomes "I believe it." Stop selling harder; start proving.',
    kind: 'belief',
    col: 4,
    row: 0,
  },
  {
    label: 'TRUST SIGNALS',
    q: 'Why trust you with money?',
    detail: 'Competence ("they know what they are doing"), honesty ("they show weaknesses"), consistency, evidence, transparency, predictability ("I know what happens after I buy"). Trust is accumulated through consistency.',
    kind: 'trust',
    col: 4,
    row: 1,
  },
  {
    label: 'TRUST-KILLERS',
    q: 'What destroys trust instantly?',
    detail: 'Fake testimonials, fake numbers, fake scarcity, fake urgency, impossible promises, unguaranteeable "guarantees", vague superlatives, pretending everyone gets the same result, hiding conditions, manufactured authority. One lie beats ten clever sentences.',
    kind: 'trust',
    col: 4,
    row: 2,
  },
  // ---- col 5: VALUE & OFFER ----
  {
    label: 'VALUE EQUATION',
    q: 'Is it worth it?',
    detail: 'Perceived value = desired outcome × belief it happens × importance ÷ (time + effort + risk + price). They want it but do not buy: belief, importance, effort or price is wrong. Diagnose — do not reflexively discount.',
    kind: 'value',
    col: 5,
    row: 0,
  },
  {
    label: 'OFFER FORMULA',
    q: 'What is the full package?',
    detail: 'For [specific person] who wants [specific outcome], we provide [mechanism] so they can [result], without [major frustration]. An offer answers what, for whom, outcome, how, what is included, price, risk, and what happens next.',
    kind: 'offer',
    col: 5,
    row: 1,
  },
  {
    label: 'PRICE, RISK & OBJECTIONS',
    q: 'What is the objection really saying?',
    detail: '"Too expensive" may mean low value, a cheaper alternative, no budget or no trust — diagnose first. Answer "I need to think", "I already use X", "can I trust you" with proof, scope and transparent terms. Defuse only when walking away is the honest answer.',
    kind: 'offer',
    col: 5,
    row: 2,
  },
  // ---- col 6: ACTION & CONVERSION ----
  {
    label: 'CTA BY READINESS',
    q: 'What do they do next?',
    detail: 'Match the CTA to readiness: low commitment "See how it works" → curiosity "Explore the system" → problem-aware "See it for your workflow" → high intent "Start now" → sales conversation "Let us map your workflow". One natural step; no sudden commands.',
    kind: 'action',
    col: 6,
    row: 0,
  },
  {
    label: '8-LINE SALES FORMULA',
    q: 'What is the full post structure?',
    detail: '1 Identification → 2 Reframe → 3 Consequence → 4 Desired future → 5 Mechanism → 6 Proof → 7 Qualification (who it is and is NOT for) → 8 CTA. One psychological job per line. Works for a post, email or landing opening.',
    kind: 'action',
    col: 6,
    row: 1,
  },
  {
    label: '5-SECOND BUYER TEST',
    q: 'Would they buy in five seconds?',
    detail: 'Is this for me? What do I get? Why this? Can I see it working? Can I trust it? What do I do next? Any fail = replace with a specific audience, plain outcome, visible differentiator, demonstration, proof and a single CTA.',
    kind: 'action',
    col: 6,
    row: 2,
  },
  // ---- col 7: DISTRIBUTION & THE LOOP ----
  {
    label: '20-POST MACHINE',
    q: 'What do I publish?',
    detail: '4 attention posts (strangers stop) · 4 problem posts (readers explain the problem to themselves) · 4 engagement posts (real conversation) · 3 demonstration · 3 authority · 2 direct traffic. You are building a portfolio of proof — not hoping one post explodes.',
    kind: 'distribution',
    col: 7,
    row: 0,
  },
  {
    label: 'METRIC CHAIN',
    q: 'How do I know it works?',
    detail: 'Impressions → attention → engaged readers → profile visits → landing visits → interest → signup/demo → activation → purchase → retention → referral. Measure conversion between stages, not raw totals. Change the biggest bottleneck, one variable at a time.',
    kind: 'distribution',
    col: 7,
    row: 1,
  },
  {
    label: 'DAILY 60-MIN LOOP',
    q: 'How does it compound?',
    detail: '10 min collect real customer language · 15 min reverse-engineer one strong message · 15 min write variations · 10 min improve proof or offer · 10 min record a test result or lesson. Weekly: reuse one winning insight in a post, email, landing, sales call and onboarding.',
    kind: 'distribution',
    col: 7,
    row: 2,
  },
];

export function buildFlowGraph(): FlowGraph {
  const nodes: FlowNode[] = ROWS.map((r, i) => ({
    id: `n${i}`,
    label: r.label,
    q: r.q,
    detail: r.detail.slice(0, 400),
    kind: r.kind,
    x: GAP + r.col * (COL_W + GAP),
    y: COL_TOP + r.row * ROW_H,
  }));
  const edges: { from: string; to: string }[] = [];
  for (let i = 1; i < nodes.length; i++) edges.push({ from: nodes[i - 1].id, to: nodes[i].id });
  return { nodes, edges, title: FlowCaptions.join(' · ') };
}