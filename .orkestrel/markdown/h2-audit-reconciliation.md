# H2 round audit — reconciliation and fix-round plan

Reconciled 2026-08-26 by the Orchestrator from the subjective lane
(`h2-audit-reviewer-verdict.md`, Claude Opus 5, native, read-only, PASS with findings) and the
objective lane (`h2-audit-analyst-verdict.md`, GPT-5.6 Sol, bench, journal
`tmp/codex/h2-audit-analyst.jsonl`, session `01a03d33-5eea-75d3-9b67-996097fb2001`, FAIL). Both
lanes ran blind on separate briefs against the same held tree, each covering the units the other's
engine wrote. The `checker` lane did not run: the round's acceptance criteria are behavioral rather
than mechanical, and both lanes read the diff directly.

**Round verdict: FAIL.** The round does not commit as it stands. Two correctness defects, one
false contract, and a documentation-parity gap carry into a fix round. The subjective lane's PASS
stands on the properties it enumerated; its own closing note says claim 5 was too narrow to catch
the TSDoc regression in its population, and the objective lane found what a wider claim reaches.

## The rulings

### R1 — The span contract prose is false, and the CODE is right. Fix the prose.

Both lanes converge: `MarkdownInterface.span` at `src/core/types.ts:478` states that a joined text
run reports no region, while `coalesceText` records `{left.start, right.end}` on the merged node
(`src/core/helpers.ts:620`), pinned by `tests/src/core/parsers.test.ts:775-786`. The design record
adopted the drop at `h2-design-reconciliation.md:26`; the `h2-u3-threading` brief re-ruled it at
`:50-51` and the code followed the brief. The guide states the corrected law narrowly
(`guides/markdown.md:278-279`, `:347-348`); the types file carries the superseded one.

**Ruling: the shipped behavior is the contract.** A span names the original region a node was
produced from, which can include syntax the node's value drops and characters normalization
removed. The prose that must change, from the objective lane's enumeration:

- `MarkdownSpan` (`types.ts:44`) — slicing a span returns the original source region, not the
  node's value. State the difference rather than implying they match.
- `MarkdownSegment` (`types.ts:64`) — the affine claim is false for compressed CRLF and
  trailing-space segments, which project their end boundary specially (`helpers.ts:232`). State
  the boundary rule the code implements.
- `MarkdownSource` (`types.ts:87`) — segments do not cover every derived position; a fabricated
  join produces uncovered separators (`helpers.test.ts:214`).
- `MarkdownParseResult` (`types.ts:397`) and `MarkdownInterface.span` (`types.ts:478`) — a
  parse-time coalesced run reports the enclosing region; only a rewrite output assembled from
  separate source nodes reports `undefined`.
- `MarkdownDerivation` (`types.ts:413`) — an absent entry does not mean retained identity alone;
  synthetic descendants are absent too, and `#derive` prefers the output identity's own span.
- The guide's universal sentences at `guides/markdown.md:269`, `:281`, `:316`, and `:347`, each
  falsified by the objective lane with its counterexample.

The parse-path over-claim the objective lane raised as claim 3 — the text span for `a \nb`
covering the discarded space — is **prose, not code**. The consumed region is what a span names;
the sentence claiming otherwise is what breaks. Carrier: `h2.2-prose`.

### R2 — The derivation chain can return another node's span. Fix the code.

The objective lane's counterexample is public and reproducible: parse `a\n\nb\n\nc`; map `A` and
`B` to a shared identity `S`; chain a map that replaces each `S` with `T` and replaces `C` with
`S`. `rewriteDocument` records `T → S` and `S → C` (`helpers.ts:3072`), and `#derive` follows
`T → S → C` and assigns `C`'s `{6,7}` span to `T` (`Markdown.ts:217`). The walk terminates; the
answer belongs to a different node.

**Ruling: a defect, and the round's most serious finding.** A handle that answers with another
node's region is wrong in the way a wrong return value is wrong — no prose fixes it. The
derivation map conflates an identity's role as an input hop with its separate role as an output
elsewhere in the same rewrite, and the resolution must not cross that boundary. The writer
designs the exact rule and proves it red-first with the objective lane's counterexample as the
failing case. Claim 6's lifecycle failure is the same defect reached through the handle and closes
with it. Carrier: `h2.1-derive`.

### R3 — `projectSpan` picks the wrong segment at a discontinuous abutment. Fix the code.

For a source whose segments are `{offset 0, start 0, end 1}` and `{offset 1, start 5, end 6}`,
`projectSpan(source, 1, 1)` returns `{1, 1}` because the first segment accepts `from <= limit` and
returns immediately (`helpers.ts:236`). The documented segment contract puts derived position `1`
in the second run, which projects to `{5, 5}`.

**Ruling: a defect.** A zero-width position at a segment boundary belongs to the later segment.
Fix the early return and pin the discontinuous case red-first. The subjective lane's claim 4 —
`sliceSource` boundary arithmetic — is CONFIRMED TRUE by the objective lane and needs no work.
Carrier: `h2.1-derive`.

### R4 — The guide's behavioral fences have no executed proof. Add one.

Both lanes raise it, the objective lane as MAJOR against H2-U6. `tests/guides.test.ts` is the
vendored `@orkestrel/guide` parity drop-in: it resolves names, examples, imports, and links, and
executes no value assertion (`tests/guides.test.ts:113`). The round added the package's largest
unexecuted behavioral surface, and
`.claude/rules/documentation.md` requires the executed assertion wherever a prose claim about
behavior sits under no fence.

**Ruling: transcribe the corrected fences into an executed proof in the round's own test files,
never by editing the vendored drop-in.** The transcription runs after the prose is corrected, so
it proves what ships rather than what the round drafted. Each row is named for the behavior it
proves. Carrier: `h2.3-fences`.

### R5 — The TSDoc regressions and the vocabulary drift. Fix them.

- The split scan leaves lost their documentation: `locateLink` and `locateEmphasis` kept the
  original description, `@example`, and `@param depth` degrade note, while the thinner `scanLink`
  (`helpers.ts:743-751`) and `scanEmphasis` (`:839-847`) ship without either, and
  `scanInlineSource` (`:906-916`) ships without an `@example`. Subjective lane, MINOR, owner
  H2-U3.
- The added public TSDoc on `MarkdownSpan`, `MarkdownSegment`, `MarkdownSource`,
  `MarkdownParseResult`, and `MarkdownDerivation` opens with noun phrases where
  `.claude/rules/typescript.md:74` requires a third-person verb. Objective lane, MINOR, owner
  H2-U1.

Carrier: `h2.2-prose` for the type openers, `h2.4-mechanical` for the scan-leaf TSDoc.

### R6 — The duplicated splitting rule and the boundary synonym. Fix them.

- `splitTableSources` (`helpers.ts:480-514`) re-implements the escaped-pipe rule `splitTableRow`
  (`:445-466`) already owns, and `splitTableRow` survives only for `delimiterToAlignments`
  (`:530`) and `validators.ts:196`. **Ruling: derive the string form from the source form** —
  `splitTableSources(...).map((cell) => cell.text)` — so one implementation owns the syntax rule.
- `limit` (`parsers.ts:38`) names an original-source end the round calls `end` everywhere else.
  **Ruling: rename it `end`** in `parseBlocks` and `collectList`, with the guide rows at
  `guides/markdown.md:64` and `:100` following.

Carrier: `h2.4-mechanical`.

### Dropped on the record

Nothing. Every finding either has a carrier or is CONFIRMED TRUE. The subjective lane's finding E
and the objective lane's MAJOR are the same finding and share the `h2.3-fences` carrier.

## The fix-round units, serial in the main checkout

| Unit | Role and engine | Owns | Auditor |
| --- | --- | --- | --- |
| `h2.1-derive` | `sol` — GPT-5.6 Sol (bridge) | `src/core/Markdown.ts`, `src/core/helpers.ts` scoped to `projectSpan`, `tests/src/core/Markdown.test.ts`, `tests/src/core/helpers.test.ts` scoped to the new rows | `reviewer` — Opus 5 |
| `h2.2-prose` | `implementer` — Claude Opus 5 (native) | `src/core/types.ts`, `guides/markdown.md` | `analyst` — Sol |
| `h2.3-fences` | `implementer` — Claude Opus 5 (native) | `tests/src/core/Markdown.test.ts`, `tests/src/core/parsers.test.ts` scoped to transcribed rows | `analyst` — Sol |
| `h2.4-mechanical` | `builder` — Sonnet (native) | `src/core/helpers.ts` scoped to `splitTableSources` and the scan-leaf TSDoc, `src/core/parsers.ts` scoped to the rename, `guides/markdown.md` rows for the renamed parameter | `checker` |
| `h2.5-gates` | `verifier` — Sonnet (native) | nothing | — |

`h2.1-derive` runs first because the prose must describe corrected behavior. `h2.3-fences` runs
after `h2.2-prose` for the same reason. Each unit's auditor is an engine that did not write it.

**Fix-round exit criterion.** The round commits when: the derivation chain answers only with the
subject node's own region or `undefined`, proven by the objective lane's counterexample as a
red-first row; `projectSpan` resolves a zero-width boundary to the later segment, proven
red-first; every span-contract sentence in `src/core/types.ts` and `guides/markdown.md` is true of
the shipped code; the guide's provenance fences carry executed value assertions; the scan-leaf
TSDoc and the type openers satisfy the TypeScript rule; one implementation owns the escaped-pipe
rule; the boundary parameter reads `end`; and the full gate chain runs green under an independent
`verifier`.
