# Unit M2 — input continuation: grouped call options carrying state and responses

Role and engine: `sol` implementer, GPT-5.6 Sol, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/mcp`. You perform this assignment directly and
spawn nothing beyond the shell commands your work needs. Red-first for every behavioral row:
record the exact command and its failing count before implementing, then record the same command
green.

Before working, read in order: `/home/user/mcp/AGENTS.md`; the applicable rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/patterns.md`, `.claude/rules/tests.md`, `.claude/rules/documentation.md`,
`.claude/rules/writing.md`, `.claude/rules/quality.md`; no skill binds this unit; the guide
`guides/mcp.md` §§ Elicitation and input continuation (the retry prose sits at lines 1160-1210).

## Objective

`MCPClientInterface.call` places a continuation retry: the caller answers an
`input_required` result by calling `call` again with the same `name` and byte-identical
`arguments`, supplying the protected state and the responses through a grouped call option,
and the client sends them as top-level `params` siblings the server's retry ingress accepts.

## Context

Baseline: mcp commit `a6b319c`, tree clean (`git status --porcelain` empty at dispatch). Every
line fact below was read from that commit.

- The defect (campaign audit): `call` cannot place `requestState` and `inputResponses` for the
  input-required retry the server fully implements.
- `src/core/MCPClient.ts:384-397` — `call(name, args, options?)` issues
  `#request('tools/call', { name, arguments: args }, this.#timeout, undefined, options)`.
  Nothing else can be placed.
- `src/core/types.ts:2310-2315` — `MCPCallOptions` carries `signal` and `progress` only. Its
  `@remarks` (types.ts:2290-2309) open with "Both leaves are the CALLER's"; that prose must be
  rewritten when a leaf is added.
- `src/core/MCPServer.ts:997-999` — `#input` branches into `#retry` when
  `params['requestState'] !== undefined || params['inputResponses'] !== undefined`.
- `src/core/MCPServer.ts:1045-1053` — `#retry` reads both from `request.params` as top-level
  siblings and refuses with `JSONRPC_INVALID_PARAMS`
  ("Invalid params: `inputResponses` and `requestState` are required together") unless
  `requestState` is a bounded string and `inputResponses` is a record. The pair is required
  together on the wire.
- `src/core/MCPServer.ts:1086-1101` — verification binds the retry to the ORIGINAL call: the
  argument digest must match (`state.digest !== digest` refuses), so the retry's `arguments`
  must be byte-identical to the first round's.
- `src/core/types.ts:584-597` — `MCPInputResult` is the at-least-one-of union the caller
  narrows on; `MCPCallOutcome` includes it (types.ts:2335-2342), so the client already
  RECEIVES `input_required` from `call` and only lacks the door to answer it.
- Precedent: `MCPResourceReadParams` (types.ts:1042-1046) and `MCPPromptGetParams`
  (types.ts:1049-1054) already declare `inputResponses?` and `requestState?` for the resource
  and prompt continuations. Those doors take a params object; `call` takes `(name, args,
  options)`, so its carrier is the options object, per the reconciled design ruling below.
- Guide: `guides/mcp.md:1163-1164` states the wire contract — the retry repeats byte-identical
  `arguments`; `inputResponses` and the byte-exact `requestState` are top-level `params`
  siblings; extra `inputResponses` keys are IGNORED.

Design ruling, reconciled by the campaign's adversarial design round and binding here: the
carrier is a grouped key on `MCPCallOptions`, per `.claude/rules/names.md` § Group options by
entity. The group is:

```ts
readonly input?: {
	readonly state: string
	readonly responses: Readonly<Record<string, unknown>>
}
```

- The group noun `input` mirrors the server's `input` option (`MCPServer.ts:979`
  `this.#options.input`) and the `input_required` family; the leaves are single words.
- Both leaves are required inside the group because the server refuses the pair apart
  (MCPServer.ts:1047-1053); the type boundary encodes the required-together rule the way
  `MCPInputResult` encodes at-least-one-of (types.ts:579-583).
- On the wire the leaves map to the dated protocol's keys exactly: `state` →
  `requestState`, `responses` → `inputResponses`, placed as top-level `params` siblings of
  `name` and `arguments` — never nested under `arguments`, never under `_meta`.
- The M6 naming cascade is a later unit; do not rename anything existing.

Host environment: Linux container, Node and npm on PATH, network DENIED in your sandbox — no
installs, no fetches. The repository's dependencies are installed. Run scoped commands:
`npm run check:src:core`, `npx vitest run --config vite.config.ts --no-cache --project
src:core`, and scoped file filters. Nested `git` invocations from a spawned tool can report
"not a git repository" while your own `git status` succeeds; that is the sandbox, not the tree.

## Unknowns

- Whether `src/core/MCPLegacyClientTransport.ts` forwards `tools/call` params unmodified.
  Verify by reading its send path before implementing. If it rewrites or strips `tools/call`
  params so the continuation pair cannot transit, STOP and report per the deviation contract —
  do not widen the unit into the adapter.
- Whether the guide's input-continuation section already shows a client-API retry example.
  Read `guides/mcp.md:1160-1210` and report what you found beside what you changed.

## Scope

Owned files:

- `src/core/types.ts` — the `MCPCallOptions` group and its TSDoc rewrite (types first).
- `src/core/MCPClient.ts` — `call` places the pair as top-level `params` siblings.
- `guides/mcp.md` — the input-continuation prose gains the client-side retry: the option
  group, the byte-identical `arguments` obligation, and a fence importing through
  `@orkestrel/mcp`.
- `tests/src/core/MCPClient.test.ts` — the behavioral rows named under Acceptance criteria.
- `tests/guides.test.ts` — only as parity requires for the guide edit.

Shared, report-only: `src/core/MCPLegacyClientTransport.ts`, `src/core/MCPServer.ts`,
`src/core/validators.ts`, `src/core/helpers.ts` — read freely, return exact patches if a
criterion genuinely needs one, edit none of them.

Off-limits: everything else, `package.json` and the lockfile included. No new dependency, no
version bump.

Allowed tools: read, edit, and scoped shell commands in `/home/user/mcp`. No commit, no push,
no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide `format` or `lint --fix`
while the campaign has other lanes; converge with scoped checks and leave formatting to the
non-mutating gates.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself,
directly, and spawn nothing beyond the shell commands your work needs. Bench limits that bind
your proofs:

- A loopback listener fails `EPERM` on every address in your sandbox, so no HTTP-transport
  proof is possible here. Take every behavioral proof through the in-process carrier pair the
  suite already uses for client/server rows (see the existing rows in
  `tests/src/core/MCPClient.test.ts` for the mechanism).
- A Node child spawned from a vitest worker is a grandchild with unreliable stdio; do not
  build a proof on one. The stdio transcription row in `tests/guides.test.ts` is such a
  subject — run it only as part of a scoped observation, never as your own proof mechanism.
- Never make a whole-suite gate a criterion for yourself: run scoped projects, record the
  whole-suite reading as an observation, and the Orchestrator takes the authoritative gates
  on the host after you exit.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact behavioral delta.
2. The chosen wire placement quoted from your own diff (the lines placing `requestState` and
   `inputResponses`).
3. Red-first evidence per behavioral row: the exact command, its failing count before, the
   same command green after.
4. The legacy-transport reading (Unknowns) with `file:line` evidence.
5. The guide reading (Unknowns) and the prose delta.
6. Observations outside scope, each named against the capability that owns it.
7. Scoped gate readings you took, each with its exit code.
8. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact evidence,
done or not done, and at most one short hypothesis. The named stop conditions: the legacy
transport cannot transit the pair; the server refuses the placement this brief prescribes; a
granted file cannot satisfy a criterion without an off-limits edit. An ancillary conflict —
where the guide paragraph sits, which heading a section takes, test row naming — is yours to
decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first; every behavioral row red-first.

1. `npm run check:src:core` exits 0 with the group typed as prescribed and `call` compiling
   against it.
2. A recorder-transport row proves placement: `call('NAME', args, { input: { state, responses
   } })` produces a request frame whose `params` carries `requestState` and `inputResponses`
   as top-level siblings of `name` and `arguments`, with `arguments` the same reference-equal
   shape passed in — and a call WITHOUT the group produces a frame carrying neither key.
3. A round-trip row proves the continuation end to end against a real `MCPServer` with
   `input` configured, over the in-process carrier pair: the first `call` returns
   `resultType: 'input_required'` with a `requestState`; the second `call` with byte-identical
   `arguments` and the group returns `resultType: 'complete'`.
4. A refusal row proves the bound stays the server's: the second `call` with ALTERED
   `arguments` and the same group is refused `JSONRPC_INVALID_PARAMS` (the digest check at
   `MCPServer.ts:1086-1101`).
5. The `MCPCallOptions` TSDoc no longer claims two leaves, states the group's
   required-together rule and the byte-identical `arguments` obligation, and follows the
   TSDoc rules in `.claude/rules/typescript.md`.
6. The guide's input-continuation section documents the client-side retry with a fence
   importing `@orkestrel/mcp`, and the scoped guides parity run over your edit exits 0 —
   observation-grade if the whole guides project cannot run in your sandbox; say which.
7. `npx vitest run --config vite.config.ts --no-cache --project src:core` exits 0.
8. No banned construct anywhere in the diff: no `any`, no assertions, no suppressions, no
   nested function declarations, no mutation of caller-owned input — the `arguments` record
   the caller passes is never copied-and-modified into the params, it is placed as given.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you exit;
your report's claims are audited against them. Flag any claim you could not close rather than
rounding it up.
