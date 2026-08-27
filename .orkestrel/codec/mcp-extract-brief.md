# Unit: mcp-extract — the MCP sentinel consumes the codec

Role and engine: implementer, Opus 5 (native). Writing unit in
`C:\Users\mikes\WebstormProjects\mcp` (HEAD `95fb3e9`, plus Orchestrator-made standing
changes: `package.json` gained `"@orkestrel/codec": "file:tmp/tarballs/orkestrel-codec-0.0.1.tgz"`
and the lockfile moved — both expected, leave them). You perform this assignment directly
and spawn nothing. You commit nothing.

Read `AGENTS.md` (pointer to the scaffold canon) before writing. The codec guide is
`C:\Users\mikes\WebstormProjects\codec\guides\codec.md`: `decodeBase64` is total
(`Uint8Array | undefined`) and CANONICAL-strict — strictly narrower than mcp's
`isStandardBase64` regex, because it also refuses non-zero unused trailing pad bits
(`'QR=='` passes the regex but is non-canonical: `'QQ=='` is the canonical spelling of the
byte it reaches for).

## Objective

Route the Base64 sentinel through the codec, with the accepted behavior change: sentinel
payloads carrying non-canonical trailing bits now refuse. `isStandardBase64` STAYS in
`src/core/validators.ts` untouched — it names JSON Schema `byte` membership for foreign
blob/image/audio content, a deliberately wider liberal-receive policy.

## Work — failing proof first (the accepted behavior change binds red-then-green)

1. Add the refusal test FIRST: in the suite that covers the sentinel
   (`tests/src/core/` — find the sentinel/header describe), a row asserting the sentinel
   form carrying payload `'QR=='` decodes to `undefined` through the same door the existing
   sentinel tests use. Run that file scoped and RECORD the exact red reading (it currently
   decodes, because `isStandardBase64` admits `'QR=='` and `atob` is lenient).
2. `src/core/helpers.ts`, `encodeSentinel` (~line 1274): replace the `btoa` +
   `String.fromCharCode` construction with `encodeBase64(new TextEncoder().encode(value))`
   via an `@orkestrel/codec` import. `decodeSentinel` (~line 1230): replace the
   `isStandardBase64(payload)` pre-check and the `atob` + `charCodeAt` loop with
   `decodeBase64(payload)` and an `undefined` check; the fatal-UTF-8 `TextDecoder` step and
   the RFC 9110 OWS handling stay exactly as they are. Remove imports that become unused
   (`isStandardBase64` from the helpers import list if now unused THERE — never from
   `validators.ts` itself).
3. Update the sentinel TSDoc: the payload is held to the codec's canonical §4 grammar
   (name `decodeBase64`), and `isStandardBase64` remains the JSON Schema `byte` policy the
   validators own. Grep `src/core` for any remaining `atob`/`btoa` and report the count as
   zero or stop.
4. Re-run the new refusal row green, then the sentinel describe, then the gates.
5. `guides/mcp.md`: update any sentence that ties the sentinel payload's grammar to
   `isStandardBase64`; guides parity must stay green.

## Scope

Owned: `src/core/helpers.ts`, the sentinel test file under `tests/src/core/`,
`guides/mcp.md`. Off-limits: `src/core/validators.ts`, `package.json`/lockfile (already
set), every vendored file, every path outside the mcp checkout (codec checkout read-only).

## Gates (run in the mcp repo; report exact tails)

`npm run format` then `format:check`; `lint:check`; `check`; the core src test project
(read `package.json` for the script names — run the project that covers the sentinel suite,
then the full `test:src`); `test:guides` (or the guides project's script name);
`test:policy`; `test:config`. All exit 0.

## Deviation contract

A sentinel consumer that depends on the old lenient acceptance (a fixture, a conformance
row, another helper), any remaining `atob`/`btoa` in `src/core` you cannot remove within
scope, or a codec semantics mismatch stops the unit: report expected/found/evidence.
Phrasing inside owned files is yours.

## Output

Final message: the red reading (exact) then the green; what changed per file; every gate
tail; the `atob`/`btoa` grep result; anything decided in latitude.
