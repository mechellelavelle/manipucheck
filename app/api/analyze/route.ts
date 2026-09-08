import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/rubric";
import { ANALYSIS_TOOL } from "@/lib/schema";
import { toStringArray } from "@/lib/normalize";

export const maxDuration = 300;

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const MAX_IMAGES = 20;
const MAX_TEXT_CHARS = 200_000;
const MAX_TOTAL_IMAGE_BYTES = 24 * 1024 * 1024;

type ImageInput = { media_type: string; data: string };

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The analysis service isn't configured yet. (ANTHROPIC_API_KEY is not set.)" },
      { status: 503 },
    );
  }

  let body: {
    mode?: string;
    userSide?: string;
    goal?: string;
    text?: string;
    images?: ImageInput[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Couldn't read that request." }, { status: 400 });
  }

  const mode = body.mode === "work" ? "work" : "personal";
  const userSide = (body.userSide ?? "").trim();
  const goal = (body.goal ?? "").trim().slice(0, 2000);
  const text = (body.text ?? "").trim();
  const images = Array.isArray(body.images) ? body.images : [];

  if (!text && images.length === 0) {
    return NextResponse.json(
      { error: "Add a conversation first — paste the text, or upload some screenshots." },
      { status: 400 },
    );
  }

  if (images.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `That's ${images.length} images. The limit is ${MAX_IMAGES} at a time.` },
      { status: 400 },
    );
  }

  if (text.length > MAX_TEXT_CHARS) {
    return NextResponse.json(
      { error: "That conversation is too long to analyse in one go. Try splitting it." },
      { status: 400 },
    );
  }

  let totalBytes = 0;
  for (const img of images) {
    if (!ALLOWED_MEDIA.includes(img?.media_type)) {
      return NextResponse.json(
        { error: "Images need to be JPEG, PNG, GIF or WebP." },
        { status: 400 },
      );
    }
    totalBytes += Math.ceil((img.data?.length ?? 0) * 0.75);
  }
  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Those images add up to more than the upload limit. Try fewer at a time." },
      { status: 400 },
    );
  }

  const content: Anthropic.ContentBlockParam[] = [];

  images.forEach((img, i) => {
    content.push({ type: "text", text: `Screenshot ${i + 1} of ${images.length}:` });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.media_type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: img.data,
      },
    });
  });

  if (text) {
    content.push({ type: "text", text: `Conversation text:\n\n${text}` });
  }

  const sideLine = userSide
    ? `The person requesting this analysis is: ${userSide}. Address them directly as "you" where natural, and use this to determine which questions went unanswered and whether impact markers apply.`
    : `The person requesting this analysis has not said which speaker they are, or is not a participant. Write in the third person and omit the impact section.`;

  const goalLine = goal
    ? `What they want from this conversation: ${goal}. Order the approaches so the ones serving this goal come first, and say plainly where the record suggests this goal is hard to reach here.`
    : `They have not said what they want from this conversation. Offer approaches covering the range of common aims.`;

  content.push({
    type: "text",
    text: `Context: this is a ${mode} conversation. ${sideLine}\n\n${goalLine}\n\nAnalyse it using the rubric and report through the report_analysis tool.`,
  });

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [ANALYSIS_TOOL as Anthropic.Tool],
      tool_choice: { type: "tool", name: "report_analysis" },
      messages: [{ role: "user", content }],
    });

    const toolUse = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (!toolUse) {
      return NextResponse.json(
        { error: "The analysis came back in an unexpected shape. Try again." },
        { status: 502 },
      );
    }

    const analysis = toolUse.input as Record<string, unknown>;

    // A pattern that was looked for and not found is not a finding. Rendering it
    // reads as an accusation contradicted by its own body text.
    if (Array.isArray(analysis.findings)) {
      analysis.findings = analysis.findings.filter(
        (f) =>
          f &&
          typeof f === "object" &&
          Array.isArray((f as { instances?: unknown[] }).instances) &&
          (f as { instances: unknown[] }).instances.length > 0,
      );
    }

    analysis.caveats = toStringArray(analysis.caveats, "caveats");
    analysis.where_this_leaves_you = toStringArray(analysis.where_this_leaves_you);
    if (analysis.safety && typeof analysis.safety === "object") {
      const s = analysis.safety as Record<string, unknown>;
      s.reasons = toStringArray(s.reasons, "reasons");
    }

    return NextResponse.json({
      analysis,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (err) {
    const status =
      err instanceof Anthropic.APIError && typeof err.status === "number" ? err.status : 500;

    const message =
      status === 401
        ? "The API key was rejected."
        : status === 429
          ? "Rate limited — wait a moment and try again."
          : status === 400
            ? "The service rejected that input. It may be too large."
            : "Something went wrong reaching the analysis service.";

    console.error("[analyze]", err);
    return NextResponse.json({ error: message }, { status });
  }
}
