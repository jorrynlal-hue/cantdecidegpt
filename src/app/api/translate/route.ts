import { NextResponse } from "next/server";
import { requireSession } from "@/lib/core/api/helpers";
import { runProviderLive } from "@/lib/core/providers";

const LANGUAGE_NAMES: Record<string, string> = {
  auto: "the source language (detect automatically)",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
};

export async function POST(request: Request) {
  try {
    const { db, ctx } = await requireSession();
    const { text, from, to } = await request.json();
    if (!String(text ?? "").trim()) {
      return NextResponse.json({ success: false, error: "Text is required." }, { status: 400 });
    }
    const src = LANGUAGE_NAMES[String(from ?? "auto")] ?? LANGUAGE_NAMES.auto;
    const dest = LANGUAGE_NAMES[String(to ?? "en")] ?? "English";
    const system = `You are a professional translator. Translate the text from ${src} into ${dest}. Preserve meaning, tone, and formatting (Markdown). Return only the translation.`;
    const outcome = await runProviderLive(db, ctx.workspaceId, "content", String(text), { system, temperature: 0.3 });
    return NextResponse.json({ success: true, data: outcome.output });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}