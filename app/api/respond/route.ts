import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { RESPOND_PROMPT } from "@/lib/respond";
import { RESPOND_TOOL } from "@/lib/schema";
import type { Analysis, ResponseDraft } from "@/lib/schema";
import { toStringArray, toPlainString } from "@/lib/normalize";

export const maxDuration = 120;

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The analysis service isn't configured yet. (ANTHROPIC_API_KEY is not set.)" },
      { status: 503 },
    );
  }

  let body: { mode?: string; goal?: string; text?: string; analysis?: Analysis };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Couldn't read that request." }, { status: 400 });
  }

  const goal = (body.goal ?? "").trim();
  const analysis = body.analysis;

  if (!goal) {
    return NextResponse.json(
      { error: "Say what you want from this conversation first." },
      { status: 400 },
    );
  }
  if (!analysis) {
    return NextResponse.json({ error: "No analysis to work from." }, { status: 400 });
  }
  if (analysis.safety?.triggered) {
    return NextResponse.json(
      {
        error:
          "A draft isn't the right tool here. This conversation contains content where wording a reply carefully can raise the risk rather than lower it.",
      },
      { status: 409 },
    );
  }

  const mode = body.mode === "work" ? "work" : "personal";
  const text = (body.text ?? "").trim().slice(0, 100_000);

  const client = new Anthropic({ apiKey });

  const userContent = [
    `Context: a ${mode} conversation.`,
    ``,
    `What the person wants from it:`,
    goal,
    ``,
    `The analysis:`,
    JSON.stringify(analysis, null, 2),
    text ? `\nThe conversation text:\n\n${text}` : ``,
    ``,
    `Draft their reply and report through the report_draft tool.`,
  ].join("\n");

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: [{ type: "text", text: RESPOND_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [RESPOND_TOOL as Anthropic.Tool],
      tool_choice: { type: "tool", name: "report_draft" },
      messages: [{ role: "user", content: userContent }],
    });

    const toolUse = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (!toolUse) {
      return NextResponse.json(
        { error: "The draft came back in an unexpected shape. Try again." },
        { status: 502 },
      );
    }

    const raw = toolUse.input as Record<string, unknown>;
    const draft: ResponseDraft = {
      goal_assessment: toPlainString(raw.goal_assessment),
      draft: toPlainString(raw.draft),
      notes: toStringArray(raw.notes, "notes"),
      omitted: toStringArray(raw.omitted, "omitted"),
    };

    // The omitted section sometimes arrives inside notes instead of its own field.
    if (!draft.omitted.length && typeof raw.notes === "string") {
      draft.omitted = toStringArray(raw.notes, "omitted");
    }

    return NextResponse.json({ draft });
  } catch (err) {
    const status =
      err instanceof Anthropic.APIError && typeof err.status === "number" ? err.status : 500;
    const message =
      status === 401
        ? "The API key was rejected."
        : status === 429
          ? "Rate limited — wait a moment and try again."
          : "Something went wrong reaching the analysis service.";
    console.error("[respond]", err);
    return NextResponse.json({ error: message }, { status });
  }
}
