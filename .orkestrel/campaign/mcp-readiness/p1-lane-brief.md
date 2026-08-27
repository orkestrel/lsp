# Audit round A-P — the probe pre-release queue (P1, P2)

You are one lane of an adversarial falsification round. Attempt to refute every claim; never
confirm by reading alone where you can attack. `CONFIRMED` requires naming the attack you tried
that failed. A claim you cannot decide is `UNRESOLVED`, not `CONFIRMED` — say what would settle
it. Do not hedge toward an imagined consensus. Perform the assignment directly and spawn nothing.

## Subject

The probe repository's readiness chain on `main`: P1 (`019c18a`, `prove` results carry
`structuredContent` beside the `formatVerdict` text, with a published key bound and fallback) and
P2 (`89f7bd7`, the default bounds move to `src/core/constants.ts`). You are rooted in a detached
worktree at `89f7bd7` — the exact audited tip — with its own installed dependencies (the
registry state the commits were written against). The main checkout is out of bounds.

## What the round decides

Whether the probe pre-release queue is accepted into the release wave. A finding now is worth
more than a clean pass: the alternative is a consumer finding it after the version is spent.

## Already established by the Orchestrator directly — do not re-run

- The workspace oxlint `--lsp` answers `initialize` in 155 ms (measured 2026-08-27); the
  `LINT_DEADLINE` value question is settled.
- The live `.mcp.json` registration drives the shipped entry in this harness today.
- The `2026-07-28` tools page states the row-31 SHOULD (structured content beside serialized
  JSON text) — the departure from it is a declared decision, not a defect; attack whether the
  declaration is TRUE, not whether the departure exists.

## Evidence

In `tmp/audit/` beside this brief: `p1.diff` and `p2.diff` (the actual commits), `status.txt`
(the worktree's clean status), `p1-report.md` and `p2-report.md` (the writers' reports —
testimony, not ground truth).

## Execution ground rules

- Probes live under `tmp/probe/` (the `probe` Vitest project collects `tmp/probe/**/*.test.ts`)
  or run by explicit vitest path. Delete every probe before returning.
- The `src:bin` project drives `dist/`; run `npm run build:src:server` before a bin drive
  (P1's recorded ancillary).
- Scoped runs only (`npm run test:src:server`, `npm run test:src:bin`, or `-t` filters). Never
  tree-wide `format`, `lint --fix`, or `build`.
- A seeded mutation is allowed only with its exact restoration: edit, observe, undo exactly that
  edit, and end with `git status --porcelain` empty apart from `tmp/`.
- A lane without an execution tool rules from the supplied records and returns `UNRESOLVED`
  where they do not reach; it does not guess.

## Claims

1. A successful modern-era `prove` answers with `structuredContent` deep-equal to the produced
   `Verdict` and exactly one `content` entry of `type` `text` equal to `formatVerdict` of that
   same verdict.
2. The legacy projection — the shipped bin entry behind `createMCPLegacy`, driven by a legacy
   client — delivers the identical `structuredContent` unchanged.
3. Failed tool results (`isError`) and every `ProbeError` refusal path answer exactly as they
   did before P1 (baseline `019c18a^`).
4. The bound arithmetic holds as documented: an empty-issue verdict's whole result clears the
   64-key default; a two-issue verdict exceeds it; under the published `PROBE_KEYS` bound a wide
   verdict answers normally; and with the published limit seeded out, a two-issue verdict's
   reply is the `-32603` protocol error the guide names.
5. When the assembled result exceeds the published bounds, the reply still carries the
   `formatVerdict` text block with its closing receipt line (the fallback preserves the receipt).
6. P2 is behavior-identical: the constants carry the same values consumed at the same sites, and
   no observable behavior moved between `019c18a` and `89f7bd7`.
7. Every sentence the two commits added to `guides/probe.md` is true as stated — the
   record-beside-text claim, the departure declaration, the bound sentence with its measurement,
   and the Constants Surface rows.
8. The two commits touch only the files their units owned (P1: `src/server/ProbeServer.ts`, the
   two test files, `guides/probe.md`; P2: `src/core/constants.ts`, `src/server/Probe.ts`,
   `src/server/stages/LintStage.ts`, `src/server/ProbeServer.ts`, `guides/probe.md`), and
   introduce no banned construct: no `any`, no type assertion, no suppression directive, no
   nested function declaration, no module-scope data outside a data-kind file.
9. The updated client drives correctly reflect that the mcp client prefers `structuredContent`
   (`MCPCallOutcome.value` is now the record), and a consumer meets that consequence in the
   guide where it reads about driving the server with a client.
10. The writers' own sound-and-unchanged verdicts are sound. Pick the ones you judge most likely
    wrong — at least the claim that the text-only fallback needs no test, and the claim that no
    off-limits file was touched — attack them, and say how many you attacked.

## Unknowns

- Whether the fallback branch (claim 5) is reachable through a real claim at feasible cost. If
  you construct one (for example a control file carrying hundreds of real lint findings), report
  the construction; if you cannot decide at feasible cost, rule `UNRESOLVED` with what would
  settle it.

## Verdict shape

Return numbered verdicts in claim order, each exactly one of `CONFIRMED` (with the attack that
failed), `BROKEN` (with the exact failing input, state, or interleaving, and the smallest correct
fix), `UNRESOLVED` (with what would settle it), `NOT-EVIDENCED` (with the missing capture). Then
findings fitting no claim, each substantiated to the `BROKEN` standard. Then exactly one terminal
line:

```text
VERDICT: PASS — <m> of <m> confirmed, no findings outside the claims
VERDICT: FAIL — <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims
```

No process diary. No summary of what was read.
