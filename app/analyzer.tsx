"use client";

import { useRef, useState } from "react";
import type { Analysis } from "@/lib/schema";
import Results from "./results";
import RespondPanel from "./respond-panel";
import Reading from "./reading";
import type { UtteranceAnalysis } from "@/lib/utterance";

type Shot = { id: string; name: string; preview: string; media_type: string; data: string };

const MAX_EDGE = 1568;

async function downscale(file: File): Promise<Shot> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("Couldn't read that file."));
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Couldn't open that image."));
    el.src = dataUrl;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that image.");
  ctx.drawImage(img, 0, 0, w, h);

  const out = canvas.toDataURL("image/jpeg", 0.85);
  return {
    id: crypto.randomUUID(),
    name: file.name,
    preview: out,
    media_type: "image/jpeg",
    data: out.split(",")[1],
  };
}

export default function Analyzer() {
  const [kind, setKind] = useState<"conversation" | "utterance">("conversation");
  const [said, setSaid] = useState("");
  const [situation, setSituation] = useState("");
  const [reading, setReading] = useState<UtteranceAnalysis | null>(null);
  const [mode, setMode] = useState<"personal" | "work">("personal");
  const [userSide, setUserSide] = useState("");
  const [goal, setGoal] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasInput =
    kind === "conversation"
      ? shots.length > 0 || text.trim().length > 0
      : said.trim().length > 0;

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    try {
      const next = await Promise.all(Array.from(files).map(downscale));
      setShots((s) => [...s, ...next].slice(0, 20));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add those images.");
    }
  }

  async function getReading() {
    setBusy(true);
    setError(null);
    setReading(null);
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, said, context: situation }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setReading(json.reading as UtteranceAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function analyse() {
    setBusy(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          userSide,
          goal,
          text,
          images: shots.map(({ media_type, data }) => ({ media_type, data })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setAnalysis(json.analysis as Analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (reading) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-10 py-16">
        <button
          onClick={() => setReading(null)}
          className="self-start text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Look at another one
        </button>
        <Reading r={reading} />
        <p className="border-t border-zinc-900 pt-6 text-xs leading-5 text-zinc-500">
          Manipucheck reports observable patterns in what was written. It is not therapy, not a
          mental-health assessment, and not medical or legal advice. It does not know
          anyone&rsquo;s intentions. For anything that matters, talk with a professional who knows
          your situation.
        </p>
      </div>
    );
  }

  if (analysis) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-10 py-16">
        <button
          onClick={() => setAnalysis(null)}
          className="self-start text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Look at another one
        </button>
        <Results a={analysis} />
        <RespondPanel analysis={analysis} mode={mode} text={text} initialGoal={goal} />
      <p className="border-t border-zinc-900 pt-6 text-xs leading-5 text-zinc-600">
        Manipucheck reports observable patterns in what was written. It is not therapy, not a
        mental-health assessment, and not medical or legal advice. It does not know anyone&rsquo;s
        intentions. For anything that matters, talk with a professional who knows your situation.
      </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight">
          <span className="text-zinc-50">Manipu</span>
          <span className="text-[#ef2b2b]">Check</span>
        </h1>
        <p className="text-xl leading-8 text-zinc-200">
          Stop replaying the conversation in your head. Manipucheck goes through it line by
          line and shows you what actually happened &mdash; in their own words.
        </p>
        <p className="leading-7 text-zinc-400">
          Upload the screenshots or paste the thread. You&rsquo;ll get the specific lines, what
          each one is doing to the conversation, the exact words behind every finding &mdash; and
          a reply you can actually send.
        </p>
      </header>

      <div className="flex rounded-lg border border-zinc-800 p-1">
        {(
            [
              ["conversation", "A whole conversation"],
              ["utterance", "One thing someone said"],
            ] as const
          ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setKind(k);
              setError(null);
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors ${
              kind === k
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-400">Is this work, or personal?</span>
        <div className="flex gap-2">
          {(["personal", "work"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
                mode === m
                  ? "border-zinc-400 bg-zinc-100 text-zinc-900"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          {mode === "work"
            ? "Guidance will lean on documentation, written follow-ups and escalation paths."
            : "Guidance will lean on what to expect, and what is and isn't within your control."}
        </p>
      </div>

      {kind === "conversation" && (
        <>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-zinc-400">
            Which side is yours? <span className="text-zinc-600">(optional)</span>
          </span>
          <input
            value={userSide}
            onChange={(e) => setUserSide(e.target.value)}
            placeholder="e.g. the right-hand side, or your name in the thread"
            className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <span className="text-xs text-zinc-600">
            Leave this blank if you weren&rsquo;t part of it.
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-zinc-400">
            What were you hoping for? <span className="text-zinc-600">(optional)</span>
          </span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. just an acknowledgement, without it turning into a fight"
            className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <span className="text-xs text-zinc-600">
            Shapes the reply we draft for you. You can change it later.
          </span>
        </label>

        <div className="flex flex-col gap-3">
          <span className="text-sm text-zinc-400">Screenshots</span>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
          >
            {shots.length ? "Add more screenshots" : "Choose screenshots — you can pick several at once"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {shots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shots.map((s) => (
                <div key={s.id} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.preview}
                    alt={s.name}
                    className="h-24 w-16 rounded border border-zinc-800 object-cover"
                  />
                  <button
                    onClick={() => setShots((v) => v.filter((x) => x.id !== s.id))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-100"
                    aria-label={`Remove ${s.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-zinc-600">
            Order doesn&rsquo;t matter — timestamps and overlap determine the sequence. Up to 20 at
            a time.
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-zinc-400">
            Or paste the conversation <span className="text-zinc-600">(email threads work too)</span>
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste here…"
            className="resize-y rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm leading-6 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </label>

        </>
      )}

      {kind === "utterance" && (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-zinc-400">What was said to you?</span>
            <textarea
              value={said}
              onChange={(e) => setSaid(e.target.value)}
              rows={4}
              placeholder="Type or paste it as close to word-for-word as you can remember"
              className="resize-y rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm leading-6 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <span className="text-xs text-zinc-600">
              The exact words matter more than the tidy version.
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-zinc-400">
              What was going on? <span className="text-zinc-600">(optional)</span>
            </span>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={3}
              placeholder="e.g. I'd just asked him about something and this was the answer"
              className="resize-y rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm leading-6 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </label>
        </>
      )}

      {error && (
        <p className="rounded-md border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => void (kind === "conversation" ? analyse() : getReading())}
          disabled={!hasInput || busy}
          className="rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
        >
          {busy ? "Reading it through…" : kind === "conversation" ? "Read the conversation" : "Read it"}
        </button>
        {busy && (
          <p className="text-center text-xs text-zinc-600">
            {kind === "conversation"
              ? "About a minute. Screenshots are read one at a time."
              : "About twenty seconds."}
          </p>
        )}
      </div>

      <div className="border-t border-zinc-900 pt-6">
        <p className="text-sm leading-6 text-zinc-500">
          Most of what goes wrong between people gets lost in translation. Some of it
          doesn&rsquo;t. Knowing which is which is the whole point.
        </p>
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Manipucheck reports observable patterns in what was written. It is not therapy, not a
          mental-health assessment, and not medical or legal advice. It does not know
          anyone&rsquo;s intentions. For anything that matters, talk with a professional who knows
          your situation.
        </p>
      </div>
    </div>
  );
}
