# Audit brief — the mcp modern revision boundary (rounds M1 and M1.1)

## Subject

The chain on branch `claude/lsp-spec-audit-est33d` in `/home/user/mcp`, tip `f859ecc`, base
`83473da`:

- `2c0131b` (M1, written by the GPT-5.6 Sol engine): repaired the modern revision boundary — bare
  server modern-only with `-32022` refusal and `ping` removed, legacy behavior decorator-owned,
  client discovery modern-only — and claimed the scoped core projects green.
- `f859ecc` (M1.1, written by the Opus 5 engine): repaired the consumer suites that M1's result
  made false — an `inferLegacyVersion` regression fixed in `src/server/inferers.ts`, obsolete
  `ping` canaries replaced with `server/discover` carrying substance assertions, modern fixtures
  restamped, one guides-parity drift closed.

Assume this chain has one more. M1 believed the consumer surface needed only one mechanical edit
and was wrong; M1.1's rulings are the freshest and least-examined surface in the package.

## What the round decides

This round decides whether the M1 + M1.1 chain is accepted as the modern-boundary repair — whether
Wave M proceeds onto it (input continuation, subscription client, tasks proof, naming cascade) with
this boundary treated as settled. A finding here is worth more than a clean pass: the alternative
is a consumer meeting the defect after the package publishes, when the version is spent.

## Already established — do not re-run

Verified by the Orchestrator directly, not taken from a writer's report:

- The commit chain and the clean tree: `git log` shows `83473da → 2c0131b → f859ecc`,
  `git status --porcelain` empty at dispatch.
- The pre-repair baseline: the full-suite log the Orchestrator captured at `2c0131b` records
  `15 failed | 1079 passed | 1 skipped`, and its chain aborted at `test:src`, so the cross-cutting
  projects were unmeasured at M1.1's dispatch.
- The combined diff supplied as evidence was produced by the Orchestrator from
  `git diff 83473da..f859ecc`.
- An independent `verifier` is running the authoritative gate chain on `f859ecc` concurrently with
  this round; its exit codes reach the reconciliation directly. Do not spend effort re-running
  whole suites; attack the claims.

## Review evidence

- The combined diff: `/home/user/scaffold/tmp/units/m-audit-combined.diff` (24 files,
  478 insertions, 260 deletions).
- Status: clean at `f859ecc` (empty porcelain output, recorded in the M1.1 report).
- Writer reports (a writer's claims, not established facts):
  `/home/user/scaffold/.orkestrel/campaign/m1-revision-boundary-report.md`,
  `/home/user/scaffold/.orkestrel/campaign/m1.1-suite-repair-report.md`, with the briefs beside
  them (`m1-revision-boundary-brief.md`, `m1.1-suite-repair-brief.md`).
- The 2026-07-28 specification anchor:
  `/home/user/scaffold/.orkestrel/campaign/researcher-external-report.md` — `ping` is removed from
  the modern revision, `initialize` exists only in the legacy era, `-32022` carries
  `data.supported` and `data.requested`, era detection is per request.
- The source itself in `/home/user/mcp` at `f859ecc` — the diff shows what changed; the tree shows
  what holds.

## Numbered falsifiable claims

Attempt to refute each. `CONFIRMED` requires naming the attack you tried that failed. A claim you
cannot decide is `UNRESOLVED`, not `CONFIRMED` — say what would settle it. Do not hedge toward an
imagined consensus.

1. **Bare modern boundary.** A `createMCPServer` with no decorator advertises exactly the
   `2026-07-28` revision through `server/discover` and serves no legacy method through any public
   door. Falsified by a public code path where a bare server discloses or accepts a legacy
   revision.
2. **`-32022` refusal.** Every request stamped with a revision outside the modern set — the known
   legacy revisions and unknown strings alike — is refused with `-32022`, `data.supported` listing
   only the modern revision, `data.requested` echoing the stamp, and the HTTP handler mapping the
   refusal to status 400 before dispatch. Falsified by a stamp variant (casing, surrounding
   whitespace, a similar date, a prefixed string) that slips past the guard, reaches dispatch, or
   produces retry data in a different shape.
3. **`ping` containment.** A modern-stamped `ping` and an unstamped `ping` at a bare server return
   `-32601`; `createMCPLegacy` alone serves `ping` and legacy `initialize`; no other
   legacy-era method leaks through a bare server. Enumerate the served-method surface yourself
   rather than trusting any writer's table. Falsified by a `ping` door outside the decorator or a
   legacy method a bare server answers.
4. **Legacy pinning.** `inferLegacyVersion` returns the exact requested supported legacy revision;
   the decorated initialization echoes that revision; the session middleware then validates the
   client's `MCP-Protocol-Version` header against the same pinned revision end to end. Falsified by
   a requested supported legacy revision that fails to pin, or a session validating against a
   revision the handshake did not echo.
5. **Client modern-only.** `MCPClient` discovery, retry filtering, and request stamping never adopt
   a legacy revision from a bare server's offer; the explicit legacy pin path is the only legacy
   door, and rediscovery after `-32022` retries only within the modern set. Falsified by a
   negotiation sequence landing a legacy stamp without the explicit pin.
6. **No assertion weakened.** Every replaced `ping` canary in the M1.1 diff drives
   `server/discover` and asserts the discover result's material fields; no repaired test passes on
   arrival alone; no test was removed or newly skipped; the suite's single skip predates the chain.
   Falsified by a repaired test the diff shows would pass with a materially wrong reply, or an
   assertion the diff deleted without replacement.
7. **The guide is true — not plausible, true.** The era prose in `guides/mcp.md` (bare modern-only,
   decorator-owned legacy, client modern-first, the `-32022` retry data shape) states behaviors the
   code at `f859ecc` exhibits, and the `isMCPModernVersion`/`isMCPLegacyVersion` examples assert
   their real disjointness. Ask specifically whether a false universal was replaced by an
   unfalsifiable one. Falsified by a guide sentence the code contradicts.
8. **Scope honesty.** Across `83473da..f859ecc` no public identifier was renamed, no version or
   dependency changed, and every hunk lands in a file the M1 or M1.1 brief owned or granted
   (M1.1's `guides/mcp.md` deviation was granted by its Scope). Falsified by any hunk outside those
   sets or any surface change the naming cascade (M6) reserves.
9. **The sound-and-unchanged rulings are sound.** M1 ruled `src/server/handlers.ts` needed no edit
   because its existing use of `SUPPORTED_PROTOCOL_VERSIONS` now emits modern-only retry data;
   M1.1 ruled the WebSocket `ping` payloads that assert only send resolution stay valid. These are
   writers' claims made by the parties least able to test them. Pick the rulings you consider most
   likely wrong, attack them, and say which you attacked.

## Unknowns

- Whether any consumer of the removed bare `ping` or of `SUPPORTED_PROTOCOL_VERSIONS` survives
  outside the repaired files. Report what your enumeration covered — the search scope by path —
  beside the answer.
- Whether hostile stamp variants (claim 2) actually reach the guard. Where deciding needs an
  execution your lane cannot perform, return the claim `UNRESOLVED` with the exact command or
  probe input that would settle it; the Orchestrator runs it at reconciliation.

## Output

Return exactly the `orkestrel-falsify` verdict shape and nothing else: numbered verdicts in the
claims' order, each `CONFIRMED` / `BROKEN` / `UNRESOLVED` / `NOT-EVIDENCED` with the evidence its
value requires; findings fitting no claim, each substantiated to the `BROKEN` standard; then one
terminal line, `VERDICT: PASS — …` or `VERDICT: FAIL — …`, per the skill's shape. No process
diary.
