# Unit m4-mirror — tasks-wave conformance mirror

## Role and engine

You are the GPT-5.6 Sol `implementer` route (Codex, model `gpt-5.6-sol`, effort high),
working directly in this checkout. You perform this assignment yourself and spawn no
subagent, no nested Codex session, and no other process tree.

## Read first, in order

1. `AGENTS.md` at the root of this checkout — the coding contract. Non-negotiables and
   design laws bind this unit exactly as they bind any other.
2. `.claude/rules/writing.md` and `.claude/rules/tests.md` — governs test file structure,
   naming, and prose in this unit's report.
3. `.agents/orchestration.md` § Dispatch anatomy and § Deviation protocol — the stop-and-
   report contract this brief's Deviation contract section instantiates.
4. This brief, in full, before writing anything.

No skill is named for this unit; none is required.

## Context

### Standing conditions (verified 2026-08-26; do not re-derive these)

- This checkout (`/home/user/mcp`) is clean at commit `f1632ad` on branch
  `claude/lsp-spec-audit-est33d`. `git status --porcelain` prints nothing at the start.
- The staged authority JSON lives at `/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.json`,
  reachable read-only from inside this exec (`--sandbox workspace-write` permits reads outside
  the exec root; only writes outside `/home/user/mcp` are rejected). Its SHA-256 is
  `bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460`. Recompute it yourself
  with `sha256sum` before vendoring rather than trusting this line alone, and stop if it
  disagrees.
- `tests/setupConformance.ts`, `tests/setupConformance.test.ts`, and `tests/conformance.test.ts`
  already exist in this tree. There is no `tests/mirrors/` directory yet — create it.
- `vite.config.ts:180-196` defines the `conformance` project: it runs only
  `tests/conformance.test.ts` with `tests/setup.ts` as its setup file, `environment: 'node'`.
  Do not add files to its `include` list; do not touch `vite.config.ts` at all (off-limits).
- A sibling package at `/home/user/lsp` (also readable from this exec) carries the precedent
  for this exact mirror pattern: `tests/setupConformance.ts`, `tests/conformance.test.ts`, and
  `tests/mirrors/metaModel.json`. Read all three before writing this unit's version. Follow
  their shape — typed comparison-row arrays exported from `setupConformance.ts`, a digest
  constant and a `readConformanceDrift` helper, `describe`/`it.each` blocks in the test file —
  adapted to this package's Task extension schema rather than LSP's metaModel. Do not import
  anything from `/home/user/lsp` at runtime; it is read-only reference material, never a
  dependency.
- Baseline gates at `f1632ad`: `format:check`, `lint:check`, `check`, and `build` all exit 0.
  The `src` vitest project reports 1143 passed, 1 skipped. **The `guides` vitest project is
  RED BY DESIGN right now** — a prior unit (`m4-contract`) added six symbols the guide prose
  does not document yet, and a later unit (`m4-guide`) closes that gap. Do not run the
  `guides` project, do not investigate that redness, and do not report it as a finding of
  this unit — it is a known, out-of-scope standing condition.
- The exec sandbox denies network entirely (no `npm install`, no fetches of any kind) and
  mounts `.git` read-only — every git command that takes the index lock (`checkout`,
  `reset`, anything writing refs) fails; `status`, `diff`, and `log` work normally. Do not
  attempt an install or a git write.

### Governing spec

Section 4 ("verification form") of `/home/user/lsp/.orkestrel/mcp/m4-design-reconciliation.md`
is this unit's charter for what "conformance" means here — read it in full before drafting
row membership. The unit-cut table row for `m4-mirror` amends section 4: this mirror uses
the analyst's file name (`ext-tasks-2026-07-28-schema.json`, not any name section 4 might
otherwise imply) and additionally rows the integer formats and the get-result distinctness
(see Row membership below). The reconciliation's Risks section also carries two items this
mirror's rows must follow: the membership rule and its negative control, and the fact that
the authority's own JSDoc contradicts itself between `tasksStatus` and `taskIds` — where the
mirror's rows touch that contradiction, follow the schema's actual declaration (the JSON
Schema's structural shape), not the JSDoc prose, and do not attempt to reconcile or flag the
JSDoc contradiction — that belongs to a different unit.

## Unknowns

- The exact JSON Schema shape of `ext-tasks-2026-07-28-schema.json` (property names, nesting,
  `$defs` structure) is not restated in this brief. Read the file yourself before writing
  comparison rows; derive each row's `expected`/`model` (or equivalent field names, matching
  the lsp precedent's row shape) from what the schema actually contains.
- Whether every named row-membership item (Task requiredness and nullability, TaskStatus
  members, DetailedTask variants, CreateTaskResult, the three result types, notification
  params, taskIds fragments, extension capability, method literals, schema `$id`) maps to
  exactly one test row or to several is your call: follow the lsp precedent's granularity
  (one `it.each` case per symbol-level fact) and record your row count in the report so the
  auditor can check membership against the list, not against a preassumed count.

## Scope

**Owned files** (create or edit freely, and only these):

- `tests/mirrors/ext-tasks-2026-07-28-schema.json` (new)
- `tests/setupConformance.ts` (edit — add exports; do not remove any existing export the
  file already has for the LSP-side conformance work, if any collides in name, prefix or
  rename this unit's new exports instead of colliding)
- `tests/conformance.test.ts` (edit — add describe/it blocks; do not remove existing ones)

**Shared files — report-only, never edit:** `vite.config.ts`, `package.json`,
`package-lock.json`, `tsconfig*.json`, any file under `.claude/` or `.agents/`.

**Off-limits — never touch:** everything under `src/`, everything under `guides/`, every
other file under `tests/` not named above (including `tests/setup.ts`,
`tests/setupConformance.test.ts`, and any `tests/src/**` or `tests/app/**` file), and
anything under `/home/user/lsp` (read-only reference, not a target).

**Allowed tools:** shell, file read/write inside `/home/user/mcp`, `sha256sum`, the
package's own `npm run` scripts and `npx vitest`. No install, no network.

## Execution

Perform this assignment directly. Spawn no subagent, no nested Codex CLI, no detached
process group. You are the sole writer in this tree for the unit's duration.

## Deviation contract

A conflict with the primary objective — the vendored JSON failing to match the pinned
digest, a row the schema cannot support, an owned file that cannot be edited without
touching an off-limits file, or any standing-red project other than `guides` turning
red — stops the unit. Stop, do not improvise a workaround, and write the report's
Deviation section per the Output section below instead of the full report shape.

An ancillary conflict — where inside `setupConformance.ts` a new export sits, what a
helper is named beyond following the lsp precedent's naming pattern, how `describe`
blocks are grouped in `conformance.test.ts` — is yours to decide, record, and continue
from.

## Objective

1. Recompute `sha256sum` of `/home/user/lsp/.orkestrel/mcp/ext-tasks-2026-07-28-schema.json`
   and confirm it equals `bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460`.
   Stop if it disagrees (Deviation contract).
2. Copy that file byte-identical into `tests/mirrors/ext-tasks-2026-07-28-schema.json`
   (new directory). Confirm the copy's own `sha256sum` matches the same digest.
3. In `tests/setupConformance.ts`, following the lsp precedent's shape: add a constant
   pinning the raw SHA-256 above, add a constant pinning the schema's `$id`
   (`https://modelcontextprotocol.io/ext-tasks/2026-07-28/schema.json`), add a path
   constant pointing at the vendored mirror file, and add whatever typed row arrays and
   digest/drift helper(s) the new test rows need — reuse the existing
   `readConformanceDrift`-equivalent pattern if one already exists in this file for
   another purpose, or add an analogous helper scoped to this schema if none does.
4. In `tests/conformance.test.ts`, add `describe`/`it.each` coverage whose row membership
   is exactly this union (derive each row's exact expected/actual values from the real
   schema content, not from paraphrase):
   - Task requiredness, including `ttlMs` nullability, and the integer formats (`int32`/
     `int64` or whichever the schema actually declares) on every integer-typed property.
   - Every `TaskStatus` enum member.
   - Every `DetailedTask` variant, each with its own owed payload shape.
   - The flat `CreateTaskResult` shape carrying `resultType: 'task'`.
   - The three `resultType: 'complete'` result shapes for get, update, and cancel, with
     the get-result kept distinct from update/cancel (the get-result distinctness this
     unit's amendment adds beyond section 4's original list).
   - `TaskStatusNotificationParams` flatness and its metadata shape.
   - The request-side and acknowledged-side `taskIds` fragments (both directions).
   - The extension capability object being exactly empty (no properties beyond what the
     schema actually declares, and no fewer).
   - Every method literal the schema declares.
   - The schema's own `$id` string.
5. Add one negative control drawn from OUTSIDE this membership list — a comparison that
   is not part of the rows above, that the real schema fails under the same drift-checking
   mechanism the real rows use. Run it, record its failing output verbatim in the report,
   then remove it (or invert it into a passing assertion, whichever the lsp precedent
   itself does — read the precedent to see which and match it) before the unit's final
   gate run. Do not leave a permanently failing test in the committed tree.
6. Add no dependency of any kind — no JSON-Schema validator library, nothing. Every check
   is a direct structural read of the parsed schema object against the typed row data.

## Acceptance criteria

Run in this order, cheapest first; record the exact command and output for each:

1. `npx --no-install prettier --check tests/mirrors/ext-tasks-2026-07-28-schema.json tests/setupConformance.ts tests/conformance.test.ts` (or this package's equivalent `format:check` invocation scoped to these three paths) exits 0.
2. `npx --no-install oxlint --deny-warnings tests/setupConformance.ts tests/conformance.test.ts` (or this package's equivalent scoped lint invocation) exits 0.
3. `npm run check` exits 0 (typecheck; this cannot be scoped narrower than the package's
   own script, so run it as-is and report its full exit code).
4. `sha256sum tests/mirrors/ext-tasks-2026-07-28-schema.json` prints
   `bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460` — paste the exact
   output line.
5. `npx vitest run --project conformance` exits 0; paste the reported pass count.
6. The negative control's failing run, with its command and full output, recorded before
   it was removed or inverted.

Do not run `npm test` unscoped and do not run the `guides` project; both would surface the
already-known, out-of-scope guides redness and waste the unit's turn diagnosing it.

## Review evidence

This is a code change: return the actual `git diff` (or per-file diffs) for every owned
file, and the actual `git status --short` output, in the report. Do not summarize the diff
in prose in place of pasting it.

## Output

Write the report to `tests/../tmp/codex/m4-mirror-report.md`, i.e.
`/home/user/mcp/tmp/codex/m4-mirror-report.md` — a path inside this checkout. A write
outside `/home/user/mcp` will be rejected by the sandbox; do not seek another mechanism if
that happens, report the rejection under Deviation instead.

Report shape:

- What changed, per file (prose, short).
- The row membership as actually implemented, listed against the union in Objective step 4
  so the auditor can check it item by item.
- The digest proof (step 4's pasted output) and the vendored file's own recomputed digest.
- The negative control's failing-run proof (step 6) and how it was resolved afterward.
- Every acceptance-criterion command and its exit code / relevant output.
- `git status --short` and the full diff for each owned file.
- Any claim in this report you are not fully certain of, named explicitly as flagged for
  the auditor.

No process diary — no narration of intermediate exploration, only the final measured
state and the evidence behind each claim.

Your final message to the harness must be this report's full content, verbatim.
