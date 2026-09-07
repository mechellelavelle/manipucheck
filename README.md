# Manipucheck

Analyses conversations for patterns associated with manipulation, against a defined
rubric, and reports the specific passages rather than a verdict.

Live: https://manipucheck.vercel.app

## How it fits together

| File | What it is |
|---|---|
| `lib/rubric.ts` | The instrument — eight patterns, counting rules, exclusions, language rules. **This is the product.** |
| `lib/schema.ts` | The structured output contract the model is forced to return |
| `app/api/analyze/route.ts` | Endpoint: takes screenshots and/or text, calls the Claude API |
| `app/analyzer.tsx` | The interface |
| `app/results.tsx` | Renders the analysis |

Design docs live in the Manipucheck project on claude.ai: `Operational-Rubric.md`
(the instrument) and `Output-Design.md` (what the user sees). Keep `lib/rubric.ts`
in sync with them.

## Running locally

```bash
cp .env.local.example .env.local   # then paste your key into it
npm install
npm run dev
```

Open http://localhost:3000

## Deploying

Vercel deploys `main` automatically. `ANTHROPIC_API_KEY` must be set in
Project Settings → Environment Variables, for Production, Preview and Development.

## Notes

- Screenshots are downscaled in the browser before upload — phone screenshots are
  far larger than the model needs, and full-size ones would exceed the request limit.
- Speaker identity comes from bubble alignment in messaging screenshots, and from
  sender headers in email. Email threads are frequently newest-first, and their
  quoted history repeats earlier messages; both are handled in the prompt.
- The system prompt is cached, so repeat analyses in quick succession cost less.
