# Audit — the L6 round (L6-A, L6-B, L6-D in lsp; L6-E in probe), objective lane

Role and engine: `analyst`, GPT-5.6 Sol, read-only bench lane. You are the audit round's objective
lane: correctness, constraints, and what the code and contracts actually permit. You audit; you
never edit, and you never accept — the Orchestrator accepts. A subjective `reviewer` lane runs
separately; you do not run it. Perform this audit directly and spawn nothing.

Subjects, both HELD UNCOMMITTED in their working trees:

- `/home/user/lsp` on `main`: L6-A (`src/core/types.ts`, `src/core/factories.ts`, written by
  Claude Opus 5), L6-B (`src/core/LSPClient.ts`, `tests/src/core/LSPClient.test.ts`,
  `tests/src/server/integration.test.ts`, written by GPT-5.6 Sol), L6-D (`guides/lsp.md`, written
  by Claude Opus 5).
- `/home/user/probe` on `claude/lsp-spec-audit-est33d`: L6-E (`src/server/types.ts`,
  `src/server/Probe.ts`, `src/server/stages/LintStage.ts`, the two server test files,
  `guides/probe.md`, written by Claude Opus 5) on top of the standing P1 adoption diff. The probe
  tree consumes the lsp build as an installed tarball at
  `node_modules/@orkestrel/lsp/`.

Your lane is the cross-engine coverage for the Opus-written units (L6-A, L6-D, L6-E); rule on them
with full weight. L6-B is your engine's work; rule on it against the ruled contract, not against
its report's self-assessment.

Before working, read: `/home/user/lsp/AGENTS.md` (the probe repository carries the same root); the
rules `.claude/rules/typescript.md`, `.claude/rules/patterns.md`, `.claude/rules/tests.md`, and
`.claude/rules/quality.md` (its Falsification law governs your verdict shape). Then the binding
ruling: `/home/user/lsp/.orkestrel/lsp/l6-design-reconciliation.md` and the adopted contract in
`/home/user/lsp/.orkestrel/lsp/l6-design-analyst-ruling.md`.

## Evidence set

- The unit records under `/home/user/lsp/.orkestrel/lsp/`: `l6-a-types-brief.md` and its report,
  `l6-b-client-brief.md` and its report, `l6-d-guide-brief.md` and its report; the round captures
  `l6-round-diff.txt` and `l6-round-status.txt`.
- The probe-side records under `/home/user/lsp/.orkestrel/probe/`: `l6-e-probe-brief.md`,
  `l6-e-probe-report.md`, and the round captures `l6-round-diff.txt` and `l6-round-status.txt`
  (the probe capture mixes the standing P1 adoption; the report's § 4 names which files carry
  which).
- The live working trees themselves — read the current sources directly; the held trees are the
  subject and the captures are their record.
- The gate readings in the unit reports; the sandbox denies you test runs against the real
  language server, so read those claims as reported evidence and name any you judge insufficient
  as an unknown for the Orchestrator to verify on the host, with the exact command.

## The claims, numbered and falsifiable — rule on each with evidence

1. `LSPClient.open` snapshots the required `options.signal` at entry, and an already-aborted
   signal refuses with the `aborted` code before the URI is owned and before
   `textDocument/didOpen` is written.
2. A caller abort during a pushed or pulled diagnostics wait rejects with `aborted`, leaves the
   client ready for further calls, keeps the URI owned so `close` still writes
   `textDocument/didClose`, and writes `$/cancelRequest` naming the canceled request id on an
   aborted pull. No abort path destroys the client.
3. The constructor `timeout` reaches ONLY initialize, shutdown, the exit write, and
   transport-close settlement: no code path applies it to a diagnostics wait, and the
   delayed-success rows in `tests/src/core/LSPClient.test.ts` prove resolution after the
   configured timeout elapsed rather than merely asserting no rejection.
4. Listener hygiene holds on every settlement path: pending publications and requests retain
   exactly one abort listener each, and responses, publications, send failures, caller aborts,
   lifecycle timeouts, transport exit, `close`, and destruction all remove that exact listener —
   no path leaks a listener on a long-lived caller signal and no path double-settles.
5. The L6-A contract states exactly what L6-B implements: `LSPOpenOptions` with the required
   `readonly signal`, the two-parameter `open` on the interface, the `aborted` and `closed` codes
   in the error union, and TSDoc scope claims no stronger than the code — and the class satisfies
   the interface without assertion or suppression anywhere in the diff.
6. In the probe, the coordinator deadline is armed BEFORE the lint inspection starts:
   `Probe.#bound` takes an operation handler, invokes it with the armed timeout's signal, and no
   touched call path starts work before arming. The diagnostics wait has exactly one owner.
7. The abort-to-refusal translation is deterministic and loss-free: on expiry the caller receives
   the coordinator's `ProbeError` with `code: 'deadline'`, `stage: 'lint'`, and the pinned
   message shape whichever promise settles first, and the losing rejection is observed rather
   than escaping as an unhandled rejection.
8. The `LintStageInterface` seam deviation is sound: widening `StageInterface.inspect` breaks
   `TypeStageInterface` as the report's compiler evidence claims (rule from the declarations
   themselves), the optional-in-type `options` is enforced required-in-fact by a runtime refusal
   that precedes warming, and no type or runtime stage acquires a cancellation promise it does
   not honor.
9. The stage-level translation in `LintStage.#document` never displaces the coordinator refusal
   on the `Probe` path, and the client's `aborted` rejection cannot surface as an
   `instrument`/`malformed` report through `guardStage` when the supplied signal aborted.
10. Scope honesty: the lsp round diff touches only the L6-A/L6-B/L6-D owned files, the probe
    round diff beyond the standing P1 entries touches only the L6-E owned files, and neither diff
    adds `any`, a type assertion, a non-null assertion, a suppression directive, or a dependency.

## Output

Write nothing to disk. Return, as your final answer, a verdict block per claim — CONFIRMED TRUE,
CONFIRMED FALSE, or UNPROVABLE with the exact evidence read (file and line, or record section) —
then any finding outside the claims with its severity and the unit that owns it, then the unknowns
you could not settle read-only with the exact host command each needs, and ONE terminal line:
`VERDICT: PASS` when every claim confirms true, otherwise `VERDICT: FAIL`. No process diary.
