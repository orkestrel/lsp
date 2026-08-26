# Unit M1 — mcp-revision-boundary

## Role and engine

GPT-5.6 Sol, `implementer` route, `codex exec` sandbox `workspace-write`, working
directory `/home/user/mcp`. You perform this assignment directly, in-process, and spawn
nothing. Read every item below before acting. Your final message must be exactly the
report the Output section specifies.

## Objective

Repair the `mcp` package's modern revision boundary so the bare `MCPServer` is strictly a
2026-07-28 (modern) implementation, and every legacy pathway exists only through the
`createMCPLegacy` decorator.

## Context

Read, in order, before editing:

1. `/home/user/mcp/AGENTS.md`.
2. The applicable files in `/home/user/mcp/.claude/rules/`: `typescript.md`, `names.md`,
   `architecture.md`, `patterns.md`, `tests.md`, `quality.md`, at minimum.
3. `/home/user/mcp/.agents/skills/orkestrel-harden-package/SKILL.md` — implementation-relevant
   phases only.
4. `/home/user/mcp/guides/mcp.md` as the governing guide.

Campaign evidence (read-only, absolute paths, do not edit):

- `/home/user/scaffold/.orkestrel/campaign/audit.md` § Subject 1.
- `/home/user/scaffold/.orkestrel/campaign/design-analyst-report.md` § Subject 1 — the
  defect evidence with `file:line`.
- `/home/user/scaffold/.orkestrel/campaign/researcher-external-report.md` — the
  2026-07-28 lifecycle facts: no handshake; per-request `_meta`; a client and server
  negotiate protocol revision per request rather than once at session start;
  `UnsupportedProtocolVersionError` carries JSON-RPC code `-32022` with
  `data.supported` and `data.requested`; `server/discover` is required and returns the
  server's supported revision set; era detection is per server, not global.

**The defect**, verified by the objective design lane: bare-server validation accepts any
revision `inferEra` recognizes (`MCPServer.ts:371,398`), `SUPPORTED_PROTOCOL_VERSIONS`
mixes eras (`constants.ts:32-36`), and discovery advertises the mixed set
(`helpers.ts:872`), so a modern request can negotiate legacy semantics without going
through `createMCPLegacy`.

**Standing conditions:**

- The exec sandbox denies network. Every source you need is local; install nothing.
- `.git` is mounted read-only. Never run a git command that writes — no commits, no
  `checkout`/`restore`/`reset`. If you must undo your own mutation of a file, rewrite its
  text back to the original content directly, and prove the restoration with
  `git diff --exit-code -- <file>`. Read-only git commands (`status`, `diff`, `log`) work
  normally.
- A loopback listener fails `EPERM` on every address inside this sandbox. Do not attempt
  to bind a real port. Run only the scoped in-memory and core test projects inside this
  exec. Record every listener-dependent or whole-suite gate as an **observation**, naming
  the exact command, for the Orchestrator to run on the host afterward. Do not treat such
  an observation as a failed acceptance criterion.
- The tree starts clean at commit `83473da463313f5c8cc16efad75c04c13dadf24` on branch
  `claude/lsp-spec-audit-est33d`. If your own `git status --porcelain` is non-empty before
  your first edit, that is a deviation: stop and report it rather than proceeding.

## Unknowns

- Whether every legacy-era consumer currently importing from `constants.ts` or
  `helpers.ts` is confined to `src/core/`. If a repair touches a constant or helper a
  file outside `src/core/` imports (for example under `src/server/` or `src/browser/`),
  and that consumer needs only a mechanical adjustment to keep typechecking (an updated
  import path or constant name, no behavior change), make that minimal update and report
  it as a scope note. If the needed change is more than mechanical, stop and report the
  conflict per the deviation contract instead of guessing at server or browser design
  intent.
- Whether `createMCPLegacy` already has the wrapper shape the design report assumes, or
  needs new structural surface to carry the legacy revision set and legacy dispatch. Only
  you can determine this by reading `MCPLegacy.ts`; record what you find and how you
  resolved it.

## Scope

**Owned files** (edit freely, within the constraints below):

- `/home/user/mcp/src/core/constants.ts`
- `/home/user/mcp/src/core/inferers.ts`
- `/home/user/mcp/src/core/helpers.ts`
- `/home/user/mcp/src/core/MCPServer.ts`
- `/home/user/mcp/src/core/MCPClient.ts`
- `/home/user/mcp/src/core/MCPLegacy.ts`
- `/home/user/mcp/src/core/validators.ts`
- `/home/user/mcp/src/core/types.ts`
- The tests mirroring these files under `/home/user/mcp/tests/`.
- The prose in `/home/user/mcp/guides/mcp.md` describing era selection and discovery
  (update it to match the repaired boundary; do not restructure the rest of the guide).

**Shared / report-only:** none identified for this unit; if you discover a file outside
your owned set that a correct repair must change beyond the minimal-consumer-update
allowance above, name it and stop rather than editing it.

**Off-limits:**

- Everything under `/home/user/mcp/src/server/` and `/home/user/mcp/src/browser/`,
  except the minimal mechanical consumer update described under Unknowns.
- `/home/user/mcp/package.json` version field — do not bump it. A later unit (M6) owns
  the single fleet-wide version bump.
- Every symbol rename the campaign assigns to a later unit (M6) — keep every existing
  public identifier name as-is. Where a structural split genuinely requires a new
  constant or type, name it consistently with the current vocabulary in `constants.ts`
  and `types.ts`; M6 will rename fleet-wide later if needed.
- No commits, no pushes, no dependency installs or version bumps, no tree-wide mutating
  gates (`format`, `lint --fix`, `build` are fine to run read-only/check-mode; do not run
  their mutating forms across the whole tree).

## Execution

Perform this assignment directly, in this exec, spawning no subprocess agent or nested
Codex session. You are the engine doing the work, not a driver relaying it.

## Method (TTTDD, red-first)

1. **Types first**, in `types.ts`, wherever the contract moves (for example, an era-scoped
   revision-set type, or a narrower type for the bare server's accepted revisions versus
   the legacy-decorated server's).
2. **Write the era matrix test FIRST**, before any implementation change, covering at
   least:
   - Bare-server `server/discover` (or equivalent discovery path) advertises the modern
     revision set only — never a legacy revision.
   - Bare-server dispatch rejects every non-modern stamped revision with
     `UnsupportedProtocolVersionError`, JSON-RPC code `-32022`, carrying era-scoped
     `data.supported` and `data.requested`.
   - A server wrapped with `createMCPLegacy` still serves a legacy `initialize` request
     and a legacy `ping` request correctly.
   - An unwrapped (bare) server serves neither legacy `initialize` nor legacy `ping`.
   - Client negotiation cannot stamp a legacy revision into a modern per-request `_meta`
     when talking to a bare server.
   Run this test and record the exact command and its failing count. This is your
   red-first proof; it must fail before you implement the fix.
3. **Implement** the boundary repair: separate the modern and legacy revision sets in
   `constants.ts`; narrow `inferEra`/validation in `MCPServer.ts` to modern-only for the
   bare server; narrow discovery in `helpers.ts` to advertise the modern set only for a
   bare server; move legacy revision recognition and legacy dispatch (`initialize`,
   `ping`) entirely behind `createMCPLegacy` in `MCPLegacy.ts`.
4. **Consolidate**: remove duplication introduced by the split, route repeated era logic
   through one shared implementation, follow the naming and centralization rules in
   `.claude/rules/architecture.md` and `.claude/rules/names.md`.
5. **Re-run** the same era matrix test command and record it green. Also run the
   narrowest relevant scoped test project(s) covering the files you touched (in-memory
   and core-only; nothing that binds a port).
6. **Document**: update the era-selection and discovery prose in `guides/mcp.md` to match.

## Output — your final message must be exactly this report

1. **What changed and why**, per file, for every file in your owned set that you touched.
2. **Red-first evidence**: the exact test command, the failing test count and names
   before the fix, then the same command, green, after the fix.
3. **Era matrix results**: which cases you covered and their outcome.
4. **Observations**: every gate you could not run inside this sandbox (listener-bound,
   whole-suite, or otherwise), each with its exact command, for the Orchestrator to run
   on the host.
5. **Unknowns**: how you resolved each Unknowns-section item, or what you found instead.
6. **Deviations**: any, per the Deviation contract below, or state none.
7. The actual output of `git diff --stat` and `git status --porcelain` run at the end of
   your work, pasted verbatim.

No process diary. No narration of intermediate steps beyond what the seven items above
require.

## Deviation contract

A conflict with the objective — a mechanism that cannot be made strictly modern without
breaking a documented consumer outside your owned files, or an off-limits file the repair
genuinely requires touching beyond the minimal mechanical allowance — stops the unit.
Report: expected, found, exact evidence (`file:line` and the conflicting requirement),
whether the unit is done or not done, and at most one short hypothesis. Do not
investigate further, improvise a workaround, or silently narrow the objective.

Ancillary choices — where a new helper lives inside `src/core/`, how a test file within
`tests/` is named, the exact wording of the updated guide prose — are yours to decide,
record in the report, and continue from.

## Acceptance criteria

1. The era matrix test file exists, is red before the fix (command and failing count
   recorded), and is green after the fix (same command, recorded).
2. A bare `MCPServer` accepts and advertises only 2026-07-28 (modern) protocol revisions:
   discovery output and dispatch validation both reflect this, with no legacy revision
   reachable without `createMCPLegacy`.
3. `createMCPLegacy` still fully serves legacy `initialize` and legacy `ping`; behavior
   for a legacy-wrapped server is unchanged from before this unit, other than what the
   era matrix test requires.
4. No off-limits file is edited beyond the minimal mechanical consumer allowance, and any
   such edit is named in the report.
5. `package.json` version is untouched; no public identifier is renamed.
6. `git status --porcelain` at the end shows only the files in your owned set (plus any
   reported minimal-consumer-update file), and `git diff --stat` is pasted in the report.

## Review evidence

This is a code change: the actual `git diff --stat` and the actual `git status --porcelain`
output are required in the report, not summarized or omitted.
