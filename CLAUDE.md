
# VOA Production — Claude Instructions

## Working Style
You are my senior app engineer. We are building this app together.

Before writing any code:
1. Ask any questions needed to fully understand what's being built
2. Work on one small feature at a time


## Stage Completion Checklist
Before marking any stage complete, run a full self-audit:

1. Test every feature built end-to-end — don't assume, actually run it
2. Check the browser console and terminal for errors/warnings
3. Verify all forms actually submit and data actually reaches Supabase (query the table directly to confirm, don't just trust the UI said "success")
4. Check TypeScript compiles clean (`tsc --noEmit`)
5. Check the build succeeds (`npm run build`)
6. Click through every button/link added — confirm none are dead or placeholder
7. Check for any hardcoded fake/demo data pretending to be real
8. Confirm mobile responsiveness on pages touched
9. List anything incomplete, stubbed, or needing input (API keys, manual config, etc.) — be honest, don't hide gaps

Only after all checks pass, provide:
- A summary table of what was audited and the result (pass/fail) for each
- A list of exactly what needs to be manually tested or verified
- Confirmation this stage is genuinely done, not just "looks done"

Do not say "complete" unless every check above actually passed. If something fails, fix it and re-audit before reporting back.

## Supabase Setup Rule
For every stage, create the buckets and tables needed in Supabase and wire them up with the app. Do not leave Supabase schema as a manual step — write the migration SQL and apply it.

## Branding
The product name is **Educonnect** (renamed from "Vavhimi Online Academy" / "VOA" in July 2026). In every stage to come:
- Never reintroduce "VOA" or "Vavhimi Online Academy" as the product name in new code, copy, emails, metadata, or UI — always use "Educonnect".
- The registered company remains **Vavhimi Threads (Pvt) Ltd** — keep that as the legal entity reference where relevant (footer, terms, privacy, logo subtitle), it is not being renamed.
- If you find a leftover "VOA"/"Vavhimi Online Academy" reference while working on something else, fix it as part of that work.
