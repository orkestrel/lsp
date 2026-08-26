# Design brief: the @orkestrel/lsp v1 contract

One brief, two blind lanes, the way the campaign's first design round ran. The subjective
lane (`planner`, Opus 5) argues shape, naming, ergonomics, and design fit. The objective
lane (`analyst`, GPT-5.6 Sol) argues correctness, constraints, and what the protocol and
the fleet's laws actually permit, verifying load-bearing claims against source. Your
dispatch names your lane. Neither lane sees the other's answer. The Orchestrator
reconciles; no lane decides.

## Objective

Propose the v1 public contract of `@orkestrel/lsp` — the fleet's Language Server Protocol
package — as a types-first design: the core type surface, the `LSPClient` API, the
conformance-suite shape, the unit decomposition to build it, and risks. Propose; never
implement.

## Context

- The scaffolded workspace sits at /home/user/lsp: `src/core` and `src/server`
  environments, seed dependencies `@orkestrel/contract`, `@orkestrel/emitter`,
  `@orkestrel/process`. Its `AGENTS.md` and `.claude/rules/` bind every proposal (types
  first, single-word entity APIs, readonly properties, named discriminants, centralize by
  kind, no unsolicited dependencies, minimal public API with the creation gate, mechanism
  not policy).
- The user's rulings (fixed): the package mirrors how `@orkestrel/mcp` carries its
  protocol; `LSPClient` ships first; `LSPServer` is an eventual trajectory recorded with
  triggers, not built; a conformance suite is REQUIRED v1 scope — parity and compatibility
  with the LSP specification on a type basis and a runtime basis wherever possible, with
  every foreign artifact (the metaModel, vendored spec material, any comparison types
  package) held at development-dependency or vendored-fixture level, never runtime.
- Evidence, absolute paths, read before proposing:
  - /home/user/scaffold/.orkestrel/campaign/lsp-spec-distillate.md — the LSP 3.18 protocol
    facts: framing, lifecycle, capabilities, document sync, position encodings,
    diagnostics push and pull, cancellation, error codes, implementation considerations.
  - /home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json — the machine-readable
    3.18.0 protocol model (requests, notifications, structures, enumerations, `since`
    markers). L2 vendors it into the lsp repository as the conformance fixture; the design
    rules on how the suite consumes it.
  - /home/user/mcp — the architectural mirror: how core carries types/validators/parsers/
    helpers/constants/errors and one class per file; how transports sit in server; and
    tests/setupConformance.ts with its pinned `CONFORMANCE_SPEC` — the conformance pattern
    the user requires this package to adopt.
  - /home/user/probe/src/server/stages/LintStage.ts — the first consumer, whole:
    framing (:348-378), correlation (:381-394), lifecycle (:198-266), teardown (:114-177),
    diagnostics consumption (:396-443). Its needs bound v1: the audit ruled probe's client
    surface as `capabilities`, `encoding`, `open`, `close`, `start`, `destroy`, `emitter`
    with no generic request/notify escape hatch, and diagnostics selected from the
    server's advertised capability (push, or pull when `diagnosticProvider` says so).
  - /home/user/scaffold/.orkestrel/campaign/audit.md § Subject 3 and
    design-planner-report.md / design-analyst-report.md § Subject 3 — the prior round's
    convergent rulings this design inherits: complete client-role behavior for declared
    capabilities (correct rejection of unsupported server requests included), teardown
    order preserved, host-run proofs for anything driving a child.

## The questions

1. **Core type surface.** Which protocol structures v1 declares in `src/core/types.ts` and
   under what names — the fleet bans `kind`/`type` discriminants and compound member
   names, while LSP's wire format fixes its own JSON property names; rule on where the
   package's own vocabulary ends and wire-faithful shapes begin (the mcp package solved
   the same tension; read how, and rule whether its answer transfers). Position, Range,
   the document identifiers, diagnostics, capability shapes, error codes, message
   framing types: which are v1, which wait.
2. **`LSPClient` API.** The entity surface against the fleet's single-word laws; options
   shape (workspace, server command vector, abort); the emitter's event map; document
   ownership semantics (one open per URI); teardown; how sync mode and diagnostics path
   are selected from the `InitializeResult`; what the client refuses and how (unsupported
   server requests answered method-not-found; malformed frames as typed errors).
3. **Conformance suite.** How the vendored metaModel drives it: type-basis parity (which
   declared shapes and method literals are checked against the model, and how, without a
   second parser or a runtime dependency) and runtime-basis parity (a protocol-faithful
   fixture server driving the client; which spec behaviors the suite proves — framing,
   ordering, id correlation, error codes, encoding negotiation). What the suite pins
   (`CONFORMANCE_SPEC = '3.18'`? the metaModel version?) and what a conformance failure
   reads as. Name what the mcp and ollama suites do that transfers and what does not.
4. **Unit decomposition.** L2 (core, Sol, bench-provable) and L3 (client over a real
   child, native Opus, host-proved) — refine owned files, acceptance criteria, and order,
   including where the conformance suite lands and where the metaModel fixture is vendored.
5. **Exclusions with triggers.** `didChange`, work-done progress rendering, `LSPServer`,
   browser environment, anything else the lane would exclude — each with the trigger that
   admits it, recorded where.

## Unknowns

- Whether the seed dependency set (contract, emitter, process) is right for v1 — the
  objective lane verifies what the stdio client actually needs from each and flags any
  unused seed or missing need (a missing need is a finding, not a license to add).
- How the scaffolded policy tests constrain the package layout — read
  /home/user/lsp/tests/policy.test.ts and setupPolicy.ts and rule within them.

## Scope

Read-only, everywhere named in Context. Write nothing, run no mutating command. The
objective lane may run read-only inspection commands only.

## Execution

Perform this assignment directly yourself and spawn nothing.

## Output

Per question 1 through 5: the proposed ruling, evidence-cited rationale, and at most one
ruled alternative. Then a `types.ts` sketch of the load-bearing declarations (a sketch, not
an implementation), the refined unit table, risks with the cheapest settling probe each,
and one exit-criterion paragraph for Wave L. No process diary.

## Deviation contract

Read-only; a missing evidence path stops the affected question only: name it, rule on the
rest.

## Acceptance criteria

- Every question carries a ruling with cited rationale and a ruled alternative.
- The conformance ruling names concretely how type-basis and runtime-basis parity are
  proven and what stays dev-side.
- The user's fixed rulings are treated as fixed.
- The exit-criterion paragraph exists.
