## 1. `CONFIRMED`

Attacked every report-table row against `encodeSentinel` / `decodeSentinel` (`src/core/helpers.ts:1219-1263`) and the two marker spellings.

Literal when `/^[ -~]*$/` (U+0020–U+007E) **and** `decodeSentinel(value) === value`; otherwise `` `=?base64?${btoa(binary)}?= ``. Decode strips leading/trailing SP/HTAB (`/^[ \t]+|[ \t]+$/g`), then `/^=\?base64\?([\s\S]*)\?=$/` — markers alone decide; payload must pass `isStandardBase64` and fatal UTF-8, else `undefined`, never the literal.

Failed attacks: `test_simple_text` / `test://static-text` stay literal; `café` and `two\nlines` fail the ASCII class so they take the sentinel branch; `  padded  ` is ASCII but decode trims so the round-trip fails and it encodes; well-formed and ill-formed marker wearers fail `decodeSentinel(value) === value` so they encode; `SGVsbG8=` and `=?base64?SGVsbG8=` miss a marker so decode returns the field unchanged and they stay literal; `=?BASE64?SGVsbG8=?=` misses the lowercase marker. Invalid padding `=?base64?SGVsbG8?=` and non-alphabet `=?base64?SGVs!!!bG8=?=` / `=?base64?AAAA?=BBBB?=` return `undefined`. Encode template `=?base64?…?=` and decode regex `^=\?base64\?…\?=$` currently agree; the café / `=?BASE64?…` / round-trip pins would catch a marker-byte change on either side.

## 2. `CONFIRMED`

Attack: a second canonical-Base64 membership spelling remaining in `src/`. `decodeSentinel` calls `isStandardBase64` at `src/core/helpers.ts:1224`. The regex lives only at `src/core/validators.ts:175`. `src/` has no other `[A-Za-z0-9+/]{4}` (or equivalent) membership form. `atob` / `btoa` decode and produce bytes; they do not restate that membership rule.

## 3. `CONFIRMED`

Attack: a fourth method, a wrong body member, a compare that skips decode, or a message that interpolates the header.

`inferHeaderTarget` (`src/server/inferers.ts:48-57`) reads `params.name` only for `tools/call` and `prompts/get`, `params.uri` only for `resources/read`, else `undefined`. A planted `name`/`uri` on `server/discover` / `tools/list` / `resources/list` / `prompts/list` is ignored. `inferHeaderIssue` (`src/server/inferers.ts:147-163`) requires `Mcp-Name` only when a target exists, then compares `decodeSentinel(header) !== target`. Missing and mismatch messages interpolate `target` from the body, never `header`.

## 4. `CONFIRMED`

Attack: the widening also swallows headerless `initialize`, a live session, or the unimplemented-version `-32022` door.

`src/server/handlers.ts:108-137`: `-32602` runs when `(era === 'modern' || isMCPModernVersion(protocol))` and `parseRequestContext` fails. `isMCPModernVersion` is membership in `SUPPORTED_MODERN_PROTOCOL_VERSIONS` (`src/core/validators.ts:1355-1357`), which is only `2026-07-28` (`src/core/constants.ts:31-32`). `parseRequestContext` requires `isModernRequest` (`src/core/parsers.ts:119`), so a modern header over a body with no version key always takes `-32602` and never reaches the `-32022` branch.

Headerless `initialize`: `protocol === null`, so `isMCPModernVersion` is false; `inferHeaderIssue` returns `undefined` for `isInitializeRequest` (`src/server/inferers.ts:107`); the `-32022` branch requires `protocol !== null`. Still dispatched. Session POST is unchanged in unedited `src/server/middlewares.ts:194-203` (string-overload `inferHeaderIssue` against the pinned legacy revision). `v999.0.0` / `2099-01-01` are not modern versions, so they still hit `src/server/handlers.ts:126-137` (`-32022`).

## 5. `CONFIRMED`

Attack: a face stamps `prompts/get` or `resources/read`, derives the name from transport state, or diverges in shape.

Browser `src/browser/transports/HTTPClientTransport.ts:189-201` and Node `src/server/transports/HTTPClientTransport.ts:188-200` share the same derivation: modern message → `inferRequestVersion(message)`, `message.method`, and `message.params?.['name']` only when `method === 'tools/call'`, wrapped in `encodeSentinel`. Legacy headers still come only from captured `#protocol`. `MCPClientInterface` publishes `call` and not `prompts/get` / `resources/read` (`src/core/types.ts:2745-2892`).

## 6. `CONFIRMED`

Attack: a fourteenth file in `m1.diff`; a banned construct in the added hunks; a second existing assertion that reversed product meaning.

`m1.diff` names only `guides/mcp.md`, the two `HTTPClientTransport.ts` faces, `src/core/helpers.ts`, `src/server/handlers.ts`, `src/server/inferers.ts`, `tests/conformance.test.ts`, and the five mirrored test files. Added source has no `any`, `as`, `!`, `@ts-*`, `eslint-disable`, default export, or `public`/`private`. The `attempt(() => …)` bodies are callbacks passed as arguments. The only existing unit assertion that reversed an error code for a given input is the handler pin that used to expect `-32022` for a modern protocol header on a legacy-shaped body (`tests/src/server/handlers.test.ts`); `tool name` → `target` keeps the same missing/mismatch diagnosis; the conformance census rewrite records that same `-32602` movement.

## 7. `CONFIRMED`

Attack: a guide sentence that the shipped code does not do.

Three-method scope matches `inferHeaderTarget` (`guides/mcp.md:127-129`, `2458-2459`). Sentinel paragraph matches encode/decode (`guides/mcp.md:135-143`). Modern-header `-32602` paragraph matches `handlers.ts:108-117` (`guides/mcp.md:211-217`). Client method-surface limit matches `MCPClientInterface` plus the two `#buildHeaders` (`guides/mcp.md:192-196`, `4046-4051`). `104 passed / 6 failed` with only `http-custom-header-server-validation` at `3/6` matches the `EXPECTED` pin and its sum in `tests/conformance.test.ts:50-108` (`guides/mcp.md:4083-4091`). Runner output itself is writer-produced; the guide is true against the shipped pin and the code those sentences describe.

## 8. `BROKEN`

Attacked four writer verdicts. Two broke.

**Whitespace “now served by” decode.** `http-header-validation` was already `13` green before this unit (`m1-brief.md` Context; pin still `tests/conformance.test.ts:82`). `decodeSentinel` did not newly serve that scenario. The RFC 9110 trim is real at `src/core/helpers.ts:1220` and is what in-process `inferHeaderIssue` uses after `headers.get`, but “stayed green” is not evidence that this trim is what the HTTP runner’s whitespace check rides on. Smallest fix: retract the causal claim; keep “stayed `13/0`” as the invariant.

**Inline markers as placement plus one spelling.** Encode builds `` `=?base64?${btoa(binary)}?= `` (`src/core/helpers.ts:1263`); decode parses `/^=\?base64\?([\s\S]*)\?=$/` (`src/core/helpers.ts:1221`). That is two spellings of the same markers. `.claude/rules/architecture.md` places constants in `*/constants.ts` and requires a reusable regex to have one implementation. Inlining avoids a hidden module-scope const; it does not remain one spelling. Smallest fix: one exported prefix/suffix (or the regex) in `src/core/constants.ts`, both functions reading it; keep encode’s membership as `decodeSentinel(value) === value`.

Failed attacks: legacy session/headerless `initialize`/`-32022` paths still sit on unedited code (`src/server/middlewares.ts:194-203`, `src/server/handlers.ts:126-137`, `tests/src/server/handlers.test.ts:674-685`); `http-custom-header-server-validation` remains `3` passed / `6` failed (`tests/conformance.test.ts:85`).

```text
VERDICT: FAIL — 1 broken, 0 unresolved, 0 not-evidenced, 0 findings outside the claims
```
