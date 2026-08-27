# P4 report — probe fix round, the A-P audit's accepted findings

Every fix row landed. One row landed partially, by a route the owned files could reach: the bound
rows named in fix 7 cannot drive `ProbeServer`'s composition from `ProbeServer.test.ts`, so the
real-composition reading landed in `main.test.ts` instead. That is the only departure, and it is
recorded under **Deviation state**.

Baseline `63a9d9b`, clean at start. Nothing committed. `tmp/worktrees/`, `package.json`, and
`package-lock.json` untouched.

## Touched files

| File                                       | Change                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `src/core/helpers.ts`                      | Adds `formatProof` (the closing receipt line, one implementation) and `formatReceipt` (the fallback text); `formatVerdict` closes with `formatProof`. |
| `src/server/ProbeServer.ts`                | Graduated fallback in `#execute`; holds the composed server in `#server` and derives its bounds from `limit`; deletes `#limits` and the duplicated comment. |
| `src/server/stages/LintStage.ts`           | Drops the rename-only `#deadline` field and the duplicated explanation comment; reads `LINT_DEADLINE` at both sites.       |
| `src/core/constants.ts`                    | `LINT_DEADLINE` and `PROBE_KEYS` TSDoc corrected (measurement wording, and the real bound reach).                          |
| `guides/probe.md`                          | Fallback, client, and receipt sentences corrected; `PROBE_KEYS` row matched to the TSDoc; the `_meta` widening sentence added; rows for the two new helpers. |
| `tests/src/core/helpers.test.ts`           | Proofs for `formatProof` and `formatReceipt`, including the drift pin between the fallback and the whole rendering.        |
| `tests/src/bin/main.test.ts`               | The wide drive past the key bound, the receipt-block drive past the content bound, and the wide `_meta` admission.         |
| `tests/src/server/ProbeServer.test.ts`     | Bound rows reframed as a pin on the installed dependency default; reads `PROBE_KEYS`; `readCall` annotates `unknown`.      |
| `tests/src/server/stages/LintStage.test.ts` | The `2_000` assertions and the "2 s" prose read `LINT_DEADLINE`.                                                           |

```text
 guides/probe.md                           |  52 +++++---
 src/core/constants.ts                     |  10 +-
 src/core/helpers.ts                       |  53 +++++++-
 src/server/ProbeServer.ts                 |  56 ++++----
 src/server/stages/LintStage.ts            |  10 +-
 tests/src/bin/main.test.ts                | 208 +++++++++++++++++++++++++++++-
 tests/src/core/helpers.test.ts            |  68 ++++++++++
 tests/src/server/ProbeServer.test.ts      |  29 +++--
 tests/src/server/stages/LintStage.test.ts |  12 +-
 9 files changed, 418 insertions(+), 80 deletions(-)
```

`src/core/types.ts` was not touched. Neither helper needed a declared type; each takes a `Verdict`
and returns a `string`.

## Per-finding landing

### Fix 1 — graduated fallback (ruling)

`#execute` composes three answers, widest first, and admits each against the bounds the composed
server publishes before returning it:

```ts
const arms: readonly MCPCallResult[] = isBoundedJSON(record, bounds)
	? [{ ...rendered, structuredContent: record }, rendered, minimal]
	: [rendered, minimal]
return arms.find((arm) => isBoundedJSON(arm, bounds)) ?? minimal
```

The record is read against the bounds first because that check is also what admits a `Verdict` into
a field the protocol types as JSON; without it the composition does not compile
(`TS2322: Type 'Verdict' is not assignable to type 'JSONValue'`). The last arm returns whether or
not the bounds admit it, and the comment beside it states the invariant: it is a handful of keys and
a few short lines, so bounds refusing it belong to a server that could produce no answer at all.

`minimal`'s text comes from `formatReceipt`.

### Fix 2 — the comment and guide claims become true

The `#execute` comment now describes the graduated behaviour. The three false sentences were
corrected in every home:

- **Byte-bound sentence.** The `ProbeServer.ts` home was deleted outright by fix 5, so it has two
  homes left. `src/core/constants.ts` (`PROBE_KEYS` TSDoc) now reads: "A whole tool-call result
  carrying the record beside its rendering costs 44 keys plus 11 for each issue, so this bound
  carries a record reporting up to 368 issues. Past that the reply falls back to the rendered text,
  and past the 4 MiB content bound to the receipt block." The guide carries the same arithmetic and
  a new paragraph, quoted under **New invariant sentences**.
- **Client sentence.** "The `@orkestrel/mcp` client's outcome carries that record alone and drops
  the content blocks, so a caller of that client who wants the rendered form calls `formatVerdict`
  from `@orkestrel/probe` on the record, or reads the text block off the raw wire."
- **Receipt paragraph.** The last-line instruction is scoped to the text block, `verdict.receipt` is
  named as where a structured-content client reads the outcome, and it joins the enumerated
  structured fields.
- **`PROBE_KEYS` Surface row** now reads "the total enumerable key bound `ProbeServer` applies to
  inbound metadata and produced tool content alike", matching the TSDoc.
- The `_meta` widening sentence was added where the guide documents the bound.

### Fix 3 — the wide-drive proof

Two drives in `tests/src/bin/main.test.ts`, both through the shipped `dist/bin/main.js` against a
real claim.

`answers a record past the published key bound with the rendered text alone` drives a control of 400
refused declarations (`WIDER`) and asserts: no `structuredContent`; exactly one text block; the
`control type:` line reports more than 368 issues; the last line matches `/^receipt probe:/`; the
frame does not contain `-32603`. The same child also sends a `tools/list` whose `_meta` carries the
reserved keys plus 200 extension keys — past the installed default of 64 — and asserts it is
answered with a result. That is the executed proof behind the new `_meta` widening sentence.

`answers a rendering past the content bound with the receipt block` reaches the third arm by
amplification rather than by seeding a bound: the control's test throws
`new Error('A'.repeat(5_000_000))`, so a claim of a few hundred bytes produces a rendering past the
4 MiB content bound. It asserts no `structuredContent`, one text block of exactly four lines
(identity, claim, reason, receipt), a last line matching `/^receipt probe:/`, and no
`control runtime:` line — the stage lines being what separates the fallback from the whole
rendering. Both drives run in about 4 s each.

The brief's cheaper route — a fixture-level `limit: { keys: … }` driving `#execute` — is not
reachable: `ProbeServer` publishes its bounds to a dispatcher it owns and exposes no seam that takes
a different `limit`. The amplification route needs no seam and drives the shipped composition.

### Fix 4 — F1

`ProbeServer` holds the composed server in `readonly #server` and reads
`{ bytes: limit.content, keys: limit.keys, depth: limit.depth }` off its `limit` getter. `#limits`
is deleted and `DEFAULT_MCP_LIMITS` is no longer imported. `#publish` passes `PROBE_KEYS` directly,
so one number decides what the server accepts and what it produces.

### Fix 5 — P2 residue

Both duplicated explanation comments deleted (`LintStage.ts` and `ProbeServer.ts`); the constants'
TSDoc is the single home. `LintStage.#deadline` dropped; `LINT_DEADLINE` is read at `grace` and
`timeout`. `tests/src/server/ProbeServer.test.ts` reads `PROBE_KEYS` in place of `{ keys: 4096 }`.
`tests/src/server/stages/LintStage.test.ts` reads `LINT_DEADLINE` in both assertions, and the three
"2 s" prose comments name the constant.

### Fix 6 — F2

`LINT_DEADLINE` TSDoc now reads exactly: "Measured 2026-08-27: the workspace `oxlint --lsp` answers
`initialize` in 155 ms, so this bound is more than ten times that reply."

### Fix 7 — the objective lane's finding

Landed partially; see **Deviation state**. The row is renamed
`refuses a record-bearing result under the installed default key bound` and its comment names it as
what it is — a pin on the dependency's own default — and points at `main.test.ts` for what the
shipped composition does with those bounds. The bound `ProbeServer` supplies is read from
`PROBE_KEYS` rather than from a second copy of its value.

### Fix 8 — the `readCall` nit

`readCall` annotates its parse result `unknown`. `readAnswer` in `main.test.ts` already did.

## Failing-first records

The bin drives read the built entry, so the reading is taken against a `dist` built from the source
under test. Command in every row:

```text
npx vitest run --config vite.config.ts --no-cache --reporter=verbose --project src:bin -t "past the"
```

| Source state                              | Result                                    |
| ----------------------------------------- | ----------------------------------------- |
| Third arm reverted (`minimal = rendered`) | `Tests  1 failed | 1 passed | 13 skipped` |
| Fix in place                              | `Tests  2 passed | 13 skipped`            |

The revert reddened exactly `answers a rendering past the content bound with the receipt block`, and
its failure is the defect the audit named:

```text
AssertionError: expected '{"error":{"code":-32603,"message":"Se…' not to contain '-32603'
Received: "{"error":{"code":-32603,"message":"Server execution returned an invalid tool result"},"id":1,"jsonrpc":"2.0"}"
```

The revert was the minimal one that reproduces the defect and nothing else: `minimal` aliased to
`rendered` and the `formatReceipt` import dropped, so the third arm returns the rendering the
pre-fix code returned unchecked. Both edits were undone exactly and the source rebuilt.

`answers a record past the published key bound with the rendered text alone` passed in both rows.
That is honest rather than missing: at 400 issues the pre-fix code already fell back to the rendered
text, so the drive pins behaviour the fix preserves rather than behaviour the fix creates. It reds
against a server whose fallback is removed, which is what the audit's claim 10 asked for.

An earlier attempt to take the failing-first reading against the `dist` already in the tree is not
evidence and is discarded: that build was stale, the child exited before answering, and the
pre-existing `carries a record whose control reports an issue per refused declaration` failed the
same way. The rows above were both taken against a build of the source they describe.

## New invariant sentences

`guides/probe.md`, replacing the false byte-bound close:

> A whole result carrying the record beside its rendering costs 44 keys plus 11 for each issue, so
> the published bound of 4096 keys carries a record reporting up to 368 issues. That bound also
> widens the inbound `_meta` key bound, deliberately: bytes and depth still bind there, the 16 KiB
> metadata byte limit is unchanged, and the process on the other end of a stdio transport is the
> harness that spawned this one.

> **The reply falls back rather than failing, and the receipt answers at every size.** The server
> admits each answer against those bounds before returning it and takes the widest one they admit.
> Past 368 issues the record is refused and the result carries the rendered text alone. Past the
> 4 MiB content bound the rendered text is refused too, and the result carries what `formatReceipt`
> renders instead: the identity and claim lines, the reason when present, and the same closing
> receipt line. A client therefore reads the outcome off the last line of the text block whichever
> answer arrived.

`src/server/ProbeServer.ts`, the last-arm invariant:

> The last arm returns whether or not it is admitted: it is a handful of keys and a few short lines,
> so bounds that refuse it belong to a server that could produce no answer at all.

## Scoped validation

| Command                                                     | Result                                     |
| ----------------------------------------------------------- | ------------------------------------------ |
| `npm run check`                                             | clean (root, core, server, bin)            |
| `oxlint --deny-warnings` on the nine owned files             | clean                                      |
| `oxfmt --check` on the nine owned files                      | `All matched files use the correct format` |
| `npm run test:src:core`                                     | `Tests  34 passed (34)`                    |
| `npm run test:src:server`                                   | `Tests  173 passed | 4 skipped (177)`      |
| `npm run test:src:bin` (after the scoped builds)             | `Tests  9 passed | 6 skipped (15)`         |
| `npm run test:guides`                                       | `Tests  13 passed (13)`                    |
| `npm run test:policy`                                       | `Tests  93 passed (93)`                    |

No tree-wide `format`, `lint --fix`, or `build` ran. `oxfmt --write` ran on `guides/probe.md` alone,
an owned file, and widened two table columns; the diff is whitespace.

The brief names `npm run build:src:server` before the bin drives. `build:src:core` and
`build:src:bin` ran with it, because this unit changed `src/core` as well and the drives read
`dist/bin/main.js`. Each is a scoped build of a project this unit owns source in.

The six skipped bin cases are the pre-existing pseudo-terminal skips: this host ships no
`/usr/bin/script`. The four skipped server cases are pre-existing too.

## Deviation state

One partial landing, reported rather than improvised around.

**Fix 7's first clause could not land as written.** Expected: the bound rows in
`tests/src/server/ProbeServer.test.ts` drive `ProbeServer`'s real composition. Found: `ProbeServer`
publishes `ProbeServerInterface` — `start` and `destroy` — and composes its dispatcher onto a stdio
transport reading `process.stdin`. There is no seam through which a test in that file can dispatch a
`tools/call` against the shipped composition, and none through which it can supply a synthetic
record to the real `#execute`, which takes its verdict from the `prove` tool backed by a real
`Probe`. Done: the rows are reframed as what they are, a pin on the installed dependency's default,
and the bound `ProbeServer` supplies is read from `PROBE_KEYS`; the real-composition reading of both
bound directions landed in `tests/src/bin/main.test.ts`, driven through the shipped entry against a
real claim. Not done: those rows still drive a hand-built `createMCPServer`. One hypothesis: the
finding reads as an untestable truth but is a missing seam — `ProbeOptions` carries no bound member,
and adding one would expand the public API with no consumer, which the brief's scope does not grant.

Two ancillary decisions, recorded rather than escalated.

**The receipt line and the fallback block are two exported helpers, not one.** The brief's invariant
— one implementation of the receipt line, not two — requires the line to be reachable from both
`formatVerdict` and the fallback text. A module-scope helper cannot be hidden under the export law,
and reading the line back out of `formatVerdict`'s output would render the whole verdict to take its
last line, which is the exact case the third arm exists for. So `formatProof` renders the line and
`formatReceipt` renders the block the brief named. Both carry guide rows and proofs.

**The identity and claim lines are rendered in both `formatVerdict` and `formatReceipt`.** Their
orders differ — `formatVerdict` puts the toolchain and project lines between the claim and the
reason — so no reuse composes cleanly, and a third export for two template literals would expand the
public API further. The drift is pinned by a test instead:
`renders the fallback text as lines the whole rendering also carries, in that order` asserts every
line of `formatReceipt`'s output appears in `formatVerdict`'s output, at a position after the one
before it.
