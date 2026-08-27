# U7 report — the consolidated ROADMAP rows, 2026-08-27

Role: `implementer`, Opus 5, native. Baseline `bb1f148`, confirmed clean before editing
(`git status --porcelain` empty). One owned file touched.

## Touched files

- `C:\Users\mikes\WebstormProjects\lsp\ROADMAP.md` — the transport rename and `Session`
  adoption rows added to `## Delivered`, the pending release order added to the `## Next`
  intro, the process line-stream finding struck, and the scaffold, process, and lsp
  findings added to `## Fleet findings carried forward`.

Diffstat:

```text
 ROADMAP.md | 41 ++++++++++++++++++++++++++++++++++++-----
 1 file changed, 36 insertions(+), 5 deletions(-)
```

## Diff

```diff
diff --git a/ROADMAP.md b/ROADMAP.md
index 98baeff..3d7261c 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -110,6 +110,25 @@ folder prunes by naming that path in a `git show` against the commit.
   `optionalOf(unionOf(isNumber, isString))` with a binding refusal case, and the
   `encoding` getter's protocol-default literal carries the comment separating it from
   the advertisement.
+- **The transport rename** (`c9537f2`): the stdio family renamed to the client-half
+  convention — `StdioClientTransport`, `StdioClientTransportInterface`,
+  `StdioClientTransportOptions`, and `createStdioClientTransport` — mirroring the mcp
+  package's naming, with the deferred rows renamed to `SocketClientTransport` and
+  `WebSocketClientTransport`. The vendored `guides/probe.md` mirror deliberately keeps the
+  old factory name until the probe package adopts the rename at its re-pin; the moved
+  published surface obliges a version bump at the next release.
+- **The `Session` adoption** (`8307f2c`, `61d9a3a`, `3859532`, `bb1f148`, consuming the
+  process package's `Supervisor` extract `5fabc07`, `Session` face `b07ba7f`, and audit
+  fixes `5365c51`): the stdio client transport constructs one `Session` per generation
+  from `@orkestrel/process` and drops the `node:child_process` module entirely. The
+  `close` method ends stdin cooperatively under one shared `grace` window, races the
+  child's native ending, and escalates through the package's `stop` method. The
+  transport's unmodified suite proves the adoption — every behavioral row written against
+  the direct-spawn implementation passes against `Session` — and a two-lane audit with
+  executed attacks corroborates it. The process dependency is installed as a packed
+  tarball recorded in `.orkestrel/campaign/tarball-swap.md`, restored to the registry
+  release at publish. The POSIX half of the corrected process-group sentence is read from
+  the installed source, and a POSIX host run is the outstanding reading.

 ## Next

@@ -118,6 +137,12 @@ package's only consumer, the probe package's lint stage, runs warm-resident over
 with no measured transport bottleneck: its warm run measured 437-495 ms, and that time
 is linter work rather than framing.

+The pending release runs in layer order. The process package publishes its additive
+surface first. The lsp package then restores its process dependency from the recorded
+tarball to the registry release, re-runs its gates against the registry artifact, bumps
+for its moved surface, and republishes. The probe package then re-pins lsp, adopts
+`createStdioClientTransport`, and its republished guide refreshes the vendored mirror.
+
 - **`SocketClientTransport`.** One `node:net` class whose `server` option group carries
   `{ host, port }` or `{ path }`. A consumer that must attach to a language server it
   does not spawn triggers it.
@@ -168,11 +193,17 @@ them here because the campaign folder prunes and this file outlives the prune.
   default maximum of 20 on 2026-08-26 after this campaign's decomposition, and mcp
   carrying readings of 21 to 30. `lint:check` runs `--deny-warnings`, so enabling the
   rule gates immediately and a fleet sweep comes first.
-- **process** — a supervised child exposes a line stream only: `ProcessInterface.lines`
-  yields decoded strings framed on line terminators, so a transport that frames its own
-  bytes cannot read a child through it and reaches for `node:child_process` directly, as
-  this package's stdio transport does. A raw byte-chunk stream on the same interface
-  would let those transports drop the direct spawn.
+- **scaffold** — the `policy/no-nested-functions` instrument covers the `src` and `app`
+  directories while the architecture rule reaches tests: a real in-body function
+  assignment in a test passed every gate and was caught only by review. Widen the
+  instrument's population, or record the narrowing in the rule.
+- **process** — the stop confirmation window is the package's fixed
+  `PROCESS_CONFIRMATION` value rather than an option, so a consumer whose `grace` sits
+  under it cannot shorten the unconfirmed-kill wait. Surface it as an option, or document
+  the floor.
+- **lsp** — the transport's preserved guards, the `send` method's terminal-facts reading
+  and the retirement half of its generation gate, have no fixture that can redden them. A
+  fixture whose child hands stdin to a grandchild closes both.
 - **fleet** — the guides-execution gap: in the packages that predate the executed-fence
   shape, the parity drop-in resolves names but executes no fence. The drop-in's header
   also carries a count and the word "below"; repair it upstream in the markdown
```

## Validation, read-only and scoped to the owned file

- `npm run format:check` on 2026-08-27: `All matched files use the correct format.`
  over 154 files, `Finished in 1572ms`.
- `npm run test:guides` on 2026-08-27: `Test Files 1 passed (1)`, `Tests 27 passed (27)`,
  `Duration 517ms`.
- `git status --porcelain`: ` M ROADMAP.md` — the single owned file, nothing else.

No failing-first test applies: this unit is a documentation record with no behavioral
claim under test. `test:guides` executes the guide fences, and `ROADMAP.md` carries none.

## Vocabulary and style checks

- Banned-vocabulary sweep over the added lines only
  (`git diff -U0 -- ROADMAP.md | grep '^+' | grep -v '^+++'`, 36 lines), case-insensitive,
  pattern `should|simply|easy|easier|just|currently|now|new|latest|utilize|leverage|via|in
  order to|e.g.|i.e.|etc.|performant|robust|allows you to|and/or|since|once|please|sanity|
  dummy|above|below|ensure|guarantee|we|our|let's`: no hit.
- Dates written `YYYY-MM-DD`. Numerals appear only as commit identifiers.
- Line endings LF, trailing newline present, wrap width within the file's existing spread.

## Shared-file patches

None. No shared or off-limits file needed a change.

## Ancillary decisions, recorded under the deviation contract

- The brief's draft phrase "a two-lane audit" is kept verbatim because `ROADMAP.md`
  already fixes that term at the inspection-bound split row ("The chunk landed behind a
  two-lane audit"). Recasting it in one row alone would give the file a second vocabulary
  for one concept.
- The rename row names all four moved exports rather than the brief's shorthand "its
  interface, options": naming the members is what the no-count rule prescribes, and the
  names are the parity-checkable facts a reader needs.
- The adoption row names `.orkestrel/campaign/tarball-swap.md` as the campaign record,
  matching the intro's instruction to reach a pruned record through `git show`, and
  matching the existing row that cites `.orkestrel/lsp/l6-design-reconciliation.md`. That
  path is tracked at `bb1f148`.
- The new scaffold finding sits after the existing scaffold rows, and the new lsp finding
  after the new process finding, so each owner's rows stay contiguous.

## Commit-message draft

```text
Record the rename, the Session adoption, and the release order in the ROADMAP

The Delivered section gains two rows. The transport rename (c9537f2) names the
client-half family - StdioClientTransport, its interface, its options, and
createStdioClientTransport - the renamed deferred rows, the vendored
guides/probe.md mirror that deliberately keeps the old factory name until probe
re-pins, and the version bump the moved surface obliges. The Session adoption
(8307f2c, 61d9a3a, 3859532, bb1f148, consuming the process package's Supervisor
extract 5fabc07, the Session face b07ba7f, and the audit fixes 5365c51) records
one Session per generation, node:child_process dropped, close ending stdin
under one shared grace window against the child's native ending with escalation
through stop, the unmodified transport suite as the proof, the packed tarball
and its restoration, and the outstanding POSIX reading.

The Next intro records the pending release order: process publishes its
additive surface, lsp restores the registry release and republishes for its
moved surface, probe re-pins and adopts createStdioClientTransport, and its
republished guide refreshes the vendored mirror.

Fleet findings: the process line-stream row is struck, shipped by the Session
face at b07ba7f carrying the raw byte stream, the exact-byte write, and the
cooperative end. Three findings are added against their owners - scaffold's
policy/no-nested-functions instrument covering src and app while the rule
reaches tests, process's fixed PROCESS_CONFIRMATION window that a consumer's
grace cannot shorten, and lsp's preserved transport guards that no fixture can
redden.

Scoped gates on 2026-08-27: format:check clean over 154 files, test:guides
27 passed.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

## Deviation state

No deviation. Every edit the brief named landed, no other line changed, and no fact the
brief carried disagreed with the campaign records or the tree.
