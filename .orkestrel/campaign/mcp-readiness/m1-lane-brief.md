# A-M1 — falsification of the standard-header unit

You are the objective cross-engine lane auditing a unit written by Opus. Attempt to refute every
claim from source; you cannot execute — rule from the code and the supplied evidence, marking
`UNRESOLVED` what only a run could settle. `CONFIRMED` requires naming the attack you tried that
failed. Edit nothing, spawn nothing. You are rooted in a detached worktree at the audited commit;
the main checkout is out of bounds.

## Subject

mcp `8667803` (M1): the Base64 sentinel codec (`encodeSentinel`/`decodeSentinel` in core), the
three-method `Mcp-Name` validation scope with decode-before-compare, both HTTP faces stamping
through the encoder, and the modern-header `-32602` refusal replacing the legacy `-32022`
fallthrough. Evidence beside this brief: `m1.diff`, `m1-report.md` (testimony; its run counts are
writer-produced). Spec captures:
`C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\r1-report.md` and the
streamable-http rules restated in the report's own membership table.

## What the round decides

Whether M1 is accepted and M2 builds on its codec.

## Claims

1. The codec's membership rule matches the spec exactly: a value travels literally when every
   code point is `U+0020`–`U+007E` AND `decodeSentinel(value) === value`; every other value
   travels as the sentinel; decode excludes leading/trailing SP/HTAB, treats the markers alone
   as sentinel-deciding, and answers `undefined` — never the literal — for a marker-carrying
   value whose payload fails `isStandardBase64` or strict UTF-8. Attack each row of the
   report's table against the implementation, and attack the two marker spellings (encode's
   template, decode's regex) for drift the tests would not catch.
2. `decodeSentinel` routes canonical-form checking through `isStandardBase64`, and no second
   spelling of that membership rule survives anywhere in `src/`.
3. `inferHeaderTarget` reads exactly `params.name` for `tools/call` and `prompts/get` and
   `params.uri` for `resources/read`, `undefined` otherwise; `inferHeaderIssue` requires the
   header exactly when a target exists, compares decoded-against-target on all three methods,
   and no refusal message echoes the client-supplied header value.
4. The `-32602` widening fires exactly when the `mcp-protocol-version` header names a MODERN
   version and the body fails the modern `_meta` rule; walk the routes to show the headerless
   legacy `initialize`, the legacy session flows, and the unimplemented-version `-32022` answer
   are reachable and unchanged.
5. Both HTTP faces stamp `Mcp-Name` through `encodeSentinel` for `tools/call`, the derivation
   stays message-only, and the two faces' derivations remain the same shape.
6. Scope honesty: the diff touches only the thirteen owned files; no banned construct; the one
   moved behavioral pin (the `-32022`→`-32602` expectation) is the only existing assertion
   whose meaning changed.
7. The guide's added sentences are true against the shipped code: the three-method scope, the
   sentinel paragraph, the modern-header `-32602` paragraph, the client method-surface limit,
   and the `104 passed / 6 failed` conformance narrative.
8. The writer's sound-and-unchanged verdicts hold. Attack at least: the claim that
   `http-header-validation`'s whitespace check is now served by the decode's RFC 9110
   exclusion; and the claim that keeping the marker literals inline (unexported, inside the two
   function bodies) satisfies the placement law while remaining a single spelling of the
   discipline. Say how many you attacked.

## Verdict shape

Numbered verdicts (`CONFIRMED` with the failed attack / `BROKEN` with the exact failing input,
state, or interleaving plus the smallest fix / `UNRESOLVED` with what would settle it /
`NOT-EVIDENCED`), findings outside the claims to the `BROKEN` standard, then exactly one
terminal line in the standard form:

```text
VERDICT: PASS — <m> of <m> confirmed, no findings outside the claims
VERDICT: FAIL — <n> broken, <u> unresolved, <e> not-evidenced, <x> findings outside the claims
```

No process diary.
