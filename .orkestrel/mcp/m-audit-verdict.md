# Audit verdict — mcp modern revision boundary (M1 + M1.1)

Round run 2026-08-25 on subject `83473da..f859ecc` in `/home/user/mcp`, brief
`.orkestrel/campaign/m-audit-brief.md`. Lanes that ran, blind on the identical brief:

- Subjective: `reviewer`, Opus 5, native. Verdict `FAIL` (immutable, retained in this file's
  sibling record `m-audit-reviewer-verdict.md`). Told its engine wrote M1.1; it broke M1's half
  hardest.
- Objective: `analyst`, GPT-5.6 Sol, `codex exec` read-only, journal
  `tmp/codex/m-audit-analyst.jsonl`, session `01a03a9e-e958-7982-9b89-a80bc8a2ec89`. Verdict
  `FAIL` (immutable, retained as `m-audit-analyst-verdict.md`). Told its engine wrote M1; it
  attacked through the consumer registry and the handler path.
- `checker`: not run — the mechanical criteria (gate exit codes, tree state) were carried by the
  independent `verifier`, which reported the full chain green on `f859ecc` before the round opened.

The Orchestrator reproduced every load-bearing finding against source before ruling; the
reproduction commands and excerpts are in the session record, and the decisive reads are cited
per claim.

## Reconciled rulings

1. **Bare modern boundary — SPLIT.** Package-owned surface `CONFIRMED` (both enumerations agree:
   no `ping`, no `initialize`, modern-only disclosure). The analyst's break — a consumer
   registering its own `server/discover` through `methods.add` — is refuted as a defect on the
   documented-behavior ground: the registry is deliberate consumer capability, proven at
   `tests/src/core/MCPServer.test.ts:2286`. The claim's universal wording carried two subjects;
   the successor scope is package-owned registrations. Analyst right on the letter, reviewer right
   on the substance. No fix carrier.
2. **`-32022` refusal — SPLIT.** Substance `CONFIRMED`: strict `===` over a frozen modern set with
   no normalization gap means whitespace, prefix, and similar-date stamps cannot reach a handler
   (`src/core/validators.ts:1236`), and the wire result is `-32022` with modern-only `supported`,
   echoed `requested`, HTTP 400. The "before dispatch" clause is false as worded: the modern-door
   refusal is produced inside `dispatch` and mapped after. The analyst's proposed pre-dispatch
   handler guard is refused: it would give the era rule a second home outside the core gate,
   which is the drift the design centralizes against. Carrier for the hardening only: hostile
   stamp variants join the integration loop (M1.2 item 5a).
3. **`ping` containment — SPLIT**, same shape as ruling 1. Package-owned containment `CONFIRMED`;
   the registry vector is documented capability. No fix carrier.
4. **Legacy pinning — `CONFIRMED`** by both lanes with independent attacks. The reviewer's
   coverage gap — no end-to-end row minting `2025-06-18` and then passing its own header — is a
   carried pin (M1.2 item 5b).
5. **Client modern-only — SPLIT.** Discovery, retry filtering, and stamping `CONFIRMED`
   modern-only by both. The unpinned legacy fallback when a peer refuses `server/discover`
   (`src/core/MCPClient.ts:703`) is one door both lanes found and both traced to documented,
   deliberate behavior, unreachable against a bare `MCPServer`. Retained as designed; the claim
   was over-worded. Whether automatic legacy fallback ought to become explicit opt-in is a product
   ruling for the user, recorded in the wave report — not an auditor's finding to act on.
6. **No assertion weakened — `BROKEN` (split by population; both lanes right about different
   objects).** The analyst confirmed over the M1.1 hunks; the reviewer broke it over M1's own test
   edits. Reproduced: the `oversized-message` row now asserts a bypass — `MCPLegacy.handle` parses
   before any bound and its local arms honour no `limit.message` while the `limit` getter
   advertises one (`src/core/MCPLegacy.ts:89,118,86`); the `changedVersion` row's binding is
   shadowed by the era gate, so its name claims coverage the row lost. Carriers: M1.2 items 2 and
   5c. Credit: the M1.1 substitutions strengthened assertions throughout; no test was removed;
   the skips predate the chain.
7. **The guide is true — `BROKEN`** on four sentences, each reproduced: `guides/mcp.md:1542`
   (says `ping` runs through the wrapped dispatcher; `MCPLegacy` answers it locally), `:1602`
   (says `MCPServer` carries no `MCPLegacy` spelling; `src/core/MCPServer.ts:143` carries
   `createMCPLegacy`, invisible to the parity guard's `\b` pattern), `:1607-1609` (the
   legacy-survivor list names consumers that do not exist — `inferEra` has none — and
   misattributes `isInitializeRequest`), `:2660` (an unfalsifiable approximation replaced an
   exact transcription). Carrier: M1.2 item 4, with the `inferEra` ruling in item 3.
8. **Scope honesty — `BROKEN`.** The `package-lock.json` hunk rides in `2c0131b` — the
   Orchestrator's checkpoint commit, not either writer's tree: the host install refreshed
   resolved `@orkestrel/*` versions after M1 returned, and the checkpoint swept the hunk in
   unrecorded. Both writer reports are truthful for their own trees. The deviation is the
   Orchestrator's; the hunk is retained (it reflects the installed truth `package.json` already
   pinned, and rewriting a pushed branch is not warranted) and this record is its account. The
   correction adopted: a checkpoint commit stages the unit's owned files by name, never the whole
   tree. The reviewer's deeper finding — `SUPPORTED_PROTOCOL_VERSIONS` keeps an unqualified name
   while its meaning narrowed to the modern set beside two era-qualified siblings — is carried to
   the M6 naming cascade as a required rename decision (carrier: the M6 brief).
9. **Sound-and-unchanged rulings — `BROKEN`, and this is the round's principal defect.**
   Reproduced at `src/server/handlers.ts:113-125`: the legacy door admits with `isMCPVersion`
   (the full client set, so a legacy-shaped request bearing a modern header is admitted onto the
   legacy path) and refuses unsupported headers with `supported: SUPPORTED_PROTOCOL_VERSIONS` —
   after M1, the modern-only set — telling a legacy client to retry with a revision a legacy
   request cannot stamp, omitting the revisions the decorated server accepts. M1.1 then rewrote
   `tests/src/server/handlers.test.ts:315` and `tests/src/server/factories.test.ts:305` to expect
   the modern set, repairing the suite toward the source instead of the source toward the
   contract. Carrier: M1.2 item 1, red-first. The WebSocket ruling held under both lanes' attacks.

Findings outside the claims, both substantiated and retained: **F1** — the era split has a third,
hard-coded representation in `src/core/inferers.ts:14-22` that no test compares against the
constant sets (carrier: M1.2 item 3, derive `inferEra` from the two era guards); **F2** —
`MCPLegacy`'s TSDoc claims it owns no execution engine while it answers `ping` locally (carrier:
M1.2 item 2). The analyst's referral R1 (unbounded `JSON.parse` at the decorator door before any
bound) folds into item 2; R3 folds into item 5a; R4 is settled (the hunk is in `2c0131b`).

Dropped, on the record: the analyst's pre-dispatch handler guard for hostile modern stamps
(duplicate era home; the observable contract already holds); the claim-1/3/5 breaks as code
defects (documented consumer capability and documented client fallback — the claims, not the
code, were over-broad).

## Terminal ruling

`FAIL` — the round found real defects and the fix unit M1.2 carries every retained finding.
Because M1.2 adopts the auditors' prescriptions with red-first pins, it closes through the
mutation-probe path the quality rules allow for verbatim-adopted fixes, followed by the
independent `verifier` re-running the authoritative chain; a departure from any prescription
reopens the cross-engine round instead. Wave M's boundary slice is accepted only when M1.2's pins
are green, the verifier chain is green, and this verdict's carriers are all closed.
