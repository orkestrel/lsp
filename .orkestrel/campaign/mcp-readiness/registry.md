# Campaign registry — MCP readiness (mcp, probe, lsp)

Started 2026-08-27. Invoked skill: `mcp-builder` (session skill), alongside the orkestrel
orchestration contract. Subject packages: `@orkestrel/mcp` (server and client library),
`@orkestrel/probe` (MCP application), `@orkestrel/lsp` (probe's language-intelligence
dependency). Campaign artifacts live in this folder; the parent folder's root files belong to the
accepted byte-stream campaign and stay untouched pending the owner's prune.

## Exit criterion

Enumerated at the design round's close (placeholder until the adversarial pass reconciles):
an audited, gate-green `@orkestrel/mcp` whose protocol behavior matches the current MCP
specification revision at MUST level with evidence; an audited `@orkestrel/probe` that registers
and serves its tool per the same specification; the lsp-in-probe integration proven against a
real workspace; and every deliberate exclusion recorded with its reason.

## Standing user directives

- Grok substitutes for Sol in objective lanes; weight the Opus lane higher; verify Grok claims
  against source; the Orchestrator decides and chooses what to surface.
- Codex is installed and logged in but user-excluded; never route to it.
- Publishing is the user's decision and credential.

## Bench liveness

- Cursor Grok: LIVE 2026-08-27 — bounded round-trip returned `READY` through the versioned entry
  `2026.08.25-3e8eec8` (journal `tmp/cursor/liveness.log` in the lsp repository). A newer
  pending-update zip sits in the versions directory; entry resolution now filters to directories.

## Routing ledger

| Unit | Subject | Role | Engine | Journal or record |
| ---- | ------- | ---- | ------ | ----------------- |
| G1 | mcp package absorption | `grok` | Cursor Grok (bench) | RETURNED — `g1-report.md`; containment clean |
| R1 | MCP spec and SDK research | `researcher` | Sonnet (native) | RETURNED — `r1-report.md`; substitution: bench single-lane, G1 held it; headline revision claim Orchestrator-verified against the changelog |
| O1 | ecosystem reconciliation | `orkestrel` | Sonnet (native) | RETURNED — `o1-report.md`; native by contract (catalog-carrying role) |
| G2 | probe package absorption | `grok` | Cursor Grok (bench) | RUNNING — `probe/tmp/cursor/g2-probe.log` |
| — | spec pattern pages (subscriptions, MRTR) | Orchestrator probe | — | `spec-patterns.md`, fetched first-hand |
| G2 | probe package absorption | `grok` | Cursor Grok (bench) | RETURNED — `g2-report.md`; containment clean |
| D1-subj | campaign design, subjective lane | `planner` | Opus 5 (native) | RETURNED — `d1-subjective-report.md` |
| D1-obj | campaign design, objective lane | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `d1-objective-report.md`; containment clean |
| — | live conformance assertion check | Orchestrator probe | — | conformance project green, 42 tests, 2.5 s |
| — | oxlint `--lsp` initialize timing | Orchestrator probe | — | 155 ms on the lsp workspace; no `diagnosticProvider` advertised |
| — | spec pages (streamable-http, tools) + conformance listing | Orchestrator probe | — | first-hand; settled the lane split on headers and `x-mcp-header` |
| — | reconciled plan | Orchestrator | — | `plan.md` |
| M0 | widen server conformance baseline | `builder` | Sonnet (native) | RETURNED — `m0-report.md`; committed mcp `23e8a02`; baseline `74 passed, 21 failed` |
| P1 | probe `prove` structuredContent | `implementer` | Opus 5 (native) | RETURNED — `p1-report.md`; committed probe `019c18a`; routed finding: mcp `MCPLimitOptions.keys` doc-versus-enforcement drift |
| P2 | probe default bounds to constants | `builder` | Sonnet (native) | RETURNED — `p2-report.md`; committed probe `89f7bd7` |
| — | tarball swap: lsp pack + probe install with process override | Orchestrator | — | `tarball-swap-probe.md`; user directive "don't wait for publishing" |
| P3 | probe adopts the renamed lsp surface | `implementer` | Opus 5 (native) | RETURNED — `p3-report.md`; committed probe `63a9d9b` with the swap state; real-oxlint proof green through the renamed transport |
| A-P-obj | falsification audit of P1+P2, objective lane | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `ap-objective-verdict.md`; FAIL 1 broken, 6 unresolved; bench ask mode refused execution tools (process note: supply Orchestrator-produced run records to non-executing behavioural lanes) |
| A-P-subj | falsification audit of P1+P2, subjective lane | `reviewer` | Opus 5 (native) | RETURNED — `ap-subjective-verdict.md`; FAIL 4 broken, 2 findings; sharp findings Orchestrator-reproduced |
| — | A-P reconciliation | Orchestrator | — | `ap-reconciliation.md`; fix round P4 briefed |
| P4 | probe fix round (graduated fallback, guide truth, F1, F2, P2 residue) | `implementer` | Opus 5 (native) | RETURNED — `p4-report.md`; committed probe `d6e5750`; third-arm proof by amplification, failing-first against the predicted `-32603`; one honest partial (bound rows reframed, missing-seam hypothesis recorded) |
| MC | client-conformance harness | — | — | RETURNED — `mc-report.md`; committed mcp `ab5cd27`; client baseline recorded; new finding `MCPCallOptions.input.state` required; M1 client half structurally SKIPPED (no resources/prompts client methods); publish gate reordered build-before-check on measured stale-dist failure (carried fleet finding: the canon chain assumes a dist-independent `check`) |
| MF2 | mcp fix round (A-M accepted findings + stateless retry) | `implementer` | Opus 5 (native) | RETURNED — `mf2-report.md`; committed mcp `6b21881`; sep-2322 row `5 passed, 0 failed` red-then-green; two-door question probe-resolved (both arms unreachable behind the ingress `-32602`); server seal-always pairing pinned |
| A-MF2 | cross-engine check of the MF2 design departures | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `amf2-verdict.md`; FAIL 1 broken (one guide sentence: wrong `server-stateless` cause), everything else CONFIRMED with named attacks; the sentence fix rides as serial integration after M4 releases the guide. **The A-M round closes on that integration** |
| M4 | name the stdio ingress contract | `implementer` | Opus 5 (native) | RETURNED — `m4-report.md`; committed mcp `1943d81`; TSDoc claims runtime-probed before writing; probe promotes into `factories.test.ts` at the M5 sweep (carried) |
| — | A-MF2 sentence fix, serial integration | Orchestrator | — | committed mcp `6689d4a`; guides 149 green. **The A-M round is closed** |
| M1 | standard headers: `Mcp-Name` scope, sentinel codec, modern refusal codes | `implementer` | Opus 5 (native) | RETURNED — `m1-report.md`; committed mcp `8667803`; `server-stateless` 28/0 red-then-green, total `104 passed, 6 failed`; mid-unit correction acknowledged and applied (`encodeSentinel`/`decodeSentinel`, `isStandardBase64` routing, no-reuse ruling recorded); `-32022`→`-32602` ruling ratified by the Orchestrator; carried finding: SEP-2663 tasks-namespace `Mcp-Name` |
| M3 | WebSocket closed-send rejects | `implementer` | Opus 5 (native) | RETURNED — `m3-report.md`; committed mcp `bf21ac9` with the serially integrated A3 patch (browser 61 passed); plain-`Error` ruling ratified (package taxonomy); carried finding: dead-peer liveness needs an RFC 6455 ping/pong deadline |
| M2 | `x-mcp-header` full contract | `implementer` | Opus 5 (native) | RUNNING — brief `m2-brief.md` with the A-M1 amendment first; mcp main at `bf21ac9` |
| A-M3 | falsification of M3 | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `am3-verdict.md`; FAIL 2 broken: the Node client face shares the CLOSING-window silent resolve (upgraded to a code fix — the guard extends to the third face), and the A3 pin lacks its no-queue half; six claims CONFIRMED under named attacks; containment clean |
| M3F | fix round for A-M3 (Node-face guard, A3 no-queue half, guide bounding) | `implementer` | Opus 5 (native) | RETURNED — `m3f-report.md`; committed mcp `28f524c`; Node-face guard red-then-green through a handshake-`head` close; A3 no-queue half pinned with the id-98 control and a measured-instrument record (the red line lives off-limits in the browser face — power proven by a removed probe row); guide universals bounded, clauses 16 and 17 corrected alongside. Carried finding: a pre-open `send` survives `close()` and is delivered on the next `start()` (browser `#queue` is not cleared) — a product question for M5's guide sweep or a later unit |
| M2 | (result) | — | — | RETURNED — `m2-report.md`; committed mcp `a7d245c`; the whole recorded conformance surface green: server `110 passed, 0 failed`, every client row green; `MCPClientTransportInterface` unchanged; per-call server lookup ruling ratified (anti-forgery beats a cache) |
| A-M2 | falsification of M2 | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `am2-verdict.md`; FAIL 2 broken (client cache never forgets an omitted tool; server lookup readable one page via the replacement seam, plus the synthetic id-0 observation leak), six CONFIRMED under sharp attacks; containment clean |
| M2F | fix round for A-M2 (fresh-listing clear, bounded page walk, observation documentation) | `implementer` | Opus 5 (native) | RETURNED — `m2f-report.md`; committed mcp `854a621`; the stale-projection interleaving red-then-green on both faces; the paged-replacement escape red-then-green through the documented `methods.add` seam with `MCP_LOOKUP_PAGES = 8`, the cap-hit edge and the built-in unpaged answer pinned unchanged; conformance intact at the recorded `[110, 0]` baseline with green client rows; Orchestrator spot-checked the clear condition and the walk against the diff before committing |
| A-M1 | falsification of M1 | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `am1-verdict.md`; FAIL 1 broken (two writer verdicts: the whitespace causal claim retracted in this reconciliation — the `13/0` invariant stands; the two-spelling marker discipline carried into M2's amendment). Claims 1–7 CONFIRMED under named attacks; containment clean. **M1 accepted with the carried fix** |
| A-P4 | cross-engine check of the P4 design departures | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `ap4-verdict.md`; every claim CONFIRMED with named attacks (terminal-line shape drift noted); containment clean. **The A-P round closes**: probe queue accepted pending the final verifier |
| M-input | (integration) shared-file patches applied serially; check green, core 785 passed, guides 144, policy 93 | Orchestrator | — | committed mcp `74d7f1c`; conformance baseline `102 passed, 8 failed` |
| MC | client-conformance harness | `implementer` | Opus 5 (native) | see the completed MC row later in this ledger |
| A-M-obj | falsification audit of M-input, objective lane | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `am-objective-verdict.md`; FAIL 2 broken; containment clean; detached-launch deviation recorded and adopted |
| A-M-subj | falsification audit of M-input, subjective lane | `reviewer` | Opus 5 (native) | RETURNED — `am-subjective-verdict.md`; FAIL 6 broken, 4 findings; sharp findings Orchestrator-reproduced |
| — | A-M reconciliation | Orchestrator | — | `am-reconciliation.md`; fix unit MF2 queued behind MC |
| G-L | lsp diagnostic-path proof confirmation | `grok` | Cursor Grok (bench) | RETURNED — `gl-report.md`; containment clean. U10 CLOSED: pull proven at client level against a protocol-faithful framing fixture, push proven by fixture plus the real spawned oxlint child with a coded diagnostic. Carried lsp findings: `identifier` forwarding unproven, unchanged-with-prior-`resultId` reuse unproven, pull never crosses real child stdio |
| MF | conformance fixture completion (MRTR family, schema tool, prompt) | `implementer` | Opus 5 (native) | RETURNED — `mf-report.md`; committed mcp `11fc749` with serial integration patches; baseline `91 passed, 15 failed` |
| M-input | widen the MRTR production seam (multi-request rounds, sampling/roots kinds, consumer keys, `-32021` gating) | `implementer` | Opus 5 (native) | RUNNING — brief `minput-brief.md` |
| M5 | closing mcp writer: queue-on-close fix, lifetime-row promotion, guide honesty, peer alignment | `implementer` | Opus 5 (native) | RETURNED — `m5-report.md`; committed mcp `7835899`; queue discard red-then-green on the state M3F measured; lifetime rows promoted (server 378); every honesty row landed with the gap sweep ruling each declared-gap entry and correcting the stale prose-checked universal and packaging counts; auth exclusion added to Declared non-goals; peer floor `^0.0.15`; conformance intact. Routed findings carried to M2F2 as the amended brief's carried section: the `DEFAULT_MCP_LIMITS` TSDoc `keys` drift (exact patch) and the legacy door's missing modern-method row. Re-baseline recorded: the planned M6 peer bump is folded into M5 (one line, one writer, one commit — a separate builder unit buys nothing); M5's charter widens beyond the plan row with the campaign's accumulated carried findings: the M3F queue-on-close observation (ruled a fix — the class TSDoc already claims the discarded behavior), the M4 lifetime-row promotion (the workbench file is gone; the M4 report is the source), and the two A-P routed-onward mcp findings (`MCPLimitOptions.keys` — document both uses; `buildModernResult` bypass — declare the SHOULD departure). The exit criterion is unchanged |
| A-M23F | combined cross-engine check of the M3F and M2F fix rounds | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `am23f-verdict.md`; FAIL 1 broken: the fresh-listing clear is sequential-correct and concurrent-wrong on both HTTP faces (overlapping listings resolving out of order leave `#parameters` the union of two listings; no latest-send-wins guard). Orchestrator-reproduced from source (`send` per-fetch with no serialization; arrival-order mutation). The other claims CONFIRMED under named attacks, including the soundness of M3F's measured-instrument substitution and the walk's cycle/repeated-cursor/stream shapes; containment clean. The M3F and M2F rounds close with the carried fix |
| M2F2 | fix round for A-M23F (generation-guarded caching on both HTTP faces) plus the carried M5 findings | `implementer` | Opus 5 (native) | RETURNED — `m2f2-report.md`; committed mcp `afca2f8`; the superseded-continuation projection red-then-green on each face; delivered-message tripwire pins exclusion-and-error on stale listings; both carried findings landed (the exact TSDoc patch; the `server/discover` legacy-door row); conformance unchanged. Recorded observations: same-object re-stamp unreachable through shipped paths; `#generation` and `#parameters` survive a close/start cycle per the existing contract |

| A-M2F2 | focused cross-engine check of the generation guard | `grok` (user substitution for Sol) | Cursor Grok (bench) | RETURNED — `am2f2-verdict.md`; PASS, 0 broken, 0 unresolved, 0 not-evidenced; every claim CONFIRMED under named attacks, including the two-fresh-out-of-order case, the fabricated-cursor ruling (non-arrival plus an invented cursor, outside well-formed paging, degrades to under-projection), the ungated delivery path, the stamp bookkeeping, and both carried findings verbatim; containment clean. **The A-M23F round closes; the mcp writing queue is complete** |
| V1 | independent tree-wide gate evidence, mcp then probe | `verifier` | Sonnet (native) | RETURNED — mcp fully green at `afca2f8` (format, lint, build, check, and the full suite: src 1330, policy 93, config 46, setup 86, guides 149, conformance 47, integration 4). probe green at `d6e5750` except `format:check`, which failed on `package.json` (the tarball-swap edit landed the `overrides` block out of key order). Orchestrator serial integration: `oxfmt --write package.json` (key reorder only, no content change), committed probe `59bae32`; the deciding `format:check` re-read is green on 159 files. Anomaly recorded: one expected stderr line in the RuntimeStage bad-config probe, suite all-pass. **Both chains are green; the campaign accepts** |
| — | closure sweep | Orchestrator | — | Every audit lane's brief, run script, and run record retained as `*-lane-*` files in this folder; the audit worktrees under mcp and probe `tmp/worktrees/` removed after retention |

Design, implementation, and audit units are added when the plan lands. `@orkestrel/tool` has no
neighboring checkout (registry-only): an annotations capability landing there is out of this
campaign's writable reach and becomes a carried finding if the design round wants it.
