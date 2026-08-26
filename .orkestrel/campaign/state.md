# Campaign state — pickup record, refreshed 2026-08-26 (resumed session)

The resumed session's bench liveness, engine configuration, container facts, routing ledger, and
rulings are in `routing-2026-08-26-resume.md` beside this file. Both benches probed live on
bounded round-tripped calls; the container came up with no installed dependencies, so `npm ci`
runs per checkout before any gate.

Read this beside `plan.md` (the ruled plan and routing) and `audit.md` (the original ten-repo
audit report). This file is the session-boundary snapshot: what is accepted, what is in flight,
what each working tree holds, and what only the user can decide. Re-derive anything live — tree
state, gate results, bench liveness — rather than trusting this snapshot as current. The
`ROADMAP.md` file in this repository carries the product-facing overview of the lsp package, the
campaign's main subject.

## Mid-round checkpoints, and how to read one

A round normally commits as ONE commit behind one green gate chain. A container reclaim
destroys an uncommitted working tree, so a session boundary overrides that: the work commits as
a **checkpoint** whose message says so, names every red row and the exact reason, and names the
queued unit that closes it. A checkpoint is not an acceptance. The round's audit still runs, its
fix units still run, and its acceptance is a later commit.

Read a checkpoint's message before judging the tree it left. A red row a checkpoint names is a
known open unit, not a regression to diagnose.

## Where every repository sits

| Repository | Branch | Head | Standing |
|---|---|---|---|
| `orkestrel/lsp` | `main` | `3b8f019` and later | The campaign's subject and its record. L2 through L6 accepted; the campaign archive lives here under `.orkestrel/`. |
| `orkestrel/probe` | `claude/lsp-spec-audit-est33d` | `42e0b1e` | **ACCEPTED and pushed.** The P round — the lsp adoption, the L6-E inspection-bound rewire, and the P1.1 gauge restore — committed as one behind a green chain. |
| `orkestrel/html` | `claude/lsp-spec-audit-est33d` | `a533947` | Accepted and pushed. Span provenance on the parse surface. |
| `orkestrel/workflow` | `claude/lsp-spec-audit-est33d` | `c01e1a5` | Accepted and pushed. Progress reshaped to the mcp pattern with `unit` removed. |
| `orkestrel/scaffold` | `claude/lsp-spec-audit-est33d` | `c51d7ce` | Accepted and pushed. The vendored lint exclusion for the campaign archive and the bench write-root rule in the host inventory's orchestration contract, with the inventory digests regenerated. A release bump is registered for that moved vendored surface; every target re-pins and runs `repair` after it publishes. |
| `orkestrel/mcp` | `claude/lsp-spec-audit-est33d` | `bc54b38` | **CHECKPOINTED, mid-round.** The era sweep, the contract surface, the conformance mirror, and the `m4-mirror.1` closure (the formatter exclusion and the metadata row correction, host-accepted with conformance `42 passed (42)`) are committed and pushed. The guides parity red row stands by design for `m4-guide`. `m4-stream` is next on the Sol bench. See the M4 section. |
| `orkestrel/markdown` | `claude/lsp-spec-audit-est33d` | `d310eea` | **Mid-round, fix round running.** `h2.1-derive` accepted; `h2.2-prose` returned with its owned edits and one integrated shared-file patch (`src/core/Markdown.ts` `@returns`), tree held uncommitted for the Sol `analyst` audit. `h2.3` and `h2.4` follow. See the H2 section. |
| `queue`, `tool`, `process`, `middleware` | `claude/lsp-spec-audit-est33d` | G1 commits | **G1 ACCEPTED.** Each guide records why its package stays untouched by the progress work, landed by parallel `builder` units, ruled PASS on every claim by the `checker` (`campaign/g1-check-verdict.md`), committed and pushed. |

## Wave status

| Wave | Subject | Standing |
|---|---|---|
| W — workflow | Progress adopted in the mcp shape, `unit` removed | Accepted and pushed |
| L — lsp | The package: contract, codec, client, transport, conformance, the open-bound split | L2 through L5 accepted through `c1f5cea`; L6 landed as one commit `231eb37` behind its audit round, the L6.1 fix, a PASS re-check, and a green chain (conformance 243). The package is green on `main`. |
| P — probe | Adopts `@orkestrel/lsp` | **Closed.** P1 adoption, the L6-E rewire, and P1.1 all committed at `42e0b1e` after the Sol re-check returned PASS on every claim with no findings. P2 (`Issue` range) is the next unit; P3 (`@typescript/native-preview`) stays deferred pending the user's install approval. |
| H — html and markdown | Provenance | html accepted through `a533947`. markdown's H2 round is written but its audit FAILED; a four-unit fix round is ruled and running. |
| M — mcp | Era 2026-07-28 native, repairs, subscriptions, the tasks family | M3 accepted through `b50520a`. M4 is mid-implementation. M5 (deprecated surface) and M6 (naming cascade, needs the user's blessing) follow. |

## M4 — the mcp tasks wave, held and mid-implementation

The design round is reconciled in `mcp/m4-design-reconciliation.md`, from the lane rulings
`m4-design-planner-ruling.md` (Opus, subjective) and `m4-design-analyst-ruling.md` (Sol,
objective). The rulings that matter for a resumed session:

- **The transition path is admission, not production.** `MCPTaskManagerInterface` does not
  change. The consumer's `subscription.listen` producer is the transition source; the server's
  work is a matcher branch keyed on `params.taskId` plus the `taskIds` filter member. The
  analyst's required manager emitter was rejected on the foreign-contract asymmetry.
- **The acknowledgement authorizes and omits.** The server resolves each requested identifier
  through `MCPTaskManagerInterface.task(id, options)` before acknowledging, and omits an
  unresolved one with no distinguishing signal. A malformed array rejects with `-32602`. The
  agreed set is fixed for the subscription's lifetime; no store read happens at delivery time.
- **Four authority-drift repairs** ride in the contract unit: integer `ttlMs` and
  `pollIntervalMs`, the open completed `result`, the exactly-empty extension capability, and a
  get result distinct from the manager snapshot.

Unit progress, serial:

| Unit | Standing |
|---|---|
| `m4-era` | **Landed** in the tree. Prose only — every draft-era claim replaced with the stable `2026-07-28` snapshot fact across source and tests. Gates green at the time it ran. Record: `mcp/m4-era-brief.md`, `-report.md`, `-diff.txt`, `-status.txt`. |
| `m4-contract` | **Landed** in the tree with a scoped deviation. The whole surface and all four drift repairs are in, each red-first. Three rows in files the brief made off-limits became false; the unit returned exact patches rather than editing them. Record: `mcp/m4-contract-brief.md`, `-report.md`, `-diff.txt`, `-status.txt`. |
| `m4-contract.1` | **Landed.** A `builder` unit applied those three patches verbatim; `check` and `test:src:core` returned to exit 0 with `772 passed`. Record: `mcp/m4-contract.1-brief.md`, `-report.md`. |
| `m4-mirror` | **Checkpointed at `2b823f9` with a deviation.** The mirror is vendored byte-identical with the digest pinned, the row arrays and drift helper landed, and the outside-membership control ran red and was removed. The unit stopped on its contract: the published scaffold 0.0.53 `prettierignore` lacks the `tests/mirrors/` exclusion, and one row (`TaskStatusNotificationParams metadata`) disagrees with the schema's `$defs` nesting. Record: `mcp/m4-mirror-brief.md`, `-deviation.md`, `-conformance-red.txt`. |
| `m4-mirror.1` | **Landed at `bc54b38`.** The successor (Sol bench, session `01a03ddc-8d82-7592-82ac-06cb6c56562f`) appended the inventory-identical ignore block and corrected the metadata row against the schema's actual fragment; the schema authority did not drift. The bench sandbox denied the conformance fixture's listener, so the Orchestrator took the acceptance on the host: `format:check` exit 0, the pinned digest unchanged, conformance `42 passed (42)` exit 0. Record: `mcp/m4-mirror.1-brief.md`, `-report.md`. The round audit still runs after `m4-gates`. |
| `m4-stream` | Next, Sol bench. The matcher branch, the guarded admission, the `tasks: boolean` parameter, the derived support fact, the authorize-and-omit acknowledgement. |
| `m4-proof` | Queued, Opus native. A real fixture producer through `subscription.listen` reaching a real client stream, plus the question-2 invariants. |
| `m4-guide` | Queued, Opus native. `guides/mcp.md` — the era sweep's guide half, the entitlement ruling, the delivery guarantee, the composing-envelope conformance gap. |
| `m4-gates` | Queued, `verifier`. |

The audit routing for the round: `reviewer` (Opus) over the Sol-written `m4-mirror` and
`m4-stream`, `analyst` (Sol) over the Opus-written units, `checker` over mirror membership and
era-sweep completeness.

**The checkpoint's one red row.** `npm run test:guides` reports `documents every barrel export`
failing with the six symbols `m4-contract` added: the types `MCPNotificationMetaObject`,
`MCPTaskDetailResult`, and `MCPTaskNotificationParams`, and the guards
`isMCPNotificationMetaObject`, `isMCPTaskDetailResult`, and `isMCPTaskNotification`. The
`m4-guide` unit documents them. Every other project is green: `src` reports `1143 passed`
with one skipped, and `policy`, `config`, and `setup` all pass. `format:check`, `lint:check`,
`check`, and `build` all exit 0.

**The composing envelope stays undefined in every available source** (`mcp/m4-envelope-probe.md`
records the search bound). The package documents `params.notifications.taskIds` as its reading
and names it a conformance gap, never as settled wire.

## H2 — the markdown provenance round, held and failing its audit

Every writing unit landed uncommitted: U1 (types), U2 (coordinate engine), U3 (span threading),
U3.1 (assert-helper widening), U4 (rewrite engine), U5 (the handle), U6 (the guide). The round
audit then ran both lanes. The subjective lane returned PASS with findings
(`markdown/h2-audit-reviewer-verdict.md`); the objective lane returned FAIL
(`markdown/h2-audit-analyst-verdict.md`).

**Round verdict: FAIL.** The reconciliation and the fix-round plan are in
`markdown/h2-audit-reconciliation.md`, which is the authoritative document for a resumed
session. Its rulings in brief:

- **R1** — the span-contract prose in `src/core/types.ts` and the guide's universal sentences are
  false; the shipped behavior is the contract. A span names the original region a node was
  produced from, which can include syntax the value drops and characters normalization removed.
- **R2** — `Markdown.#derive` can answer with another node's region through a chained rewrite
  (`T → S → C`). A real correctness defect.
- **R3** — `projectSpan` resolves a zero-width position on a segment boundary to the earlier
  segment; the contract puts it in the later one.
- **R4** — the guide's provenance fences carry no executed proof; transcribe them into the
  round's own test files, never into the vendored parity drop-in.
- **R5** — TSDoc regressions on the split scan leaves, and noun-phrase openers on the added
  public types.
- **R6** — `splitTableSources` duplicates the escaped-pipe rule, and `limit` is a synonym for
  `end`.

| Unit | Role and engine | Standing |
|---|---|---|
| `h2.1-derive` | `sol` — Sol bench | **ACCEPTED.** The Opus `reviewer` audit returned `PASS — 6 of 6 confirmed` on Orchestrator-produced evidence (isolated diff, green rows, revert-proof controls reddening exactly the named rows, `src:core` `592 passed`). Records: `markdown/h2.1-audit-brief.md`, `-evidence.md`, `-instrument.sh`, `h2.1-derive-diff.txt`, `h2.1-audit-reviewer-verdict.md`, `h2.1-audit-verdict.md`. The verdict's referral is landed as Amendment 2026-08-26 in `h2-audit-reconciliation.md`: the exit criterion's derivation clause now names the direct-input rule. |
| `h2.2-prose` | `implementer` — Opus native | **Audited FAIL, reconciled.** The Sol `analyst` audit (session `01a03ded-7d86-7d52-93f1-e5657714feb7`) confirmed the claim-5 overturn, the openers, the integrated hunk, and the writing sweep, and broke the cascade bullet, the derivation qualifier, and the guide's coverage sentence — the last upgraded from derivation to measurement by the Orchestrator's bridge probe (`projectSpan 0..3` bridges an uncovered interior; a boundary in the uncovered position reports `undefined`). The report-versus-held-tree gap is the Orchestrator's integration step, closed by `markdown/h2.2-integration-evidence.txt`. Records: `markdown/h2.2-audit-brief.md`, `-analyst-verdict.md`, `h2.2-audit-verdict.md`. |
| `h2.2.1-prose` | `implementer` — Opus native | **In flight** as the sole markdown writer. Carries every broken finding: the cascade bullet (last run at the offset, zero-extent runs skipped), the own-region qualifier on the derivation branch, the boundary rule for the coverage sentence with its `MarkdownSource` alignment, and the `Markdown` class TSDoc rewrite (carrier moved here from `h2.3-fences`). Brief: `markdown/h2.2.1-prose-brief.md`. Its audit rides as added claims in the `h2.3-fences` Sol `analyst` round. |
| `h2.3-fences` | `implementer` — Opus native | Queued, after `h2.2.1-prose`. R4. Auditor: Sol `analyst`, whose round also audits the `h2.2.1-prose` corrections. |
| `h2.4-mechanical` | `builder` — Sonnet | Queued. R6 and the scan-leaf TSDoc from R5. Auditor: `checker`. |
| `h2.5-gates` | `verifier` | Queued. |

## Bench and lane discipline

One Sol lane at a time through `codex exec` script files written in the session scratchpad,
journals under `tmp/codex/` in THIS repository, one Monitor per exec filtered to milestones and
exiting on the terminal event. **A bench design lane always gets a lane-assignment cover
prepended to the shared brief** — a raw shared brief makes Sol simulate both lanes and reconcile
itself. **A bench unit writes only under its own `--cd` root and the system temporary
directory**, so a report path in this repository is rejected after the work is done; name the
report inside the unit's own tree or take it from the `--output-last-message` file, and let the
Orchestrator copy it into `.orkestrel/<package>/`. That rule is landed in the scaffold host
inventory's `.agents/orchestration.md`, the vendored source every repository receives.

Native Opus and Sonnet lanes dispatch through the Agent tool. Writers serialize per checkout;
parallel writers run only across disjoint checkouts, which is how the mcp and markdown fix units
ran beside each other.

## Only the user can decide

- **The M6 naming blessing**: the mcp rename cascade, `SUPPORTED_CLIENT_PROTOCOL_VERSIONS` and
  the adapter family name included.
- **The P3 `@typescript/native-preview` install.**
- **Publishing, at campaign end**: the user's decision and credential, run through the
  `orkestrel-publish` skill in layer order. The probe package re-pins its `file:` tarball range
  to the registry release then, and `scaffold` carries a registered bump for its vendored
  `.oxlintrc.json` and `.prettierignore` changes.

## Registered capabilities, carried not scheduled

The inert `.oxlintignore` under oxlint 1.80.0 (it reads `.eslintignore`; the rc `ignorePatterns`
carries the exclusion instead — wire `--ignore-path` or retire the file in a fleet alignment
pass); `#cancelRequest` single-caller and `#releaseGeneration` delegate (lsp client, next
change); the fleet-wide guides-execution gap (a parity drop-in that resolves names but executes
no fence); the html and markdown reused-identity engine divergence; the lsp guides-parity
project; the lsp vocabulary pass (the `isInstalledDiagnostic` annotation, the inlined `30_000`
default); `LSPServer`; transport-ingress backpressure (mcp); the html-spans-to-markdown inbound
projection; the CommonMark `U+0000` replacement question; barrel membership of
`findOpenPosition` and `projectDepth` (html); the mcp `below`/`above` file-wide sweep; the
pre-publish observation list in `plan.md`.

## Where everything lives

The campaign record lives in the lsp repository under `.orkestrel/`, one folder per package —
`lsp/`, `mcp/`, `markdown/`, `html/`, `probe/`, `workflow/` — with the cross-package record (the
plan, the original audit, this state file, the opening design round, the fleet sweeps, the
shared research, and the H-wave terrain) under `.orkestrel/campaign/`. Each package folder holds
its units' briefs, reports, audit verdicts, settling receipts, instruments, and acceptance
records, one file set per unit, named `<unit>-<noun>.md`. Retention lands new artifacts here
directly.

Live bench journals and launch briefs sit in `tmp/codex/` in THIS repository and are swept at
each round's acceptance; native unit briefs and reports sit in `tmp/units/` and are retained
into `.orkestrel/<package>/` as they return. Launch and gate scripts live in the session
scratchpad, with the executed copies retained beside their units at acceptance.

This repository works on `main`. Every other campaign repository works on the
`claude/lsp-spec-audit-est33d` branch.
