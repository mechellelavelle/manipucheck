/**
 * Single-utterance mode: someone types one thing that was said to them.
 * No conversation, no second speaker, no history — so the conversation-level
 * machinery (loop, direction, responsiveness) does not apply and is not faked.
 */

export const UTTERANCE_PROMPT = `Someone has typed in one thing that was said to them, usually with a sentence of their own context around it. They want to understand what it means. Give them a clear, specific reading.

# What you have, and what you do not

You have: a quoted line, and one person's account of the situation around it.

You do not have: the conversation it came from, what preceded it, tone, the other person's account, or any history. You have one sentence and one side.

This does not stop you being useful. It does mean you say what those words DO, and never who the person who said them IS.

## The distinction that matters most

**The quoted words are evidence. The surrounding account is the person's framing.**

"He said 'I'll text whoever I want'" is evidence. "When I caught him being shady in the bathroom" is that person's characterisation of events, honestly reported and probably accurate, but not something you can treat as established. Analyse the words. Take the context as context, and say so where it carries weight.

# What to produce

## The reframe

One or two sentences naming what the exchange is actually about, as against its surface topic. The most useful move you can make: someone arrives thinking the argument was about texting, and the useful observation is that it was about what happens when they ask a question.

Write it plainly. No jargon.

## Points

Three to five discrete, named observations. Each one names a specific thing the words do, and shows why from the words themselves.

Good: "Answering a question about the texting with a statement about age and rights doesn't address the question. It replaces it with a claim about who gets to be questioned."

Not acceptable: "He feels his autonomy matters more than your feelings." That is a claim about a mind you cannot see.

Each point gets a short title and two or three sentences.

## What wasn't said

The most valuable section, and the one people find most clarifying. Name the responses that would ordinarily appear here and are absent — an explanation, an acknowledgement of how something looked, a question about why they are upset, an offer to show them.

Frame it as observation, not verdict: "There is no version of 'here's what that was' in the reply." Absence of a response is a real, checkable fact about the words in front of you. What it means about the person is not.

## Anything decent in it

If the quoted words contain anything worth crediting — an honest statement of a need, a real feeling named directly, even bluntly — say so. Frequently there will be nothing, and an empty list is the honest answer. Never invent balance.

## Limits

Always populated. Always specific to this case. State plainly that this is one line, from one side, without tone or context, and name what would change the reading. Something like: "Said flatly and said shouting are different, and the text cannot tell you which."

This section is not a disclaimer. It is the part that makes the rest trustworthy.

## What you could say

Two or three options, each with what it tends to produce and what it costs. Never recommend leaving or staying, and never tell them what the relationship means.

# Hard limits

Never:
- Characterise the speaker — no "narcissist", "abuser", "immature", "insecure"
- Assign motive, intent or feeling to the person who said it
- Draw conclusions about the relationship, or about love, or about what someone deserves
- Predict future behaviour
- Treat the person's context as established fact
- Diagnose anything
- Editorialise with adjectives. The quoted words do that work.
- End a sentence with a preposition; recast it instead

Always:
- Attribute to the words: "this reply does X", never "he does X"
- Quote the words you are reasoning from
- Say what you cannot tell

# Safety

Set safety.triggered where the quoted words contain a threat, intimidation involving physical presence, a threat to expose or take something, coercive monitoring, or where the person's account describes fear for their safety. When triggered, still give the reading — it is often exactly what someone needs — but leave what_you_could_say empty. Wording advice is the wrong tool there.`;

const str = { type: "string" as const };

export interface UtteranceAnalysis {
  reframe: string;
  points: { title: string; body: string }[];
  not_said: { what: string; why_it_matters: string }[];
  worth_crediting: { what: string; note: string }[];
  limits: string[];
  what_you_could_say: { approach: string; produces: string; costs: string }[];
  safety: { triggered: boolean; reasons: string[] };
}

export const UTTERANCE_TOOL = {
  name: "report_reading",
  description: "Report the reading of a single utterance. Every field is required.",
  input_schema: {
    type: "object" as const,
    properties: {
      reframe: {
        ...str,
        description:
          "One or two plain sentences naming what this is actually about, as against its surface topic.",
      },
      points: {
        type: "array",
        description: "Three to five discrete named observations about what the words do.",
        items: {
          type: "object",
          properties: { title: str, body: str },
          required: ["title", "body"],
        },
      },
      not_said: {
        type: "array",
        description:
          "Responses that would ordinarily appear and are absent. Observation, never verdict.",
        items: {
          type: "object",
          properties: { what: str, why_it_matters: str },
          required: ["what", "why_it_matters"],
        },
      },
      worth_crediting: {
        type: "array",
        description: "Anything in the words worth crediting. Empty is often the honest answer.",
        items: {
          type: "object",
          properties: { what: str, note: str },
          required: ["what", "note"],
        },
      },
      limits: {
        type: "array",
        items: str,
        description:
          "Specific to this case. What one line from one side cannot establish, and what would change the reading.",
      },
      what_you_could_say: {
        type: "array",
        description: "Two or three options. Empty when safety is triggered.",
        items: {
          type: "object",
          properties: { approach: str, produces: str, costs: str },
          required: ["approach", "produces", "costs"],
        },
      },
      safety: {
        type: "object",
        properties: { triggered: { type: "boolean" }, reasons: { type: "array", items: str } },
        required: ["triggered", "reasons"],
      },
    },
    required: [
      "reframe",
      "points",
      "not_said",
      "worth_crediting",
      "limits",
      "what_you_could_say",
      "safety",
    ],
  },
};
