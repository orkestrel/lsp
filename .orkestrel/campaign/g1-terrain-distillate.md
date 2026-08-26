# G1 terrain distillate — Cursor Grok, 2026-08-26

Returned by the `grok` driver (Cursor Grok, `cursor-grok-4.6-high`) from a bounded read-only
sweep of the four untouched packages and the campaign record. Preserved verbatim, with two
Orchestrator settlements appended at the end.

Question: What terrain does G1 (guide rulings for queue, process, tool, middleware retention) need before dispatch?

Evidence:

**Repo state** — all four clean, all on branch `claude/orkestrel-lsp-resume-wr46dd` (not `claude/lsp-spec-audit-est33d` as the brief assumed — flag this discrepancy for the Orchestrator). All four carry `tests/guides.test.ts`, so a guide edit is parity-gated in every repo.

**Ruling source (exact passages to carry into the brief)**:
- `/home/user/lsp/.orkestrel/campaign/audit.md:120-122` — one-line summary: queue owns progress via the job; process streams lines; tool is inert with progress one layer up in mcp's execution context; middleware observes through callbacks.
- `/home/user/lsp/.orkestrel/campaign/audit.md:134-137` — the four are "ruled untouched, each reason recorded in its guide"; middleware's "one admitting trigger is a consumer asking for multipart upload progress, answered with a reporter callback in the multipart options."
- `/home/user/lsp/.orkestrel/campaign/audit.md:152-155` — capability-matrix table, one row per package, terse form of each ruling (usable near-verbatim for guide prose).
- `/home/user/lsp/.orkestrel/campaign/design-planner-report.md:135` (queue), `:137` (process), `:139` (tool — cites `guides/tool.md:26` and `MCPExecutionContext.progress` at `/home/user/mcp/src/core/types.ts:715` and `MCPServer.ts:803-810,904-937`), `:141` (middleware — cites `MultipartParser.ts:19,36`). These are the fullest reasoned form; `:139` explicitly says "Record the ruling in tool's guide so it is not reopened."
- `/home/user/lsp/.orkestrel/campaign/design-analyst-report.md:115-118,123,134` — objective-lane corroboration, same four packages, same conclusion, with type-level citations (`process/src/core/types.ts:203-273`, `queue/src/core/types.ts:78-115,206-229`, `tool/src/core/types.ts:83-93,169-183`, `middleware/src/core/types.ts:20-33,35-65`).
- `/home/user/lsp/.orkestrel/campaign/orkestrel-fleet-report.md:25-28,37` — the raw discovery grep behind the rulings (process progress-bar note at `:217`, queue's lifecycle-only surface, middleware's `UploadStatus` staged/moved fact).

**Guide structure** (heading list per file, so the builder brief can name an exact insertion point):
- `/home/user/queue/guides/queue.md` — `Surface(34) / Methods(107) / Contract(138) / Persistence(154) / Observing(193) / Patterns(217) / Tests(299) / See also(307)`. Existing progress mention: `:29` (blockquote CUT list: "no delay / progress / message channels") and `:149` ("Still deliberately CUT: … the progress / message channels"). No dedicated boundaries section — the ruling most naturally extends the existing CUT language at `:149` or gets its own subsection before `Tests`.
- `/home/user/process/guides/process.md` — `Surface(18) / Methods(210) / Supervised children(264) / Command resolution(594) / One-shot runs(703) / Detached spawns(862) / The keyed registry(884) / Errors(945) / Observing(1022) / Patterns(1059) / Vocabulary(1211) / Tests(1227) / See also(1323)`. Existing progress mention: `:269` ("A child that redraws a progress bar with a carriage return therefore yields one line per…"), matching the analyst's `:217` citation of the same idea in source. No boundaries section; insertion point is a new subsection late in `Patterns` or a short note before `Tests`.
- `/home/user/tool/guides/tool.md` — `Surface(31) / Methods(86) / Anatomy of a tool(108) / The registry(148) / Calls and results(183) / Callers(237) / Tests(254) / See also(261)`. Line `:26` (inside a blockquote spanning ~20-25) already reads "**Mechanism only.**… Each trust decision belongs to the invoking consumer, to a policy layer, or to the tool itself" — this is the existing boundary/mechanism-only framing the progress ruling must join, not duplicate. No existing progress mention.
- `/home/user/middleware/guides/middleware.md` — `Surface(21) / Methods(256) / Contract(308) / Patterns(467) / Tests(750) / See also(781)`. Dense existing multipart documentation (`:67,104-118,150-160,193-224,234-237,436-447,652-720`) but no lifecycle/progress callback mentioned yet — `MultipartOptions` at `:112` has no `onProgress`-style key today, so the ruling either documents a future reporter-callback option as intentionally excluded now, or the campaign's later unit adds that key and the guide row together. Confirm which before drafting: the audit and design reports both describe the trigger as answered "with a reporter callback in the multipart options," which reads as a capability not yet implemented in `MultipartOptions` (`:112`).

Distillate: G1's builder brief can cite `audit.md:120-122,134-137,152-155` as the primary ruling text, `design-planner-report.md:135,137,139,141` for the fuller reasoning and file:line citations to embed, and insert each ruling into: queue's `Patterns` section near `:149`'s CUT language, process's `Patterns`/pre-`Tests` area near `:269`, tool's existing mechanism-only blockquote at `:26`, and middleware's `Patterns` or a new subsection near the multipart documentation block (`:652-720`) — none of the four guides has a pre-existing "boundaries" or "non-goals" heading, so each ruling is a net-new subsection or an extension of an existing CUT/mechanism-only passage. Every repo gates the edit through `tests/guides.test.ts`.

Unknowns: whether `MultipartOptions` (`middleware/src/core/types.ts`, not read this pass) already declares a progress-callback field — the guide's `:112` table shows none, but source truth wasn't checked; the builder should confirm before writing middleware's ruling as purely "excluded" versus "excluded pending W1/later unit."

Deviation: none — sweep completed within the bounded read; no launch was needed. Branch-name mismatch (actual `claude/orkestrel-lsp-resume-wr46dd` vs. brief's stated `claude/lsp-spec-audit-est33d`) is the one fact worth correcting before the next dispatch.

## Orchestrator settlements, 2026-08-26

- **The branch discrepancy is corrected.** The four repos carried the session-template branch
  from clone time; each is checked out to `claude/lsp-spec-audit-est33d` from its remote, whose
  head equals the prior `main` content — queue `3a9a7a7`, process `817464d`, tool `7a52395`,
  middleware `8ea6c03` — with clean trees.
- **The middleware unknown is settled by a probe.** `grep -in progress
  /home/user/middleware/src/core/types.ts` matches nothing; the `report` member at
  `types.ts:32` is an error sink. No progress capability exists in middleware's contract, so the
  guide ruling documents the admitting trigger as a condition for a future admission, never as a
  live key.
