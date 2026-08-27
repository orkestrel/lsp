# D2 subjective lane verdicts — planner / Opus 5, 2026-08-26

Returned by the native `planner` agent against `d2-parser-brief.md`. Retained from the agent's
report; the unit definition it proposes is amended by `d2-reconciliation.md` (routing: Opus
`implementer`, serialized after U2).

## Verdict 1 — Decompose. The monolith's cohesion claim is false for its largest block.

- `src/core/parsers.ts:112` takes `headerBytes = joined.subarray(0, boundary)`, and from there to
  `:222` nothing reads `pending`, `previous`, `size`, or `bytes`. The largest block in the
  function is a flat byte range in and a number out, fused to the state machine by position only.
- `:253-276` is the same: byte range in, one validated message out, no state touched.
- The function holds three subjects: retained-byte plumbing, an HTTP-style field grammar, and a
  payload grammar. The complexity reading of 60 is a symptom, not the case.
- A live rule violation: the segment-join walk is written twice (`:102-110`, `:241-251`),
  byte-identical in logic; the centralize-twice law is not satisfied today.
- A published type with no published algebra: `LSPDecodeState` is public (`src/core/types.ts:359`,
  `guides/lsp.md:301`) and the guide tells consumers to hold it; the package publishes no
  operation over it.
- Fleet calibration: sibling protocol code measures 21-30 over the default 20; 60 sits at twice
  the fleet's worst.

The extraction is capability-shaped, not threshold-shaped: every candidate is judged by whether it
is an operation a consumer of the package should be handed, because every centralized declaration
is public and documented — there is no private extraction in this repository.

## Verdict 2 — The leaf set, and what stays

All leaves land in `src/core/helpers.ts` (a throwing function is precedented there by
`encodeLSPMessage`; the barrel already star-exports it; no edit to `src/core/index.ts` or
`src/core/types.ts`):

- `joinLSPSegments(state: LSPDecodeState): Uint8Array` — allocates `state.size` and copies each
  segment from the `previous` chain into position; ALWAYS returns an owned buffer, never a
  retained segment by reference. The shell keeps the no-copy path as a one-line ternary at each
  call site (`previous === undefined ? pending.bytes : joinLSPSegments(pending)`).
- `takeLSPTail(state: LSPDecodeState, count: number): Uint8Array` — the last
  `min(count, state.size)` retained bytes as an owned buffer, replacing the backwards cursor walk
  at `:63-73` — the only reverse read of the chain and the densest untested arithmetic in the
  file.
- `scanLSPBoundary(bytes: Uint8Array): number | undefined` — first `\r\n\r\n` index. The
  state-taking variant is refused: it would carry the hidden precondition "every earlier node was
  already scanned". The overlap trick and the absolute-offset translation at `:83` stay in the
  shell.
- `readLSPHeader(header: Uint8Array, messages: readonly JSONRPCMessage[]): number` — owns the
  ASCII check, field splitting, Content-Length digits and duplication, Content-Type media,
  parameters, and charset (`:113-222`); throws `LSPError` coded `framing` with every message
  string verbatim and the `value` contexts preserved; owns `LSP_CONTENT_LIMIT`.
- `readLSPBody(body: Uint8Array, messages: readonly JSONRPCMessage[]): JSONRPCMessage` — owns the
  fatal UTF-8 decode, `parseJSON`, and the JSON-RPC shape gate (`:254-276`) with the same codes
  and contexts.

Naming: none is a `parse*` (that form is `T | undefined`, no throw); `read*` is unreserved;
`decodeLSPHeader` rejected (one concept, one term — `decode` means bytes-to-text here).
`messages` as a context-only parameter is accepted: the accumulated-messages refusal context is
part of the package's contract, and refusal-as-data was rejected (a `reason` member is a second
representation of an error).

Stays in `parseLSPMessages`: the state chaining (`:37-50`; no public constructor for
`LSPDecodeState` — forged states would break the size/boundary invariants); both
`LSP_HEADER_LIMIT` refusals (`:88-100` — framing facts, not header-grammar facts); the message
shape gate as a separate leaf refused (rename-only wrapper — it moves INTO `readLSPBody`); the
Content-Type sub-parse as a separate leaf refused (void-and-throw shape); `parseLSPMessages` keeps
its name and file (tension 3, deliberately retained).

## Verdict 3 — Proof obligations

- Unmodified and green: `tests/src/core/parsers.test.ts` in full (boundary splits at every
  offset `:51-62`, byte-at-a-time body continuations `:144-173`, caller-mutation ownership
  `:38-49`, astral split `:104-120`, retained next-header `:122-142`), plus
  `tests/src/core/LSPClient.test.ts`, `tests/setupServer.ts`, `tests/conformance.test.ts`.
- New leaf tests in `tests/src/core/helpers.test.ts`: join single/multi-segment and returned-buffer
  ownership; tail shorter/spanning/exceeding/zero; boundary at start/end/absent and near-misses;
  every header refusal reached from header bytes alone asserting code and `value` (the ergonomic
  gain — each header rule is proven today only through a whole frame), plus accepted cases
  (unknown field ignored, `utf8` folded, no Content-Type); body valid/invalid-UTF-8/invalid-JSON/
  non-message each asserting code and context code.
- No test pins a refusal MESSAGE STRING — preservation is a diff-read criterion.
- Probe re-run: `parseLSPMessages` strictly below 30 binding; whether the shell cleared 20 is an
  observation; `readLSPHeader` above 20 alone is accepted by design, recorded.

## Verdict 4 — Worth it now

The duplication is a standing rule violation a later round will find again; the header grammar has
no direct test surface (an adequacy weakness in the package's most safety-critical proof); the
public-surface decision is versioned and the package sits at `0.0.x`. Churn risk is the
best-covered refactor available: the untouched parser suite reddens immediately on drift.

## Unit D2-1 (amended routing: Opus `implementer`, after U2)

- Owned: `src/core/helpers.ts`, `src/core/parsers.ts`, `guides/lsp.md`,
  `tests/src/core/helpers.test.ts`.
- Off-limits: `tests/src/core/parsers.test.ts`, `tests/src/core/LSPClient.test.ts`,
  `tests/setupServer.ts`, `tests/conformance.test.ts`, `src/core/types.ts`, `src/core/index.ts`,
  `src/core/validators.ts`, `src/core/LSPClient.ts`.
- Acceptance, cheap first: diff names only owned files; every refusal message string preserved
  verbatim and one implementation of the join walk; `format:check` and `lint:check` green;
  `check` green; `test:policy` green; `test:src:core` green; `test:guides` green with each new
  export documented and carrying a worked example; probe re-run reads `parseLSPMessages` strictly
  below 30 with per-leaf readings recorded.
- Deviation: a behaviour-preservation conflict stops the unit; a criterion-8 failure is reported,
  never repaired by inventing a further seam.
- Risks settled by design: no join during an incomplete header (a join-per-chunk header path
  would be quadratic in a 64 KiB header and must be refused); `takeLSPTail` allocates at most 3
  bytes per chunk.

## Alternatives refused

- Record-the-monolith: rests on a cohesion claim the code contradicts; leaves the duplicated walk.
- An `LSPDecoder` class with `#` methods: converts a caller-owned-state pure codec into a stateful
  entity — a worse public contract sold as encapsulation.

## Tensions (named for audit)

1. Surface growth on a published package — accepted under the barrel law's "same mechanisms"
   intent.
2. `messages` as a context-only parameter versus contract `Result` — refusal-as-data rejected.
3. `parseLSPMessages` stays in `parsers.ts` under its name although it throws and returns a tuple.
4. `readLSPHeader` above 20 alone — accepted, recorded.
5. The `previous === undefined` fast path survives at both join call sites.
6. `takeLSPTail` has the thinnest public value and the highest test value in the set.

## Open questions routed to the unit

- Whether `validators.ts` imports `helpers.ts` (leaf-pair cycle check) — read after U1's commit;
  the Orchestrator confirms it does not, so `helpers.ts → validators.ts` is a simple edge.
- Whether oxlint's `complexity` counts `?.` and `??` — the unit's probe re-run answers before
  editing.
- Whether `tests/setupConformance.ts` exercises framing refusals — grep; observation only.
