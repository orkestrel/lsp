I hold the **subjective lane** — shape, naming, ergonomics, design fit. Ruling follows the brief's Output shape, with the dispatch's `Units`, `Tensions`, and `Risks` folded in.

---

# Ruling: `open` takes a per-call options bag carrying `signal`

Candidate `open` gains a per-call options bag wins. The caller's inspection budget rides an abort signal into the one method that spends it, and the constructor `timeout` keeps every bound the client owns on its own account.

The falsified conflation is not that `timeout` is one number. It is that `timeout` is one **owner**. Lifecycle and settlement bounds belong to the client, because nothing outside the client can sensibly bound its own transport handshake and teardown. The inspection wait belongs to the caller, because the caller is the entity with a budget, and in the probe's case that budget is per-claim rather than per-client. A knob on the constructor cannot follow a per-claim budget however finely it is split, which is what rejects the grouped-knob candidate outright rather than on taste.

One further fact settles the shape. `LSPClientOptions.signal` is already spoken for and cannot serve: `#abortClient` (`src/core/LSPClient.ts:583`) drains every pending entry **and** calls `destroy()`. Routing a per-open budget through the constructor signal tears down the client and its language server child for one over-budget document. The per-call signal is therefore a genuinely different axis, not a second spelling of one already present, and the wrapper law's objection does not reach it.

## Design

### Exact signatures

Added to `src/core/types.ts`:

```ts
/** Bounds one document inspection with the caller's own cancellation. */
export interface LSPOpenOptions {
	readonly signal?: AbortSignal
}
```

Changed in `LSPClientInterface`:

```ts
open(
	document: LSPTextDocumentItem,
	options?: LSPOpenOptions,
): Promise<readonly LSPDiagnostic[]>
```

`LSPClientOptions` is unchanged in shape. `timeout` keeps its name and its `30_000` default; only its documented reach narrows.

`LSPErrorCode` is unchanged. `aborted` and `timeout` both already exist, and `#openPull` already reads `this.#signal?.aborted` (`src/core/LSPClient.ts:274`). The vocabulary this ruling needs was designed in; the option to reach it was the only missing part.

### Naming, and what each name refuses

`LSPOpenOptions` names the operation, matching `MCPCallOptions` and `MCPListenOptions` where the entity is likewise the call rather than its subject. `LSPDocumentOptions` is refused: it names the document, and the option configures no document.

`signal` is the leaf. It is this package's existing word on `LSPClientOptions`, the platform's word, and the sibling's word. `deadline` is refused because the probe already spends that word on a duration (`ProbeOptions.deadline`), and one term naming a number in one package and a signal in its consumer is the drift the one-term law exists to stop. `abort` is refused: `.claude/rules/names.md` § Fixed lifecycle vocabulary owns it as a verb, and a property may not take it.

The parameter is `options`, per the documented options-object form.

### The bag, not a bare positional

A bare `open(document, signal?)` is cheaper today and a one-way door tomorrow. The mcp sibling shows what per-call concerns accrete into — `signal`, `progress`, `input` on one bag — and a second positional parameter has no honest place to go. The bag costs a pair of braces at the call site and buys the growth seam. That is the whole argument, and it is sufficient.

### Both diagnostics paths, not only the push path

The signal bounds the pull request as well as the push publication wait. Which path a document takes is the **server's** choice, read from `diagnosticProvider` in the initialize result (`src/core/LSPClient.ts:168`), and the consumer cannot see it before `start()` resolves. A budget that silently applies against one language server and not against another is worse than no budget, because it fails only on the server nobody tested against. The P1 evidence carries the case directly: Oxlint 1.80.0 declares no `diagnosticProvider` and takes the push path, and a different linter behind the same `LintStage` takes the pull path while the stage's contract must not move under it.

### Contract prose for each changed TSDoc block

`LSPOpenOptions`:

> Bounds one document inspection with the caller's own cancellation.
>
> @remarks `signal` bounds this inspection alone. It reaches the pushed publication wait and the pulled `textDocument/diagnostic` request alike, because the server chooses which path a document takes. It never closes the transport and never tears down the client — a client-wide abort is `LSPClientOptions.signal`. A signal that is already aborted refuses the open before `textDocument/didOpen` reaches the wire, so no document the server would have to be told about is ever opened. The client's own `timeout` bound stays live beside it, and whichever fires first settles the wait.

`LSPClientInterface.open`:

> Opens a document and resolves its diagnostics.
>
> @param document - The document's identity, language, version, and complete text
> @param options - The caller's cancellation policy for this inspection
> @returns A promise resolving the server's diagnostics for the document
> @remarks The server's initialize result selects the path: a declared `diagnosticProvider` pulls a `textDocument/diagnostic` report, and its absence waits for the pushed `textDocument/publishDiagnostics` notification. An empty publication resolves empty. Thrown when the client is not ready (`closed`), when the URI is already open (`duplicate`), when the server declares no `openClose` support (`protocol`), when `options.signal` aborts (`aborted`), and when the client's own `timeout` elapses first (`timeout`). An abort and a client timeout each release the URI, so a later `open` on it is not refused as a duplicate.

`LSPClientOptions.timeout`:

> Bounds the client's own waits in milliseconds. Default: `30_000`.
>
> @remarks The bound reaches the `initialize` handshake, `shutdown`, the `exit` write, and transport close settlement — every wait the client owns on its own account. It also backs each `open` as a default net, so a silent server cannot park a caller's promise forever. It is not the inspection budget: a caller that owns one passes `LSPOpenOptions.signal` instead of narrowing this value, because narrowing it also narrows teardown.

`LSPClientInterface.destroy` keeps its existing block verbatim. The teardown bounds do not move, and the prose that states them must not be rewritten into looking like it changed.

### The default-bound decision

**The client keeps a default bound on the push wait, and the bag stays optional.** The caller's signal is an additional bound, never a replacement.

The mcp sibling's `listen` requires its signal for a reason that does not transfer. `listen` returns a stream with no natural terminal event, so a caller with no signal has built a leak by construction and the type is the only place left to refuse it. `open` has a natural terminal: the server publishes for the URI, the transport exits, or the document is closed. A request-shaped operation with a default deadline is the honest shape, and it is what `open` already promises every consumer reading the guide.

Two further costs settle it. Making the bag required breaks the guide's opening fence — `client.open({ uri, languageId, version, text })` is the shape a reader learns this package from, and forcing a signal into the simplest possible use makes a worse first page for every consumer whose budget genuinely is the client's. And parking unbounded when no signal arrives makes the least attentive consumer the worst served, with a hang and no error as the failure mode — precisely the mode this package's coded-error vocabulary exists to prevent.

The composition a reader keeps is one sentence: whichever bound fires first settles the wait, and the code says which one fired.

### Failure modes

Each path's rejection under the caller's abort, under the client's own bound, and at teardown:

| Path                                 | Caller's `signal` aborts             | Client's own bound                   | Teardown (`destroy`)                       |
| ------------------------------------ | ------------------------------------ | ------------------------------------ | ------------------------------------------ |
| Push publication wait                | `aborted`, `cause` is `signal.reason` | `timeout`, the publication message   | `closed`, the closing message              |
| Pull `textDocument/diagnostic`       | `aborted`, `cause` is `signal.reason` | `timeout`, plus `$/cancelRequest`    | `closed`, the closing message              |
| `initialize` handshake               | Unreached — no per-call signal       | `timeout`, the request message       | `closed`, settled inside `destroy`         |
| `shutdown` request                   | Unreached — no per-call signal       | `timeout`, the request message       | Absorbed; teardown continues               |
| `exit` write                         | Unreached — no per-call signal       | `timeout` bounds the race            | Bounded, then transport close              |
| Transport `close`                    | Unreached — no per-call signal       | `timeout` emitted on the emitter     | Emitted before the emitter is destroyed    |
| `close(uri)` notification            | Unreached — no per-call signal       | None; the write is not deadline-bound | `closed` if the generation is already dead |

The lifecycle rows read "unreached" deliberately. `initialize`, `shutdown`, and `exit` take no per-call signal, and that is the ruling's explicit statement that their bounds do not move.

The distinction the table buys is the point of the whole change: a consumer reading `aborted` knows its own budget fired and its own coordinator owns the refusal; a consumer reading `timeout` knows the client's net caught a silent server.

### Releasing the URI

An abort deletes the URI from `#documents`, exactly as `#timeoutPublication` already does (`src/core/LSPClient.ts:539`). Without it, the stage's next `open` on the same URI reports `duplicate` — the client's word for "you opened it twice" — to a consumer that opened it once. A word that accuses the caller of a mistake the caller did not make is a worse defect than the leak it stands in for.

I flag the honest limit beside it: releasing the URI sends no `textDocument/didClose`, so the server still believes it holds the document. That is the behaviour that ships today under the timeout path, and this ruling matches it rather than silently changing it. See `Tensions`.

## Alternatives

**A grouped constructor knob splitting the bounds by name.** The closest rival, and it fails on axis rather than on taste. It stays per-client while the budget it must express is per-claim, so the `LintStage` holding one client across many inspections still cannot follow the coordinator. It also asserts, by grouping, that the request bound and the diagnostics bound are two facets of one entity — the exact claim the P1 measurement falsified. `diagnostics` as a duration leaf reads as a collection and would fight its own name. And it buys no cancellation: a stage being torn down waits out its own diagnostics bound rather than ending the wait it no longer wants. Cost: the defect relocates from one knob to two, and the consumer's rewiring is identical to the one it has today.

**No lsp change; the consumer races `destroy()` against its own deadline.** Rejected on the `open` contract's honesty and on the blast radius. `destroy` is a client-lifetime verb: spending it as an inspection bound destroys the language server child for one over-budget document, and the stage then re-warms at the cost P1 measured (`never answers its warming exchange`, 1113 ms). Every consumer with a caller-owned budget must reimplement the race, and each gets it slightly differently — which is the shim the no-shims law bans, written in the consumer because the library refused to hold it.

## Units

Each unit names its role and engine so the routing ledger is derivable.

**L6-A — types and contract prose.** Role `implementer`, engine Opus 5. Owns `src/core/types.ts` and `src/core/factories.ts`. Adds `LSPOpenOptions`, changes the `open` signature, and lands every TSDoc block quoted earlier. Depends on nothing. Acceptance: `npm run check` green; `LSPErrorCode` unchanged; `createLSPClient`'s `@param` no longer says "deadline" undifferentiated.

**L6-B — client paths.** Role `sol`, engine GPT-5.6 Sol. Owns `src/core/LSPClient.ts`. Objective and constraint-heavy: listener lifetime, settle-path symmetry, and wire ordering. Threads `options` through `open`, races both bounds in `#openPush`, adds the per-call signal to `#request` for the pull path only, removes the per-call abort listener in `#settle` and `#settlePublication`, and releases the URI on abort. Depends on L6-A. Acceptance: the pinned rows following, green; `#boundExit` and `#closeTransport` unchanged by diff.

**L6-C — pinned rows.** Role `sol`, engine GPT-5.6 Sol. Owns the client test suite. Depends on L6-B. Acceptance: each row runs red against the pre-change client and green after.

**L6-D — guide and parity.** Role `implementer`, engine Opus 5. Owns `guides/lsp.md`. Adds the `LSPOpenOptions` Surface row, rewrites the `LSPClientOptions` row off "deadline", extends the `open` method row, and adds an executed fence showing a caller-owned budget. Depends on L6-A. Acceptance: `npm run test:guides` green; the fence executes rather than being asserted as a substring.

**L6-E — consumer rewiring.** Role `application`, engine Sonnet. Owns `/home/user/probe/src/server/stages/LintStage.ts` and its suite. Depends on L6-B shipping to the probe as a tarball. Fully specified by the rewiring shape following.

**L6-F — the fixture capability patch.** Role `builder`, engine Sonnet. Owns the `ORDERED` and `STALLING` fixtures in `tests/src/server/Probe.test.ts`. Carries the exact byte-identical patch P1 § 5 supplies. It is a separate obligation from this split and gets its own unit rather than riding L6-E.

### Pinned rows

Named for what each proves:

- `rejects a pushed inspection with the caller's abort reason` — push path, `aborted`, `cause` is the signal's reason.
- `rejects a pulled inspection with the caller's abort reason` — pull path against a `diagnosticProvider` fixture, same word.
- `reopens a document whose inspection the caller aborted` — a second `open` on the aborted URI resolves rather than reporting `duplicate`.
- `writes no open notification for an already-aborted inspection` — the recorder sees no `textDocument/didOpen`.
- `bounds a silent server when the caller passes no signal` — the client's default net still rejects `timeout`.
- `bounds the handshake at the client's own deadline while a caller signal stays live` — the row that reddens if someone routes the lifecycle requests through the per-call signal.
- `retains no abort listener after repeated inspections on one signal` — the accumulation row.

### Consumer rewiring for `LintStage`

`createLSPClient({ transport, workspace, timeout: 2000 })` **stays**. The 2000 ms value is the stage's teardown discipline, and after this ruling it bounds warming, `shutdown`, and settlement — which is what the stage always meant by it. The P1 teardown timings hold unchanged.

`#document` builds no timer. It passes the signal it already owns for the admitted inspection into `client.open(item, { signal })`, and `#translate` maps `aborted` to the stage's own refusal rather than to a stage fault, because an abort there is the coordinator collecting its own deadline rather than the server failing.

The coordinator's 6000 ms then fires first, destroys the stage, and `replaces a lint stage its deadline destroyed` and `names arming in a boot expiry and arms again for the next claim` report `The lint stage exceeded 6000 ms` again — the coordinator's own message, from the coordinator's own budget.

### Exit criterion

The campaign closes when: `LSPOpenOptions` exists and `open` accepts it; each pinned row is green; the guide's Surface and method rows name which bound each option carries and the fence executes; `LintStage` passes a caller signal and keeps `timeout: 2000`; and the `Probe.test.ts` rows named earlier are green with the capability patch landed. Carried, not ruled on here: the inlined `30_000` at `src/core/LSPClient.ts:106` against the constants placement law, which belongs to its own unit under that law.

## Tensions

Named for the objective lane to challenge:

1. **The default net.** I keep a client-level bound on the push wait when no signal arrives, against the `MCPListenOptions` precedent of requiring the signal. The objective lane may hold that a package with a required-signal sibling owes the same refusal here.
2. **The signal on the pull path.** I bind it, though the pull request already carries the client's deadline. The objective lane may read the second bound as redundant machinery on a path that cannot hang.
3. **The optional bag.** Optional keeps every existing call site and the guide's first fence intact. Required makes the budget unforgettable. I chose ergonomics for the common case.
4. **The unsent `didClose` on abort.** Releasing the URI without notifying the server matches what `#timeoutPublication` ships today, so this ruling preserves rather than changes it — but the server keeps a document the client has forgotten. Whether that is a latent defect this change must close, or an existing row for a separate unit, is the objective lane's to rule.
5. **`timeout` keeping its name** while its reach narrows. A reader who learned it as "every deadline" is not corrected by the identifier, only by the TSDoc.

## Risks

- **Pull-path cancel ordering.** A caller abort sends `$/cancelRequest` while the client may also be destroying. Evidence needed: a fixture recording the wire order across an abort that races `destroy()`.
- **Listener accumulation.** A long-lived caller signal across many opens must leave nothing behind. Evidence needed: the accumulation row asserting through a recorder rather than through absence of a symptom.
- **Pull-path coverage is fixture-only in this fleet.** Real Oxlint takes the push path, so the pull-path abort is proven against a protocol-faithful fixture and never against a real server. State that coverage beside the row rather than letting the green read as complete.
- **Attribution of the probe's red rows.** `Probe.test.ts` stays red until L6-F lands, for a reason unrelated to this split. A reader who sees red after L6-E will charge it to this change. Sequence L6-F before or with L6-E, or name the red in the unit's report.
