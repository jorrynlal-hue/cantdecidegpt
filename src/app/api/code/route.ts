import { NextResponse } from "next/server";
import { requireSession } from "@/lib/core/api/helpers";
import { runProviderLive } from "@/lib/core/providers";

const SYSTEMS: Record<string, string> = {
  generate: "You are an expert software engineer. Write production-quality code for the request. Return the code inside a single Markdown fenced code block, followed by a short usage note.",
  explain: "You are an expert software engineer. Explain the given code clearly, covering its purpose, key components, and how it works, in Markdown.",
  debug: "You are a senior debugging engineer. Analyze the given code for bugs and issues, then provide concrete fixes in Markdown. Be specific and correct.",
  refactor: "You are a senior software engineer. Refactor the given code for clarity, type safety, and performance, and explain what changed in Markdown.",
};

export async function POST(request: Request) {
  try {
    const { db, ctx } = await requireSession();
    const { prompt, language, mode } = await request.json();
    const m = String(mode ?? "generate");
    const system = SYSTEMS[m];
    if (!system) {
      return NextResponse.json(
        { success: false, error: "Invalid mode" },
        { status: 400 }
      );
    }
    const lang = String(language ?? "typescript");
    const outcome = await runProviderLive(db, ctx.workspaceId, "code", String(prompt ?? ""), {
      system: `Language: ${lang}.\n${system}`,
      temperature: 0.3,
    });
    return NextResponse.json({ success: true, data: outcome.output });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}