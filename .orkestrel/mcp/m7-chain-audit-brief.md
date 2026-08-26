# Audit brief — the client era boundary (M7 + M7.1 + M7.2.1)

## Subject

The client era boundary landed across units on the GPT-5.6 Sol engine: the checkpoint `06d7f4a`
(modern-only `MCPClient`, the `MCPLegacyClientTransport` adapter, shared era translation
helpers, adapter suite), the continuation commit `33be98b` (granted-row migration, owned-row
moves per the M7 rulings table, guide sections, gates), and the classification commit `e5ac674`
(the adapter-naming refusal narrowed to discovery method-not-found alone, every other failure
propagating as itself, the socket rows re-pinned). The user's binding ruling: the client always
speaks the modern protocol; legacy reach lives only in an explicit transport decorator that
translates a legacy peer up to the modern protocol; production types never admit a legacy pin on
the bare client.

One part of `e5ac674` is Orchestrator-written and needs an auditor the Orchestrator does not
share: the id-less socket row's message pin
(`'MCP server returned an error without a request id: Bad Request: Server not initialized'` at
`tests/src/core/MCPClient.test.ts`, in the row `settles id-less errors over real HTTP without
weakening correlated isolation`). The unit pinned the bare peer message where the sandbox denied
it a listener; the Orchestrator measured the id-less settlement shape on the host and re-pinned
the expectation. The `analyst` lane rules on that pin.

## Lanes

- Subjective: `reviewer`, Claude Opus 5, native, read-only — design fit, API shape, naming,
  guide voice.
- Objective: `analyst`, GPT-5.6 Sol through `codex exec` read-only — correctness, constraints,
  what the code and both protocol revisions actually permit. Sol wrote the subject: attack
  hardest where agreeing would be easiest. This lane also owns claim 9 and the ruling on the
  Orchestrator-written pin in claim 8.

Both lanes run blind on this identical brief and return per-claim verdicts with evidence and one
terminal line, per the Falsification law in `.claude/rules/quality.md` and the
`orkestrel-falsify` value set. The lanes run serialized only because the bench carries one exec
at a time; neither sees the other's return before both land.

## Claims to falsify

1. The bare client is modern-only as ruled: no code path in `src/core/MCPClient.ts` negotiates,
   pins, or falls back to a legacy revision; `MCPClientOptions.version` admits only
   `MCPModernVersion`; a legacy peer met directly draws a refusal that names
   `createMCPLegacyClientTransport`; and no production type widened to admit what the boundary
   refuses.
2. The adapter translates faithfully in both directions: it performs the legacy `initialize`
   against the revision it negotiates, synthesizes modern discovery a modern client consumes
   unchanged, strips exactly the modern request metadata a legacy peer must not see, restores
   exactly the members a modern consumer requires (`resultType`, server identity, cache fields),
   and passes through what needs no translation. An attack here is a message either direction
   that survives translation malformed for its era.
3. The shared era projections in `src/core/helpers.ts` are one implementation with two callers:
   `MCPLegacy`'s observable behavior is unchanged by the rerouting, and no translation logic is
   duplicated between the server decorator and the client adapter.
4. Every migrated row proves what it names on its new subject: the rows moved from the client
   suite to the adapter suite exercise the adapter's handshake rather than merely compiling
   against it; the refusal replacement binds the boundary; the reworked superseded-attempt rows
   still cover the races they covered before; the legacy control keeps its control force; and
   the granted-file rows (integration, helpers, server factories, middlewares,
   HTTPClientTransport) each kept their original subject under the adapter wrap.
5. The recorded proofs bind: the baseline reds (the refusal rows red before the boundary, the
   `npm run check` exit 2 at `06d7f4a`, the classification rows red at `33be98b`) and the greens
   are consistent with the diffs, and no row that pins an executable defect shipped without a
   recorded red.
6. The guide tells the truth: the client section states the modern-only boundary, the adapter
   has its section beside `MCPLegacy` in the decorator pattern's voice, the negotiation sentence
   states that method-not-found names the adapter and every other discovery failure surfaces as
   itself, no prose still describes client-side implicit fallback, every backticked name
   resolves to a real export, and parity holds.
7. Every unit stays inside the law on the files it touched: naming, placement, no banned
   constructs, readonly surfaces, scope honesty against the retained briefs and the granted-file
   list, and the commit shape (checkpoint at the M7 deviation stop, continuation, the M7.2
   deviation stop with no edits, the M7.2.1 classification) matches the retained reports.
8. The era classification is exact: the catch in `src/core/MCPClient.ts` rewrites into the
   adapter refusal only a correlated `MCPError` coded `JSONRPC_METHOD_NOT_FOUND` from
   `server/discover`; a `-32000` server-state answer, another JSON-RPC error, a rejected
   transport write, and a timeout each surface with their own category, code, message, and
   cause; the `MCP_UNSUPPORTED_VERSION` retry is unchanged; and the re-pinned socket rows pin
   honest shapes — including the Orchestrator-written id-less message pin, which must be exactly
   what the id-less settlement path at `src/core/MCPClient.ts:533` yields for the `/connect`
   fixture's id-less `-32000`, and not a weakening of the row's isolation subject.
9. The transport seam ruling: the server `HTTPClientTransport` given an unauthenticated `401`
   response with a JSON body emits no JSON-RPC message and surfaces no auth-shaped failure, so
   a discovery against a guarded server fails only by the client's own request deadline
   (`MCP request 'server/discover' timed out after 200ms` in the bearer row). Rule whether that
   silence is the transport contract or a defect: name the interface member whose TSDoc or
   behavior owes the consumer the auth failure if you find one, or confirm the deadline is the
   honest surface and the row pins it correctly. A ruling here is a proposal for the
   Orchestrator, not an edit.

## Evidence

- The combined diff `git diff a379b08..e5ac674` at
  `/home/user/scaffold/tmp/units/m7-chain-diff.txt` (2723 lines), and the empty
  `git status --porcelain` at `/home/user/scaffold/tmp/units/m7-chain-status.txt`, taken
  2026-08-25 with the mcp tree clean at `e5ac674`.
- The repaired tree readable at `/home/user/mcp`.
- The retained pairs in `/home/user/scaffold/.orkestrel/campaign/`: `m7-client-era-brief.md` /
  `m7-client-era-report.md`, `m7.1-client-era-continuation-brief.md` /
  `m7.1-client-era-continuation-report.md`, the deviation pair `m7.2-era-classification-brief.md`
  / `m7.2-era-classification-report.md`, and `m7.2.1-era-classification-brief.md` /
  `m7.2.1-era-classification-report.md`.
- The Orchestrator's authoritative idle-host readings at `e5ac674`, 2026-08-25: `src:core`
  738 passed; `src:server` 310 passed, 1 skipped; `guides` 138 passed; `format:check`,
  `lint:check`, and `check` all exit 0. The two socket rows the sandbox could not settle passed
  on the host under their exact settling commands from the M7.2.1 report.

## Output

Numbered per-claim verdicts with `file:line` evidence, findings outside the claims, one terminal
`VERDICT:` line in the skill's shape. No process diary.
