# Routing record — resumed session, 2026-08-26

## Bench liveness

The Codex bench probed live on a bounded round-tripped model call. The probe ran
`codex exec --json --sandbox read-only --model gpt-5.6-sol` with effort `low` from `/home/user/lsp`
and the reply read back exactly `BENCH-LIVE lsp-campaign 2026-08-26`, exit 0. Journal:
`tmp/codex/probe-2026-08-26.jsonl`; last message: `tmp/codex/probe-2026-08-26-last.md`. The probe
followed device-auth recovery in the same session: the CLI resolved (`codex-cli 0.149.1`),
authentication was initially unavailable, the login backgrounded with output captured to
`tmp/codex/login-2026-08-26.log`, the user authorized the one-time code, and `codex login status`
then reported `Logged in using ChatGPT`.

## Orchestrator engine

This session's Orchestrator runs on Claude Fable 5, not Opus 5, per the session configuration. The
Claude Code bridge fixes that its Orchestrator duties are unchanged when configured otherwise. Lane
routing is unaffected: the subjective lane stays Opus 5 native, the objective lane stays GPT-5.6
Sol across the Codex bench. Where a bench-dark substitution table names the remaining native
engine, this session records the substitute as its configured native engine.

## Container state

The container came up fresh with no installed dependencies in any checkout, proven by a vitest
startup failure (`ERR_MODULE_NOT_FOUND: Cannot find package 'vitest'`) in `/home/user/markdown`.
Installs run as Orchestrator-owned tracked commands (`npm ci`) per checkout before any gate or
bench exec runs there; the bench sandbox denies network, so no unit installs for itself. The
markdown and mcp installs ran first, for the units in flight.

## The routing ledger for the units in flight

| Unit | Role | Engine | Transport |
| --- | --- | --- | --- |
| `m4-mirror` | `sol` | GPT-5.6 Sol | journaled `codex exec`, workspace-write, `-C /home/user/mcp` |
| `h2.1` audit | `reviewer` | Claude Opus 5 | native subagent, read-only, evidence supplied by the Orchestrator |
| `m4-mirror.1` | `sol` | GPT-5.6 Sol | journaled `codex exec`, workspace-write, `-C /home/user/mcp`, successor of `m4-mirror` |
| `h2.2-prose` | `implementer` | Claude Opus 5 | native subagent, sole writer in `/home/user/markdown` |
| P2 terrain | `grok` | Cursor Grok | journaled `agent -p`, read-only over `/home/user/probe` |

## Cursor bench liveness

The Cursor bench probed live on a bounded round-tripped model call: `agent --version` resolved
`2026.08.11-e8db854`, `agent models` lists the pinned `cursor-grok-4.6-high`, and the probe reply
read back exactly `BENCH-LIVE cursor 2026-08-26`, exit 0, journal
`tmp/cursor/probe-2026-08-26.log`, instrument `tmp/cursor/run-probe.sh`.

## Rulings taken this session

- **The `m4-mirror` formatter deviation.** The vendored byte-identical mirror fails the mcp
  formatter because the published scaffold 0.0.53 `dist/host/dotfiles/prettierignore` carries no
  `tests/mirrors/` exclusion, while scaffold's own tree at `.prettierignore` and the lsp target
  (commit `586758d`) both carry it. Ruling: the `m4-mirror.1` successor adds the byte-identical
  block to `/home/user/mcp/.prettierignore`; the local copy converges with the vendored surface at
  scaffold's registered release, the same way lsp's does. The mirror file itself never reformats.
- **The `m4-mirror` red row.** The unit's own conformance instrument caught its
  `TaskStatusNotificationParams metadata` row disagreeing with the schema's `$defs` nesting
  (`Tests 1 failed | 41 passed (42)`, evidence `.orkestrel/mcp/m4-mirror-conformance-red.txt`).
  The row's author fixes its transcription in `m4-mirror.1`, or stops if reading the schema shows
  genuine authority drift.
- **The h2.1 exit-criterion amendment.** The reviewer's referral was verified and the corrected
  derivation clause is appended to `h2-audit-reconciliation.md` as Amendment 2026-08-26; the
  `h2.2-prose` brief cites the amendment.

The h2.1 audit evidence is Orchestrator-produced because the reviewer lane cannot execute: the
isolated h2.1 diff (reconstructed from the committed checkpoint against the retained round diff),
the green runs of the two red-first rows, and revert-proof controls that redden exactly those rows
under the pre-fix sources, with the exact restore proven by an empty `git status --porcelain`.

## Routing rows added at the m4-mirror.1 and h2.2-prose boundary

| Unit | Role | Engine | Route and record |
|---|---|---|---|
| `m4-mirror.1` acceptance | Orchestrator | — | Host gates after the bench denied the conformance listener: `format:check` 0, digest pinned, conformance `42 passed (42)`. mcp checkpoint `bc54b38`. |
| `h2.2-prose` integration | Orchestrator | — | The unit's exact `Markdown.ts` `@returns` patch applied serially; scoped `oxfmt --check` exit 0. |
| `h2.2-audit` | `analyst` | GPT-5.6 Sol (bench, read-only) | Audits the Opus-written `h2.2-prose` against the held markdown tree. Queued first on the Sol bench; `m4-stream` follows it, one lane at a time. |
| `m4-stream` | `sol` | GPT-5.6 Sol (bench, workspace-write) | Launches after `h2.2-audit` terminates, from the clean `bc54b38` baseline. |
| `g1-queue`, `g1-process`, `g1-tool`, `g1-middleware` | `builder` | Sonnet (native) | Parallel across the four disjoint checkouts; each owns its own guide plus its `tests/guides.test.ts` run. Briefs from `g1-terrain-distillate.md`. |
| `p2-range` | `implementer` | Opus 5 (native) | Still in flight in probe; Sol `analyst` audit on return. |

Carried finding: the `Markdown.ts:27-28` class TSDoc over-claim from the `h2.2-prose` report is
carried by the `h2.3-fences` brief, recorded in `state.md`'s H2 table.

## Routing rows added at the m4-stream and h2.2.1-prose boundary

| Unit | Role | Engine | Route and record |
|---|---|---|---|
| `m4-stream` acceptance | Orchestrator | — | Host re-verification after the bench run: the scoped helpers and MCPServer suites `310 passed`, tree-wide `format:check` exit 0. mcp checkpoint `bef9f40`. |
| `h2.2.1-prose` | `implementer` | Opus 5 (native) | Landed; markdown checkpoint `e4c434c` with scoped gates green (`592 passed`, guides `18 passed`). Audit rides as added claims in the `h2.3-fences` Sol `analyst` round. |
| `m4-proof` | `implementer` | Opus 5 (native) | In flight in mcp from the clean `bef9f40` baseline. Question-2 invariants plus the end-to-end producer-to-client proof, mutation-bound to the two landed sites. |
| `h2.3-fences` | `implementer` | Opus 5 (native) | In flight in markdown from the clean `e4c434c` baseline. R4: the provenance fences transcribed into executed rows. |
| `p2-range` deciding runs | Orchestrator | — | `npm run build` exit 0; `test:src` under load read one timing red (`Probe.test.ts` deadline fixture, concurrent with the `h2.2.1` writer); the same file alone reads `26 passed (26)` exit 0, so the load red is contention per the concurrency rule on timing failures. |
| `p2-audit` | `analyst` | GPT-5.6 Sol (bench, read-only) | Launches on the free bench after a claim-5 correction: the staged brief demanded applied-and-reverted mutations of a read-only exec, so the Orchestrator re-runs every mutation-table row on the host as supplied executed evidence (`p2-audit-instrument.sh`) and the lane attacks the consistency of report, instrument readings, and source. |
