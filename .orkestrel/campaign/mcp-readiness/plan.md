# Campaign plan — MCP readiness (reconciled 2026-08-27)

Reconciled by the Orchestrator from `d1-subjective-report.md` (Opus), `d1-objective-report.md`
(Grok, source-verified), the Orchestrator's own probes (oxlint `--lsp` initialize 155 ms;
conformance listing; spec pages first-hand; source spot checks), and the absorption reports.

## Rulings where the lanes split

- **`x-mcp-header` and `Mcp-Name` scope: the objective lane wins, enlarged.** The spec marks the
  standard headers REQUIRED for compliance — `Mcp-Name` on `tools/call`, `resources/read`
  (`params.uri`), and `prompts/get` — and client `x-mcp-header` support a flat MUST including
  exclusion of violating tools from `tools/list`. Both carry a mandatory Base64 sentinel
  encoding (`=?base64?…?=`) servers must decode before comparing; the package has no trace of
  it (verified: both `#buildHeaders` stamp raw `params.name` for `tools/call` only;
  `inferHeaderIssue` returns undefined for any other method at `src/server/inferers.ts:106`).
  The guide's `Mcp-Param-*` entry itself names the closer this plan schedules, so this follows
  the recorded design; the user's readiness instruction schedules it.
- **U8 narrowed by measurement.** oxlint `--lsp` answers `initialize` in 155 ms on a real
  workspace (13× inside the 2000 ms bound), and the death-mid-inspection path is already pinned
  by a real SIGKILL test (`LintStage.test.ts:1444-1484`). The configurability unit collapses to
  constants centralization.
- **Diagnostic-path proof already exists in lsp** (the pull and push terms appear across
  `LSPClient.test.ts`, `conformance.test.ts`, and the helper suites); the audit confirms shape
  rather than building. No second diagnostic path in probe: oxlint advertises no
  `diagnosticProvider` (measured in the same probe).
- **WS closed-send: subjective's remedy shape.** The Node client's throw sits in an `async`
  method — a rejection, contract-conformant. The browser client and server transport silently
  resolve; both move to rejection. Queue-until-open stays.
- **Everything the objective lane verified as already true is rejected as a unit**: GET/DELETE
  `405` (tests pin it), `CacheableResult` on all five methods, error-code numerals,
  streamed-SSE cancellation wiring, S1–S8 mechanics, MRTR M1–M7/M9, progress monotonicity,
  registry-order `tools/list`, protocol/method header stamping. M8's `-32602` fail-closed
  departure is declared, not repaired.
- **Conformance instrument adopted.** The installed runner (`0.2.0-alpha.10`) lists a
  `2026-07-28` server suite far beyond the recorded set (stateless, caching, header
  validation ×2, MRTR ×13, schema, resource-not-found) and a client mode whose non-auth
  scenarios map onto the confirmed gaps. The campaign widens the server run failing-first and
  builds the client harness. `auth/*` client scenarios are out of scope: the package implements
  no OAuth client (declared limit, guide-carried).

## Units and routing

Sol is user-excluded; judgment-bearing writing routes to the Opus `implementer`, mechanical
writing to `builder` (Sonnet), objective audit to Grok (bench, executed attacks), subjective
audit to `reviewer` (Opus), mechanical audit to `checker`. Writers serialize per repository;
the mcp and probe queues run in parallel.

### mcp queue (serialized)

| Unit | Objective | Role |
| ---- | --------- | ---- |
| M0 | Widen the server conformance run to the full `2026-07-28` listing; record the red baseline as named expected failures | `builder` |
| MC | Build the client-conformance harness (non-auth scenarios); record its red baseline | `implementer` (Opus) |
| M4 | Name the stdio ingress contract (`StdioServerInterface`) | `implementer` (Opus) |
| M1 | `Mcp-Name` on all three methods, Base64 sentinel encode/decode, server validation scope — turns the header scenarios green | `implementer` (Opus) |
| M3 | WS closed-send rejects on the browser client and server transport | `implementer` (Opus) |
| M2 | `x-mcp-header` client projection, violating-tool exclusion, server `Mcp-Param-*` validation — last code unit (widened seam) | `implementer` (Opus) |
| M6 | Peer `@orkestrel/server` → `^0.0.15` (aligns the advertised floor with what gates prove) | `builder` |
| M5 | Guide honesty rows: entries closed by M1–M3, legacy method-set consequence, M8 departure, shutdown posture (signal-first; cooperative stdin close carried to process), `createMCPContinuation` as the `requestState` protector, auth client scenarios out of scope | `implementer` (Opus), last mcp writer |

### probe queue (serialized, parallel to mcp)

| Unit | Objective | Role |
| ---- | --------- | ---- |
| P1 | `prove` success results carry `structuredContent` (the `Verdict` record) beside the `formatVerdict` text block, proven through the legacy projection; guide declares the row-31 departure | `implementer` (Opus) |
| P2 | Magic bounds (`30_000`, `2_000`) move to `src/core/constants.ts` as named defaults | `builder` |

### Gated on the user's release (staged, not executed)

| Unit | Objective |
| ---- | --------- |
| P3 | probe re-pin commit: lsp range, `createStdioClientTransport` import, vendored `guides/lsp.md` mirror, See-also row |
| Wave | `process` `0.0.7` → `lsp` and `mcp` (mcp re-pins process `^0.0.7`, plus its own surface changes from this campaign → bump) → `probe` re-pin |

### Audit and verification

- Falsification audit per landed unit: Grok objective lane (bench, executed attacks) on
  Opus-written units; `reviewer` subjective lane on shape/documentation units and on
  builder-written units; `checker` where acceptance is mechanical. No engine audits its own
  writing.
- One independent `verifier` runs both gate chains topologically at the end.

## Exit criterion

- Every `2026-07-28` MUST row from the checklist and pattern tables ends verified true,
  repaired (M1, M2, M3), or declared with cost and closer in the guide (M5) — with the widened
  conformance server suite and the new client harness green (auth scenarios excluded, declared).
- probe serves `prove` with structured output through both eras; bounds centralized; the live
  `.mcp.json` registration path stays proven by the bin suite.
- LSP-in-probe: push-path real-world proof stands (oxlint), pull-path proof confirmed in lsp's
  suite, rename adoption staged for the re-pin.
- Both gate chains green under the independent verifier; deliberate exclusions recorded; the
  release wave surfaced to the user.

## Rejections of record

`outputSchema` and annotations on `prove` (no field in `@orkestrel/tool`; row 32 binds clients);
`MCPLegacy` widening (removability is the point); legacy client `Last-Event-ID` resume (revision
removed it; no consumer); `MCPClientTransportInterface` rename (guide defers it — surfaced to the
user as an option); `Session` byte face for mcp stdio (line protocol); second language server in
probe (receipt binds oxlint); mcp-builder evaluation XML (measures the model, no durable home,
real-client proof already live); unary-HTTP cancellation (structural, declared); M8 re-request
SHOULD (fail-closed departure, declared); `alpha.10 → alpha.11` conformance bump (user's call —
`alpha.10` already carries every needed scenario).
