import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { UTTERANCE_PROMPT, UTTERANCE_TOOL } from "@/lib/utterance";
import { toStringArray } from "@/lib/normalize";

export const maxDuration = 180;

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The analysis service isn't configured yet. (ANTHROPIC_API_KEY is not set.)" },
      { status: 503 },
    );
  }

  let body: { said?: string; context?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Couldn't read that request." }, { status: 400 });
  }

  const said = (body.said ?? "").trim().slice(0, 4000);
  const context = (body.context ?? "").trim().slice(0, 2000);
  const mode = body.mode === "work" ? "work" : "personal";

  if (!said) {
    return NextResponse.json(
      { error: "Type in what was said and I'll take a look." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  const userContent = [
    `A ${mode} situation.`,
    ``,
    `What was said to them:`,
    said,
    context ? `\nTheir context:\n${context}` : `\nThey gave no further context.`,
    ``,
    `Give the reading through the report_reading tool.`,
  ].join("\n");

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: [{ type: "text", text: UTTERANCE_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [UTTERANCE_TOOL as Anthropic.Tool],
      tool_choice: { type: "tool", name: "report_reading" },
      messages: [{ role: "user", content: userContent }],
    });

    const toolUse = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (!toolUse) {
      return NextResponse.json(
        { error: "The reading came back in an unexpected shape. Try again." },
        { status: 502 },
      );
    }

    const reading = toolUse.input as Record<string, unknown>;
    reading.limits = toStringArray(reading.limits, "limits");
    if (reading.safety && typeof reading.safety === "object") {
      const s = reading.safety as Record<string, unknown>;
      s.reasons = toStringArray(s.reasons, "reasons");
    }

    return NextResponse.json({ reading });
  } catch (err) {
    const status =
      err instanceof Anthropic.APIError && typeof err.status === "number" ? err.status : 500;
    const msg =
      status === 401
        ? "The API key was rejected."
        : status === 429
          ? "Rate limited — wait a moment and try again."
          : "Something went wrong reaching the analysis service.";
    console.error("[reading]", err);
    return NextResponse.json({ error: msg }, { status });
  }
}
