# M-input report — widen the server's MRTR production seam

`MCPServerOptions.input` now expresses a round of several input requests under consumer-chosen
keys, of the elicitation, sampling, and roots kinds, capability-gated per kind. All six red rows
moved. `npm run test:conformance` is green at the new baseline `102 passed, 8 failed`.

**One deviation, reported and not acted on:** the widened types break three test files the brief
did not own. I did not edit them. Exact patches are in "Shared-file patches"; until they land,
`npm run check` reports three errors and `npm run test:src:core` reports 6 failed, all inside
those three files.

## The type design that landed

Every new declaration is in `src/core/types.ts`.

| Name | Shape | Why |
| --- | --- | --- |
| `MCPInputRound` | `{ requests: MCPInputRequestMap; state?: JSONValue }` | The selector's return. Replaces `MCPElicitation`, whose `request: MCPElicitForm` could carry one form and nothing else. Both members are one word. |
| `MCPRoot` | `{ uri; name?; _meta? }` | One filesystem root. |
| `MCPRootResult` | `{ roots: readonly MCPRoot[]; _meta? }` | The client's answer to `roots/list`. Named for the entity rather than pluralized. |
| `MCPSampleResult` | `{ role; content; model; stopReason?; _meta? }` | The client's answer to `sampling/createMessage`. `content` is ONE block of the text/image/audio arms, per the dated `CreateMessageResult`. |
| `MCPInputResponse` | `MCPElicitResult \| MCPSampleResult \| MCPRootResult` | Discriminated by each arm's own required members (`action`, `model` beside `role`, `roots`), because a response carries no `method`. |
| `MCPInputResponseMap` | `Readonly<Record<string, MCPInputResponse>>` | Mirrors `MCPInputRequestMap`. |

Three existing declarations changed:

- `MCPInputOptions.elicit` → **`round`**. The key names what it supplies, matching `principal`,
  `continuation`, and `ttl`; `elicit` was actively wrong for a sampling-only or roots-only round.
- `MCPInputContext.response?: MCPElicitResult` → **`responses?: MCPInputResponseMap`**. A round has
  several answers, keyed by the keys that round assigned.
- `MCPInputState.key` + `.schema` → **`.requests: MCPInputRequestMap`**. The sealed state carries
  the EXACT round issued, which derives both the keys a retry must answer and each form's schema.
  Storing the key and the schema separately would be storing two facts the round already holds.

`MCPElicitation` was removed. Its capability — one form round with consumer state — is a strict
subset of `MCPInputRound`, so keeping it would be a compatibility shim.

New behaviour, in its centralized file:

- `src/core/helpers.ts` — `computeMissingCapabilities(requests, capabilities)` returns the
  `requiredCapabilities` record naming what a round needs and the client did not declare, or
  `undefined`. One call answers both "refuse?" and "with what payload?".
- `src/core/validators.ts` — `isMCPRoot`, `isMCPRootResult`, `isMCPSampleResult`, and
  `isMCPInputResponse(value, request)`. The last takes the ISSUED request the same way
  `isElicitContent` takes the issued schema, and composes `isMCPElicitResult` + `isElicitContent`
  for a form round. An unrecognized request admits nothing.
- `src/core/parsers.ts` — `parseMCPInputState` reads `requests` through `isMCPInputRequestMap` and
  refuses an EMPTY round, because a retry against one would answer no question.

Sampling and roots response validation is exactly as deep as the package's own declaration goes.
The brief's premise that `isMCPInputResult`'s wire guards already admit `CreateMessageResult` and
`ListRootsResult` is not accurate — that guard covers the server's own result, and the package
declared no response types for either kind. I declared the two dated result shapes and validate
against them, and added no semantic check the schema does not state: `stopReason` stays an open
string, a root's `uri` stays an unconstrained string, and a sampling request's `params` stay an
open record.

## The one ordering change, and why

The capability gate moved from the retry's INGRESS to the point where a round is ISSUED.

Before, `#retry` checked `isFormElicitationSupported` before opening the continuation port. That
worked while every round was a form elicitation. With a widened round the required capability is
not knowable before the state is opened, and the protocol's rule (M4) is about SENDING, not about
answering. So the gate now measures the round: in `#input` after the round is owned and before the
principal resolver, and in `#retry` after the selector composes the NEXT round and before the seal.

Two consequences, both recorded in the guide and pinned by tests:

- A first round still costs no principal lookup when the gate refuses it
  (`checks the capability before the principal resolver and the seal on a first round`).
- A retry that answers its round and needs no further round now runs the tool even when the retry
  declared no capabilities (`gates the next round rather than the answered one on a retry`). The
  retry is still fully verified — sealed state, digest, principal, and every answer against the
  request that asked for it.

`MCPMethodManagerInterface` and the dispatch spine are unchanged. Nothing under `src/server` or
`src/browser` changed; `inferStatus` already maps `-32021` to HTTP 400.

## Failing-first evidence

**Conformance level.** The standing red record is the committed baseline in
`tests/conformance.test.ts` at `11fc749`: five `input-required-result-*` rows at
`{ passed: 0, failed: 1 }`, `server-stateless` at `{ passed: 24, failed: 4 }`, total `[91, 15]`.
`npm run test:conformance` was green against that record before the change
(`Test Files 1 passed (1)`, `Tests 43 passed (43)`), which is what makes it a record rather than a
prediction.

**Unit level.** Measured by writing the `HEAD` copies of the five owned source files over the
working ones, running the two owned test files, then restoring from a verified scratch backup.

```text
npx vitest run --config vite.config.ts --no-cache --reporter=dot --project src:core \
  tests/src/core/MCPServer.test.ts tests/src/core/validators.test.ts

pre-change source:  Test Files 2 failed (2)   Tests 35 failed | 323 passed (358)
post-change source: Test Files 2 passed (2)   Tests 358 passed (358)
```

Rows that ran red and now run green, named for what they prove:

- `issues one round of several kinds under the consumer's own keys`
- `refuses a round the client cannot answer with no declaration at all`
- `refuses a round the client cannot answer with URL-only elicitation`
- `refuses a round the client cannot answer with every kind but roots`
- `returns the consumer's keyed round and resumes under a new id from top-level echo fields`
- `checks the capability before the principal resolver and the seal on a first round`
- `gates the next round rather than the answered one on a retry`
- `owns the selector's round and schema immediately`
- `binds the original id across three rounds while re-minting the round and its expiry`
- `validates a roots listing and a sampling completion against their dated shapes`
- `answers each input response against the exact request that was issued`
- `names each capability a round needs and the client did not declare`
- `covers every guard the barrel publishes`

## Per-row baseline movement

| Scenario | Before | After |
| --- | --- | --- |
| `input-required-result-basic-elicitation` | 0/1 | 2/0 |
| `input-required-result-basic-sampling` | 0/1 | 2/0 |
| `input-required-result-basic-list-roots` | 0/1 | 2/0 |
| `input-required-result-multiple-input-requests` | 0/1 | 2/0 |
| `input-required-result-capability-check` | 0/1 | 1/0 |
| `server-stateless` | 24/4 | 26/2 |
| every other row | — | unchanged |
| total | 91 passed, 15 failed | 102 passed, 8 failed |

`server-stateless`'s row comment is split by cause, and the split is measured rather than deduced.
A throwaway probe under `tmp/probe/` ran the pinned runner with `--output-dir` against the live
fixture and read that scenario's `checks.json`; the probe was deleted. Its two remaining failures:

```text
sep-2575-request-meta-invalid-missing-meta              Expected error code -32602, got -32022
sep-2575-request-meta-invalid-missing-protocol-version  Expected error code -32602, got -32022
```

The same file records both capability checks `SUCCESS`, with the wire detail criterion 3 asks for:

```json
{ "jsonrpc": "2.0", "id": 401, "error": { "code": -32021,
  "message": "Server requires a client capability this request did not declare",
  "data": { "requiredCapabilities": { "sampling": {} } } } }
```

`sep-2575-missing-capability-http-400` passing is the HTTP `400` half.

## The fixture

`CONFORMANCE_FORMS` (a table of `MCPElicitForm` arrays) became `CONFORMANCE_ROUNDS` (a table of
`MCPInputRequestMap` arrays), and `buildConformanceElicitation` became `buildConformanceInput`.
The prompt-arm `buildConformanceRound` keeps its name; the two never collide because the prompt arm
answers `prompts/get` and the tool arm answers the `input` policy.

`test_missing_capability` is registered from `CONFORMANCE_ANSWERS`, so it is listed by `tools/list`
and its round asks for `sampling/createMessage` alone. Its answer text is a sentence naming the
failure it would represent, so a gate that failed open would put that sentence in the runner's own
failure detail. `test_input_required_result_capabilities` asks for sampling alone for the same
reason from the other side: that call declares `sampling` and nothing else.

The composition rule MF held to still holds. No fixture code produces an `input_required` result
for `tools/call`, and `MCPMethodManagerInterface.add` is not used.

**Carried obligation from MF, closed.** `tests/setupConformance.test.ts` now proves the exported
fixture helpers directly: the round progression and the unknown-name case
(`walks each tool's rounds by the state the previous round carried`), the sampling-only rounds and
the no-empty-round invariant (`asks only for sampling wherever the scenario declares only
sampling`), `readConformanceAnswers` (`projects only the accepted string answers a verified retry
carried`), and the prompt arm's seal/open loop (`re-issues the prompt round until its own sealed
carrier comes back`).

## Touched files

| File | Change |
| --- | --- |
| `src/core/types.ts` | `MCPInputRound`, `MCPRoot`, `MCPRootResult`, `MCPSampleResult`, `MCPInputResponse`, `MCPInputResponseMap`; `MCPInputOptions.round`, `MCPInputContext.responses`, `MCPInputState.requests`; `MCPElicitation` removed |
| `src/core/MCPServer.ts` | `#round` replaces `#form`; new `#gate` and `#answers`; `#input` / `#retry` / `#required` carry the round |
| `src/core/validators.ts` | `isMCPRoot`, `isMCPRootResult`, `isMCPSampleResult`, `isMCPInputResponse` |
| `src/core/helpers.ts` | `computeMissingCapabilities` |
| `src/core/parsers.ts` | `parseMCPInputState` reads `requests` and refuses an empty round |
| `tests/src/core/MCPServer.test.ts` | Round-shaped probe and helpers; new mixed-kind and capability-gate rows |
| `tests/src/core/validators.test.ts` | Rows for each new guard and for `computeMissingCapabilities`; guard-totality table extended |
| `tests/setupConformance.ts` | `CONFORMANCE_ROUNDS`, `buildConformanceInput`, `test_missing_capability` |
| `tests/setupConformance.test.ts` | Tool-list row; proofs for the exported fixture helpers |
| `tests/conformance.test.ts` | Baseline moved to `102, 8`; row comments rewritten |
| `guides/mcp.md` | Input-policy section rewritten; Surface and Types rows for every new and changed symbol |

```text
 guides/mcp.md                     | 150 ++++++++-----
 src/core/MCPServer.ts             | 183 +++++++++-------
 src/core/helpers.ts               |  55 +++++
 src/core/parsers.ts               |  25 +--
 src/core/types.ts                 |  99 +++++++--
 src/core/validators.ts            | 137 ++++++++++++
 tests/conformance.test.ts         |  46 ++--
 tests/setupConformance.test.ts    |  88 ++++++++
 tests/setupConformance.ts         | 272 ++++++++++++++---------
 tests/src/core/MCPServer.test.ts  | 450 +++++++++++++++++++++-----------------
 tests/src/core/validators.test.ts | 148 +++++++++++++
 11 files changed, 1150 insertions(+), 503 deletions(-)
```

## Validation evidence

| Command | Result |
| --- | --- |
| `npx oxfmt --config .oxfmtrc.json --check src/ tests/ guides/` | `All matched files use the correct format.` |
| `npx oxlint --config .oxlintrc.json --deny-warnings src/core tests/src/core/MCPServer.test.ts tests/src/core/validators.test.ts tests/setupConformance.ts tests/setupConformance.test.ts tests/conformance.test.ts` | exit 0 |
| `npm run check:src` | exit 0 — `check:src:core`, `check:src:browser`, `check:src:server` clean |
| `npm run check` | 3 errors, all in the two unowned files below |
| `npm run test:src:core` | `Tests 6 failed \| 779 passed (785)` — every failure in the three unowned files below |
| `npx vitest run … --project src:core tests/src/core/MCPServer.test.ts tests/src/core/validators.test.ts` | `Tests 358 passed (358)` |
| `npm run test:setup` | `Test Files 5 passed (5)`, `Tests 79 passed (79)` |
| `npm run test:conformance` | `Test Files 1 passed (1)`, `Tests 43 passed (43)` |
| `npm run test:guides` | `Test Files 1 passed (1)`, `Tests 144 passed (144)` |
| `npm run test:policy` | `Test Files 1 passed (1)`, `Tests 93 passed (93)` |

Nothing was committed. `npm test`, tree-wide `format`, and `build` were not run.

## Shared-file patches (report-only, not applied)

### Patch 1 — `tests/setup.ts`, `createInputServer`

Replace lines 405 to 417:

```ts
			round: ({ responses }) =>
				responses === undefined
					? {
							requests: {
								approval: {
									method: 'elicitation/create',
									params: {
										message: 'Approve this call?',
										requestedSchema: {
											type: 'object',
											properties: { approved: { type: 'boolean' } },
											required: ['approved'],
										},
									},
								},
							},
						}
					: undefined,
```

Closes `tests/src/core/MCPClient.test.ts` `continues an input-required call with protected state
and responses` and `keeps changed retry arguments under the server digest refusal`. Both read the
round's first key dynamically, so the fixed `approval` key needs no further change there.

### Patch 2 — `tests/src/core/MCPLegacy.test.ts`, line 382

Replace lines 382 to 387:

```ts
					round: () => ({
						requests: {
							approval: {
								method: 'elicitation/create',
								params: {
									message: 'Approve?',
									requestedSchema: { type: 'object', properties: {} },
								},
							},
						},
					}),
```

The assertion is unchanged and still holds: `legacyInvocationToModern` declares `{}` capabilities,
so the gate refuses with `requiredCapabilities: { elicitation: {} }`, `MCPLegacy.#capability` reads
no `extensions` and answers `'input-required'`, and the message stays `Legacy protocol 2025-11-25
cannot represent an input-required result`. The equivalent row in the owned
`tests/src/core/MCPServer.test.ts` passes on this exact path.

### Patch 3 — `tests/src/core/parsers.test.ts`

Replace the `key` and `schema` members of `protectedPayload` (lines 35 and 38) with:

```ts
		requests: {
			confirm: {
				method: 'elicitation/create',
				params: {
					message: 'Approve?',
					requestedSchema: { type: 'object', properties: { approved: { type: 'boolean' } } },
				},
			},
		},
```

In `parses every replay-binding field, the issued schema, and optional consumer state` (rename it
to `parses every replay-binding field, the issued round, and optional consumer state`) replace the
`key` and `schema` expectations with the same `requests` object.

In `rejects malformed JSON and every missing or mistyped binding`, replace the `key` and `schema`
rows with:

```ts
			protectedPayload({ requests: undefined }),
			protectedPayload({ requests: 'confirm' }),
			protectedPayload({ requests: {} }),
			protectedPayload({ requests: { confirm: { method: 'tools/call' } } }),
			protectedPayload({
				requests: {
					confirm: {
						method: 'elicitation/create',
						params: { message: 'Approve?', requestedSchema: { type: 'object' } },
					},
				},
			}),
```

In `parses the complete payload the rejection rows are built from`, replace
`toMatchObject({ key: 'confirm' })` with `toMatchObject({ requests: expect.any(Object) })`.

The empty-round row is a NEW binding this change added: an issued round with no keys seals state no
retry could satisfy, so the parser refuses it.

### Patch 4 — `guides/mcp.md` § Declared non-goals (off-limits section)

Two lines there are now false or dangling. I did not edit them; `npm run test:guides` does not
check internal anchors, so nothing gates them.

- The `Server-initiated elicitation/create requests` row links to
  `#produce-a-form-elicitation-for-the-call-in-hand`. That heading is now
  `### Ask the client for input during the call in hand`, so the link text becomes
  `[Ask the client for input during the call in hand](#ask-the-client-for-input-during-the-call-in-hand)`.
- The `Sampling and roots as input-request carriers` row states `this server produces
  MCPElicitRequest and nothing else`. That is the capability this unit shipped, so the row is no
  longer a non-goal. Delete it.

### Patch 5 — recommended, not required

`computeMissingCapabilities` lives in `helpers.ts` and its unit rows are in the owned
`tests/src/core/validators.test.ts`, beside `isFormElicitationSupported` — which is also a
`helpers.ts` capability predicate already proved in that file. If the repository prefers helper
proofs in `tests/src/core/helpers.test.ts`, move the `names each capability a round needs and the
client did not declare` row there. I followed the existing placement rather than starting a second
one.

## Deviation state

One deviation, per the brief's `an existing green row reddens` trigger. The widened types force a
change in `tests/setup.ts`, `tests/src/core/MCPLegacy.test.ts`, and
`tests/src/core/parsers.test.ts`, none of which the brief owns. No shape of the widening avoids it:
`MCPInputContext.response` becoming `responses` and `MCPInputRound.requests` replacing
`MCPElicitation.request` break those files whatever the option key is called. I finished every
owned file rather than stopping, and returned the patches above rather than editing them.

No other trigger fired. No conformance row resisted for a reason outside the named seam, no owned
green row reddened, and the guide's recorded input-policy design agreed with the spec rows
throughout.

## Ancillary choices I made

- `MCPInputOptions.elicit` renamed to `round` rather than kept. The brief did not name the key;
  `elicit` names one of three kinds the option can now produce.
- The server no longer stamps `mode: 'form'` onto a consumer's elicitation params. The consumer
  owns the wire it composed, `MCPElicitForm.mode` is optional, and no scenario reads it.
- Sampling and roots response types declared (`MCPSampleResult`, `MCPRootResult`) rather than
  validating those answers as bare records. A bare-record check would accept any object under a
  sampling key, which is the hole the brief asked to close symmetrically.
- `isMCPInputResponse` takes the issued request as a second argument rather than exposing three
  separate per-kind checks the server would have to dispatch between itself.
- Test helper `createRound(request?, state?)` in `MCPServer.test.ts` replaces `createElicitation`,
  and the shared key is `approval`.

## What I could not close

- The remaining `server-stateless` pair (`-32602` versus `-32022` for a bad or missing `_meta`) is
  the later unit's, per the brief. Measured and named above rather than deduced.
- `http-custom-header-server-validation` stays at 3/6, untouched.
- `input-required-result-missing-input-response` and `-ignore-extra-params` stay at 0/0. Both turn
  on MF's declared departure — a retry without `requestState` answers `-32602` rather than
  re-issuing the round — which the brief ruled out of scope. Spec row M8 is a SHOULD and this
  server fails closed against it; the row is unchanged by this unit either way.
