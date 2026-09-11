import { NextResponse } from "next/server";
import { requireSession } from "@/lib/core/api/helpers";
import { runProviderLive } from "@/lib/core/providers";

const SYSTEMS: Record<string, string> = {
  email: "You are a professional email writer. Write a complete, ready-to-send email in Markdown for the given subject/prompt. Keep it concise and professional.",
  blog: "You are an experienced blogger. Write a complete blog post in Markdown on the given topic, with a headline, subheadings, and practical takeaways.",
  essay: "You are an academic writer. Write a structured essay in Markdown on the given topic with introduction, analysis, counterargument, and conclusion.",
  creative: "You are a literary writer. Write an original, evocative short creative piece in Markdown based on the prompt.",
  business: "You are a strategy consultant. Write an executive brief in Markdown with market analysis, recommendations, risks, and next steps.",
};

export async function POST(request: Request) {
  try {
    const { db, ctx } = await requireSession();
    const { prompt, type, tone } = await request.json();
    if (!String(prompt ?? "").trim()) {
      return NextResponse.json({ success: false, error: "Prompt is required." }, { status: 400 });
    }
    const system = `${SYSTEMS[String(type ?? "email")] ?? SYSTEMS.email}\nTone to use: ${String(tone ?? "professional")}.`;
    const outcome = await runProviderLive(db, ctx.workspaceId, "content", String(prompt), { system, temperature: 0.8 });
    return NextResponse.json({ success: true, data: outcome.output });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}