# Unit m4-mirror.1 — successor to m4-mirror, closing the `.prettierignore` deviation and the one red conformance row

## Role and engine

You are the GPT-5.6 Sol `implementer` route (Codex, model `gpt-5.6-sol`, effort high),
working directly in this checkout (`/home/user/mcp`). Perform this assignment yourself.
Spawn no subagent, no nested Codex session, no other process tree.

## This is a successor brief

This amends `tmp/codex/m4-mirror-brief.md` (the original `m4-mirror` unit). Read that file
in full first — this brief does not restate its Role, Read-first, Objective steps 1-6, or
Execution sections, all of which still bind. This document states only what changed and why.

The original unit stopped with a recorded deviation
(`tmp/codex/m4-mirror-deviation.md`, mirrored for audit at
`/home/user/lsp/.orkestrel/mcp/m4-mirror-deviation.md`): the vendored mirror
`tests/mirrors/ext-tasks-2026-07-28-schema.json` is byte-identical to the pinned digest
but the repository formatter rejects its JSON formatting, and the original brief left
`.prettierignore` report-only with no mechanism to exclude the mirror. Separately, an
audit run after the stop found the conformance suite carrying one drifted row.

Corrected before launch, 2026-08-26: the stopped run's work is committed as the mid-round
checkpoint `2b823f9` on the `claude/lsp-spec-audit-est33d` branch, so this tree
(`/home/user/mcp`) is CLEAN at start — `git status --porcelain` prints nothing. Your work
continues on that committed baseline. The checkpointed files are in HEAD; never revert
them, and no git write command is available to you regardless (`.git` mounts read-only).

## What changed from the original brief

### 1. `.prettierignore` moves from report-only to a scoped owned file

The original brief listed `.prettierignore` under "Shared files — report-only, never
edit." This successor narrows that: `.prettierignore` is now owned, but for exactly one
addition — the identical exclusion block the Orkestrel scaffold fleet already uses for
fetched-bytes mirrors, and that the lsp target (a sibling package under this same
Orkestrel convention) already applied to its own tree in commit `586758d` when it vendored
its own mirror. This is not a new invention; it is copying an inventory-adopted exclusion
locally, because the published `@orkestrel/scaffold` 0.0.53 vendors
`dist/host/dotfiles/prettierignore` without this block yet — the block exists in
scaffold's own source tree (`/home/user/scaffold/.prettierignore`) ahead of its next
publish, and every consumer that needs it now adds it locally rather than waiting.

Confirmed source text (`/home/user/scaffold/.prettierignore`, tail):

```text
# Fetched-bytes mirrors keep their upstream bytes and stay out of the formatter.
tests/mirrors/
```

Confirmed current state of `/home/user/mcp/.prettierignore` (unchanged by the stopped
run, ends after the `.orkestrel/` block):

```text
# Campaign records under the orchestration folder are verbatim evidence, not formatted source.
.orkestrel/
```

**Append, byte-for-byte, exactly this to the end of `/home/user/mcp/.prettierignore`** —
one blank line, then the comment line, then the path, with a trailing newline matching
the file's existing convention:

```text

# Fetched-bytes mirrors keep their upstream bytes and stay out of the formatter.
tests/mirrors/
```

Change nothing else in this file. Do not touch `dist/`, `demo/showcase.html`, or the
`.orkestrel/` block above it.

### 2. The one red conformance row gets corrected against the real schema, not assumed

An audit run of the stopped tree found:

```text
Tests  1 failed | 41 passed (42)
```

Failing case: `'TaskStatusNotificationParams metadata' matches the Tasks schema` at
`tests/conformance.test.ts:114`. The failure message shows what the schema actually
declares at those coordinates:

```text
"params":{"$ref":"#/$defs/NotificationMetaObject"},"metadata":{"type":"object","properties":{"io.modelcontextprotocol/subscriptionId":{"$ref":"#/$defs/RequestId", ...}}}
```

The row's current `expected` value in `tests/setupConformance.ts` (or wherever this row's
data lives, per your own step-3 placement in the original run) does not match this
structure. Re-derive the row's expected fragment by reading
`tests/mirrors/ext-tasks-2026-07-28-schema.json` yourself at the
`TaskStatusNotificationParams` / `NotificationMetaObject` coordinates the failure message
names, and correct the row's expected value to match the schema's actual declaration
(structural shape, not the JSDoc prose — per the original brief's governing-spec
instruction to follow the schema over the JSDoc wherever they disagree).

**If, on reading the schema, you conclude the row was already correct and the mismatch
reflects genuine authority drift rather than a transcription slip in the row** — stop here
and write the Deviation section (per the original brief's Deviation contract) instead of
proceeding. Do not edit the row to make a red result go away if the schema itself
disagrees with what the row is claiming; that is a finding to escalate, not a fix to make.

Touch only this row and only inside the files the original brief already scopes you into
(`tests/setupConformance.ts`, `tests/conformance.test.ts`) — do not touch the mirror file
itself; its digest is pinned and immutable.

## Scope (successor delta only — everything else from the original brief's Scope section still applies)

**Owned files:**

- `tests/mirrors/ext-tasks-2026-07-28-schema.json` — present, immutable, do not edit.
- `tests/setupConformance.ts` — edit, as originally scoped, plus the row-3 correction.
- `tests/conformance.test.ts` — edit, as originally scoped, plus the row-3 correction.
- `.prettierignore` — newly owned, for exactly the one-block addition above. Nothing
  else in this file changes.

**Off-limits:** unchanged from the original brief — everything under `src/`, everything
under `guides/`, every other file under `tests/` not named above, `vite.config.ts`,
`package.json`, `package-lock.json`, `tsconfig*.json`, anything under `.claude/` or
`.agents/`, and anything under `/home/user/lsp` (read-only reference). The `guides`
vitest project stays un-run — its redness is a known, out-of-scope standing condition a
later unit closes; do not investigate it and do not report it as a finding here.

## Acceptance criteria — run in this exact order, recording command and output for each

1. `npx --no-install oxfmt --config .oxfmtrc.json --check tests/setupConformance.ts tests/conformance.test.ts` exits 0.
2. `npm run format:check` exits 0. Run this only after the `.prettierignore` addition
   lands — before that addition the mirror is still inside the formatter's population and
   this gate fails on it, which is expected and not a new deviation.
3. `npx --no-install oxlint --deny-warnings tests/setupConformance.ts tests/conformance.test.ts` exits 0.
4. `npm run check` exits 0.
5. `sha256sum tests/mirrors/ext-tasks-2026-07-28-schema.json` prints
   `bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460` — paste the exact
   output line. The mirror file itself must be byte-identical to the original run; this
   confirms the `.prettierignore` and row-3 work did not touch it.
6. `npx vitest run --project conformance` exits 0; paste the full reported pass count
   (expect `42 passed (42)` once the row is corrected).

Do not run `npm test` unscoped and do not run the `guides` project.

## Deviation contract

Unchanged from the original brief, plus: if the row-3 correction reveals the mismatch is
genuine authority drift rather than a row transcription slip, that is itself a primary-
objective conflict — stop and report it per the Deviation contract rather than editing the
row to force a pass.

## Review evidence

This is a code change: return the actual diff for every owned file
(`tests/setupConformance.ts`, `tests/conformance.test.ts`, `.prettierignore`), and the
actual `git status --short` output, in the report. Do not summarize the diff in prose in
place of pasting it.

## Output

Write the report to `/home/user/mcp/tmp/codex/m4-mirror.1-report.md`. A write outside
`/home/user/mcp` is rejected by the sandbox; report the rejection under Deviation instead
of seeking another mechanism.

Report shape:

- What changed, per file (prose, short), naming this as the successor to `m4-mirror`.
- The `.prettierignore` diff and confirmation the mirror is now excluded from formatting.
- The row-3 correction: what the row said before, what the schema actually declares, what
  the row says now, with the schema coordinates cited.
- The row membership list carried forward unchanged from the original unit's own report,
  plus a note that row 3 (`TaskStatusNotificationParams metadata`) was corrected.
- All six acceptance criteria's exact commands and outputs, in order.
- Any claim you cannot fully verify, flagged explicitly.
