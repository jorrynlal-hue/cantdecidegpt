import { NextResponse } from "next/server";
import { requireSession } from "@/lib/core/api/helpers";
import { runProviderLive } from "@/lib/core/providers";

export async function POST(request: Request) {
  try {
    const { db, ctx } = await requireSession();
    const { prompt, style, size } = await request.json();
    if (!String(prompt ?? "").trim()) {
      return NextResponse.json({ success: false, error: "Prompt is required." }, { status: 400 });
    }
    const styled = style ? `${prompt} — style: ${style}.` : String(prompt);
    const outcome = await runProviderLive(db, ctx.workspaceId, "image", styled, {
      size: String(size ?? "1024x1024"),
    });
    return NextResponse.json({ success: true, data: outcome.output });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}