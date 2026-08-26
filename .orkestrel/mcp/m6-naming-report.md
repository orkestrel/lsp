# Unit report: m6-naming — the mcp naming cascade under the delegated ruling

The ruled rename set landed in one change across `src/`, `tests/` (excluding `tests/mirrors/`),
and `guides/mcp.md`, with the named gates green. No compatibility alias, re-export, deprecation
tag, or wrapper was left behind, and no class, factory, or type identifier moved.

Baseline verified before editing: `git log --oneline -1` read
`11c879c Close the M4 round audit's findings in one repair unit`, and `git status --short` was
empty. No deviation.

## What each rename touched

The rename ran as one word-boundary substitution over the files a
`grep -rlwE 'SUPPORTED_PROTOCOL_VERSIONS|SUPPORTED_CLIENT_PROTOCOL_VERSIONS|MCP_PROTOCOL_VERSION|MCP_LEGACY_VERSION'`
over `src tests guides` named, minus `tests/mirrors/`. The instrument is retained at
`/tmp/claude-0/-home-user/e78ce9cf-999c-5254-92bf-205d07ca630a/scratchpad/m6-rename.sh`.

Post-edit site measurements, from `grep -rnw <token> src tests guides | grep -v '^tests/mirrors/'`
run 2026-08-26, match the brief's pre-edit populations token for token in every file:

| File                                             | `SUPPORTED_MODERN_PROTOCOL_VERSIONS` | `SUPPORTED_MCP_VERSIONS` | `MCP_HANDSHAKE_VERSION` | `MCP_FALLBACK_VERSION` |
| ------------------------------------------------ | ------------------------------------ | ------------------------ | ----------------------- | ---------------------- |
| `guides/mcp.md`                                  | 4                                    | 2                        | 4                       | 3                      |
| `src/core/MCPClient.ts`                          | 2                                    | —                        | —                       | —                      |
| `src/core/MCPLegacy.ts`                          | —                                    | —                        | 2                       | —                      |
| `src/core/MCPLegacyClientTransport.ts`           | —                                    | —                        | 2                       | —                      |
| `src/core/MCPServer.ts`                          | 2                                    | —                        | —                       | —                      |
| `src/core/constants.ts`                          | 2                                    | 1                        | 2                       | 2                      |
| `src/core/helpers.ts`                            | 2                                    | —                        | 2                       | —                      |
| `src/core/inferers.ts`                           | 3                                    | —                        | —                       | —                      |
| `src/core/validators.ts`                         | 3                                    | 3                        | —                       | —                      |
| `src/server/inferers.ts`                         | —                                    | —                        | 3                       | —                      |
| `tests/integration.test.ts`                      | —                                    | —                        | —                       | 2                      |
| `tests/src/core/MCPClient.test.ts`               | 2                                    | —                        | 9                       | —                      |
| `tests/src/core/MCPLegacyClientTransport.test.ts` | —                                   | —                        | 5                       | —                      |
| `tests/src/core/MCPServer.test.ts`               | 3                                    | —                        | 5                       | —                      |
| `tests/src/core/inferers.test.ts`                | 4                                    | —                        | —                       | —                      |
| `tests/src/core/integration.test.ts`             | 2                                    | —                        | 2                       | 4                      |
| `tests/src/core/validators.test.ts`              | 2                                    | 2                        | —                       | —                      |
| `tests/src/server/factories.test.ts`             | —                                    | —                        | 2                       | 2                      |
| `tests/src/server/handlers.test.ts`              | —                                    | —                        | 3                       | 3                      |
| `tests/src/server/helpers.test.ts`               | —                                    | —                        | 3                       | —                      |
| `tests/src/server/middlewares.test.ts`           | —                                    | —                        | —                       | 5                      |
| `tests/src/server/transports/HTTPClientTransport.test.ts` | —                           | —                        | 5                       | 6                      |

Every site is an identifier, an `import` member, or a backticked guide token. No test title, `it`
description, or `describe` description names any of these constants, verified by
`grep -rnwE '<new tokens>' tests | grep -E "it\('|describe\('"`, which returned nothing.

`{@link}` references resolve to the new spellings: `src/core/inferers.ts` line 11 links
`SUPPORTED_MODERN_PROTOCOL_VERSIONS` beside `SUPPORTED_LEGACY_PROTOCOL_VERSIONS`,
`src/core/validators.ts` line 1338 links `SUPPORTED_MCP_VERSIONS` from the `isMCPVersion`
`@returns`, and line 1348 links `SUPPORTED_MODERN_PROTOCOL_VERSIONS` from the
`isMCPModernVersion` `@returns`.

## The refused rename and the standing condition

The `MCPLegacy` family is untouched: `MCPLegacy`, `createMCPLegacy`, `MCPLegacyClientTransport`,
and `createMCPLegacyClientTransport` keep their names, and no class, factory, or type identifier
appears in the diff.

`MCP_PROTOCOL_VERSION_HEADER` still resolves untouched. Its declarations sit at
`src/server/constants.ts:27` and `src/browser/constants.ts:22`, both reading
`export const MCP_PROTOCOL_VERSION_HEADER = 'mcp-protocol-version'`, and neither file appears in
`git status --short`. The word-boundary form was proved against that exact adjacency before the
run: a `sed -E 's/\bMCP_PROTOCOL_VERSION\b/MCP_HANDSHAKE_VERSION/'` probe over a fixture holding
`MCP_PROTOCOL_VERSION_HEADER`, `MCP_PROTOCOL_VERSION`, `SUPPORTED_LEGACY_PROTOCOL_VERSIONS`,
`MCPLegacyVersion`, and the hyphenated `mcp-protocol-version` rewrote only the bare constant.

## Prose repairs from Unknowns

Two authored sentences changed. Both sit in `src/core/constants.ts`, and both repair a claim the
rename makes false or stale.

The `SUPPORTED_MODERN_PROTOCOL_VERSIONS` TSDoc first sentence carried the unqualified reading the
8b finding named — "the MCP protocol revisions", where the constant holds the modern set alone:

- Before: `The MCP protocol revisions a bare server accepts and advertises.`
- After: `The modern MCP protocol revisions a bare server accepts and advertises.`

The `SUPPORTED_MCP_VERSIONS` TSDoc first sentence asserted the client allowlist the F3 finding
refuted, because no client surface admits the constant's full contents:

- Before: The protocol revisions the client can use across modern and legacy peers.
- After: The protocol revisions the `isMCPVersion` guard admits, spanning the modern and legacy eras.

The `@remarks` block under `SUPPORTED_MODERN_PROTOCOL_VERSIONS` stays as written: it states that
legacy revisions are absent because `SUPPORTED_LEGACY_PROTOCOL_VERSIONS` and the optional legacy
decorator own them, which the rename leaves true.

Two TSDoc blocks the rename touched needed no repair, and I record the reading rather than the
edit. `MCP_HANDSHAKE_VERSION` already opened "The revision offered and defaulted to in the legacy
`initialize` handshake", so the rename brings the name to the sentence. `MCP_FALLBACK_VERSION`
already opened "The legacy fallback anchor used when an initialize request cannot be accepted as
modern", which is the role the ruling names for it; re-litigating that sentence sits outside this
unit.

Guide prose needed no sentence-level correction, only the token and its table padding. The two
sentences that carry the meaning were already right at `11c879c`: line 88 reads
"`SUPPORTED_MODERN_PROTOCOL_VERSIONS` is the bare server's frozen modern set", and line 91 reads
"`SUPPORTED_MCP_VERSIONS` combines those era-scoped sets for the version guards and the explicit
client adapter; it never becomes a bare-client or server advertisement". The guide therefore never
carried the superset or allowlist reading; only the `constants.ts` TSDoc did.

## Guide table padding

Three tables in `guides/mcp.md` hold a renamed token, and the substitution moved their column
widths off the file's convention — every cell padded to its column's widest content, one space each
side. Each was re-padded to that convention by
`/tmp/claude-0/-home-user/e78ce9cf-999c-5254-92bf-205d07ca630a/scratchpad/repad.mjs`:

- the protocol table at lines 82–86, whose third column keeps its baseline width because the
  unchanged `2026-07-28` row still sets it;
- the survivor table at lines 1817–1823, whose first column widens by one because
  `MCP_HANDSHAKE_VERSION` is longer than the `MCP_PROTOCOL_VERSION` that set the old width, so
  every row and the separator take one more space;
- the constants table at lines 1950–1979, whose first column keeps its baseline width because
  `SUPPORTED_MODERN_PROTOCOL_VERSIONS` is exactly as long as the
  `SUPPORTED_CLIENT_PROTOCOL_VERSIONS` that set it.

`git diff -U0 -- guides/mcp.md` reports hunks at lines 85, 88, 91, 1817–1823, 1952, 1955, 1957,
3144, 4317, and 4509 and nowhere else, so the re-pad reached no table row the rename did not.

## Gate readings

Each command ran from `/home/user/mcp` against the finished tree on 2026-08-26. Owned files means
the paths `git diff --name-only` reports.

| Gate                                                                | Reading                          | Exit |
| ------------------------------------------------------------------- | -------------------------------- | ---- |
| `npx oxfmt --config .oxfmtrc.json --check <owned files>`             | All matched files use the correct format | 0 |
| `npx --no-install oxlint --config .oxlintrc.json --deny-warnings <owned .ts>` | no diagnostics       | 0    |
| `npm run check`                                                      | root, core, browser, server clean | 0   |
| `npx vitest run … --project src:core`                                | `Tests 780 passed (780)`, `Test Files 16 passed (16)` | 0 |
| `npm run test:guides`                                                | `Tests 144 passed (144)`         | 0    |
| `npx vitest run … --project conformance`                             | `Tests 42 passed (42)`           | 0    |

The `src:core` pre-edit reading, taken on the clean `11c879c` tree before any edit, was
`Test Files 16 passed (16)` / `Tests 780 passed (780)`, exit 0 — identical to the post-edit
reading. Guides matched the brief's `144 passed (144)` baseline and conformance its
`42 passed (42)`.

Two further projects own edited test files, and I report their readings as observations rather
than as criteria: `src:server` read `Test Files 12 passed (12)` / `Tests 315 passed | 1 skipped
(316)`, exit 0, and `npm run test:integration` read `Tests 4 passed (4)`, exit 0. The skip is
pre-existing and sits in a file this unit did not touch.

## Acceptance criterion 1, measured

A word-boundary grep for each old spelling over `src`, `tests` excluding `tests/mirrors/`, and
`guides` reports zero, run 2026-08-26:

```text
SUPPORTED_PROTOCOL_VERSIONS: 0
SUPPORTED_CLIENT_PROTOCOL_VERSIONS: 0
MCP_PROTOCOL_VERSION: 0
MCP_LEGACY_VERSION: 0
```

A sweep for a shim over the same owned files —
`grep -rniE '@deprecated|export \{ .*(SUPPORTED_PROTOCOL_VERSIONS|MCP_PROTOCOL_VERSION|MCP_LEGACY_VERSION|SUPPORTED_CLIENT_PROTOCOL_VERSIONS)'`
— returns nothing, so no alias, re-export, or deprecation tag survives the cascade.

## Writing-rules sweep

Population: the 119 added lines of `git diff -U0`, stripped of the `+++` headers — every line this
unit writes, prose and code alike. Pattern, case-insensitive and inflected:

```text
should|simply|eas(y|ier|ily)|just|currently|now|new|latest|utilize|leverage|via|in order to|
e\.g\.|i\.e\.|etc\.|performant|robust|allows you to|and/or|since|once|please|sanity check|dummy|
blacklist|whitelist|master|slave|ensure|guarantee|\bwe\b|\bour\b|let's|above|below|\bhere\b
```

The sweep returned two hits, both on `newest` matching the `new` row, and both ruled permitted:

- `guides/mcp.md` line 1952, "`'2025-11-25'` — the newest legacy initialize revision."
- `guides/mcp.md` line 4317, "newest supported legacy revision (`MCP_HANDSHAKE_VERSION`,
  `'2025-11-25'`)."

Each `newest` orders two dated revisions against each other rather than dating the software, and
each prints the exact date beside it, so the sense the `new` row bans is absent. Both lines are
pre-existing prose the rename carried into the diff; the only edit on either is the token and its
padding.

The sweep also caught one defect in my own authored prose before the final run. The
`SUPPORTED_MCP_VERSIONS` sentence first read "The protocol revisions `isMCPVersion` admits", which
puts a code token in front of a verb rather than a noun. It now reads "the `isMCPVersion` guard
admits", and the file re-passed format and lint at exit 0 after the repair.

## Deviation state

No deviation. Every edit landed inside the owned set; no rename forced an edit outside it; no
word-boundary hit surfaced in a sense other than the renamed constant; no gate reddened.

## Tree state

`git status --short`:

```text
 M guides/mcp.md
 M src/core/MCPClient.ts
 M src/core/MCPLegacy.ts
 M src/core/MCPLegacyClientTransport.ts
 M src/core/MCPServer.ts
 M src/core/constants.ts
 M src/core/helpers.ts
 M src/core/inferers.ts
 M src/core/validators.ts
 M src/server/inferers.ts
 M tests/integration.test.ts
 M tests/src/core/MCPClient.test.ts
 M tests/src/core/MCPLegacyClientTransport.test.ts
 M tests/src/core/MCPServer.test.ts
 M tests/src/core/inferers.test.ts
 M tests/src/core/integration.test.ts
 M tests/src/core/validators.test.ts
 M tests/src/server/factories.test.ts
 M tests/src/server/handlers.test.ts
 M tests/src/server/helpers.test.ts
 M tests/src/server/middlewares.test.ts
 M tests/src/server/transports/HTTPClientTransport.test.ts
```

`git diff --stat`:

```text
 guides/mcp.md                                      | 36 +++++++++++-----------
 src/core/MCPClient.ts                              |  4 +--
 src/core/MCPLegacy.ts                              |  4 +--
 src/core/MCPLegacyClientTransport.ts               |  4 +--
 src/core/MCPServer.ts                              |  4 +--
 src/core/constants.ts                              | 18 +++++------
 src/core/helpers.ts                                |  8 ++---
 src/core/inferers.ts                               |  6 ++--
 src/core/validators.ts                             | 12 ++++----
 src/server/inferers.ts                             |  6 ++--
 tests/integration.test.ts                          |  4 +--
 tests/src/core/MCPClient.test.ts                   | 22 ++++++-------
 tests/src/core/MCPLegacyClientTransport.test.ts    | 10 +++---
 tests/src/core/MCPServer.test.ts                   | 16 +++++-----
 tests/src/core/inferers.test.ts                    |  8 ++---
 tests/src/core/integration.test.ts                 | 16 +++++-----
 tests/src/core/validators.test.ts                  |  8 ++---
 tests/src/server/factories.test.ts                 |  6 ++--
 tests/src/server/handlers.test.ts                  |  8 ++---
 tests/src/server/helpers.test.ts                   |  6 ++--
 tests/src/server/middlewares.test.ts               | 10 +++---
 .../server/transports/HTTPClientTransport.test.ts  | 22 ++++++-------
 22 files changed, 119 insertions(+), 119 deletions(-)
```

`package.json` is untouched, so the version bump the moved published surface obliges stays with the
release, as the brief directs.

## Claims I flag for the auditor

- The site table reports post-edit measurements and matches the brief's pre-edit populations file
  by file. It proves the rename reached every measured site; it does not prove the brief's
  populations were themselves complete for `MCP_PROTOCOL_VERSION` and `MCP_LEGACY_VERSION`, whose
  test hits the brief left to the acceptance grep. I re-derived those sets before editing and the
  zero-residual grep closes them.
- The `MCP_FALLBACK_VERSION` TSDoc sentence is retained unedited on the ruling's reading that it
  already states the fallback-anchor role. A reader who checks `src/server/inferers.ts` line 145
  and `src/core/helpers.ts` line 1081 will find the unsupported-revision fallback resolving to
  `MCP_HANDSHAKE_VERSION` rather than to `MCP_FALLBACK_VERSION`. That tension predates this unit
  and I did not act on it.
