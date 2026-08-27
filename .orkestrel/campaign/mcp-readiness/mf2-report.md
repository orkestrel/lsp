# MF2 report — the A-M accepted findings plus the stateless-retry seam

Every fix row landed. Nothing was dropped and no deviation trigger fired. Two rows departed from
their prescription's letter and both departures are named in "Departures from prescription".

The headline measurement: `sep-2322-client-request-state` moved from `4 passed, 1 failed` to
`5 passed, 0 failed`, recorded red-then-green with `npm run test:conformance`.

## Per-fix landing

### 1 — Gate the port doors

`#prompt` and `#resource` now route a forwarded `MCPInputResult` through the new
`MCPServer.#forward`, which runs the result's `inputRequests` through the same `#gate` before
stamping. A result carrying only a continuation carrier asks nothing, so it is stamped without a
gate. The two doors' stamping bodies were identical, so `#forward` owns both.

New rows, one per port, in `tests/src/core/MCPServer.test.ts`:

- `MCP resources/read > refuses a manager round the client did not declare the capability for`
- `MCP prompts/get > refuses a manager round the client did not declare the capability for`

Each drives a round-carrying manager arm added to `MemoryResourceManager` (`tests/setup.ts`,
`memory://resource/round`) and to `MemoryPromptManager` (`tests/src/core/MCPServer.test.ts`, the
`round` prompt name), asserts `-32021` with the exact `requiredCapabilities` payload against a
client declaring `{}`, and asserts the stamped result against a client that declared the kind.

**Failing-first**: reverting the gate (`if (requests !== undefined)` to `if (false && ...)`) gives
`npx vitest run --project src:core tests/src/core/MCPServer.test.ts` →
`Tests 2 failed | 220 passed (222)`. Restored → `Tests 222 passed (222)`.

**Conformance consequence, measured**: `input-required-result-non-tool-request` did NOT move. It
stands at `2 passed, 0 failed` in `npm run test:conformance`, which is green at
`Tests 47 passed (47)`. The runner's client for that scenario declares the elicitation capability
the fixture's prompt round asks for, so the gate admits it. No scenario reddened.

### 2 — Widen sampling to the pinned schema, and the root URI

`MCPSampleResult.content` is now `MCPSampleContent | readonly MCPSampleContent[]`, which is the
mirror's `anyOf` at `tests/mirrors/ext-tasks-2026-07-28-schema.json` `CreateMessageResult.content`.
Three types are new in `src/core/types.ts`: `MCPToolUseContent`, `MCPToolResultContent`, and the
`MCPSampleContent` union (the schema's `SamplingMessageContentBlock`).

One guard is new in `src/core/validators.ts`: `isMCPSampleContent`. It delegates the text, image,
and audio arms to `isMCPContent` and owns the `tool_use` and `tool_result` shapes; the resource
arms of `isMCPContent` are refused, matching the schema. `isMCPSampleResult` accepts one block or
an array of them.

`isMCPRoot` applies `isAbsoluteURI` to `uri`, the same treatment the URL-elicitation `url` gets for
the same `format: uri` keyword.

Prose corrected: the `MCPSampleResult` TSDoc, the `isMCPSampleResult` and `isMCPRootResult` guard
remarks, and the guide's `MCPSampleResult`, `isMCPSampleResult`, and `isMCPRoot` rows. New guide
rows document `MCPToolUseContent`, `MCPToolResultContent`, `MCPSampleContent`, and
`isMCPSampleContent`; `npm run test:guides` is green at `Tests 144 passed (144)`.

**Failing-first**: reverting the widening (tool_use arm to `return false`, plus rejecting an array
`content`) gives `npx vitest run --project src:core tests/src/core/validators.test.ts` →
`Tests 2 failed | 140 passed (142)`. Reverting `isAbsoluteURI` to `isString` gives
`Tests 1 failed | 141 passed (142)`. Both restored → `Tests 142 passed (142)`.

### 3 — The URL refusal payload

`computeMissingCapabilities` answers `{ elicitation: { url: {} } }` for a URL round the client's
declaration excludes. The pinned loop row in `tests/src/core/validators.test.ts` is now the
regression row asserting that payload, and the guide's refusal sentence names the URL case.

**Failing-first**: collapsing the branches back to `missing['elicitation'] = {}` gives
`npx vitest run --project src:core tests/src/core/validators.test.ts` →
`Tests 1 failed | 141 passed (142)`. Restored → `Tests 142 passed (142)`.

### 4 — One reading for an unparsable modern context

**I read the first door's arms with a probe before landing anything, and the reading changes what
this row can claim.** Both arms are unreachable through the public surface. `MCPServer.#modern`
refuses `context === undefined` with `-32602 Invalid params: malformed modern request metadata`
at `src/core/MCPServer.ts:391` before any handler resolves, and every route into `#call` — the
public `dispatch`, `handle`, and `MCPLegacy` — passes through it. A runtime probe under
`tmp/probe/` (deleted before this report) drove four `tools/call` requests through a configured
input policy and printed each answer:

```text
non-string version:          {"code":-32602,"message":"Invalid params: malformed modern request metadata"}
malformed capabilities:      {"code":-32602,"message":"Invalid params: malformed modern request metadata"}
retry malformed capabilities:{"code":-32602,"message":"Invalid params: malformed modern request metadata"}
control gate:                {"code":-32021,"message":"Server requires a client capability this request did not declare","data":{"requiredCapabilities":{"roots":{}}}}
```

The control proves the probe sees the gate's own answer when the context parses. So the `-32021`
against `-32602` disagreement the subjective lane found was between two DEFENSIVE arms, and the
wire behaviour was already one answer.

Landed reading: `#gate` now takes the parsed `MCPRequestContext | undefined` instead of a
capability record, and owns the unparsable arm itself with the ingress's exact code and message.
All three doors — first round, retry, and forwarded port round — read it through that one place.
The retry door's own earlier `context === undefined` message changed from the retry wording to the
same malformed-metadata wording, because it answers the same condition.

Pinned by `MCPServer — W02-B: MRTR ordering, binding, and re-entry > separates an empty declaration
from an unparsable one, at both MRTR doors`: an empty declaration is gated `-32021`, an unparsable
`_meta` is refused `-32602 malformed modern request metadata` on the first-round door and on the
retry door alike, and neither unparsable call costs a selector run.

**Instrument control**: this pin records pre-existing wire behaviour, so no revert of my own change
reddens it. I proved it can fail by perturbing the ingress refusal it reads — changing
`#modern`'s message string gives
`npx vitest run --project src:core tests/src/core/MCPServer.test.ts` →
`Tests 2 failed | 220 passed (222)` (the new pin plus the file's existing ingress row at
`:835`). Restored → `Tests 222 passed (222)`.

The guide's failure taxonomy declares the behaviour: "A request whose modern `_meta` cannot be
parsed at all is a different failure and receives `-32602` with `malformed modern request
metadata` — the answer `MCPServer` gives it at the ingress, before any handler runs, and the same
answer both MRTR doors give it. An empty capability declaration is not that case: it parses, it
excludes every kind, and it is gated `-32021`."

### 5 — The stateless retry

`MCPCallOptions.input.state` is `state?: string`. `MCPClient.call` places `requestState` exactly
when a state is supplied and never otherwise. `tests/conformanceClient.ts` answers a stateless
round instead of reporting the seam; a result carrying no `inputRequests` is still reported,
because there is nothing to answer.

**Failing-first, the recorded conformance row.** With the client fixed and the baseline row still
recording the old reading, `npm run test:conformance` reported:

```text
Tests  2 failed | 45 passed (47)
-     "failed": 1,
+     "failed": 0,
      "name": "sep-2322-client-request-state",
-     "passed": 4,
+     "passed": 5,
```

The two reds were the per-scenario baseline comparison and the red-name list. After updating the
`EXPECTED_CLIENT` row to `passed: 5, failed: 0` with its cause rewritten, the same command reports
`Tests 47 passed (47)`. The runner's message behind the old red, recorded by MC and reproduced
here as the row that disappeared, was `sep-2322-client-no-state-omitted`: "MRTR client check …
Tool was not called by client or MRTR flow not completed".

A unit row proves the client half directly:
`MCPClient — call() (the content round-trip) > omits requestState from a retry the peer sealed no
state for`. **Failing-first**: restoring the unconditional `requestState: input.state` gives
`npx vitest run --project src:core tests/src/core/MCPClient.test.ts` →
`Tests 1 failed | 141 passed (142)`. Restored → `Tests 142 passed (142)`.

**The server side, verified and pinned — and the verification did not find what the brief
predicted.** `MCPServer.#retry` does NOT model an optional `requestState`: it requires
`inputResponses` and `requestState` together and refuses either alone with
`-32602 Invalid params: \`inputResponses\` and \`requestState\` are required together`. That is
coherent rather than defective, because this server seals a carrier on every round it issues, so a
retry reaching it without one answers a round it never sent. I pinned that reading instead of
changing it: `MCPServer — W02-B … > refuses a retry carrying answers with no state, and one
carrying state with no answers`. The optional field `#retry` does already model is the consumer's
application `state`, forwarded only when defined, which the existing row `returns the consumer's
keyed round…` already pins. The guide now states both halves: the client's `state` is optional
because a PEER may issue a stateless round, and a retry reaching THIS server without one is
refused `-32602`.

### 6 — `round` renamed to `selector`

`MCPInputOptions.round` is `MCPInputOptions.selector`. `MCPServer` reads `configured.selector` at
both call sites. Every consumer moved: `tests/setupConformance.ts`, `tests/setup.ts` (whose TSDoc
sentence naming the removed `elicit` key is corrected in the same edit), `tests/src/core/
MCPLegacy.test.ts`, and thirty option literals in `tests/src/core/MCPServer.test.ts`. The rename
was applied line by line from the compiler's own `TS2353` report, so the application-state literals
that also spell `round` (`{ round: 1 }`, `{ round: selections.length }`) were untouched. The guide's
`MCPInputOptions` row and the MRTR fence follow.

### 7 — Stale references

- The three dead anchors (`guides/mcp.md` former `:532`, `:796`, `:3178`) now target
  `#ask-the-client-for-input-during-the-call-in-hand`, with link text matching the heading. An
  anchor sweep over the whole guide finds no target that no heading defines.
- The suite name is `MCPServer — multi-round-trip input`.
- The control identifiers are `'selector provider detail'` and `['selector', 'principal']`.
- The `MCPInputResponse` guide row's union pipes are escaped, so the row is one cell again.
- The deprecated-carrier cells are rewritten: the guide's `MCPInputRequest` and
  `isMCPInputRequest` rows, the `MCPInputRequest` TSDoc, and the `isMCPInputRequest` `@returns`.
  Sampling and roots are described as embedded arms this server issues, with open parameter
  records because the dated schema leaves those bodies to the caller.
- The server-keyed map cells are consumer-keyed: the guide's `MCPInputRequestMap`,
  `MCPInputResponseMap`, and `isMCPInputRequestMap` rows, plus the two TSDoc lines in
  `src/core/types.ts` and the `isMCPInputRequestMap` remark in `src/core/validators.ts`.
- `MCPElicitURL` no longer says "not produced here".

### 8 — The guide's conformance narrative

The "23 passed / 0 failed … no remaining failing scenario" paragraph now states the recorded
server-mode baseline `102 passed / 8 failed`, names `server-stateless` (26/2) and
`http-custom-header-server-validation` (3/6) with their causes, and points at
`tests/conformance.test.ts` as the per-scenario record. A new paragraph states the client-mode run,
names `http-custom-headers` (3/15) and `http-invalid-tool-headers` (1/10) with the one cause behind
both, and records the `auth/*` exclusion and its reason. The "a run with no failures invites
over-reading" clause is gone, and the historical `23/0` reading is marked as the scenario set of the
day.

### 9 — F3, the round against the state budget

One sentence in the protected-state paragraph: the round travels inside the protected payload, so
its size is spent from `limit.state` (16384 bytes by default), and a large mixed round or a large
form schema is refused at the seal with `-32602` rather than truncated. The option key is `limit`,
verified against `MCPServerOptions` rather than assumed from the brief's spelling.

### 10 — F4, URL-mode elicitation

A new paragraph in the input-policy section: URL mode is a composable arm that may sit beside a
form, sampling, or roots request under other keys; the client must declare `elicitation.url` as a
record; the bare `elicitation: {}` spelling is form-only, so a URL round against it is refused
`-32021` with `{ elicitation: { url: {} } }`; `url` carries `format: uri`; and the URL arm issues
no schema, so its answer is checked for shape alone.

### 11 — The nested function

`tests/setupConformance.test.ts` hoists the selector-context builder to module scope as
`buildInputContext`, beside the file's other module-scope declarations, and its three call sites
read it there. `npm run test:setup` is green at `Tests 86 passed (86)`.

### 12 — Wording

The one "byte-exact" claim about sealed state (`guides/mcp.md`, the retry paragraph) reads "the
`requestState` the server issued, returned unchanged". A tree-wide sweep for `byte-exact` finds no
other occurrence; the remaining `byte-identical` hits are about headers, refusals, and arguments,
which are literal byte claims the tests do establish.

The `MCPLegacy.test.ts` fixture round is minimal — `{ requests: { approval: { method:
'roots/list' } } }` — with a comment stating the round is never issued on that path, because
`legacyInvocationToModern` stamps an empty declaration, the modern gate refuses every kind against
it, and the legacy layer projects that refusal.

## Departures from prescription

Both are supersets of the prescribed behaviour on the case the prescription names.

1. **Fix 3, the mixed round.** The prescription is `missing['elicitation'] = { url: {} }` in the
   URL branch. Written literally beside the unchanged form branch, a round needing BOTH arms
   overwrites one payload with the other, and which one survives depends on key order — which
   reinstates the loop the fix exists to close, because neither `{}` nor `{ url: {} }` authorizes
   both arms. So the branches now set flags and the payload is composed once: a URL-only gap
   answers exactly `{ url: {} }`, a form-only gap answers exactly `{}`, and a round needing both
   answers `{ form: {}, url: {} }`. The prescribed case is byte-identical to the prescription.
2. **Fix 4, the message.** The prescription says the unparsable arm answers `-32602` "like the
   retry door". The retry door's wording blamed the request state. Because the probe showed the
   ingress already answers this exact condition with `malformed modern request metadata`, one
   reading means that wording at every door, so the retry door's message moved to it as well. No
   observable behaviour changed on any reachable path.

## Claims I could not close

- **The MRTR guide fence has no executed transcription.** `.claude/rules/documentation.md` wants a
  prose claim about behaviour executed by `tests/guides.test.ts`, and that file is off-limits to
  this unit. The fence's new lines — `isMCPSampleContent(...)`, the array-form
  `isMCPSampleResult(...)`, and the `computeMissingCapabilities` URL refusal — are each asserted
  with the same inputs and the same expected values in `tests/src/core/validators.test.ts`, so the
  claims are proven, in the mirrored suite rather than in the guide project. A successor unit
  owning `tests/guides.test.ts` can transcribe the fence.
- **The two `context === undefined` arms are unreachable** through the public surface, per the
  probe above. They are now one consistent defensive reading rather than two contradictory ones,
  but no test can drive either directly. Removing them would mean threading the parsed context
  through the public `MCPMethodHandler` seam, which is a contract change outside this unit.

## Ancillary decisions recorded

- `guides/mcp.md` failed `oxfmt --check` at the unmodified baseline `ab5cd27`, on one table cell's
  trailing padding in the non-goals table. I own the file and it is inside my format gate, so I
  applied that one-character fix. `npx oxfmt --check .` is now clean across all 218 files.
- The new guard is `isMCPSampleContent` rather than folded into `isMCPSampleResult`, because the
  five-arm block check is reusable logic and `AGENTS.md` forbids a hidden module helper.
- `MCPServer.#forward` exists because both port doors had byte-identical stamping bodies and now
  share a gate; it adds a boundary rather than renaming one.
- The `computeMissingCapabilities` locals are `formUndeclared` and `urlUndeclared`, past
  participles reading as assertions.
- Test names describe what they prove; no test is named for a perturbation or a control.

## Touched files

| File | Change |
| --- | --- |
| `src/core/types.ts` | `MCPToolUseContent`, `MCPToolResultContent`, `MCPSampleContent` added; `MCPSampleResult.content` widened to the mirror's `anyOf`; `MCPCallOptions.input.state` optional; `MCPInputOptions.round` renamed `selector`; the deprecated-carrier and server-keyed TSDoc corrected. |
| `src/core/validators.ts` | `isMCPSampleContent` added; `isMCPSampleResult` accepts a block or an array; `isMCPRoot` applies `isAbsoluteURI`; the narrowing and server-keyed guard prose corrected. |
| `src/core/helpers.ts` | `computeMissingCapabilities` names the elicitation ARM the round needs. |
| `src/core/MCPServer.ts` | `#gate` takes the parsed context and owns the unparsable reading; `#forward` gates and stamps a manager-authored `MCPInputResult` for both ports; `configured.selector`; the retry door's unparsable message unified. |
| `src/core/MCPClient.ts` | `requestState` rides only when the caller supplies a state. |
| `guides/mcp.md` | Dead anchors retargeted; the refusal taxonomy, the retry paragraph, the conformance narrative, F3, and F4 rewritten; the Surface, Helpers, Types, and Methods rows corrected; new rows for the three types and the new guard; the union-pipe row repaired; the baseline padding drift fixed. |
| `tests/setup.ts` | `MemoryResourceManager` gains the round-carrying arm; `createInputServer` uses `selector` and its TSDoc no longer names `elicit`. |
| `tests/setupConformance.ts` | `selector`. |
| `tests/setupConformance.test.ts` | The nested selector-context builder hoisted to `buildInputContext`. |
| `tests/conformanceClient.ts` | `driveCall` answers a stateless round. |
| `tests/conformance.test.ts` | The `sep-2322-client-request-state` baseline row moved to `5 passed, 0 failed` with its cause rewritten. |
| `tests/src/core/MCPServer.test.ts` | Suite renamed; control identifiers renamed; `selector`; the round-carrying prompt arm; four new rows (two port gates, the two-door reading, the retry pairing). |
| `tests/src/core/MCPClient.test.ts` | The stateless-retry row. |
| `tests/src/core/MCPLegacy.test.ts` | The minimal never-issued round with its comment. |
| `tests/src/core/validators.test.ts` | The URL refusal regression row and the mixed-round rows; the sampling array, tool-block, and nested-array rows; the root URI rows; the new `isMCPSampleContent` suite; the guard registered in both published-guard lists. |

```text
 guides/mcp.md                     | 428 ++++++++++++++++++++++----------------
 src/core/MCPClient.ts             |   6 +-
 src/core/MCPServer.ts             |  78 ++++---
 src/core/helpers.ts               |  15 +-
 src/core/types.ts                 |  74 +++++--
 src/core/validators.ts            |  85 ++++++--
 tests/conformance.test.ts         |  18 +-
 tests/conformanceClient.ts        |  16 +-
 tests/setup.ts                    |  13 +-
 tests/setupConformance.test.ts    |  33 +--
 tests/setupConformance.ts         |   2 +-
 tests/src/core/MCPClient.test.ts  |  26 +++
 tests/src/core/MCPLegacy.test.ts  |  16 +-
 tests/src/core/MCPServer.test.ts  | 264 ++++++++++++++++++++---
 tests/src/core/validators.test.ts | 113 +++++++++-
 15 files changed, 863 insertions(+), 324 deletions(-)
```

## Commands and final counts

Run on 2026-08-27, Windows 11, Node v24.19.0, from `C:\Users\mikes\WebstormProjects\mcp` at
`ab5cd27`. Nothing was committed. `git status --short` holds exactly the fifteen owned files.

| Command | Result |
| --- | --- |
| `npm run build:src` | Exit 0. The recorded ancillary the brief authorizes; `tests/conformanceClient.ts` imports `dist/`, and the type change had to reach it. Run once before the first conformance measurement and once after the last source edit. |
| `npm run check` | Exit 0. Root `tsc` plus `check:src:core`, `check:src:browser`, `check:src:server`. |
| `npm run test:src:core` | `Test Files 16 passed (16)`, `Tests 791 passed (791)` — was 785 before this unit. |
| `npm run test:setup` | `Test Files 5 passed (5)`, `Tests 86 passed (86)` — unchanged. |
| `npm run test:conformance` | `Test Files 1 passed (1)`, `Tests 47 passed (47)`, after the recorded red at `Tests 2 failed | 45 passed (47)`. |
| `npm run test:guides` | `Test Files 1 passed (1)`, `Tests 144 passed (144)` — unchanged. |
| `npm run test:policy` | `Test Files 1 passed (1)`, `Tests 93 passed (93)` — unchanged. |
| `npx oxlint --config .oxlintrc.json --deny-warnings` on the fifteen owned files | Exit 0, no violations. |
| `npx oxfmt --config .oxfmtrc.json --check` on the fifteen owned files | `All matched files use the correct format.` |
| `npx oxfmt --config .oxfmtrc.json --check .` | `All matched files use the correct format.` on 218 files — the pre-existing `guides/mcp.md` drift is closed. |

Run beyond the brief's list, to check the deviation trigger "a test outside the owned files
reddens":

| Command | Result |
| --- | --- |
| `npm run test:src:server` | `Test Files 12 passed (12)`, `Tests 316 passed (316)`. |
| `npm run test:src:browser` | `Test Files 4 passed (4)`, `Tests 56 passed (56)`. |
| `npm run test:integration` | `Test Files 1 passed (1)`, `Tests 4 passed (4)`. |

No tree-wide `format` or `lint --fix` was run. `oxfmt --write` was run scoped to the fifteen owned
files. The runtime probe under `tmp/probe/` was deleted after its reading was recorded here.

### Failing-first ledger

Each perturbation reverses exactly one landed fix, is applied and restored from a backup copy taken
immediately before it, and never touches `git checkout`, `restore`, `stash`, `reset`, or `clean`.

| Perturbation | Command | Red | Green after restore |
| --- | --- | --- | --- |
| The port gate short-circuited in `#forward` | `npx vitest run --project src:core tests/src/core/MCPServer.test.ts` | `Tests 2 failed \| 220 passed (222)` | `Tests 222 passed (222)` |
| `isMCPSampleContent` tool arm to `false`, array `content` refused | `npx vitest run --project src:core tests/src/core/validators.test.ts` | `Tests 2 failed \| 140 passed (142)` | `Tests 142 passed (142)` |
| `isMCPRoot` back to `isString` | `npx vitest run --project src:core tests/src/core/validators.test.ts` | `Tests 1 failed \| 141 passed (142)` | `Tests 142 passed (142)` |
| The elicitation payload collapsed to `{}` | `npx vitest run --project src:core tests/src/core/validators.test.ts` | `Tests 1 failed \| 141 passed (142)` | `Tests 142 passed (142)` |
| The ingress malformed-metadata message changed (control for the two-door pin) | `npx vitest run --project src:core tests/src/core/MCPServer.test.ts` | `Tests 2 failed \| 220 passed (222)` | `Tests 222 passed (222)` |
| The client's `requestState` made unconditional | `npx vitest run --project src:core tests/src/core/MCPClient.test.ts` | `Tests 1 failed \| 141 passed (142)` | `Tests 142 passed (142)` |
| The `sep-2322-client-request-state` baseline row left at `4/1` | `npm run test:conformance` | `Tests 2 failed \| 45 passed (47)` | `Tests 47 passed (47)` |
