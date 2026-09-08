import type { UtteranceAnalysis } from "@/lib/utterance";

export default function Reading({ r }: { r: UtteranceAnalysis }) {
  return (
    <div className="flex flex-col gap-10">
      {r.safety.triggered && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-5">
          <h2 className="text-sm font-semibold text-amber-200">
            There&rsquo;s something here that changes what would help
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100/80">
            {r.safety.reasons.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-amber-100/70">
            The reading below still stands. What we&rsquo;ve left out is advice on what to say
            back — when something reads like this, careful phrasing can raise the risk rather
            than lower it.
          </p>
        </div>
      )}

      <p className="text-xl leading-9 text-zinc-100">{r.reframe}</p>

      {r.points.length > 0 && (
        <section className="flex flex-col gap-4">
          {r.points.map((p, i) => (
            <article key={i} className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-5">
              <div className="flex gap-3">
                <span className="text-sm tabular-nums text-zinc-600">{i + 1}</span>
                <div>
                  <h3 className="text-[15px] font-medium text-zinc-200">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-zinc-400">{p.body}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {r.not_said.length > 0 && (
        <section className="border-t border-zinc-800 pt-8">
          <h2 className="text-[15px] font-medium text-zinc-200">What wasn&rsquo;t said</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Responses that would ordinarily turn up here, and didn&rsquo;t.
          </p>
          <ul className="mt-5 flex flex-col gap-4">
            {r.not_said.map((n, i) => (
              <li key={i} className="border-l-2 border-zinc-700 pl-4">
                <p className="text-[15px] leading-7 text-zinc-300">{n.what}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{n.why_it_matters}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.worth_crediting.length > 0 && (
        <section className="border-t border-zinc-800 pt-8">
          <h2 className="text-[15px] font-medium text-zinc-200">Worth crediting</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {r.worth_crediting.map((w, i) => (
              <li key={i} className="border-l-2 border-emerald-800/70 pl-4">
                <p className="text-[15px] leading-7 text-zinc-300">{w.what}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{w.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.what_you_could_say.length > 0 && (
        <section className="border-t border-zinc-800 pt-8">
          <h2 className="text-[15px] font-medium text-zinc-200">What you could say</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Options, not instructions. You know the situation and this doesn&rsquo;t.
          </p>
          <div className="mt-5 flex flex-col gap-5">
            {r.what_you_could_say.map((o, i) => (
              <div key={i} className="rounded-lg border border-zinc-800/80 p-5">
                <h3 className="text-sm font-medium text-zinc-200">{o.approach}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  <span className="text-zinc-500">Tends to produce · </span>
                  {o.produces}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  <span className="text-zinc-500">Costs · </span>
                  {o.costs}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {r.limits.length > 0 && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-[15px] font-medium text-zinc-300">
            What one line can&rsquo;t tell you
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-400">
            {r.limits.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
