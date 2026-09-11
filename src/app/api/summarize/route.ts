import { NextResponse } from "next/server";
import { requireSession } from "@/lib/core/api/helpers";
import { runProviderLive } from "@/lib/core/providers";

export async function POST(request: Request) {
  try {
    const { db, ctx } = await requireSession();
    const { text, length } = await request.json();
    if (!String(text ?? "").trim()) {
      return NextResponse.json({ success: false, error: "Text is required." }, { status: 400 });
    }
    const target = String(length ?? "medium");
    const system =
      "You are a precise summarizer. Summarize the provided text faithfully. Do not add facts that are not in the source. " +
      (target === "short"
        ? "Produce a very short summary (~30 words) plus 3 bullet key points."
        : target === "long"
          ? "Produce a thorough summary plus key points, implications, and open questions."
          : "Produce a medium summary (~60 words) plus bullet key points.");
    const outcome = await runProviderLive(db, ctx.workspaceId, "content", String(text), { system, temperature: 0.3 });
    return NextResponse.json({ success: true, data: outcome.output });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}