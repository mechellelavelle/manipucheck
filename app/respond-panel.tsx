"use client";

import { useState } from "react";
import type { Analysis, ResponseDraft } from "@/lib/schema";

export default function RespondPanel({
  analysis,
  mode,
  text,
  initialGoal,
}: {
  analysis: Analysis;
  mode: "personal" | "work";
  text: string;
  initialGoal: string;
}) {
  const [goal, setGoal] = useState(initialGoal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ResponseDraft | null>(null);
  const [edited, setEdited] = useState("");
  const [copied, setCopied] = useState(false);

  if (analysis.safety?.triggered) return null;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, goal, text, analysis }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setDraft(json.draft as ResponseDraft);
      setEdited((json.draft as ResponseDraft).draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(edited);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't reach the clipboard. Select the text and copy it manually.");
    }
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Write back
      </h2>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm text-zinc-400">
          What would a good outcome look like now?
        </span>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={2}
          placeholder="e.g. I'd like him to acknowledge the deadline, without it becoming a fight"
          className="resize-y rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm leading-6 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
        <span className="text-xs text-zinc-600">
          Having read all that, this may have shifted. Change it if it has.
        </span>
      </label>

      {error && (
        <p className="mt-4 rounded-md border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        onClick={() => void generate()}
        disabled={!goal.trim() || busy}
        className="mt-4 rounded-full border border-zinc-600 px-5 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-200"
      >
        {busy ? "Writing…" : draft ? "Try another" : "Draft a reply"}
      </button>

      {draft && (
        <div className="mt-8 flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-300">Before you send</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{draft.goal_assessment}</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-sm font-medium text-zinc-300">The draft</h3>
              <button
                onClick={() => void copy()}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              value={edited}
              onChange={(e) => setEdited(e.target.value)}
              rows={7}
              className="mt-2 w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-7 text-zinc-100 focus:border-zinc-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-600">
              Edit it freely. It should sound like you, not like this.
            </p>
          </div>

          {draft.notes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300">Why it&rsquo;s written this way</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-400">
                {draft.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.omitted.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300">
                What it leaves out, and why
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-400">
                {draft.omitted.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
