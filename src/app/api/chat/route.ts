import { NextResponse } from "next/server";
import { requireSession } from "@/lib/core/api/helpers";
import { liveChat } from "@/lib/core/ai";
import { liveModelFor } from "@/lib/core/ai";
import { getProviderConfig, baselineOutput } from "@/lib/core/providers";

export async function POST(request: Request) {
  try {
    const { db, ctx } = await requireSession();
    const { messages } = await request.json();
    const raw: unknown[] = Array.isArray(messages) ? messages : [];
    const last = String((raw[raw.length - 1] as { content?: unknown } | undefined)?.content ?? "");
    if (!last.trim()) {
      return NextResponse.json({ success: false, error: "Message is required." }, { status: 400 });
    }
    const cfg = getProviderConfig(db, ctx.workspaceId, "chat");
    const spec = liveModelFor("chat", cfg?.provider, cfg?.enabled);
    if (!spec) {
      return NextResponse.json({ success: true, data: baselineOutput("chat", last) });
    }
    try {
      const mapped = raw
        .map((m) => {
          const mm = m as { role?: string; content?: unknown };
          const role: string = ["user", "assistant", "system"].includes(mm?.role ?? "") ? (mm.role ?? "user") : "user";
          return { role, content: String(mm?.content ?? "") };
        })
        .filter((m) => m.content);
      const output = await liveChat(mapped.length ? mapped : [{ role: "user", content: last }]);
      return NextResponse.json({ success: true, data: output });
    } catch {
      return NextResponse.json({ success: true, data: baselineOutput("chat", last) });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}