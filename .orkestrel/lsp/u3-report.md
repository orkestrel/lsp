# U3 report — ROADMAP reconciliation and the deferral record

Baseline confirmed before writing: `git status --porcelain` empty, HEAD `823f2d6`. Every
campaign commit had landed (`869b506`, `05005da`, `e5dfac7`, `823f2d6`), so no row names
unlanded work and the brief's Unknowns section is closed.

Touched files: `ROADMAP.md` alone — the sequenced record rewritten to carry no stale
live-state claim, this campaign's chunks, the verified fleet findings, and a trigger per
`## Next` row.

## Section-by-section disposition

| Section | Disposition |
| ------- | ----------- |
| Opening paragraph (package summary) | **Edited.** The `LSPServer` sentence dropped `follows after the client surface settles` — an evaluative condition — for ruling 7's trigger: a fleet package that must answer LSP requests rather than send them. |
| Opening paragraph (protocol targeting) | **Edited.** Gained ruling 3: the transport seam carries bytes permanently for stream transports, because LSP fixes one `Content-Length` framing over stdio, socket, and pipe, and a message-framed transport re-frames at its own edge. |
| Opening paragraph (plan of record) | **Edited.** The `.orkestrel/` navigation sentence and the `state.md` sentence were live-state claims about a folder that prunes. Replaced by a git-history statement: each `## Delivered` row names its commits, the campaign records land under `.orkestrel/lsp/` in those same commits, and a `git show` against the commit reads them after the prune. |
| `## Delivered` | **Merged and extended.** Absorbed `## Delivered to its first consumer`, text verbatim. Gained the combinator adoption (`869b506`), the seam fold and single-sourced advertisement (`05005da`), the codec decomposition (`e5dfac7`), and the audit round's accepted findings (`823f2d6`). One stray blank line inside the list removed. |
| `## Delivered to its first consumer` | **Struck as a heading.** Its rows survive verbatim inside `## Delivered`. |
| `## Where the work sits, 2026-08-26, at the campaign's close` | **Struck in full**, table included. No merged branch name remains in the file. |
| `## The campaign's end` | **Struck in full.** |
| `## Next` | **Rewritten as the sequenced record.** Gained an intro carrying ruling 4's transport-performance reading, then `SocketTransport`, a WebSocket transport, `LSPServer`, and the TypeScript 7 conformance reading, each with its trigger. The internal-seams row is struck (ruling 2 closed it) and the TypeScript 7 row lost `after the package is enterprise-grade`. |
| `## Deliberately deferred` | **Extended and moved.** Kept legacy protocol negotiation verbatim; gained the IPC-channel transport (ruling 4's node-ipc exclusion) and the further-ecosystem-dependencies row (ruling 6). |
| `## Fleet findings carried forward` | **Verified row by row against U0 and extended.** Intro kept verbatim. |

Ancillary decisions, recorded per the deviation contract:

- **Section order.** `## Deliberately deferred` now sits directly after `## Next`, ahead
  of `## Fleet findings carried forward`. The package's own forward record reads
  contiguously and the section about other repositories closes the file.
- **Row order inside `## Delivered`.** The absorbed consumer rows sit in their
  chronological slot — after the vocabulary pass, before this campaign's chunks — rather
  than as the section's final rows. The list is build-ordered, and four newer chunks
  placed before older ones would break that reading. Their text is verbatim either way.
- **`LSPServer` trigger stated in the opening and in `## Next`.** The opening summary
  carries the trigger so the sentence is not stale; the `## Next` row carries the trigger
  plus the shape and the design-brief rule, which the summary does not.
- **Reviewer observations dropped.** `waitForDeadline` as the barrel's one unqualified
  function name, and the inline-combinator closure allocation, are neither forward
  obligations nor campaign rulings, and no section naturally owns them.
  `.orkestrel/lsp/campaign-audit-verdict.md` retains both.

## Fleet-finding verdicts

| Row | Verdict | U0 pointer |
| --- | ------- | ---------- |
| scaffold — session-assembly duplication | **Kept verbatim** | U0 open: `HOST_PATHS` still vendors the instruction set (`scaffold/src/core/constants.ts:124-159`); slimming refused in `PROPOSAL.md`. |
| scaffold — inert `.oxlintignore` | **Kept verbatim** | U0 open: file present (`scaffold/.oxlintignore:1-20`), no `--ignore-path` in the lint scripts (`package.json:65,73`), exclusion in rc `ignorePatterns`. |
| fleet — guides-execution gap | **Kept verbatim** | U0 open: `markdown/tests/guides.test.ts` drop-in resolves names (`:142-151`) and executes no fence; file ends at the link checks (`:154-170`). |
| mcp — transport-ingress backpressure | **Kept verbatim** | U0 open: named as the unimplemented closer (`mcp/guides/mcp.md:4023-4025`); `MCPClientTransportInterface.send` still takes `message` alone (`mcp/src/core/types.ts:2266`). |
| mcp — `below`/`above` sweep | **Kept verbatim** | U0 open: hits remain across `mcp/guides/*.md`, tests, and src. |
| markdown — vocabulary sweep | **Kept verbatim** | U0 open: every named `via` and TSDoc-opener site still hits. |
| markdown — CommonMark `U+0000` | **Kept verbatim** | U0 open: `splitLines` (`markdown/src/core/helpers.ts:87-109`) does not replace `U+0000`; no ruling in src. |
| markdown and html — reused-identity divergence | **Kept verbatim** | U0 open: html uses `WeakSet` identity (`html/src/core/helpers.ts:1188-1193`), markdown walks without a visited set (`markdown/src/core/helpers.ts:2628-2665`). |
| html — spans-to-markdown inbound projection | **Kept, bullet narrowed** | U0 open: `html/src` has no `markdown` symbol; `htmlToMarkdown` returns a document with no span map. |
| html — barrel membership of `findOpenPosition` / `projectDepth` | **STRUCK** | U0 shipped on html `main` `ddd2433a`: exported (`html/src/core/helpers.ts:103`, `:135`), barrelled (`html/src/core/index.ts:5`), surface rows at `guides/html.md:102-103`, `INTERNAL` empty. The commit is named in the commit-message draft, not in the file. |
| probe — RuntimeStage frame basis | **Kept verbatim** | U0 open: still lowers Vitest's 1-based column (`probe/src/server/stages/RuntimeStage.ts:921-926`); pin expects `15`; Vitest still `^4.1.11`. |
| **process — line-stream-only supervised child** | **ADDED** | New this campaign. Verified here, not from U0: `ProcessInterface.lines` is `AsyncIterable<string>` framed on line terminators (`node_modules/@orkestrel/process/dist/src/core/index.d.ts:452`) and the interface exposes no byte-chunk member, so `src/server/transports/StdioTransport.ts:3,8` imports `node:child_process` directly. |
| **scaffold — oxlint `complexity` rule** | **ADDED** | New this campaign. Readings from `.orkestrel/lsp/complexity-probe-results.txt`: lsp clean at max 20 after the decomposition; mcp at max 20 reads 28, 23, 21, and 30. `lint:check` runs `--deny-warnings`. |

No conflict arose between U0's table and the file, so the deviation contract did not fire.

## Ruling placement

| Ruling | Home, stated once |
| ------ | ----------------- |
| 2 — `#releaseGeneration` folds, `#cancelRequest` stays | `## Delivered`, the seam-fold row. The `## Next` internal-seams row is struck. |
| 3 — byte seam permanent, edge re-framing | Opening paragraph (protocol targeting). Its concrete application sits in the WebSocket `## Next` row without restating the permanence. |
| 4 — transport performance reading | `## Next` intro. The node-ipc exclusion from the same ruling sits in `## Deliberately deferred`. |
| 6 — no ecosystem dependency added | `## Deliberately deferred`, the further-dependencies row, each candidate with its one-line reason. |
| 7 — `LSPServer` trigger | Opening paragraph and the `## Next` row. |
| D2 retained tensions | `## Delivered`, the codec-decomposition row: `parseLSPMessages` 19 down from 60, `readLSPHeader` 27 alone accepted by design, and the name-and-file tension recorded rather than repaired. |

## Acceptance criteria

1. `git diff --stat` shows `ROADMAP.md` alone — **met** (1 file changed, 93 insertions, 61 deletions).
2. No merged branch name; `## Where the work sits` and `## The campaign's end` absent — **met** (`grep -c "est33d\|Where the work sits\|campaign's end" ROADMAP.md` returned 0).
3. `## Delivered` is one section, the consumer rows survive verbatim, this campaign's chunks appear with their hashes — **met**.
4. Every `## Next` row carries a trigger; the internal-seams row is gone; no `should` and no evaluative condition — **met**.
5. Fleet findings match U0 plus the two added rows; the struck half-row names its commit here, not in the file — **met**.
6. Rulings 3, 4, and 6 appear once each in the section that owns them; the IPC-channel exclusion sits under `## Deliberately deferred` — **met**.
7. `npm run format:check` and `npm run test:guides` green — **met**.

## Commands run

| Command | Result |
| ------- | ------ |
| `git status --porcelain` (before) | empty — clean baseline |
| `git log --oneline -8` | HEAD `823f2d6`; all four campaign commits present |
| `git diff --stat 2c0eba8 823f2d6 -- package.json package-lock.json` | empty — byte-identical, so the ruling-6 claim in the file is verified |
| `grep -nEi "should\|simply\|easy\|currently\|via\|e.g.\|etc.\|performant\|robust\|and/or\|please\|ensure\|latest\|new\|above\|below\|est33d" ROADMAP.md` | Hits at `:176` and `:179` only, both quoting `below`/`above` as the subject of the mcp sweep finding — permitted sense. No other banned term. |
| `npm run format:check` | `All matched files use the correct format.` — 154 files, 1615 ms |
| `npm run test:guides` | `Test Files 1 passed (1)` / `Tests 27 passed (27)` — 526 ms |
| `git diff --stat` | `ROADMAP.md \| 154 ++++---`, 1 file changed, 93 insertions, 61 deletions |
| `git status --porcelain` (after) | ` M ROADMAP.md` |

## Commit-message draft

```text
Reconcile the ROADMAP against what the campaign landed

The branch table and the campaign-end section were live state about a wave
that closed, so both go, and no merged branch name remains in the file. The
.orkestrel/ navigation sentence and its state.md pointer described a folder
that prunes; the paragraph now states where the record lives in git history
and how to read it after the prune.

Delivered absorbs Delivered to its first consumer, text verbatim, and gains
this campaign's chunks: the combinator adoption 869b506, the seam fold with
the LSP_CAPABILITIES and waitForDeadline extractions 05005da, the codec
decomposition e5dfac7 with parseLSPMessages measuring 19 against the retained
probe where it read 60 and readLSPHeader 27 alone accepted by design, and the
audit round's accepted findings 823f2d6.

Next becomes the sequenced record and every row carries a trigger:
SocketTransport when a consumer must attach to a server it does not spawn, a
WebSocket transport when a browser consumer must reach one it cannot spawn,
LSPServer when a fleet package must answer LSP requests rather than send
them, and the user-approved TypeScript 7 conformance reading. The client's
internal seams row is struck: the design round ruled it closed, with
#releaseGeneration folded and #cancelRequest kept for its symmetry with
#respondUnsupported. The transport performance reading, the permanent byte
seam, and the refusal to add an ecosystem dependency are each recorded once,
in the section that owns them, and node-ipc joins the deliberate exclusions.

Fleet findings were verified row by row against each owning repository's main
before being kept. The html barrel-membership half-row is struck as shipped at
html ddd2433a; the spans-to-markdown half of that bullet stays, and every
other row remains open. Two findings join: @orkestrel/process exposes a
supervised child as a line stream only, so a byte-framing transport still
imports node:child_process directly, and the oxlint complexity rule is worth
a vendored fleet decision now that lsp reads clean at the default maximum.

format:check clean and test:guides 27 passed on 2026-08-26.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

## `git status --porcelain`

```text
 M ROADMAP.md
```

## Deviation state

None. No conflict with U0's table, no unlanded campaign unit, and `test:guides` passed on
the change. Ancillary choices are recorded earlier in this report.

## Full `git diff`

```diff
diff --git a/ROADMAP.md b/ROADMAP.md
index 9895727..0ffb868 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -5,21 +5,24 @@ an `LSPClient` that drives a real language server over a transport, a stdio tran
 that owns the server child process, and a conformance suite that measures the package
 against the protocol's own metaModel. The package exists so no fleet consumer carries
 private framing, correlation, or lifecycle code for a language server again — the probe
-package's lint stage is the first such consumer. An `LSPServer` half follows after the
-client surface settles.
+package's lint stage is the first such consumer. An `LSPServer` half waits for a fleet
+package that must answer LSP requests rather than send them.
 
 The package targets LSP 3.18 and carries no compatibility mode for older servers: the
 client advertises exactly what it implements — `utf-16` position encoding alone — and
 fails `start` with a `protocol` error when a server selects outside that offer. Foreign
 protocol tooling stays on the development side — `vscode-languageserver-protocol` is a
-development dependency that the conformance suite reads, never a runtime import.
+development dependency that the conformance suite reads, never a runtime import. The
+transport seam carries bytes and stays that way for stream transports: LSP fixes one
+`Content-Length` framing over stdio, socket, and pipe, so the codec is a package-wide
+constant that the client owns. A message-framed transport re-frames at its own edge
+rather than adding a second seam.
 
 The plan of record is sequenced. Each chunk reaches green — the full gate chain plus an
-independent audit round — before the next begins. The campaign's briefs, reports, audit
-verdicts, and acceptance records live in this repository under `.orkestrel/`, one
-folder per fleet package with the cross-package record under `.orkestrel/campaign/`,
-and name each chunk here by its commits. The `state.md` file there is the
-session-boundary snapshot of what is in flight.
+independent audit round — before the next begins, and each `## Delivered` row names the
+commits that carry it. A campaign's briefs, reports, audit verdicts, and acceptance
+records land under `.orkestrel/lsp/` in those same commits. Read them after the campaign
+folder prunes by naming that path in a `git show` against the commit.
 
 ## Delivered
 
@@ -44,7 +47,6 @@ session-boundary snapshot of what is in flight.
   `vscode-languageserver-protocol` release — structure rows read from the metaModel's
   own properties, typed coordinates, membership derived from the core barrel, and a
   total drift formatter that reports any value without throwing.
-
 - **The guides parity project** (`eefa27a`): the fleet-standard executed-fence suite —
   `tests/guides.test.ts` powered by `@orkestrel/guide` and `@orkestrel/test`, the guides
   Vite project wired into the test chain, the manifest reshaped into the `## By concept`
@@ -54,9 +56,6 @@ session-boundary snapshot of what is in flight.
   `value is Diagnostic` through the installed protocol package, and the
   request-settlement default hoists to `LSP_TIMEOUT` in the constants file with its
   guide row.
-
-## Delivered to its first consumer
-
 - **The inspection bound split** (`231eb37`): the first real consumer falsified one
   conflation — `LSPClientOptions.timeout` bounded the client's lifecycle requests and
   the diagnostics wait alike, so a consumer whose inspection budget belongs to its own
@@ -72,53 +71,81 @@ session-boundary snapshot of what is in flight.
   installed as a packed tarball until the registry serves a release. Its round carries
   the adoption, the inspection-bound rewire, and the progress-gauge restore, accepted
   after an objective re-check returned PASS on every claim.
-
-## Where the work sits, 2026-08-26, at the campaign's close
-
-Every wave is closed and every touched checkout reads green under an independent
-verifier (`.orkestrel/campaign/fleet-verifier-2026-08-26.md`). The following table names
-each repository's final campaign state and the branch that carries it.
-
-| Repository                    | Branch                         | State                                                                                                                                                                                                      |
-| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
-| `orkestrel/lsp`               | `main`                         | `759b899` — the package with its guides parity project and vocabulary pass; the verifier read conformance `243 passed` on 2026-08-26.                                                                      |
-| `orkestrel/mcp`               | `claude/lsp-spec-audit-est33d` | `aa20c37` — the tasks wave (M4), the M5 closure under the no-deprecation ruling, and the M6 naming cascade, each accepted behind its audit. The moved published surface obliges a version bump at release. |
-| `orkestrel/markdown`          | `claude/lsp-spec-audit-est33d` | `a02494e` — the provenance round (H2) accepted behind its review and repairs.                                                                                                                              |
-| `orkestrel/probe`             | `claude/lsp-spec-audit-est33d` | `1db0372` — the lsp adoption (P1) and the `Issue.range` move (P2) accepted; the package re-pins its `file:` tarball range to the registry release at publish.                                              |
-| `orkestrel/html`              | `claude/lsp-spec-audit-est33d` | `a533947` — span provenance on the parse surface.                                                                                                                                                          |
-| `orkestrel/workflow`          | `claude/lsp-spec-audit-est33d` | `c01e1a5` — progress reshaped to the mcp pattern with `unit` removed.                                                                                                                                      |
-| `orkestrel/scaffold`          | `claude/lsp-spec-audit-est33d` | `c51d7ce` — the vendored lint exclusion and the bench write-root rule. The moved vendored surface obliges a scaffold release; every target re-pins and runs `repair` after it.                             |
-| `orkestrel/process`           | `claude/lsp-spec-audit-est33d` | `2a47ed1` — the G1 guide ruling and the g2 fixture guard behind its red-first and mutation-bound records.                                                                                                  |
-| `queue`, `tool`, `middleware` | `claude/lsp-spec-audit-est33d` | G1 commits — each guide records why the package stays untouched by the progress work.                                                                                                                      |
-
-## The campaign's end
-
-The exit criterion is met on landed evidence: every audit-report row reached
-implemented, repaired, retained, or intentionally excluded, and every touched checkout's
-gate chain reads green under an independent verifier. What remains runs on the owner's
-word:
-
-1. **The campaign folder prune.** The retention procedure's checks run first and the
-   disposition goes to the owner; deletion happens only on the owner's explicit
-   go-ahead, and the prune commit carries the promotion record. Git history is the
-   archive.
-2. **Release.** Publishing is the user's decision and credential, in layer order through
-   the `orkestrel-publish` skill. The release carries the mcp bump for its moved
-   published surface, the scaffold bump for its moved vendored surface with every target
-   re-pinning and running `repair` after it, and the probe re-pin from the `file:`
-   tarball to the registry release.
+- **The combinator adoption** (`869b506`): `arrayOf`, `literalOf`, `optionalOf`, and
+  `unionOf` replace the hand-walked loops and literal chains in the diagnostic,
+  container, sync, and capability guards. Every guard keeps its function form, its
+  `isRecord` root, and its `holds` boundary, and the JSON-RPC message guards stay
+  hand-written whole for their forbidden-key logic. Added cases pin the accepted set:
+  sparse element arrays refused, literal member sets bounded, a prototype-carrying
+  instance refused at the root, unknown extra members still admitted.
+- **The seam fold and the single-sourced advertisement** (`05005da`):
+  `#releaseGeneration` folded into its one caller. `#cancelRequest` stays by ruling —
+  it composes the cancel notification, the send, and the failure-to-emitter policy,
+  symmetric with `#respondUnsupported`, and folding one of that pair would give the
+  class a second vocabulary for one concept. `LSP_CAPABILITIES` moves the advertised
+  capability record into constants, deeply frozen, so the initialize advertisement and
+  the position-encoding refusal derive from one source rather than each carrying its own
+  `utf-16` literal to drift from. `waitForDeadline` centralizes the repeated deadline
+  race; a runtime probe with a `setTimeout` negative control read the armed
+  `AbortSignal.timeout` holding nothing open, so the helper keeps its plain promise
+  shape.
+- **The codec decomposition** (`e5dfac7`): `parseLSPMessages` keeps the framing spine —
+  state chaining, the overlap window, the accumulation refusals, boundary bookkeeping,
+  and the remainder re-seed — and hands the rest to exported leaves in `helpers.ts`:
+  `joinLSPSegments` and `takeLSPTail` over the segment chain, `scanLSPBoundary` over a
+  flat buffer, and `readLSPHeader` and `readLSPBody` owning the header and payload
+  grammars with every refusal code, message string, and context preserved. The
+  duplicated segment-join walk became one implementation. Cyclomatic readings under the
+  retained probe on 2026-08-26: `parseLSPMessages` 19, down from 60, and `readLSPHeader`
+  27 alone, accepted by design and recorded. `parseLSPMessages` keeps its name and file
+  although it throws and returns a tuple, outside the `parse*` coercion form — renaming
+  the package's flagship codec entry is a public break, recorded rather than repaired.
+- **The audit round's accepted findings** (`823f2d6`): the framing guide states the
+  boundary precondition — `subarray(0, boundary)` is the header block and the body
+  starts at `boundary + 4` — and its fence composes `encodeLSPMessage`,
+  `scanLSPBoundary`, `readLSPHeader`, and `readLSPBody` over one framed buffer, with the
+  fence's values executed in the guides suite. The `messages` parameter on the readers
+  gains a documented empty-list default, `waitForDeadline`'s parameter is named
+  `timeout`, the diagnostic `code` member adopts
+  `optionalOf(unionOf(isNumber, isString))` with a binding refusal case, and the
+  `encoding` getter's protocol-default literal carries the comment separating it from
+  the advertisement.
 
 ## Next
 
-- **`LSPServer`.** The server half of the package, mirroring the client's contract
-  style: typed handlers over the same codec and transport seam. Designed after the
-  client surface settles and the first consumer's demands are known.
-- **The client's internal seams.** `#cancelRequest` has one caller and
-  `#releaseGeneration` forwards to a delegate; fold or justify each in the next client
-  change.
+Each row names what triggers it, and nothing here is scheduled. As of 2026-08-26 the
+package's only consumer, the probe package's lint stage, runs warm-resident over stdio
+with no measured transport bottleneck: its warm run measured 437-495 ms, and that time
+is linter work rather than framing.
+
+- **`SocketTransport`.** One `node:net` class whose `server` option group carries
+  `{ host, port }` or `{ path }`. A consumer that must attach to a language server it
+  does not spawn triggers it.
+- **A WebSocket transport.** The platform `WebSocket`, prepending the header bytes on
+  `message` and stripping them on `send`, so the client keeps the byte seam unchanged. A
+  browser consumer that must reach a server it cannot spawn triggers it.
+- **`LSPServer`.** The server half, mirroring the client's contract style: typed
+  handlers over the same codec and transport seam. A fleet package that must answer LSP
+  requests rather than send them triggers it, and that consumer's first requirement set
+  is the design brief.
 - **TypeScript 7 conformance.** Approved by the user on 2026-08-26 as a
   conformance-only reading — `@typescript/native-preview` measured against the suite,
-  never adopted at runtime — in a later session, after the package is enterprise-grade.
+  never adopted at runtime — in a later session.
+
+## Deliberately deferred
+
+- **Legacy protocol negotiation.** The client pins the protocol it implements; a
+  compatibility mode for older servers is excluded by ruling, not postponed.
+- **An IPC-channel transport.** Node's IPC channel is message-shaped and carries no
+  `Content-Length` header, and it reaches only a peer this package spawned — which the
+  stdio transport already serves. Excluded by ruling, not postponed.
+- **Further ecosystem dependencies.** `package.json` is byte-identical to `2c0eba8`
+  across this campaign, and each candidate carries its reason. `@orkestrel/abort` wraps
+  `AbortSignal.any`, which the client composes natively. `@orkestrel/timeout` is a
+  lifecycle timer entity where the need is a one-shot deadline that `waitForDeadline`
+  closes. `@orkestrel/websocket` is Node-only and text-frame, so the deferred browser
+  transport reaches for the platform `WebSocket` instead. `@orkestrel/sse` and
+  `@orkestrel/tool` have no surface here. `@orkestrel/pool` is a probe-side note.
 
 ## Fleet findings carried forward
 
@@ -133,6 +160,17 @@ them here because the campaign folder prunes and this file outlives the prune.
 - **scaffold** — the inert `.oxlintignore` under oxlint 1.80.0: the binary reads
   `.eslintignore`, and the rc `ignorePatterns` carries the exclusion instead. Wire
   `--ignore-path` or retire the file in a fleet alignment pass.
+- **scaffold** — the oxlint `complexity` rule as a vendored `.oxlintrc.json` decision:
+  the installed oxlint 1.80.0 supports the rule and no default category enables it. The
+  probe retained at `.orkestrel/lsp/complexity-probe-results.txt` read lsp clean at the
+  default maximum of 20 on 2026-08-26 after this campaign's decomposition, and mcp
+  carrying readings of 21 to 30. `lint:check` runs `--deny-warnings`, so enabling the
+  rule gates immediately and a fleet sweep comes first.
+- **process** — a supervised child exposes a line stream only: `ProcessInterface.lines`
+  yields decoded strings framed on line terminators, so a transport that frames its own
+  bytes cannot read a child through it and reaches for `node:child_process` directly, as
+  this package's stdio transport does. A raw byte-chunk stream on the same interface
+  would let those transports drop the direct spawn.
 - **fleet** — the guides-execution gap: in the packages that predate the executed-fence
   shape, the parity drop-in resolves names but executes no fence. The drop-in's header
   also carries a count and the word "below"; repair it upstream in the markdown
@@ -144,15 +182,9 @@ them here because the campaign folder prunes and this file outlives the prune.
   and the imperative TSDoc openers at `helpers.ts:434` and `:500`, per the h2.4 review.
 - **markdown** — the CommonMark `U+0000` replacement question.
 - **markdown and html** — the reused-identity engine divergence.
-- **html** — the spans-to-markdown inbound projection, and barrel membership of
-  `findOpenPosition` and `projectDepth`.
+- **html** — the spans-to-markdown inbound projection.
 - **probe** — the RuntimeStage frame-basis dependence on Vitest's un-remapped stacks: a
   Vitest change routing the stage's frames through its source-map remap flips the
   column basis. The guard chain refuses it loudly, and the campaign's
   `p2-settle-instrument.sh` re-produces the detecting measurement from git history
   after the prune.
-
-## Deliberately deferred
-
-- **Legacy protocol negotiation.** The client pins the protocol it implements; a
-  compatibility mode for older servers is excluded by ruling, not postponed.
```
