# A-M subjective lane verdict (returned 2026-08-27, `reviewer`/Opus 5, blind, own-engine subject)

Ruled against the diff, the worktree at `74d7f1c`, and the byte-pinned schema mirror
`tests/mirrors/ext-tasks-2026-07-28-schema.json`. Immutable record (Orchestrator transcription
of the returned report, rulings and evidence unedited).

1. **BROKEN.** Ordering half holds (two `#required` calls, each preceded by `#gate` on the same
   round; selector-`undefined` retry runs the tool). The sentence "no path issues an input
   request without the gate having measured that exact round" is false: `prompts/get`
   (`MCPServer.ts:686-694`) and `resources/read` (`:534-542`) forward a consumer-authored
   `MCPInputResult` verbatim, stamping `_meta` only — `inputRequests` never reaches
   `computeMissingCapabilities`; the unit's own `-non-tool-request` fixture drives it green. A
   package-level promise held only on the `tools/call` door. Fix: gate the forwarded
   `inputRequests` in `#prompt`/`#resource`, or scope the promise explicitly in TSDoc and guide.
2. **BROKEN.** Dispatch and cross-kind refusals hold; URL fall-through correct. But sampling is
   narrowed against the pinned schema: `CreateMessageResult.content` is an `anyOf` including
   `ToolUseContent`, `ToolResultContent`, and an ARRAY of blocks (mirror `:1858-1881`);
   `MCPSampleResult`/`isMCPSampleResult` admit one text/image/audio block and the TSDoc plus
   guide row claim the schema says so. A legal multi-block or tool-use answer is refused at
   `#answers`. Fix: widen to the schema's union, or declare the narrowing as a gap and stop
   citing the schema. Smaller, same class: `isMCPRoot` accepts any string `uri` while the mirror
   applies `format: uri` and the package enforces exactly that keyword for the URL-elicitation
   `url` through `isAbsoluteURI` — two `format: uri` fields, opposite treatment.
3. **CONFIRMED.** Attacks failed: pre-reshape payloads refuse; empty-map vacuity closed on both
   sides; the issued schema survives transitively and re-enforces at accept; the per-key
   unanswered check re-imposed in `#answers`; every replay binding still parsed and re-compared.
4. **CONFIRMED.** `state` admitted through `isJSONValue` only, spread only when defined, never
   read. Wording note: "byte-exact" cannot hold literally (canonical serialization normalizes
   key order); value-identical and never-inspected is what the tests establish.
5. **BROKEN.** Six stale sites: dead anchor `#produce-a-form-elicitation-for-the-call-in-hand`
   at `guides/mcp.md:532`, `:796`, `:3178` (heading renamed at `:1216`); `tests/setup.ts:381`
   TSDoc names the removed `elicit` key; suite name `multi-round-trip form elicitation`
   (`MCPServer.test.ts:1612`) now covers three kinds; `'elicit provider detail'` and the
   `['elicit', 'principal']` control ids (`:1729`, `:4682`, `:4694`). Plus a rendering break:
   the `MCPInputResponse` guide table row's union pipes are unescaped, splitting the row into
   five cells; siblings escape them. Also stale cells: `isMCPInputRequest`/`MCPInputRequest`
   still call sampling and roots deprecated carriers; the maps still "server-keyed";
   `MCPElicitURL` still "not produced here".
6. **CONFIRMED.** The expected branch-move attack on the `MCPLegacy` row failed —
   `isFormElicitationSupported({})` was already false pre-change, so the row proves the same
   refusal. Parsers rows isolate one binding each; empty-round is genuinely new. Observation:
   the `MCPLegacy` fixture's round is never issued on that path — a minimal round would say so.
7. **CONFIRMED.** The mirror requires `["message", "requestedSchema"]` on the form arm with
   `mode` an optional `const`; the URL arm requires `mode`; the `anyOf` resolves an omitted
   `mode` to form unambiguously. Dropping the stamp ships a valid request.
8. **BROKEN.** The three kind→capability mappings are exact, but the URL-mode refusal payload is
   `{ elicitation: {} }` — this package's own spelling for FORM support
   (`isFormElicitationSupported({elicitation:{}})` is true) — so the server instructs the client
   to declare what it already declared and refuses the identical round again with the identical
   payload; a pinned test celebrates the loop. Fix: `missing['elicitation'] = { url: {} }`
   (`MCPClientCapabilities.elicitation.url` already typed); guide's refusal sentence names the
   URL case.
9. **BROKEN** (narrow). File scope exact; no `any`/`as`/`!`/suppressions; module data placed.
   One banned construct: `tests/setupConformance.test.ts:249` assigns a function inside an `it`
   body (neither sanctioned exception). Two pre-existing instances elsewhere predate the unit.
   Fix: hoist beside the file's other fixture builders.
10. **BROKEN.** "`MCPMethodManagerInterface` and the dispatch spine unchanged" — the interface
    and ingress hold, but one wire-visible change is undeclared: an unparsable modern context on
    the RETRY door now answers `-32602` where it answered `-32021` (`MCPServer.ts:1080-1086`),
    while the first door still gates `context?.capabilities ?? {}` into `-32021` — one
    condition, two codes, with the package arguing both readings in adjacent comments. The
    reshape-avoidance claim HOLDS (cheapest evasion constructed and fails). "No other trigger
    fired" refuted by the undeclared code change.

## Findings outside the claims

- **F1** — the guide's conformance narrative still states "23 passed / 0 failed" and "no
  remaining failing scenario" (`guides/mcp.md:3960-3963`, `:4011`) against the recorded
  `[102, 8]` baseline, in a section whose thesis is "read the fixture before quoting the
  number". Fix: derive the paragraph from the recorded table, or state the total with the two
  failing scenarios and their declared causes.
- **F2** — `round` names the handler option, the round value, and the private validator in one
  body while the prose calls the handler "the selector" throughout. One concept three names.
  Fix: rename the option key off `round` (the lane proposed `select`).
- **F3** — sealing the whole round moved a budget: `requests` now rides inside the protected
  payload bounded by `limit.state` (default 16 KiB), so an admitted mixed round can refuse at
  seal with `-32602`; the guide's protected-state paragraph says nothing about round size
  consuming the budget. Fix: one coupling sentence.
- **F4** — URL-mode elicitation became producible (stamp removed, gate and validator handle it)
  and is documented nowhere; combined with the claim-8 loop, a URL round meets an undocumented
  capability with an unactionable error. Fix: the input-policy section names URL mode and the
  `elicitation.url` declaration.

## Referrals to the objective lane

Sampling-narrowing wire interop (does `-basic-sampling` send only a single text block?); M4
conformance of the ungated port path; the retry door's correct code; round size against the
16 KiB default; testimony status of the conformance evidence.

VERDICT: FAIL
