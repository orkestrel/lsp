# M2 audit round — verdicts and reconciliation

Subject: the M2 input continuation, mcp `fa11c89`. Lanes run: the subjective lane (native
Opus `reviewer`, the engine that did not write the unit) and, per the audit step's
first-lane-FAIL trigger, the objective lane (GPT-5.6 Sol `analyst` over the bench, journal
`tmp/codex/m2-audit-analyst.jsonl`, session `01a03bf6-8b2a-7253-a8d3-f64ae3d4ebba`,
`EXEC_EXIT=0`, verdict captured at `m2-audit-analyst-verdict.md` beside this file). The
lanes ran on the same claims, blind to each other; the `checker` did not run — the
mechanical criteria (file list, empty status, banned-construct absence) were each covered
inside the lanes' claim 5.

## Reviewer verdict (subjective lane, verbatim)

Lane: subjective (design fit), Opus 5, over work written by GPT-5.6 Sol. No probe was
executed by this lane — every ruling below rests on the committed diff, the source at
`fa11c89`, the declarations, and the Orchestrator's supplied host gate record, and is a
review of the source in the sense `.claude/rules/quality.md` § Rounds and verdicts names.

### 1. Option shape — CONFIRMED

`src/core/types.ts:2313-2323` declares exactly `signal`, `progress`, and `input`, with
`input`'s `state: string` and `responses: Readonly<Record<string, unknown>>` both
non-optional inside the group — so the required-together rule the server enforces at
`src/core/MCPServer.ts:1047-1052` is encoded at the type boundary rather than restated in
prose. The type boundary holds against the placement-apart attack: satisfying `input`
demands both members, and the only other caller-supplied payload is `args`, which
`src/core/MCPClient.ts:393` places under `arguments` where no top-level sibling can be
reached from it. A wider pre-typed variable carrying extra keys changes nothing, because
`MCPClient.ts:397-398` reads `.state` and `.responses` alone.

No other door moved. The `src/core/types.ts` hunk spans only lines 2288-2323;
`MCPResourceReadParams` (`types.ts:1044-1045`) and `MCPPromptGetParams`
(`types.ts:1052-1053`) keep their independent optional `inputResponses?` / `requestState?`,
and no legacy-transport type appears in the diff at all.

The TSDoc at `types.ts:2290-2312` no longer counts leaves — "Each option lives for exactly
one request", "No option survives the call" — and states both the required-together rule
and the byte-identical `arguments` obligation (`types.ts:2304-2307`). The group is an
inline nested object in `types.ts`, which is the sanctioned form in
`.claude/rules/patterns.md` § Options, not a stray anonymous type.

Method: read from the declaration, not from a compile the lane ran. The host `check` exit 0
recorded in `.orkestrel/campaign/m2-acceptance.md` is corroboration.

### 2. Wire placement — CONFIRMED

`src/core/MCPClient.ts:391-400` spreads the pair as siblings of `name` and `arguments`, and
contributes `{}` when `options?.input` is undefined, so a call without the group carries
neither key. The `_meta` interaction does not disturb it: `MCPClient.ts:445-446` builds
`stamped = { ...(params ?? {}), _meta: metadata }`, a shallow copy that leaves
`requestState` and `inputResponses` at the top level and adds `_meta` beside them, never
above them. The progress-token path cannot reach them either — `MCPClient.ts:443` stamps
`progressToken` inside `metadata`, one level under `_meta`, so supplying `progress` and
`input` together adds a sibling and shadows nothing.

The caller's `arguments` reference survives the whole path. The object literal at
`MCPClient.ts:393` assigns `args` itself, and the shallow spread at line 446 copies the
container while carrying that same reference; nothing on the path clones or writes into it.
`tests/src/core/MCPClient.test.ts:1274` pins the identity with `toBe(args)`.

### 3. Behavioral rows — CONFIRMED, with three assertions a wrong implementation would still pass

Each row fails for the defect it names, per the red-first records in
`.orkestrel/campaign/m2-input-continuation-report.md` § 3 and the assertions themselves.
The claim asked the lane to name any assertion a wrong implementation survives; these
three:

- `tests/src/core/MCPClient.test.ts:1274-1281` — an implementation that wrote
  `requestState` and `inputResponses` into the caller's `args` object **in place**, and
  then placed the same pair top-level, passes every assertion in the row. `toMatchObject`
  is a subset match, so extra keys inside `arguments` go unreported, and `toBe(args)`
  survives in-place mutation because the reference is unchanged. Acceptance criterion 8 of
  the unit brief forbids exactly that mutation and no row pins it. What would pin it:
  assert the caller's own `args` object has no `requestState` key after the call.
- `tests/src/core/MCPClient.test.ts:1280-1281` —
  `Object.hasOwn(plain.params ?? {}, 'requestState')` passes vacuously through the `?? {}`
  fallback if `params` were ever absent. Harmless for `tools/call`, which always carries
  params, but the assertion is weaker than it reads.
- `tests/src/core/MCPClient.test.ts:1342` — the refusal row pins only
  `code: JSONRPC_INVALID_PARAMS`. `src/core/MCPServer.ts:1047-1052` and
  `MCPServer.ts:1096-1100` both answer `-32602`, with different messages, so an
  implementation that dropped `requestState` and sent `inputResponses` alone would be
  refused "required together" and this row would still be green while its name claims the
  digest check. What would discriminate it: assert the message, or assert in the same row
  that the unaltered retry completes.

None of these falsifies the claim — the rows do bind — so they are recorded here rather
than as findings.

### 4. Guide fence at `guides/mcp.md:1177` — CONFIRMED

The fence's import resolves: `MCPClientInterface` is declared in `src/core/types.ts` and
reaches the published specifier through `src/core/index.ts:1`. The retry reuses the same
`'reply'` name and the same `callArguments` binding at `guides/mcp.md:1189` and `1201`, so
the fence demonstrates the byte-identical obligation instead of merely asserting it. The
narrowing is sound against `MCPInputResult` (`src/core/types.ts:584-596`), where
`requestState` and `inputRequests` are each optional in one arm and required in the other,
so the guard at `guides/mcp.md:1191-1197` is the narrowing the union demands rather than
defensive noise. The fence carries no value comment, so there is nothing to recompute.

Inside the continuation section itself (`guides/mcp.md:1162-1239`) the lane found no
sentence surviving from the shape that lost. The surviving sentences sit outside that
section and are reported as findings.

### 5. Law and owned scope — CONFIRMED

The diff carries no `any`, no `as`, no non-null assertion, no `@ts-*` or `eslint-disable`,
and no nested function declaration. The arrow functions inside `serverWithInput`'s object
literal (`tests/src/core/MCPClient.test.ts:595-612`) follow the pattern the pre-existing
`toolRegistry` already uses at `tests/src/core/MCPClient.test.ts:565` and `568`, so the
unit introduced no new construct there.

The report's legacy-transport reading is true as cited: `src/core/helpers.ts:851` returns
the invocation unchanged when `_meta` is not a record, `helpers.ts:853-855` copy every
top-level parameter except `_meta`, and `helpers.ts:865` is the translated parameter record
the transport sends at `src/core/MCPLegacyClientTransport.ts:148`. The continuation pair
transits unmodified. One wording imprecision worth nothing more than a note: the report
says line 865 "sends" the record, where 865 assigns it and the send is in the transport.

Files changed are exactly the four owned ones, and `tests/guides.test.ts` was granted and
lawfully unedited. `/home/user/scaffold/tmp/units/m2-status.txt` is empty.

### Finding A — the declared conformance gap the unit closed is still declared

`guides/mcp.md:3966-3981` states, as a shipped limit: "**`call` surfaces the
`input_required` arm and this client cannot continue it.**", "The `'input_required'` arm
has no client-side continuation at all", "this client publishes no way to write one —
`call` takes a name and arguments", "**The consumer's options:** none inside this
package", and "**Closer:** the same unit that publishes the correlated-request door, which
is what the continuation would be written on."

Every one of those sentences is false against `fa11c89`. `src/core/MCPClient.ts:391-400`
publishes the way to write one, `tests/src/core/MCPClient.test.ts:1284-1312` drives the
full continuation against a real server, and the predicted closer is falsified twice over —
the continuation shipped, and it shipped without publishing the correlated-request door.

Why it matters: this is the entry a developer is sent to. `guides/mcp.md:70` routes readers
to this section from the top of the guide, and `guides/mcp.md:2955` links this exact entry
from the `call` method row. A developer who reads the guide in the order it directs is told
the capability does not exist and to stop, while the code answers it. That is the failure
`.claude/rules/documentation.md` names in "Re-read the prose last, against what actually
shipped" — a limit documented for the option that lost.

What right looks like: delete the gap entry. Where anything about the seam still needs
saying, it belongs in the continuation section beside the fence, not among the gaps.

### Finding B — the `call` method row still refuses the arm and omits the option

`guides/mcp.md:2955` states that `'input_required'` "is SURFACED but cannot be continued
from this client — the arm is reported faithfully and there is no supported way to answer
it, which is [a declared gap](#declared-conformance-gaps)", and closes by enumerating the
per-call options as "`options.signal` cancels THIS request only; `options.progress`
receives its progress frames."

Both halves are now wrong. The refusal clause contradicts `MCPClient.ts:391-400`; the
options sentence enumerates the surface that `types.ts:2313-2323` replaced, so a reader of
the Methods table meets `call` without ever learning `options.input` exists. The
`#declared-conformance-gaps` link still resolves, so link parity cannot see this.

What right looks like: replace the refusal clause with the continuation the arm now has,
pointing at the fence, and add `options.input` to the options sentence — the group carries
the protected state and the responses for one retry that repeats the same name and
byte-identical `arguments`.

### Finding C — the `MCPCallOptions` surface row documents the two-leaf shape

`guides/mcp.md:2048` reads `` `MCPCallOptions` | interface | `{ signal?; progress? }` —
per-call policy for one remote `tools/call`. Neither leaf survives the call: … ``. The
shipped type carries `signal`, `progress`, and `input` (`types.ts:2313-2323`).

Every neighbouring row in that table enumerates its type's full member set —
`MCPClientOptions` at `guides/mcp.md:2046`, `MCPServerOptions` at `2037`, `MCPLimitOptions`
at `2035` — so the omission reads as a complete list and is not a summary the reader is
expected to distrust. "Neither leaf" also tallies a set that has grown, which `AGENTS.md`
§ Writing refuses. Parity passes because the backticked name resolves;
`.claude/rules/documentation.md` says plainly that the parity test proves a name exists and
never that a sentence about behaviour is true.

What right looks like: `{ signal?; progress?; input? }`, with the closing sentence recast
so it names the members it speaks for rather than counting them, and with `input` described
as the one-retry continuation carrier.

Bounding all three findings: the drift is confined to `guides/mcp.md` at lines 2048, 2955,
and 3966-3981, and it is one class with one fix unit. The continuation section
(`1162-1239`), the `MCPResourceReadParams` row (`1963`), the legacy refusal at
`src/core/MCPLegacy.ts:147-157` and every other entry in the gaps section — the
registered-method asymmetry (`3944-3954`), the raw-transport hazard (`3956-3964`), the
task-notification gap (`3983` onward) — remain true and must not be touched. No source
file is implicated.

Claims the lane attacked and could not break: the type boundary against a placement-apart
vector (claim 1), the `_meta` and progress-token interaction against the spread (claim 2),
the caller-reference identity through `#request` (claim 2), the three rows against the
defects they name (claim 3), and the fence's resolution and narrowing (claim 4).

VERDICT: FAIL — 0 broken, 0 unresolved, 0 not-evidenced, 3 findings outside the claims

## Analyst verdict (objective lane)

Captured verbatim at `m2-audit-analyst-verdict.md` beside this file. Terminal line:
`VERDICT: FAIL — 3 broken, 0 unresolved, 0 not-evidenced, 0 findings outside the claims`
(claims 3, 4, and 5 broken; claims 1 and 2 confirmed with a direct placement instrument).

## Reconciliation

The lanes agree on every substance. The reviewer's findings A, B, and C are the analyst's
broken claim 4 at the same lines; the reviewer's claim-3 notes are the analyst's broken
claim 3 with an executed collision instrument behind the digest half; the analyst's broken
claim 5 (the `serverWithInput` fixture factory in the test file) was substantiated by the
Orchestrator against `.claude/rules/tests.md` ("Test files import shared infrastructure
rather than declaring local fixture factories") and the `create{Entity}` factory form, with
the factory serving the rows at `tests/src/core/MCPClient.test.ts:1286` and `:1316` — the
reviewer's contrary reading addressed the arrow-function construct, not the fixture-placement
rule, so the finding stands. The Orchestrator verified the three guide locations at their
cited lines on 2026-08-26 before instructing any fix.

Every retained finding names one carrier: the M2.1 brief
(`m2.1-continuation-repairs-brief.md`) — finding 1 the guide drift at the three locations,
finding 2 the digest-row discrimination, finding 3 the recorder-row placement negatives
(folding the reviewer's in-place and `?? {}` notes), finding 4 the fixture move. Dropped on
the record: nothing. Noted without a carrier because no lane ruled it a defect: the
reviewer's wording note on the report's "sends" at `helpers.ts:865`.

The implementation claims (1 and 2) are confirmed by each lane; no source file reopens. The
round stays open until M2.1 lands and closes under the verbatim-adoption rule on its
mutation controls.
