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
The product name is **EduOnLink** (renamed from "Educonnect" in July 2026, which itself was renamed from "Vavhimi Online Academy" / "VOA" earlier that same month — "Educonnect" turned out to already be taken). In every stage to come:
- Never reintroduce "VOA", "Vavhimi Online Academy", or "Educonnect" as the product name in new code, copy, emails, metadata, or UI — always use "EduOnLink".
- The registered company remains **Vavhimi Threads (Pvt) Ltd** — keep that as the legal entity reference where relevant (footer, terms, privacy, logo subtitle), it is not being renamed.
- The visual logo mark itself (the pencil + 3D "E" SVG in `src/components/logo/VoaLogoMark.tsx`) is unchanged by either rename — only the text/wordmark next to it and all other name references update.
- If you find a leftover "VOA"/"Vavhimi Online Academy"/"Educonnect" reference while working on something else, fix it as part of that work.
- Historical `supabase/migrations/*.sql` file comments are not retroactively renamed — they're a record of what the product was called at the time (migration 001 still says "VOA", for example). Only current/forward-looking code, live UI text, and new migrations use the current name.

## Storage Architecture
Storage is deliberately split between two systems — check which one a new upload feature belongs to before defaulting to either one:
- **Cloudflare R2** (`src/lib/r2.ts`, `FILE_CATEGORIES`, `/api/uploads/presign`, `/api/files/[...key]`) is for categorized/large files: lesson videos, lesson materials, course materials, assignment briefs/submissions, HBC project files, past papers, teacher qualifications/IDs, school docs, and voice notes. New file-upload features should add a `FILE_CATEGORIES` entry and use the presign → direct-PUT → `/api/files/{key}` pattern, not invent a new flow.
- **Supabase Storage** (`chat-attachments` bucket) is for images/files sent inline in class chat and direct messages — small, chat-embedded media uploaded directly via the Supabase client SDK.
- Before building a new upload path, check `FILE_CATEGORIES` first — several categories (e.g. `voice-note`) were already reserved for features that hadn't been wired up yet. Don't default new uploads to Supabase Storage just because it's the simpler client-side SDK call if an R2 category already exists or should exist for that content type.
