/**
 * Structured output contract. Mirrors claude/Output-Design.md.
 * The model is forced to return exactly this shape.
 */

export type Grade = "clear" | "arguable";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type Verdict =
  | "patterns strongly present"
  | "patterns present"
  | "ambiguous"
  | "not indicated";

export interface Instance {
  quote: string;
  position: string;
  grade: Grade;
  marker: string;
}

export interface Finding {
  speaker: string;
  pattern: string;
  plain_description: string;
  mechanism: string;
  instances: Instance[];
  confidence: Confidence;
  excluded_alternatives: string[];
  part_of_loop: boolean;
}

export interface Flag {
  speaker: string;
  quote: string;
  position: string;
  note: string;
}

export interface Analysis {
  input_kind: "messaging" | "email" | "mixed";
  chronology_note: string;
  speakers: string[];
  summary: string;
  loop: { description: string; occurrences: string[] } | null;
  findings: Finding[];
  green_flags: Flag[];
  yellow_flags: Flag[];
  unanswered: { quote: string; asked_by: string; position: string }[];
  per_speaker: { speaker: string; verdict: Verdict; arithmetic: string; note: string }[];
  direction: "one-directional" | "reciprocal" | "neither indicated";
  workability: {
    repair_attempts: string;
    responsiveness: string;
    effect_of_deescalation: string;
    distribution: string;
  };
  impact: { speaker: string; level: string; markers: string[] } | null;
  alternative_read: {
    what_happened: string;
    divergence_point: string;
    each_side: { speaker: string; appeared_to_think: string }[];
    what_would_have_helped: string;
  } | null;
  where_this_leaves_you: string[];
  approaches: { approach: string; produces: string; costs: string }[];
  caveats: string[];
  safety: { triggered: boolean; reasons: string[] };
}

const str = { type: "string" as const };
const strArr = { type: "array" as const, items: str };

export const ANALYSIS_TOOL = {
  name: "report_analysis",
  description:
    "Report the completed analysis. Every field is required. Confidence values must be derived from the counting rules, never assigned by impression.",
  input_schema: {
    type: "object" as const,
    properties: {
      input_kind: { type: "string", enum: ["messaging", "email", "mixed"] },
      chronology_note: {
        ...str,
        description:
          "How you determined message order, and whether the record appears complete. For email, state explicitly whether the thread was newest-first and whether quoted history was deduplicated.",
      },
      speakers: { ...strArr, description: "Names, or 'left'/'right' where names are not visible." },
      summary: {
        ...str,
        description:
          "Two or three sentences of plain language naming the shape of the exchange. No pattern jargon, no verdict.",
      },
      loop: {
        type: ["object", "null"],
        description:
          "A repeating sequence, only if it occurs 2+ times. Null otherwise — never invent one.",
        properties: {
          description: str,
          occurrences: { ...strArr, description: "Each occurrence, quoted." },
        },
        required: ["description", "occurrences"],
      },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            speaker: str,
            pattern: str,
            plain_description: {
              ...str,
              description: "What happened, in plain words, before any category name.",
            },
            mechanism: {
              ...str,
              description:
                "What this behaviour does to a conversation, independent of intent. The most valuable field — write it for someone deciding whether to keep engaging.",
            },
            instances: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  quote: str,
                  position: str,
                  grade: { type: "string", enum: ["clear", "arguable"] },
                  marker: { ...str, description: "Which specific marker this satisfies." },
                },
                required: ["quote", "position", "grade", "marker"],
              },
            },
            confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
            excluded_alternatives: {
              ...strArr,
              description: "Exclusion rules considered and rejected, and why.",
            },
            part_of_loop: { type: "boolean" },
          },
          required: [
            "speaker",
            "pattern",
            "plain_description",
            "mechanism",
            "instances",
            "confidence",
            "excluded_alternatives",
            "part_of_loop",
          ],
        },
      },
      green_flags: {
        type: "array",
        description:
          "Moments of emotional awareness, attributed to whoever earned them. Never offset or soften a finding.",
        items: {
          type: "object",
          properties: {
            speaker: str,
            quote: str,
            position: str,
            note: { ...str, description: "What this shows, in one plain sentence." },
          },
          required: ["speaker", "quote", "position", "note"],
        },
      },
      yellow_flags: {
        type: "array",
        description:
          "Worth noticing, but below any pattern threshold. Never a passage already counted as an instance.",
        items: {
          type: "object",
          properties: {
            speaker: str,
            quote: str,
            position: str,
            note: { ...str, description: "Why it gives pause, in one plain sentence." },
          },
          required: ["speaker", "quote", "position", "note"],
        },
      },
      unanswered: {
        type: "array",
        description: "Substantive questions visibly asked and never answered.",
        items: {
          type: "object",
          properties: { quote: str, asked_by: str, position: str },
          required: ["quote", "asked_by", "position"],
        },
      },
      per_speaker: {
        type: "array",
        items: {
          type: "object",
          properties: {
            speaker: str,
            verdict: {
              type: "string",
              enum: [
                "patterns strongly present",
                "patterns present",
                "ambiguous",
                "not indicated",
              ],
            },
            arithmetic: { ...str, description: "Show the counts that produced the verdict." },
            note: str,
          },
          required: ["speaker", "verdict", "arithmetic", "note"],
        },
      },
      direction: {
        type: "string",
        enum: ["one-directional", "reciprocal", "neither indicated"],
      },
      workability: {
        type: "object",
        properties: {
          repair_attempts: str,
          responsiveness: str,
          effect_of_deescalation: str,
          distribution: str,
        },
        required: [
          "repair_attempts",
          "responsiveness",
          "effect_of_deescalation",
          "distribution",
        ],
      },
      impact: {
        type: ["object", "null"],
        properties: {
          speaker: str,
          level: { type: "string", enum: ["evident", "possible", "not evident"] },
          markers: strArr,
        },
        required: ["speaker", "level", "markers"],
      },
      alternative_read: {
        type: ["object", "null"],
        description:
          "Required when no speaker reaches 'patterns present'. What is actually happening, if it is not manipulation. Null otherwise.",
        properties: {
          what_happened: str,
          divergence_point: { ...str, description: "Quote the message where meaning diverged." },
          each_side: {
            type: "array",
            items: {
              type: "object",
              properties: { speaker: str, appeared_to_think: str },
              required: ["speaker", "appeared_to_think"],
            },
          },
          what_would_have_helped: str,
        },
        required: ["what_happened", "divergence_point", "each_side", "what_would_have_helped"],
      },
      where_this_leaves_you: {
        ...strArr,
        description:
          "What tends to happen if nothing changes; what would have to change; what is and is not within this person's control. Never a recommendation.",
      },
      approaches: {
        type: "array",
        description: "Three, matched to context. Empty when safety.triggered is true.",
        items: {
          type: "object",
          properties: { approach: str, produces: str, costs: str },
          required: ["approach", "produces", "costs"],
        },
      },
      caveats: {
        ...strArr,
        description: "Only caveats that actually apply to this record. Never boilerplate.",
      },
      safety: {
        type: "object",
        properties: { triggered: { type: "boolean" }, reasons: strArr },
        required: ["triggered", "reasons"],
      },
    },
    required: [
      "input_kind",
      "chronology_note",
      "speakers",
      "summary",
      "loop",
      "findings",
      "green_flags",
      "yellow_flags",
      "unanswered",
      "per_speaker",
      "direction",
      "workability",
      "impact",
      "alternative_read",
      "where_this_leaves_you",
      "approaches",
      "caveats",
      "safety",
    ],
  },
};

export interface ResponseDraft {
  goal_assessment: string;
  draft: string;
  notes: string[];
  omitted: string[];
}

export const RESPOND_TOOL = {
  name: "report_draft",
  description: "Report the drafted reply. Every field is required.",
  input_schema: {
    type: "object" as const,
    properties: {
      goal_assessment: {
        type: "string",
        description:
          "What the record suggests about whether this goal is reachable in this conversation. Honest, not discouraging.",
      },
      draft: {
        type: "string",
        description: "The message, ready to copy and edit.",
      },
      notes: {
        type: "array",
        items: { type: "string" },
        description: "Two to four short items on why the parts are there.",
      },
      omitted: {
        type: "array",
        items: { type: "string" },
        description: "What the draft deliberately leaves out, and why.",
      },
    },
    required: ["goal_assessment", "draft", "notes", "omitted"],
  },
};
