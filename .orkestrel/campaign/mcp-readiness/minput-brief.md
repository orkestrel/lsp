# M-input — widen the server's MRTR production seam

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the mcp
  checkout.
- **Objective**: `MCPServerOptions.input` can express what the `2026-07-28` MRTR pattern
  permits — a round of several input requests under consumer-chosen keys, of the elicitation,
  sampling, and roots kinds, each capability-gated — and a tool whose round requires an
  undeclared client capability is refused with `-32021` before execution. Six red baseline rows
  turn green.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\mcp`, clean `main` at `11fc749` (M0 widened the
  conformance baseline; MF completed the fixture). Commit nothing.
- Read first: `AGENTS.md`, `.claude/rules/typescript.md`, `.claude/rules/names.md`,
  `.claude/rules/patterns.md`, `.claude/rules/architecture.md`, `.claude/rules/tests.md`, and
  `guides/mcp.md` §§ on the input policy and MRTR. TTTDD binds: types first in
  `src/core/types.ts`, then implementation, then tests.
- The M0/MF records: `tmp/units/m0-report.md`, `tmp/units/mf-report.md` (per-check runner
  messages). The five one-seam rows and their messages:
  - `input-required-result-basic-elicitation` — `inputRequests missing expected key
    "user_name"`: the consumer cannot choose the key; `MCPServer.#required` mints
    `crypto.randomUUID()`.
  - `input-required-result-basic-sampling` — expected `sampling/createMessage`, got
    `elicitation/create`: `MCPInputHandler` returns an `MCPElicitation` and nothing else,
    though `MCPInputRequest`, `isMCPInputRequestMap`, and `MCPInputResult` already admit
    sampling and `roots/list` on the wire.
  - `input-required-result-basic-list-roots` — same seam, `roots/list`.
  - `input-required-result-multiple-input-requests` — expected at least a three-request round
    mixing the kinds; the selector can only ever produce one entry.
  - `input-required-result-capability-check` — the scenario declares `sampling` and no
    `elicitation` and requires sampling-only requests; today the server refuses for the missing
    elicitation capability because elicitation is all it can produce.
  - `server-stateless` (partial): `sep-2575-server-rejects-undeclared-capability` and
    `sep-2575-missing-capability-http-400` need a fixture tool `test_missing_capability` whose
    round requires the `sampling` capability, and the refusal `-32021` (HTTP `400`) when the
    client did not declare it. The row's OTHER two failures (`-32602` versus `-32022` for
    bad/missing `_meta`) belong to a later unit — leave them red and keep the row comment
    split by cause.
- Spec grounding, read first-hand (campaign captures `spec-patterns.md` rows M1–M9 and
  `r1-report.md`): `inputRequests` keys are server-assigned identifiers unique within the
  request; values are `ElicitRequest`, `CreateMessageRequest`, or `ListRootsRequest`; a server
  never sends a request kind the client's declared capabilities exclude
  (`MissingRequiredClientCapabilityError` `-32021`); every `InputRequiredResult` carries at
  least one of `inputRequests`, `requestState`.
- The existing continuation discipline stays: `createMCPContinuation` seals round state; the
  server verifies retries; elicitation responses are validated against the schema the round
  issued. Sampling and roots responses have their own result shapes
  (`CreateMessageResult`, `ListRootsResult`) already admitted by `isMCPInputResult`'s wire
  guards — verify what response validation the existing types support and extend validation
  symmetrically (a sampling response validated as far as its declared shape allows; do not
  invent semantic checks the spec does not require).

## Design constraints

- Types first in `src/core/types.ts`. Single-word entity API laws bind: name the round shape
  and the selector's return so each property is one word. Do not store derivable facts.
- The widened selector must stay backward-compatible in spirit but this is greenfield: no
  compatibility shims — update every consumer (the fixture in `tests/setupConformance.ts` is
  the first real consumer; probe supplies no `input` policy and is untouched).
- Capability gating is per request kind and per round: a round containing any kind the client
  did not declare refuses `-32021` (HTTP `400` through the existing error mapping) without
  executing the tool.
- The refusal happens before tool execution for a tool whose policy demands a round the client
  cannot answer.
- Keep `MCPMethodManagerInterface` and the dispatch spine unchanged unless the types force a
  change; state any forced change in the report.
- The MF observation about `ignore-extra-params`/`missing-input-response` (retry without
  `requestState` answers `-32602` fail-closed) is a declared departure, not yours to change.

## Scope

- Owned: `src/core/types.ts`, `src/core/MCPServer.ts`, `src/core/validators.ts`,
  `src/core/helpers.ts`, `src/core/parsers.ts` (only as the types force),
  `tests/src/core/MCPServer.test.ts`, `tests/src/core/validators.test.ts` (rows the widened
  guards need), `tests/setupConformance.ts`, `tests/setupConformance.test.ts`,
  `tests/conformance.test.ts`, `guides/mcp.md` (the input-policy section and its Surface and
  Types rows only).
- Off-limits: `src/server/*`, `src/browser/*`, `package.json`, configs, every other guide
  section.
- Carried obligation from MF: the exported fixture helpers (`buildConformanceElicitation`,
  `buildConformanceRound`, `readConformanceAnswers`) have no proofs in
  `tests/setupConformance.test.ts`; your rework of the fixture's selector supersedes or keeps
  them — whatever shape survives, its selector behavior gets a proof there (the round
  progression and the unknown-name case).

## Execution

Perform the assignment directly and spawn nothing. TTTDD with failing-first evidence: the six
red conformance rows are the standing red record; add unit-level failing rows for the new round
shape before implementing. Validate scoped: `npm run check`, scoped oxlint,
`npm run test:src:core`, `npm run test:setup`, `npm run test:conformance`, and
`npm run test:guides` for the guide rows. Do not run the whole suite, tree-wide `format`, or
`build`.

## Output

Write your report to `tmp/units/minput-report.md` in the mcp repository and return it as your
final message: the type design you landed (names and shapes), the failing-first evidence
(commands, red counts, green counts), per-row baseline movement, any forced change outside the
expected seam, and every claim you could not close.

## Deviation contract

Stop and report when: the widened types force a change in `src/server` or `src/browser`; a
conformance row resists for a reason outside the named seam; an existing green row reddens; or
the guide's recorded input-policy design contradicts the spec rows in a way the brief did not
anticipate. Ancillary choices (helper naming, test placement within owned files) are yours to
decide and record.

## Acceptance criteria

1. Scoped check and lint green; `test:src:core`, `test:setup`, `test:guides` green.
2. `npm run test:conformance` green with these rows moved:
   `input-required-result-basic-elicitation`, `-basic-sampling`, `-basic-list-roots`,
   `-multiple-input-requests`, `-capability-check` all `failed: 0`;
   `server-stateless` at `failed: 2` with its row comment split by cause (the `_meta` refusal
   codes stay red for the later unit).
3. The fixture's `test_missing_capability` tool exists, is listed, and its refusal is `-32021`
   over HTTP `400`.
4. Failing-first evidence recorded for the new round shape at unit level.
5. The guide's input-policy section, Surface, and Types rows match what shipped.
