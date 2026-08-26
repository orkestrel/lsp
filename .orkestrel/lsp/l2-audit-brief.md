# Audit brief — the @orkestrel/lsp L2 core contract and codec

## Subject

Commit `073d7d2` on `claude/lsp-spec-audit-est33d` in `/home/user/lsp`, written by the GPT-5.6 Sol
engine against the brief at `/home/user/scaffold/.orkestrel/campaign/l2-core-brief.md` and the
reconciled contract at `/home/user/scaffold/.orkestrel/campaign/lsp-design-reconciliation.md`.
The greenfield chain is one round deep; assume it carries a defect the writer's own gates cannot
see.

## What the round decides

Whether L3 — the `LSPClient` implementation — builds on this contract and codec as settled. A
finding now costs one fix unit; the same finding after L3 costs the client's rework too.

## Already established — do not re-run

Verified by the Orchestrator directly: the scoped gates (`check:src:core`, root `check`, the
`src:core` suite at 14 tests across 3 files) re-run green on the host after the unit returned; the
tree is clean at `073d7d2`; `as const` on a literal deriving a union is permitted by
`.claude/rules/typescript.md`; the named proof rows (astral content, split header, coalesced
frames, folded and refused charsets, over-limit refusal, malformed JSON) exist in
`tests/src/core/parsers.test.ts` with `TextEncoder` as the byte oracle.

## Review evidence

The actual diff at `/home/user/scaffold/tmp/units/l2-audit.diff`; the tree at `073d7d2`; the unit
report at `/home/user/scaffold/.orkestrel/campaign/l2-core-report.md`; the binding contract in the
`l2-core-brief.md` file's The contract section; the staged meta model at
`/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json`; the LSP distillate at
`/home/user/scaffold/.orkestrel/campaign/lsp-spec-distillate.md`.

## Numbered falsifiable claims

`CONFIRMED` requires naming the attack you tried that failed. A claim you cannot decide is
`UNRESOLVED`, not `CONFIRMED` — say what would settle it. Do not hedge toward an imagined
consensus.

1. **Contract fidelity.** Every declaration the L2 brief's contract names exists in
   `src/core/types.ts` with the specified shape — member names, optionality, readonly, the
   `id?: never` discriminants, the open `LSPPositionEncoding`, the closed severity, tag, and sync
   unions — and nothing is exported beyond that contract plus `LSPInitializeParams`, `LSPHeader`,
   and the declarations the brief's codec section names. Falsified by a missing member, a shape
   departure, or an unbriefed export.
2. **Wire verbatim and model truth.** Wire structures carry the specification's property names
   unchanged, and `LSPInitializeParams` matches the meta model's resolved `InitializeParams` for
   every included member (the report's member table is a writer's claim — check it against the
   model, mandatory members especially). Falsified by a renamed or mistyped wire member or a
   mandatory model member the type omits.
3. **Byte accuracy.** The encoder measures `Content-Length` in encoded bytes; the decoder
   reassembles a header split at any byte position, separates coalesced frames, and refuses an
   over-limit length before buffering a body. Falsified by an input — construct it — where the
   round-trip loses, duplicates, or misframes a message, including a frame boundary landing inside
   a multi-byte sequence.
4. **Total guards.** Every exported guard returns `false` on hostile input and never throws —
   null, primitives, wrong-typed members, and objects whose property access itself throws.
   Falsified by an input that makes a guard throw or return `true` for a shape the contract
   refuses.
5. **Naming and placement law.** Declarations sit in their prescribed centralized files;
   package-owned surfaces use single words; helpers use `{verb}{Noun}`; no nested function
   declarations; no `any`, no type assertion beyond permitted `as const`, no non-null assertion,
   no suppression comment. Falsified by a hunk in the diff breaking any of these.
6. **TSDoc and test shape.** Every exported declaration carries TSDoc; the tests mirror source
   files; no assertion is vacuous (an expectation derived from the code under test, a total-only
   check where members are the claim). Falsified by an undocumented export or a test that would
   pass under a mutation of the line it exists to pin.
7. **Core is host-independent.** No `node:` import, no host global, no dependency import beyond
   `@orkestrel/contract` and `@orkestrel/emitter` in `src/core/`. Falsified by any such reference.
8. **The suite is sufficient for what L3 builds on.** Fourteen tests is thin for a codec this
   load-bearing: name the codec or guard behaviors L3 will rely on that no current row pins —
   incremental decode across chunk boundaries mid-body, a header with unknown extra fields, CRLF
   handling, id `0` and empty-string ids, `null`-id error responses — and rule each as pinned,
   unpinned-but-safe, or unpinned-and-required. An unpinned-and-required behavior is a finding.

## Unknowns

- Whether the decoder's state machine handles a chunk boundary inside the body of one frame and
  the header of the next simultaneously. Where reading cannot settle it, return `UNRESOLVED` with
  the exact input the Orchestrator runs at reconciliation.

## Output

Return exactly the `orkestrel-falsify` verdict shape and nothing else: numbered verdicts in the
claims' order with evidence, findings fitting no claim substantiated to the `BROKEN` standard, one
terminal line. No process diary.
