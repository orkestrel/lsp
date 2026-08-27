# Unit: server-extract — @orkestrel/server consumes the codec

Role and engine: implementer, Opus 5 (native). Writing unit in
`C:\Users\mikes\WebstormProjects\server` (HEAD `33b39c7`, plus Orchestrator-made standing
changes: `package.json` gained `"@orkestrel/codec": "file:tmp/tarballs/orkestrel-codec-0.0.1.tgz"`
and the lockfile moved — both expected, leave them). You perform this assignment directly and
spawn nothing. You commit nothing.

Read `AGENTS.md` (pointer to the scaffold canon) before writing. The codec package's guide is
`C:\Users\mikes\WebstormProjects\codec\guides\codec.md` — its decoders are total
(`Uint8Array | undefined`), canonical-strict, and its url names spell the initialism
`Base64URL`.

## Objective

Delete server's four Base64 helpers and route the token functions through the codec, per the
accepted charter (archived: lsp repo, `.orkestrel/campaign/codec-home/charter-verdict.md` at
commit 7fdcb40) and the audit consequence rulings.

## Work

1. `src/server/helpers.ts`: delete `encodeBase64`, `decodeBase64`, `encodeBase64Url`,
   `decodeBase64Url` (functions and their TSDoc). Import from `@orkestrel/codec` exactly
   what the remaining callers need (read the callers: `signToken`, `verifyToken`,
   `decodeTokenPayload` use the url pair — the codec spelling is `encodeBase64URL` /
   `decodeBase64URL`). Do NOT re-export any codec symbol (quality.md: never re-export a
   dependency's symbol).
2. Narrow the token functions' error handling: where a `try/catch` existed solely because
   the old decoder threw `DOMException`, replace with an `undefined` check on the codec
   decoder's return; keep `catch` only around what still throws (WebCrypto, `JSON.parse`).
   Read each site before editing — the containment that remains must match what the body can
   actually throw.
3. Tests `tests/src/server/helpers.test.ts`: remove the describe blocks for the four deleted
   exports (the standard-pair block and any url-pair rows that test the deleted symbols
   directly, including the `DOMException` expectations). Token-function tests stay and must
   stay green unchanged — the token surface's behavior is preserved (a malformed signature
   still yields `undefined`, now via the total decoder instead of a caught throw). Record as
   an observation, not a criterion: inputs the host `atob` repaired (embedded whitespace)
   now refuse earlier on the decode path; the token verdict for them is unchanged
   (`undefined`).
4. `guides/server.md`: remove the four helper rows (parity enforces this).

## Scope

Owned: `src/server/helpers.ts`, `tests/src/server/helpers.test.ts`, `guides/server.md`.
Off-limits: everything else, including `package.json`/lockfile (already set), every vendored
file, every path outside the server checkout (the codec checkout is read-only reference).

## Gates (run in the server repo; report exact tails)

`npm run format` then `format:check`; `lint:check`; `check`; the helpers/server src suite
(scoped: the project or file that covers `tests/src/server/helpers.test.ts`, plus the full
`test:src` if scoped runs are not wired); `test:guides`; `test:policy`; `test:config`. All
exit 0.

## Deviation contract

A caller of the deleted helpers outside the token functions, a test that pins deleted
behavior you cannot remove within scope, or a codec semantics mismatch stops the unit:
report expected/found/evidence. Phrasing and ordering inside the owned files are yours.

## Output

Final message: what changed per file; the codec imports taken; every gate tail; the
whitespace-path observation with an executed example; anything decided in latitude.
