# P1 — probe `prove` results carry `structuredContent`

- **Role and engine**: `implementer`, Opus 5, native. Writing unit, sole writer in the probe
  checkout.
- **Objective**: a successful `tools/call` `prove` result carries `structuredContent` (the
  `Verdict` record) beside the existing single `formatVerdict` text block, on the modern era and
  through the legacy projection; the guide documents the shape and declares the deliberate
  departure from the serialized-JSON text-block recommendation.

## Context

- Repository: `C:\Users\mikes\WebstormProjects\probe` (clean `main`; commit nothing).
- Read first: `AGENTS.md`, `.claude/rules/` per its rule map (at minimum `tests.md`,
  `typescript.md`, `names.md`, `documentation.md`), and `guides/probe.md` §§ on the verdict and
  MCP registration.
- Today: `ProbeServer.#execute` returns
  `{ resultType: 'complete', content: [{ type: 'text', text: formatVerdict(verdict) }] }` with no
  `structuredContent` (`src/server/ProbeServer.ts:202-215`). Because it supplies
  `MCPServerOptions.execution` and returns a full `MCPCallResult`, it bypasses mcp's own
  `#normalize` stamping. `MCPCallResult` already admits `structuredContent` (verify in the
  installed `@orkestrel/mcp` declarations); expect no type change in probe.
- The wire consumer today is legacy: this harness registers probe through `.mcp.json` and mcp's
  `createMCPLegacy` projects modern results via `modernResultToLegacy`. The field must be proven
  to survive that projection — `tests/src/bin/main.test.ts` already drives the shipped entry
  with the mcp stdio client and a legacy client transport; extend those drives.
- Spec grounding (for the guide sentence): tools row 31 — "a tool that returns structured
  content SHOULD also return the serialized JSON in a TextContent block." This unit deliberately
  keeps `formatVerdict` prose as the text block instead: the receipt's closing line
  (`receipt <token>` or `no receipt`) must stay quotable verbatim per the quality contract, and
  the record itself now travels in `structuredContent`. Declare that departure with its reason
  in the guide.

## Fixed constraints

- No `outputSchema`. No tool annotations. No changes to `@orkestrel/tool` usage beyond what the
  result shape needs. No changes under `@orkestrel/mcp`. No new packages.
- A failed (`isError`) tool result and every `ProbeError` path stay byte-identical to today.
- Exactly one text content block, equal to `formatVerdict(verdict)`.
- `structuredContent` equals the `Verdict` record the run produced (the same object shape
  `isVerdict` admits), not a re-serialization of the text.

## Scope

- Owned: `src/server/ProbeServer.ts`, `tests/src/server/ProbeServer.test.ts`,
  `tests/src/bin/main.test.ts`, `guides/probe.md`.
- Off-limits: everything else, including `src/core/*` (the `Verdict` type and `formatVerdict`
  do not move) and `package.json`.

## Execution

Perform the assignment directly and spawn nothing. TTTDD: write the failing assertions first —
one on the server result (`structuredContent` present and equal to the verdict), one through the
legacy bin drive — record the red run, implement, record green. Validate scoped:
`npm run test:src:server` and `npm run test:src:bin`, plus scoped lint on owned files and
`npm run check` for the touched projects. Do not run the whole suite, tree-wide `format`, or
`build`.

## Output

Write your report to `tmp/units/p1-report.md` in the probe repository: the failing-first
evidence (exact command, red count, then green count), the diff summary, the guide sentences
added, and any claim you could not close.

## Deviation contract

Stop and report when: `structuredContent` does not survive `modernResultToLegacy` (that is an
mcp finding, not yours to fix); the installed `MCPCallResult` declaration rejects the field; or
any existing test outside your owned files reddens. Ancillary choices (test naming, guide
placement within the existing sections) are yours to decide and record.

## Acceptance criteria

1. Failing-first proof recorded for the new assertions.
2. A successful `prove` over the modern server path carries `structuredContent` deep-equal to
   the verdict and one text block equal to `formatVerdict(verdict)`.
3. The legacy bin drive receives the same `structuredContent` unchanged.
4. Failed results and error paths unchanged (existing rows stay green).
5. `guides/probe.md` documents the field and declares the row-31 departure with its reason;
   `npm run test:guides` green if the guide gate runs locally, otherwise report it as deferred
   to the verifier.
6. Scoped lint, check, `test:src:server`, `test:src:bin` green.
