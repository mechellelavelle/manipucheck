export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 px-6 font-sans text-zinc-50">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium uppercase tracking-widest text-zinc-400">
          Coming soon
        </span>

        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Manipucheck
        </h1>

        <p className="text-lg leading-8 text-zinc-400">
          Paste a conversation. Get a clear, criteria-based read on whether
          someone is being manipulated &mdash; scored against defined patterns,
          not guesswork.
        </p>

        <p className="text-sm text-zinc-600">
          For business and personal conversations.
        </p>
      </main>

      <footer className="absolute bottom-8 text-xs text-zinc-700">
        Lavelle Productions
      </footer>
    </div>
  );
}
