import { DB, ProviderConfig } from './types';
import { now } from './db';
import { liveModelFor, liveComplete, liveImage, liveSpeech, liveTranscribe, defaultModelFor } from './ai';
import { getOpenAI, getProviderSecrets, isProviderName } from './secrets';
import { configuredTextProviders, isTextKind } from './router';

// Provider abstraction. Every AI/generation/communication capability is routed
// through a ProviderConfig. The built-in "baseline" provider is a clearly-labeled
// deterministic simulator: it never fabricates external side effects and never
// claims a real API call was made. When a live provider is configured (env or
// in-app API key), real API calls are made and results honestly labeled as live.

export type ProviderKind = ProviderConfig['kind'];

export const BASELINE = 'baseline';

export interface ProviderInfo {
  kind: ProviderKind;
  id: string;
  provider: string;
  isBaseline: boolean;
  enabled: boolean;
  label: string;
  status: 'ready' | 'needs_setup' | 'disabled';
}

export function listProviderKinds(): ProviderKind[] {
  return ['chat', 'content', 'image', 'video', 'voice', 'transcription', 'speech', 'code'];
}

export function providerKindLabel(kind: ProviderKind): string {
  const map: Record<ProviderKind, string> = {
    chat: 'AI chat',
    content: 'Content',
    image: 'Image',
    video: 'Video',
    voice: 'Voice',
    transcription: 'Transcription',
    speech: 'Speech',
    code: 'Code',
  };
  return map[kind];
}

export function getProviderConfig(db: DB, workspaceId: string, kind: ProviderKind): ProviderConfig | undefined {
  return db.providerConfigs.find((p) => p.workspaceId === workspaceId && p.kind === kind);
}

export function listProviderConfigs(db: DB, workspaceId: string): ProviderConfig[] {
  return db.providerConfigs.filter((p) => p.workspaceId === workspaceId);
}

export function providerNameLabel(provider: string): string {
  const map: Record<string, string> = {
    baseline: 'Baseline (built-in simulator)',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google Gemini',
    groq: 'Groq',
    mistral: 'Mistral',
  };
  return map[provider] ?? provider;
}

export function providerInfo(cfg: ProviderConfig | undefined, kind: ProviderKind): ProviderInfo {
  if (!cfg) {
    return { kind, id: `prv-${kind}`, provider: BASELINE, isBaseline: true, enabled: true, label: providerKindLabel(kind) + ' (baseline simulator)', status: 'ready' };
  }
  const isBaseline = cfg.provider === BASELINE;
  const keyReady = isProviderName(cfg.provider) ? !!getProviderSecrets(cfg.provider).apiKey : false;
  return {
    kind,
    id: cfg.id,
    provider: cfg.provider,
    isBaseline,
    enabled: cfg.enabled,
    label: isBaseline
      ? `${providerKindLabel(kind)} (baseline simulator)`
      : `${providerKindLabel(kind)} via ${providerNameLabel(cfg.provider)}${keyReady ? '' : ' — add API key'}`,
    status: !cfg.enabled ? 'disabled' : isBaseline ? 'ready' : keyReady ? 'ready' : 'needs_setup',
  };
}

export interface ProviderOutcome {
  provider: string;
  isBaseline: boolean;
  simulated: boolean;
  at: string;
  output: string;
}

// Deterministic baseline execution. "output" is derived from the prompt so the
// result is reproducible and clearly simulated.
export function baselineOutput(kind: ProviderKind, prompt: string, params: Record<string, unknown> = {}): string {
  const seed = prompt.trim().slice(0, 80);
  switch (kind) {
    case 'content':
      return `[baseline content draft, simulated] Based on "${seed}"…\n\nThis is a clearly-labeled built-in simulation so you can see how content generation flows through the platform without relying on an external provider. Connect a real provider to replace this output.`;
    case 'image':
      return `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI3NjgiIGhlaWdodD0iNTEyIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExMjE4Ii8+PHRleHQgeD0iMjQiIHk9IjQ4IiBmaWxsPSIjYThhOGIwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE4Ij5CQVNFTElORSBJTUFHRSBTSU1VTEFUSU9OPC90ZXh0Pjx0ZXh0IHg9IjI0IiB5PSI3NiIgZmlsbD0iIzc3NzhhYyIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNCI+IiBwcm9tcHQuc2xpY2UoMCwgNjApICk8L3RleHQ+PC9zdmc+`;
    case 'video':
      return `[baseline video storyboard, simulated] Prompt: "${seed}". Scene 1: establishing shot. Scene 2: subject action. Scene 3: payoff. No real video was rendered — this is a built-in simulation so the pipeline is testable end to end.`;
    case 'voice':
      return `[baseline voice synthesis, simulated] A spoken narration for: "${seed}". No audio was actually generated — built-in simulation.`;
    case 'transcription':
      return `[baseline transcription, simulated] You asked to transcribe audio described as: "${seed}". No real audio was processed — built-in simulation.`;
    case 'speech':
      return `[baseline TTS, simulated] A text-to-speech rendition of: "${seed}". No audio was generated — built-in simulation.`;
    case 'code':
      return `// baseline code generation (simulated)\n// prompt: ${JSON.stringify(seed)}\nexport async function generatedSolution() {\n  // Replace this with a real provider. This is a clearly-labeled simulation.\n  return { ok: true, note: 'baseline simulation' };\n}\n`;
    case 'chat':
    default:
      return `[baseline assistant, simulated] You asked: "${seed}". This is the built-in deterministic simulator. It shows a realistic reply shape so you can verify the AI pipeline, tool use, and persistence. Connect a real LLM provider to get real intelligence.`;
  }
}

function baselineOutcome(kind: ProviderKind, prompt: string, params: Record<string, unknown> = {}): ProviderOutcome {
  return { provider: BASELINE, isBaseline: true, simulated: true, at: now(), output: baselineOutput(kind, prompt, params) };
}

const LIVE_SYSTEMS: Record<string, string> = {
  chat: 'You are NexusAI, a capable assistant embedded in a connected work platform. Answer helpfully and honestly.',
  content: 'You are a skilled content writer. Produce well-structured, ready-to-use content in Markdown.',
  code: 'You are an expert software engineer. Return production-quality code in Markdown fenced blocks, with brief explanations.',
  voice: 'You process spoken or pasted transcript text. Return a clear, useful result in Markdown.',
  speech: 'Return the exact text to be spoken aloud.',
};

export function runProvider(db: DB, workspaceId: string, kind: ProviderKind, prompt: string, params: Record<string, unknown> = {}): ProviderOutcome {
  return baselineOutcome(kind, prompt, params);
}

// Live path for user-facing AI surfaces. Real HTTP calls; any failure (missing
// key, network, rejected request) falls back to the honest baseline so surfaces
// never present fake "success".
export async function runProviderLive(db: DB, workspaceId: string, kind: ProviderKind, prompt: string, params: Record<string, unknown> = {}): Promise<ProviderOutcome> {
  const cfg = getProviderConfig(db, workspaceId, kind);
  const spec = liveModelFor(kind, cfg?.provider, cfg?.enabled);
  if (!spec) return baselineOutcome(kind, prompt, params);
  try {
    let output: string;
    switch (kind) {
      case 'image':
        output = await liveImage(prompt, params);
        break;
      case 'speech':
        output = await liveSpeech(prompt, params);
        break;
      case 'transcription':
        if (params.audioB64) output = await liveTranscribe(String(params.audioB64), String(params.mime ?? 'audio/mpeg'));
        else throw new Error('NO_AUDIO');
        break;
      case 'video':
        throw new Error('VIDEO_NOT_LIVE');
      default: {
        const system = typeof params.system === 'string' && params.system.trim() ? params.system : (LIVE_SYSTEMS[kind] ?? LIVE_SYSTEMS.chat);
        output = await liveComplete(kind, system, prompt, params);
      }
    }
    return { provider: spec.provider, isBaseline: false, simulated: false, at: now(), output };
  } catch {
    return baselineOutcome(kind, prompt, params);
  }
}

export interface LiveStatus {
  kind: ProviderKind;
  configured: boolean; // providerConfig row exists
  provider: string; // shown provider (config or openai default)
  usesBaseline: boolean;
  keyConfigured: boolean;
  model: string;
}

export function listLiveStatus(db: DB, workspaceId: string): LiveStatus[] {
  const textProviders = configuredTextProviders();
  const hasTextKey = textProviders.length > 0;
  const hasOpenAIKey = !!getOpenAI().apiKey;
  return listProviderKinds().map((kind) => {
    const cfg = getProviderConfig(db, workspaceId, kind);
    const explicit = cfg && cfg.provider !== BASELINE;
    const textKind = isTextKind(kind);
    const provider = explicit && isProviderName(cfg!.provider)
      ? cfg!.provider
      : textKind
        ? (hasTextKey ? textProviders[0] : 'openai')
        : 'openai';
    const cfgLookup = explicit && isProviderName(cfg!.provider)
      ? cfg!.provider
      : textKind && hasTextKey
        ? textProviders[0]
        : 'openai';
    const specPossible = liveModelFor(kind, textKind ? (hasTextKey ? cfgLookup : 'openai') : cfgLookup, explicit ? cfg!.enabled : true);
    return {
      kind,
      configured: !!cfg,
      provider,
      usesBaseline: !specPossible,
      keyConfigured: textKind ? hasTextKey : hasOpenAIKey,
      model: specPossible?.model ?? defaultModelFor(kind),
    };
  });
}

// Email delivery through the configured email provider (simulated, honest).
export function deliverEmail(db: DB, workspaceId: string, to: string, subject: string, body: string): ProviderOutcome {
  const int = db.integrations.find((i) => i.workspaceId === workspaceId && i.category === 'email' && i.connected);
  const via = int ? int.name : 'baseline email relay';
  return {
    provider: via,
    isBaseline: !int,
    simulated: true,
    at: now(),
    output: `Queued to ${via} (simulated): "${subject}" → ${to}`,
  };
}

export function publishSocial(db: DB, workspaceId: string, platform: string, text: string): ProviderOutcome {
  const int = db.integrations.find((i) => i.workspaceId === workspaceId && i.category === 'social' && i.connected);
  const via = int ? int.name : 'baseline social relay';
  return {
    provider: via,
    isBaseline: !int,
    simulated: true,
    at: now(),
    output: `Published via ${via} (simulated) to ${platform}: "${text.slice(0, 60)}"`,
  };
}