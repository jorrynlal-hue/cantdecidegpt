import { liveComplete } from '@/lib/core/ai';
import { knowledgeView, knowledgeDigest, saveProfile } from './kb';
import type { GenerateInput, PostResult } from './types';

const has = (t: string, words: string[]) => words.some((w) => t.toLowerCase().includes(w));

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function stripEnd(s: string): string {
  return s.replace(/[\s.,;:"\u201c\u201d\u2014\u2022]+$/, '');
}

// Pull a short rule-ish line out of the knowledge digest so the built-in
// engine also honours the playbooks instead of only surfacing raw facts.
function ruleLine(digest: string): string {
  if (!digest) return '';
  const needles = ['post must', 'post begins', 'does not begin', 'first two lines', 'first line', 'one clear', 'call to action', 'scorecard', 'structure', 'rule', 'make the reader', 'hidden problem', 'cost', 'hook'];
  const lines = digest.split(/\n+/).map((s) => s.trim()).filter((s) => s.length >= 40 && s.length <= 240);
  for (const needle of needles) {
    const hit = lines.find((s) => s.toLowerCase().includes(needle) && !s.startsWith('====='));
    if (hit) return stripEnd(hit);
  }
  return '';
}

function hashtagsFrom(texts: string[]): string[] {
  const counts = new Map<string, number>();
  const skip = new Set(
    (
      'post,posted,like,share,comment,comments,think,want,will,that,with,this,your,have,from,are,you,the,and,for,' +
      'not,its,our,their,them,can,would,could,about,more,most,just,over,today,work,works,make,makes,one,day,way'
    ).split(','),
  );
  for (const t of texts) {
    for (const m of t.toLowerCase().match(/[a-z]{3,}/g) ?? []) {
      if (skip.has(m)) continue;
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);
  const tags: string[] = [];
  for (const w of ranked) {
    if (tags.length >= 3) break;
    tags.push(w[0].toUpperCase() + w.slice(1));
  }
  const pool = ['AI', 'Workflow', 'Productivity', 'Founders', 'SmallBusiness', 'Context', 'Automation'];
  for (const p of pool) {
    if (tags.length >= 4) break;
    if (!tags.includes(p)) tags.push(p);
  }
  return tags.slice(0, 4).map((t) => `#${t.replace(/\s+/g, '')}`);
}

function fallbackPost(input: GenerateInput, facts: string[], knowledge: string): string {
  const brief = input.brief.trim();
  const sents = sentences(brief);
  const contextTheme =
    has(brief, ['context', 'ai', 'workflow', 'tool', 'automate', 'connect', 'integrat', 'system', 'software']) || facts.length > 0;
  const hook =
    sents[0] && sents[0].length <= 200
      ? sents[0]
      : 'If your work lives across several tools but you still connect them by hand, this may be about you.';
  const reframe = contextTheme
    ? 'The problem is rarely the tools themselves. It is that no single system sees the whole situation.'
    : 'The problem is rarely the tooling. It is the hidden coordination between the parts.';
  const consequence = 'That quietly turns work into manual coordination — time spent rebuilding context instead of doing the work that matters.';
  const desire = contextTheme
    ? 'Imagine starting your day already knowing what needs your attention, instead of searching for it.'
    : 'Imagine the repetitive part almost gone, so you spend your energy only where it actually moves things forward.';
  const explain = sents.length > 1 ? stripEnd(sents[1]).slice(0, 200) : '';
  const guide = ruleLine(knowledge);
  const proof = guide
    ? `One rule the playbook keeps returning to: ${guide}.`
    : facts[0]
      ? `Here is one finding our own notes keep repeating: ${stripEnd(facts[0])}.`
      : 'The effect shows up early: less reconstructing, more doing.';
  const lines: string[] = [hook, '', reframe, '', consequence, '', desire];
  if (explain) lines.push('', explain);
  lines.push(
    '',
    proof,
    '',
    'This is most useful for people whose work is spread across several tools and systems. It is not a magic button for processes that are not defined yet.',
    '',
    'If part of your week looks like this, reply "HOW" and I will walk you through one real example.',
    '',
    hashtagsFrom([brief, ...facts]).join(' '),
  );
  return lines.join('\n');
}

function fallbackHooks(input: GenerateInput): string {
  const brief = input.brief.trim();
  const contextTheme = has(brief, ['context', 'ai', 'workflow', 'tool', 'connect', 'automate', 'system']);
  if (contextTheme) {
    return [
      '1. Your AI is not the problem. It simply does not know enough about what is happening around it.',
      '2. How many times today did you move information from one tool into another?',
      '3. You do not need another tool. You need the tools you already use to work together.',
      '4. Nobody wakes up wanting more software. They want the coordination to quietly disappear.',
      '5. The most expensive part of your workflow is not the software. It never was.',
    ].join('\n\n');
  }
  return [
    '1. The best thing this can do for you is quietly disappear into the background.',
    '2. Nobody wakes up wanting more tools — they want the work to stop eating their week.',
    '3. What if the repetitive part was already handled before you started your day?',
    '4. We stopped doing this the slow way. That changed everything.',
    '5. If your week looks like this, this post was written for you.',
  ].join('\n\n');
}

function livePrompt(input: GenerateInput, knowledge: string, facts: string[]): string {
  const parts = [
    'Write ONE LinkedIn post in English for the product described in the brief below.',
    'Follow the owner\u2019s text-only sales formula, in this order: 1) identification of the reader\u2019s situation, 2) reframe ("The problem is not X. It is Y."), 3) consequence (the hidden cost), 4) desired future (imagine...), 5) mechanism (how the solution works), 6) proof, 7) qualification (who it helps / who it is not for), 8) one CTA.',
    'Length: 15-20 short lines, about 250 words, with blank lines between blocks and bullets as \u2022.',
    'Truth rules: never invent numbers, testimonials or results. If the brief and knowledge base do not support a claim, write a general truthful line instead.',
    'Avoid hype words (innovative, revolutionary, next-generation, seamless, world-class). Use short concrete sentences, interrupt the expected pattern in the first line, and include one honest question or reflection.',
    'Close with a small set of relevant hashtags.',
  ];
  const knowledgeBlock =
    knowledge && knowledge.length > 0
      ? `\n\nOWNER\u2019S KNOWLEDGE BASE (read it in full before writing; use its rules, structure and exact phrasings where they apply):\n${knowledge}`
      : '';
  return (
    parts.join('\n') +
    `\n\nPRODUCT BRIEF (typed by the owner):\n${input.brief.trim() || '(not said yet — stay general and truthful)'}` +
    `\n\nDetected themes from the documents (rephrase, never repeat verbatim):\n${facts.length ? facts.join('\n') : '(none)'}` +
    knowledgeBlock
  );
}

export async function generatePost(input: GenerateInput): Promise<PostResult> {
  saveProfile({ brief: input.brief });
  const kb = await knowledgeView();
  const knowledge = await knowledgeDigest();
  let text = '';
  let baseline = true;
  try {
    text = await liveComplete(
      'content',
      'You are LOCAL POST MAKER, a LinkedIn post generator trained on the owner\u2019s Sales Mastery documents and product-post playbooks. You write like an honest, experienced builder: clear, calm, human, zero hype. The owner hands you one short instructive paragraph about their product; you turn it into a post that scores the sale: it makes the reader recognize their situation in the first two lines, names the hidden problem, shows the cost, introduces the product as the logical answer, demonstrates it, and closes with one clear call to action. Follow the sales formula while staying completely truthful.',
      livePrompt(input, knowledge, kb.facts),
      { temperature: 0.8 },
    );
    baseline = false;
  } catch {
    text = fallbackPost(input, kb.facts, knowledge);
  }
  const clean = text.replace(/\n{3,}/g, '\n\n').trim();
  return {
    text: clean,
    provider: baseline ? 'built-in knowledge engine' : 'AI (live)',
    isBaseline: baseline,
    words: clean.split(/\s+/).length,
    chars: clean.length,
  };
}

export async function generateHooksVariant(input: GenerateInput): Promise<PostResult> {
  const knowledge = (await knowledgeDigest()).slice(0, 6000);
  let text = '';
  let baseline = true;
  try {
    text = await liveComplete(
      'content',
      'You are LOCAL POST MAKER. Write opening hook lines for LinkedIn posts.',
      `Give me 5 distinct opening hook lines for a LinkedIn post about the product described below. Vary the mechanisms: recognition, contrast, curiosity, direct question, direct promise or demonstration. One line each, numbered 1-5. No hashtags.\n\nPRODUCT BRIEF:\n${input.brief}\n\nReference knowledge:\n${knowledge || '(none)'}`,
      { temperature: 0.85 },
    );
    baseline = false;
  } catch {
    text = fallbackHooks(input);
  }
  return {
    text: text.trim(),
    provider: baseline ? 'built-in knowledge engine' : 'AI (live)',
    isBaseline: baseline,
    words: text.split(/\s+/).length,
    chars: text.length,
  };
}