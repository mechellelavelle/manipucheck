import type { Analysis, Confidence } from "@/lib/schema";

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-800 pt-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </h2>
      {blurb && <p className="mt-1 text-sm text-zinc-600">{blurb}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-zinc-700 py-1 pl-4 text-zinc-300">
      {children}
    </blockquote>
  );
}

const confidenceStyle: Record<Confidence, string> = {
  HIGH: "border-zinc-500 text-zinc-300",
  MEDIUM: "border-zinc-700 text-zinc-400",
  LOW: "border-zinc-800 text-zinc-500",
};

export default function Results({ a }: { a: Analysis }) {
  return (
    <div className="flex flex-col gap-10">
      {a.safety.triggered && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-5">
          <h2 className="text-sm font-semibold text-amber-200">
            This conversation contains content that changes what&rsquo;s useful here
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100/80">
            {a.safety.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-amber-100/70">
            The analysis below still stands. What we haven&rsquo;t included is advice on how to
            word your next message — in situations like this, conversational technique is the
            wrong tool and can make things worse rather than better.
          </p>
        </div>
      )}

      <section>
        <p className="text-lg leading-8 text-zinc-200">{a.summary}</p>
        <p className="mt-3 text-xs text-zinc-600">{a.chronology_note}</p>
      </section>

      {a.loop && (
        <Section title="The loop" blurb="A sequence this exchange repeats.">
          <p className="leading-7 text-zinc-300">{a.loop.description}</p>
          <div className="mt-4 flex flex-col gap-3">
            {a.loop.occurrences.map((o, i) => (
              <Quote key={i}>{o}</Quote>
            ))}
          </div>
        </Section>
      )}

      {a.findings.length > 0 && (
        <Section
          title="Passage by passage"
          blurb="What was said, and what it does to a conversation."
        >
          <div className="flex flex-col gap-8">
            {a.findings.map((f, i) => (
              <article key={i} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-zinc-200">{f.speaker}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${confidenceStyle[f.confidence]}`}
                  >
                    {f.pattern}
                  </span>
                </div>

                <p className="leading-7 text-zinc-300">{f.plain_description}</p>

                <div className="flex flex-col gap-2">
                  {f.instances.map((ins, j) => (
                    <div key={j}>
                      <Quote>{ins.quote}</Quote>
                      <p className="mt-1 pl-4 text-xs text-zinc-600">
                        {ins.position} · {ins.grade} · {ins.marker}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-md bg-zinc-900/60 p-4">
                  <p className="text-sm leading-6 text-zinc-400">{f.mechanism}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      {a.unanswered.length > 0 && (
        <Section
          title="What never got answered"
          blurb="Questions asked in the record that received no response."
        >
          <ul className="flex flex-col gap-3">
            {a.unanswered.map((u, i) => (
              <li key={i}>
                <Quote>{u.quote}</Quote>
                <p className="mt-1 pl-4 text-xs text-zinc-600">
                  asked by {u.asked_by} · {u.position}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="What each person is doing">
        <div className="flex flex-col gap-5">
          {a.per_speaker.map((s, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-sm font-medium text-zinc-200">{s.speaker}</span>
                <span className="text-sm text-zinc-400">{s.verdict}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{s.note}</p>
              <p className="mt-1 text-xs text-zinc-600">{s.arithmetic}</p>
            </div>
          ))}
          <p className="text-sm text-zinc-500">Direction: {a.direction}</p>
        </div>
      </Section>

      <Section
        title="Signals that bear on whether this is workable"
        blurb="Observations, not predictions."
      >
        <dl className="flex flex-col gap-4">
          {(
            [
              ["Repair attempts", a.workability.repair_attempts],
              ["Responsiveness", a.workability.responsiveness],
              ["Effect of de-escalation", a.workability.effect_of_deescalation],
              ["Distribution", a.workability.distribution],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm font-medium text-zinc-300">{label}</dt>
              <dd className="mt-1 text-sm leading-6 text-zinc-400">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {a.impact && a.impact.level !== "not evident" && (
        <Section title="Responses consistent with impact">
          <p className="text-sm text-zinc-400">
            For {a.impact.speaker} — {a.impact.level}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400">
            {a.impact.markers.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Section>
      )}

      {a.where_this_leaves_you.length > 0 && (
        <Section title="Where this leaves you">
          <ul className="flex flex-col gap-3">
            {a.where_this_leaves_you.map((w, i) => (
              <li key={i} className="text-sm leading-7 text-zinc-300">
                {w}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {a.approaches.length > 0 && (
        <Section
          title="If you continue"
          blurb="Approaches, not instructions. You know the situation and this doesn't."
        >
          <div className="flex flex-col gap-6">
            {a.approaches.map((ap, i) => (
              <div key={i}>
                <h3 className="text-sm font-medium text-zinc-200">{ap.approach}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
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
        </Section>
      )}

      {a.caveats.length > 0 && (
        <Section title="Limits of this reading">
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-500">
            {a.caveats.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
