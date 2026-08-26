# L6 design reconciliation — the inspection bound split

Date: 2026-08-26. Subject: the fork the probe adoption falsified — `LSPClientOptions.timeout`
bounds the client's lifecycle requests and the diagnostics wait alike, so a consumer whose
inspection budget belongs to its own caller cannot bound teardown tightly without preempting that
caller. Lanes: the `planner` ruling (`l6-design-planner-ruling.md`, Opus 5, native) and the
`analyst` ruling (`l6-design-analyst-ruling.md`, GPT-5.6 Sol, bench session
`01a03c9a-fd5e-7033-9ad3-e59ed487c879`), run blind on the shared brief
(`l6-open-bound-design-brief.md`).

## Ruling

The analyst's contract is adopted. `open` takes a required `LSPOpenOptions` bag whose `signal`
member is required. The constructor `timeout` leaves the push and the pull diagnostics waits and
keeps initialize, shutdown, exit-write settlement, and transport-close settlement. A caller abort
rejects `open` with an `LSPError` coded `aborted`, leaves the client ready, keeps the URI owned so
`close` still sends `textDocument/didClose`, and writes `$/cancelRequest` on the pull path while
the generation stays ready.

The planner's optional-signal shape is dropped on the analyst's elimination table: an optional
signal with no fallback permits an accidental permanent wait, an optional signal with the existing
timeout preserves the falsified deadline race, and a required signal with a client fallback
restores competing owners. Each tension the planner flagged lands as follows.

| Planner tension | Resolution |
| --- | --- |
| The default net on the wait | Removed. `timeout` governs lifecycle and settlement only, and the delayed-success rows pin that the wait outlives it. |
| The signal on the pull path | The signal reaches the correlated diagnostic request, and cancellation writes `$/cancelRequest`. |
| The optional bag | Rejected. The bag and the signal are required. |
| The unsent `didClose` on abort | The planner's release-on-abort is rejected: a written `textDocument/didOpen` leaves the server holding the document, so the URI stays owned and `close` settles it. |
| `timeout` keeping its name | Kept, with the re-scoped prose the analyst supplies. |

## Units and routing

The planner's cut survives with amended content. The routing ledger names role and engine.

| Unit | Content | Role and engine |
| --- | --- | --- |
| L6-A | `LSPOpenOptions` and the `open` signature in `types.ts`, TSDoc per the analyst's contract prose | `implementer`, Opus 5, native |
| L6-B | The client paths per the analyst's implementation boundary, with the pinned rows red-first | `sol`, GPT-5.6 Sol, bench |
| L6-D | The guide per the analyst's parity list | `implementer`, Opus 5, native |
| L6-E | The probe rewire: the `StageInterface.inspect` signal seam, the `Probe.#bound` operation handler, the coordinator refusal preserved, `LintStage` passing `{ signal }` and keeping `timeout: 2000` | `implementer`, Opus 5, native |
| L6-F | The fixture capability patch at `Probe.test.ts:55` and `:97` | Struck — already applied by the Orchestrator as integration; its audit rides the L6-E round |

The row unit the planner cut as L6-C folds into L6-B: the rows pin the same files the client unit
owns, and a separate writer would contend on them.

L6-E deviates from the bench default for objective work, on the record: the probe's lint rows
spawn the real Oxlint server as a grandchild of the test runner, and the bench sandbox denies a
grandchild, so the unit cannot prove its own work there. The native Opus `implementer` takes it and
the Orchestrator runs the acceptance commands on the host.

The tarball rebuilds and repacks after L6-B lands and before L6-E runs, because the consumer's
proofs must run against the packed artifact that carries the split.

## Audit plan

`reviewer` (Opus 5) takes L6-A and L6-D. `analyst` (GPT-5.6 Sol) takes L6-B and L6-E, so at least
one lane's engine did not write each nontrivial unit. The verdict file for the round is
`.orkestrel/lsp/l6-audit-verdict.md`.
