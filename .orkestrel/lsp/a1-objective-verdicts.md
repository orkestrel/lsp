Working tree before and after is clean (`git status --porcelain` empty, `git diff --stat` empty). `HEAD` is `e5dfac7522929d7c21c40a180a3646710670521d`. `tmp/cursor/a1` exists as an empty directory; probe scripts and seeded mutations did not land (file writes refused). Residual tracked change: none.

Executed: `npm run test:src:core` (exit 0, 138 passed), `npm run test:policy` (exit 0, 110 passed), `npm run test:guides` (exit 0, 25 passed). Read-only git: `git diff 2c0eba8 e5dfac7`, `git show 2c0eba8` of `validators.ts`, `parsers.ts`, and `LSPClient.ts`.

## 1. CONFIRMED

The converted sites still sit behind `isRecord` + `holds`. Replacements match the `2c0eba8` loops on the named inputs.

- `optionalOf(g)` is `value === undefined || g(value)` (`node_modules/@orkestrel/contract/dist/src/core/index.js:6084-6086`). Present-key `undefined` stays accepted; `null` is not.
- `literalOf` membership is `Set.has` (SameValueZero). `1`/`2`/`3`/`4` and `0`/`1`/`2` match the old `===` chains. `-0` still matches `0`. `'1'` does not.
- `arrayOf` requires `Array.isArray`, a dense index population, then the element guard (`index.js:5556-5563`). Sparse holes fail density (and would fail the old `undefined` element check). Array-likes fail `Array.isArray`.
- `unionOf(literalOf(0, 1, 2), isLSPTextDocumentSyncOptions)` is the old `=== 0|1|2 || isLSPTextDocumentSyncOptions` order by acceptance, not by evaluation.

`tests/src/core/validators.test.ts` already drives holes, present `undefined`, cross-type near-misses (`severity: '1'`, `tags: [undefined]`), a prototype-carrying `WireRange`, and extra members. Those cases ran in `test:src:core`.

## 2. CONFIRMED

`#releaseGeneration` at `2c0eba8` was only `await this.#closeTransport()`. The catch now calls that same method (`src/core/LSPClient.ts:271-273`). `#cancelRequest` is untouched in the client diff.

Failed initialize still: throws the original coded `LSPError` (`protocol` for utf-8 / bad result), awaits close, `#clearSession()`, `phase: 'closed'`, then `start()` can run again. `test:src:core` passed `restarts the transport after a failed handshake`, `refuses utf-8 after advertising only utf-16`, and the close throw / reject / deadline cases.

## 3. CONFIRMED

`LSP_CAPABILITIES` is `Object.freeze` on the outer record, `general`, `positionEncodings`, `textDocument`, and each of `synchronization`, `publishDiagnostics`, `diagnostic` (`src/core/constants.ts:27-34`). `#begin` sends that object and refuses with `LSP_CAPABILITIES.general.positionEncodings.includes` (`src/core/LSPClient.ts:250`, `:259`). Those are the same array.

`test:guides` passed `advertises utf-16 alone`. `test:src:core` passed the initialize-params deep equal (`positionEncodings: ['utf-16']`) and the utf-8 refusal.

## 4. CONFIRMED

`waitForDeadline` only `resolve()`s on `abort` (`src/core/helpers.ts:327-331`). It never `reject()`s. `#closeTransport` still races `closing.then(() => false, error => error)` against a deadline that becomes `true` (`src/core/LSPClient.ts:669-683`), the same three-way as `2c0eba8`. `#boundExit` races work against the same helper.

`test:src:core` passed `resolves no earlier than its deadline`, `settles a shorter deadline before a longer one`, and `emits a close deadline error before destroying the emitter`.

## 5. CONFIRMED

Grammar, codes, messages, and context shapes in `readLSPHeader` / `readLSPBody` match the `2c0eba8` monolith (ASCII gate, field parse, `Content-Length` / `Content-Type` refusals, fatal UTF-8, `parseJSON`, JSON-RPC gate, `Object.freeze([...messages])`, `cause` on UTF-8). `parseLSPMessages` still owns the spine, header-limit refusals, and `messages.push(...)`.

`joinLSPSegments` runs only after a boundary is found (`parsers.ts:86`) or after the body is complete (`:105-106`). An incomplete header returns at `:78` with the chain intact. The 3-byte window is `takeLSPTail`, not a full-chain join. Overlap math is the same: `base = previous.size - tail.byteLength` equals `previousSize - overlap`.

`tests/src/core/parsers.test.ts` is not in `2c0eba8..e5dfac7` and still passed inside `test:src:core` (mid-header split, boundary offsets, mid-body, astral split, 1-byte body continuation, coalesced frames, carried messages on refusal).

## 6. CONFIRMED

Documented adverse cases are in `tests/src/core/helpers.test.ts` and passed.

- `joinLSPSegments` always allocates `new Uint8Array(state.size)` (`helpers.ts:64`). Mutation of the result leaves `state.bytes` intact.
- `takeLSPTail`: short tail, spanning segments, count above `state.size`, zero → empty buffer, owned copy, negative → `RangeError` via `new Uint8Array(-1)`.
- `scanLSPBoundary`: loop bound `index + 3 < bytes.byteLength` never reads past the view; first match or `undefined` (including empty and near-misses).
- `readLSPHeader` / `readLSPBody`: same refusal codes and frozen `context.messages` as the monolith; leaf tests pin codes, `context.value` where it exists, and `Object.isFrozen(context.messages)`.

## 7. COULD-NOT-ATTACK

The mutation re-run did not execute. A copy under `tmp/cursor/a1` is not on a Vitest include path, and patching a tracked file was not applied. Green `test:src:core` / `test:guides` do not bind the “fails under a seeded defect” claim. The reports’ mutations are consistent with the assertions they name; that is not a re-run.

VERDICT: PASS — no claim BROKEN (claim 7 COULD-NOT-ATTACK)
