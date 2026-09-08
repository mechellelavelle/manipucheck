import type { Analysis, Confidence, Flag } from "@/lib/schema";

/* Collapsible section. Native <details> — no JS, keyboard accessible. */
function Fold({
  title,
  count,
  blurb,
  open = false,
  children,
}: {
  title: string;
  count?: number;
  blurb?: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="group border-t border-zinc-800 py-5">
      <summary className="flex cursor-pointer list-none items-baseline gap-3 [&::-webkit-details-marker]:hidden">
        <span className="text-[15px] font-medium text-zinc-200">{title}</span>
        {count !== undefined && (
          <span className="text-xs text-zinc-600">{count}</span>
        )}
        <span className="ml-auto text-xs text-zinc-600 transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      {blurb && <p className="mt-1 text-sm text-zinc-500">{blurb}</p>}
      <div className="mt-5">{children}</div>
    </details>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-zinc-700 py-0.5 pl-4 text-[15px] leading-7 text-zinc-300">
      {children}
    </blockquote>
  );
}

function Pill({
  tone,
  count,
  label,
}: {
  tone: "red" | "amber" | "green";
  count: number;
  label: string;
}) {
  const styles = {
    red: "border-red-900/70 bg-red-950/40 text-red-300",
    amber: "border-amber-900/70 bg-amber-950/40 text-amber-300",
    green: "border-emerald-900/70 bg-emerald-950/40 text-emerald-300",
  }[tone];
  const dot = { red: "bg-red-400", amber: "bg-amber-400", green: "bg-emerald-400" }[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${styles}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span className="font-medium tabular-nums">{count}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}

function FlagList({ flags, tone }: { flags: Flag[]; tone: "amber" | "green" }) {
  const bar = tone === "green" ? "border-emerald-800/70" : "border-amber-800/70";
  return (
    <ul className="flex flex-col gap-4">
      {flags.map((f, i) => (
        <li key={i} className={`border-l-2 pl-4 ${bar}`}>
          <p className="text-[15px] leading-7 text-zinc-300">{f.quote}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">{f.note}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {f.speaker} · {f.position}
          </p>
        </li>
      ))}
    </ul>
  );
}

const chip: Record<Confidence, string> = {
  HIGH: "border-zinc-500 bg-zinc-800/60 text-zinc-200",
  MEDIUM: "border-zinc-700 text-zinc-400",
  LOW: "border-zinc-800 text-zinc-500",
};

const verdictTone: Record<string, string> = {
  "patterns strongly present": "text-zinc-100",
  "patterns present": "text-zinc-200",
  ambiguous: "text-zinc-400",
  "not indicated": "text-zinc-500",
};

export default function Results({ a }: { a: Analysis }) {
  const green = a.green_flags ?? [];
  const yellowExtra = a.yellow_flags ?? [];
  const redCount = a.findings.filter((f) => f.confidence !== "LOW").length;
  const yellowCount = a.findings.filter((f) => f.confidence === "LOW").length + yellowExtra.length;

  const signals = [
    ["Does anyone try to repair it?", a.workability.repair_attempts],
    ["Do questions get answered?", a.workability.responsiveness],
    ["Does backing off help?", a.workability.effect_of_deescalation],
    ["One bad moment, or a pattern?", a.workability.distribution],
  ] as const;

  return (
    <div className="flex flex-col">
      {a.safety.triggered && (
        <div className="mb-10 rounded-lg border border-amber-700/50 bg-amber-950/30 p-5">
          <h2 className="text-sm font-semibold text-amber-200">
            There&rsquo;s something here that changes what would help
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100/80">
            {a.safety.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-amber-100/70">
            Everything below still stands. What we&rsquo;ve left out is advice on wording your
            next message — when a conversation looks like this, careful phrasing can raise the
            risk rather than lower it.
          </p>
        </div>
      )}

      {(redCount > 0 || yellowCount > 0 || green.length > 0) && (
        <div className="mb-8 flex flex-wrap gap-2">
          {redCount > 0 && (
            <Pill tone="red" count={redCount} label={redCount === 1 ? "red flag" : "red flags"} />
          )}
          {yellowCount > 0 && <Pill tone="amber" count={yellowCount} label="worth noticing" />}
          {green.length > 0 && (
            <Pill
              tone="green"
              count={green.length}
              label={green.length === 1 ? "green flag" : "green flags"}
            />
          )}
        </div>
      )}

      {/* Lead */}
      <p className="text-xl leading-9 text-zinc-100">{a.summary}</p>
      <p className="mt-4 text-xs leading-5 text-zinc-600">{a.chronology_note}</p>

      {/* The four signals, scannable */}
      <div className="mt-10 grid gap-px overflow-hidden rounded-lg bg-zinc-800 sm:grid-cols-2">
        {signals.map(([label, value]) => (
          <div key={label} className="bg-zinc-950 p-5">
            <p className="text-sm font-medium text-zinc-300">{label}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{value}</p>
          </div>
        ))}
      </div>

      {/* Who's doing what — short, so open */}
      <div className="mt-10">
        <Fold title="What each person is doing" open>
          <div className="flex flex-col gap-5">
            {a.per_speaker.map((s, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-sm font-medium text-zinc-200">{s.speaker}</span>
                  <span className={`text-sm ${verdictTone[s.verdict] ?? "text-zinc-400"}`}>
                    {s.verdict}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">{s.note}</p>
                <p className="mt-1 text-xs text-zinc-600">{s.arithmetic}</p>
              </div>
            ))}
            <p className="text-sm text-zinc-500">Direction: {a.direction}</p>
          </div>
        </Fold>

        {a.alternative_read && (
          <Fold
            title="Where it went sideways"
            blurb="Nothing here crossed the line into manipulation. This is what happened instead."
            open
          >
            <p className="text-[15px] leading-7 text-zinc-300">
              {a.alternative_read.what_happened}
            </p>
            <p className="mt-5 text-sm text-zinc-500">
              The point where you stopped discussing the same thing
            </p>
            <div className="mt-2">
              <Quote>{a.alternative_read.divergence_point}</Quote>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {a.alternative_read.each_side.map((e, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-zinc-300">
                    {e.speaker} seemed to think
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{e.appeared_to_think}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md bg-zinc-900/60 p-4">
              <p className="text-sm text-zinc-500">What would have headed it off</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {a.alternative_read.what_would_have_helped}
              </p>
            </div>
          </Fold>
        )}

        {a.loop && (
          <Fold title="The pattern it keeps repeating" open>
            <p className="text-[15px] leading-7 text-zinc-300">{a.loop.description}</p>
            <div className="mt-4 flex flex-col gap-3">
              {a.loop.occurrences.map((o, i) => (
                <Quote key={i}>{o}</Quote>
              ))}
            </div>
          </Fold>
        )}

        {a.findings.length > 0 && (
          <Fold
            title="Line by line"
            count={a.findings.length}
            blurb="What was said, and what it does to a conversation."
          >
            <div className="flex flex-col gap-4">
              {a.findings.map((f, i) => (
                <article
                  key={i}
                  className={`rounded-lg border border-l-2 border-zinc-800/80 bg-zinc-900/30 p-5 ${
                    f.confidence === "LOW" ? "border-l-amber-700/70" : "border-l-red-800/80"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-zinc-200">{f.speaker}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${chip[f.confidence]}`}
                    >
                      {f.pattern}
                    </span>
                  </div>

                  <p className="mt-3 text-[15px] leading-7 text-zinc-300">
                    {f.plain_description}
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    {f.instances.map((ins, j) => (
                      <div key={j}>
                        <Quote>{ins.quote}</Quote>
                        <p className="mt-1 pl-4 text-xs text-zinc-600">
                          {ins.position} · {ins.marker}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 border-t border-zinc-800/80 pt-4 text-sm leading-6 text-zinc-400">
                    {f.mechanism}
                  </p>
                </article>
              ))}
            </div>
          </Fold>
        )}

        {yellowExtra.length > 0 && (
          <Fold
            title="Worth noticing"
            count={yellowExtra.length}
            blurb="Below the threshold for a pattern, but you may want to see it."
          >
            <FlagList flags={yellowExtra} tone="amber" />
          </Fold>
        )}

        {green.length > 0 && (
          <Fold
            title="What went well"
            count={green.length}
            blurb="Moments of real emotional awareness. These don't cancel anything above — they just also happened."
            open
          >
            <FlagList flags={green} tone="green" />
          </Fold>
        )}

        {a.unanswered.length > 0 && (
          <Fold
            title="Questions that never got an answer"
            count={a.unanswered.length}
            open={a.unanswered.length <= 4}
          >
            <ul className="flex flex-col gap-3">
              {a.unanswered.map((u, i) => (
                <li key={i}>
                  <Quote>{u.quote}</Quote>
                  <p className="mt-1 pl-4 text-xs text-zinc-600">
                    {u.asked_by} · {u.position}
                  </p>
                </li>
              ))}
            </ul>
          </Fold>
        )}

        {a.impact && a.impact.level !== "not evident" && (
          <Fold title="How it seems to be landing">
            <p className="text-sm text-zinc-400">
              For {a.impact.speaker} — {a.impact.level}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-400">
              {a.impact.markers.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Fold>
        )}

        {a.where_this_leaves_you.length > 0 && (
          <Fold title="Where this leaves you" open>
            <ul className="flex flex-col gap-3">
              {a.where_this_leaves_you.map((w, i) => (
                <li key={i} className="text-[15px] leading-7 text-zinc-300">
                  {w}
                </li>
              ))}
            </ul>
          </Fold>
        )}

        {a.approaches.length > 0 && (
          <Fold
            title="Some ways you could handle it"
            blurb="Options, not instructions. You know the situation and this doesn't."
            open
          >
            <div className="flex flex-col gap-5">
              {a.approaches.map((ap, i) => (
                <div key={i} className="rounded-lg border border-zinc-800/80 p-5">
                  <h3 className="text-sm font-medium text-zinc-200">{ap.approach}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    <span className="text-zinc-500">Tends to produce · </span>
                    {ap.produces}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    <span className="text-zinc-500">Costs · </span>
                    {ap.costs}
                  </p>
                </div>
              ))}
            </div>
          </Fold>
        )}

        {a.caveats.length > 0 && (
          <Fold title="What this can&rsquo;t tell you" count={a.caveats.length}>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-500">
              {a.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Fold>
        )}
      </div>
    </div>
  );
}
