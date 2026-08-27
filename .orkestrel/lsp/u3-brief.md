# U3 — ROADMAP reconciliation and the deferral record

## Role and engine

`implementer` — Claude Opus 5, native.

## Objective

Rewrite `ROADMAP.md` so it carries no stale live-state claim, records this campaign's rulings and
delivered chunks, verifies every carried fleet finding against U0's table, and gives every `Next`
row a close condition or a trigger.

## Context

Read before editing: `AGENTS.md` § Writing; `.claude/rules/writing.md`;
`.claude/rules/documentation.md`; the current `ROADMAP.md` in full; `.orkestrel/lsp/plan.md`
(rulings 2-9 and the exit criterion); `.orkestrel/lsp/u0-fleet-findings-distillate.md` (the
strike/keep table); `.orkestrel/lsp/d2-reconciliation.md` (the parser ruling and its retained
tensions); `.orkestrel/lsp/complexity-probe-results.txt`; and `git log --oneline -8` for the
campaign's commit hashes. No dispatch-named skill applies.

Host facts: Windows 11; run npm scripts as plain single commands; your baseline is the commit
that landed the A1 audit record (confirm a clean tree before starting).

The design round's ROADMAP ruling (plan.md ruling 8, subjective verdicts § 8), binding:

- **Opening paragraphs stay, edited**: the `.orkestrel/` navigation sentence (`ROADMAP.md:19-22`)
  becomes a git-history statement naming this campaign's record under `.orkestrel/lsp/` and the
  commits that carry it; the `LSPServer` sentence (`:8-9`) takes the trigger from ruling 7.
- **`## Delivered` absorbs `## Delivered to its first consumer`** as its final rows, text
  verbatim, and gains this campaign's chunks with their commit hashes: the combinator adoption,
  the seam fold with the two extractions, and the codec decomposition.
- **Goes in full**: the `## Where the work sits` branch table (`:76-92`) and
  `## The campaign's end` (`:94-109`). No merged branch name may remain anywhere in the file.
- **`## Fleet findings carried forward`**: apply U0's table — strike the html barrel-membership
  half-row (shipped at html `ddd2433a`; keep that bullet's spans-to-markdown half), keep every
  other row. Add the campaign's new findings, each against its owning package:
  - **process** — a supervised child exposes a line stream only (`ProcessInterface.lines`); a raw
    byte-chunk stream would let stdio byte transports drop `node:child_process`.
  - **scaffold** — the oxlint `complexity` rule (installed 1.80.0 supports it; not in any default
    category) is worth fleet adoption as a vendored `.oxlintrc.json` decision: the probe retained
    at `.orkestrel/lsp/complexity-probe-results.txt` read lsp clean at the default max of 20 after
    this campaign's decomposition, and mcp carrying readings of 21-30; `lint:check` runs
    `--deny-warnings`, so enablement gates immediately and needs a fleet sweep first.
- **`## Deliberately deferred`** gains node-ipc with ruling 4's reason (message-shaped, no reach
  stdio lacks).
- **`## Next` becomes the sequenced record**: first any not-yet-landed unit of this campaign
  (none, if you dispatch after everything landed — verify against `git log`), then the triggered
  items, each with its trigger sentence: `SocketTransport` (one `node:net` class; `server` group
  carries `{ host, port }` or `{ path }`) when a consumer must attach to a server it does not
  spawn; WebSocket (platform `WebSocket`, edge re-framing onto the byte seam, per ruling 3) when a
  browser consumer must reach a server it cannot spawn; `LSPServer` deferred until a fleet package
  must answer LSP requests rather than send them, that consumer's first requirement set being the
  design brief; TypeScript 7 conformance reading (user-approved 2026-08-26, conformance-only, a
  later session). Strike `## The client's internal seams` — ruling 2 closed it, and say so in the
  commit message rather than in the file.
- **Record once each, in the section that owns them**: the byte seam retained permanently for
  stream transports with the WebSocket edge-reframing shape (ruling 3); no ecosystem dependency
  added — `abort`, `timeout`, `websocket`, `sse`, `tool`, and `pool` each ruled out with its
  one-line reason (ruling 6); the transport performance reading — probe is warm-resident over
  stdio, warm prove 437-495 ms is linter work, no measured transport bottleneck (ruling 4); the
  parser ruling's retained tensions that outlive the campaign: `parseLSPMessages` keeps its name
  and file although its form throws, and `readLSPHeader` measures above 20 alone by design
  (d2-reconciliation.md).

Writing constraints that bite here: no counts ("the table names each repository" — never "the
nine repositories"); no `should`; no evaluative close conditions — every row's condition is
testable or named as a trigger; dates as YYYY-MM-DD; plain language throughout.

## Unknowns

Whether every campaign unit landed before you start: settle with `git log --oneline -10` and
`git status --porcelain`; if a unit is still in flight, stop and report rather than writing rows
about unlanded work.

## Scope

- Owned: `ROADMAP.md`.
- Off limits: everything else — every `src/`, `tests/`, `guides/` file, `package.json`,
  `.orkestrel/**`.
- Tools: Read, Grep, Glob, Edit, Write, Bash (the two named validation scripts and `git log`,
  `git status`, `git diff` only).
- Validation: `npm run format:check` and `npm run test:guides` (link parity), read-only.

## Execution

You perform this assignment directly and spawn nothing.

## Output

Write your distilled report to `tmp/units/u3-report.md` and return it: the section-by-section
disposition (stayed, edited, merged, struck, added), each fleet-finding row's verdict with its
U0 pointer, the exact commands run with results, the full `git diff`, and
`git status --porcelain`. No process diary.

## Deviation contract

Stop and report when: U0's table conflicts with what you read in the file; a campaign unit the
rows must name has not landed; `test:guides` fails on your change for a reason outside
`ROADMAP.md`. Ancillary choices — section ordering within the fixed set, sentence phrasing — are
yours to decide and record.

## Acceptance criteria, cheap first

1. `git diff --stat` shows `ROADMAP.md` alone.
2. No merged branch name (`claude/lsp-spec-audit-est33d`) remains; the `## Where the work sits`
   table and `## The campaign's end` section are absent.
3. `## Delivered` is one section; the former consumer section's rows survive verbatim; this
   campaign's chunks appear with their commit hashes.
4. Every `## Next` row carries a testable close condition or a named trigger; the internal-seams
   row is gone; no row contains `should` or an evaluative condition.
5. The fleet-findings section matches U0's table plus the two added findings; the struck half-row
   names its commit in YOUR commit-message draft (returned in the report), not in the file.
6. Rulings 3, 4, and 6 each appear exactly once, in the section that owns them; node-ipc sits
   under `## Deliberately deferred`.
7. `npm run format:check` and `npm run test:guides` green.

## Review evidence

The full `git diff` and `git status --porcelain` in the report.
