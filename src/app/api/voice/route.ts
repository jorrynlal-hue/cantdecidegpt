import { NextResponse } from "next/server";
import { requireSession } from "@/lib/core/api/helpers";
import { runProviderLive } from "@/lib/core/providers";
import { liveTranscribe, liveModelFor } from "@/lib/core/ai";

const SYSTEMS: Record<string, string> = {
  transcribe:
    "You are a transcription editor. Clean up the raw transcript text: fix punctuation, capitalization, and obvious filler, and format it as readable paragraphs in Markdown. Do not change the meaning or add content.",
  translate:
    "You are a professional translator working with transcribed audio. Translate the transcript into the requested target language, preserving meaning and formatting. Return only the translation.",
  summarize:
    "You are a meeting-note summarizer. Summarize the transcript faithfully: main topics, decisions, action items, and open questions, as a Markdown report. Do not invent details.",
};

export async function POST(request: Request) {
  try {
    const { db, ctx } = await requireSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const audioB64 = body.audioBase64 ? String(body.audioBase64) : "";
    const audioText = String(body.audioText ?? "");
    const action = String(body.action ?? "transcribe");
    const target = String(body.target ?? "English");

    // Real speech-to-text when an audio recording is supplied.
    if (audioB64) {
      const cfg = db.providerConfigs.find((p) => p.workspaceId === ctx.workspaceId && p.kind === "transcription");
      const spec = liveModelFor("transcription", cfg?.provider, cfg?.enabled);
      if (!spec) {
        return NextResponse.json({
          success: true,
          data: "[baseline transcription, simulated] No transcription provider configured — upload or add an API key to transcribe real audio. No real audio was processed.",
        });
      }
      try {
        const text = await liveTranscribe(audioB64, String(body.mime ?? "audio/mpeg"));
        return NextResponse.json({ success: true, data: text });
      } catch (e) {
        return NextResponse.json({
          success: true,
          data: `[transcription failed, honest fallback] ${(e as Error).message}`,
        });
      }
    }

    if (!audioText.trim()) {
      return NextResponse.json({ success: false, error: "Provide audio text or an audio recording." }, { status: 400 });
    }

    const system = action === "translate" ? `${SYSTEMS.translate} Target language: ${target}.` : (SYSTEMS[action] ?? SYSTEMS.transcribe);
    const outcome = await runProviderLive(db, ctx.workspaceId, "content", audioText, { system, temperature: 0.3 });
    return NextResponse.json({ success: true, data: outcome.output });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}