# D2 reconciliation — parser decomposition, 2026-08-26

Lanes: subjective (`planner`, Opus 5, native) ruled DECOMPOSE with a five-leaf unit; objective
(Grok, bench) ruled MONOLITH HONEST. The Orchestrator rules for the decomposition.

## Why the subjective lane wins

- Its two decisive facts verify against source: the segment-join walk is duplicated
  byte-identically (`src/core/parsers.ts:102-110`, `:241-250`) — a standing violation of the
  centralize-twice law, not taste; and the header grammar (`:112-222`) reads nothing from the
  retained-state chain, so the cohesion claim the monolith ruling rests on is false for the
  function's largest block.
- It answers each objective constraint on its own terms: the leaves are `read*`/`scan*`/`join*`
  helpers in `helpers.ts` (where a throwing function is precedented by `encodeLSPMessage`), so the
  `parse*` no-throw form does not bind; every refusal keeps its `LSPError` code, verbatim message,
  and `context.messages` through the `messages` parameter; `joinLSPSegments` is called only where
  the code already joins, and the `previous === undefined` no-copy fast path survives at the call
  sites, so no join-per-chunk regression is possible by construction.
- `LSPDecodeState` is published with no published algebra; the leaves are the operations the
  barrel law says developers receive.

## What survives from the objective lane

- The framing spine, the state chaining, the accumulation-limit refusals, and the shape-gate
  placement stay in `parseLSPMessages` — the objective lane's anti-hollowing case holds for the
  spine and the reconciled unit keeps it.
- Surface growth on a published package is a real versioned cost. Accepted deliberately;
  `takeLSPTail`'s thin public value is carried by its test value (the densest untested arithmetic
  in the file).
- The probe reading is not a gate today; the binding criterion is `parseLSPMessages` strictly
  below 30 with readings recorded, per the subjective lane's own threshold reasoning.

## Deliberately retained tensions

- `parseLSPMessages` keeps its name and file although it throws and returns a tuple (outside the
  `parse*` coercion form). Renaming or moving the package's flagship codec entry is a public
  break outside this campaign's exit criterion. Recorded, not repaired.
- `readLSPHeader` is expected to measure above 20 alone; accepted by design, recorded.
- Conformance exercises no framing refusal (subjective open question); observation for the
  adequacy record, not this unit's scope.

## Routing amendment

The subjective lane proposed the Sol `implementer`. Sol is user-excluded this session, so the
unit (U5 in the campaign sequence) runs on the Opus `implementer`, serialized after U2 (they
share `src/core/helpers.ts`, `guides/lsp.md`, and `tests/src/core/helpers.test.ts`).
