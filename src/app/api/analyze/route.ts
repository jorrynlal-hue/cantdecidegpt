import { NextResponse } from "next/server";
import { requireSession } from "@/lib/core/api/helpers";
import { runProviderLive } from "@/lib/core/providers";

const SYSTEMS: Record<string, string> = {
  sentiment:
    "You are an NLP analyst. Perform a sentiment analysis of the text. Use the text itself as the evidence — do not invent unrelated details. Return a Markdown report with an overall classification, a numeric score (0–1), confidence, and a short breakdown with quoted evidence.",
  entities:
    "You are an NLP analyst. Extract named entities from the text: people, organizations, locations, dates, and technologies. Only list entities that actually appear in the text. Return a Markdown report grouped by type, with counts and a short snippet for each.",
  keywords:
    "You are an SEO analyst. Extract the real keywords from the text, grouped by relevance, with approximate frequency counts based on the text. Return a Markdown report.",
  readability:
    "You are a readability analyst. Compute readability metrics from the actual text: average sentence length, average word length, estimated Flesch-Kincaid grade, and readability level, plus concrete recommendations. Return a Markdown report.",
};

export async function POST(request: Request) {
  try {
    const { db, ctx } = await requireSession();
    const { text, type } = await request.json();
    if (!String(text ?? "").trim()) {
      return NextResponse.json({ success: false, error: "Text is required." }, { status: 400 });
    }
    const system = SYSTEMS[String(type ?? "sentiment")] ?? SYSTEMS.sentiment;
    const outcome = await runProviderLive(db, ctx.workspaceId, "content", String(text), { system, temperature: 0.2 });
    return NextResponse.json({ success: true, data: outcome.output });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}