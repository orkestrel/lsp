# Unit H3 — nested implied close: the scan reaches the entry the guide documents

Role and engine: `sol` implementer, GPT-5.6 Sol, reached through `codex exec`, sandbox
`workspace-write`, working directory `/home/user/html`. You perform this assignment directly
and spawn nothing beyond the shell commands your work needs. Red-first for every behavioral
row: record the exact command and its failing count before implementing, then record the same
command green.

Before working, read in order: `/home/user/html/AGENTS.md`; the applicable rules —
`.claude/rules/names.md`, `.claude/rules/typescript.md`, `.claude/rules/architecture.md`,
`.claude/rules/tests.md`, `.claude/rules/documentation.md`, `.claude/rules/writing.md`,
`.claude/rules/quality.md`; no skill binds this unit; the guide `guides/html.md` §§ parsing
and recovery (the implied-close row sits at line 202).

## Objective

The parser delivers the implied close the guide documents when the closing trigger arrives
with other elements open above the entry-keyed element, bounded by scope barriers so a nested
container protects its ancestors, and the spans of every implicitly closed element follow.

## Context

Baseline: html commit `3ce6787`, tree clean at dispatch. Every line fact below was read from
that commit. The defect predates the campaign: the `7d82b86` baseline carries the identical
scan.

- The measured defect (H1 audit round, PROBE C, retained at
  `/home/user/scaffold/.orkestrel/campaign/h1-audit-instruments/h1-lane-disagreements.test.ts`):
  parsing `<p><b>x<div>y` records the `p` span as `[0, 13)` where the guide row
  (`guides/html.md:202` — "a block start while `p` is open → Implied close per
  `IMPLIED_CLOSERS`") owes `[0, 7)`. The `b` on top of the stack hides the open `p`.
- The mechanism (`src/core/parsers.ts:154-163`): the stack scan lowers `stackTarget` only
  while each successive top element is itself an `IMPLIED_CLOSERS` key whose closers include
  the incoming tag, so it breaks at the first intervening element with no entry. The twin
  scan over the depth-capped overflow stack sits at `src/core/parsers.ts:144-152` with the
  same break.
- The table (`src/core/constants.ts:104-119`): keys `p` (closers `BLOCK_ELEMENTS`), `li`,
  `dt`, `dd`, `option`, `optgroup`, `rt`, `rp`, `td`, `th`, `tr`, `thead`, `tbody`, `tfoot`.
  `BLOCK_ELEMENTS` (`src/core/constants.ts:47`) includes `table`, `caption`, `td`, `th`, and
  `tr`, so a `p` never survives INTO a table — the barrier question for `p` is about the
  containers that are not closers of `p`.

The ruling this unit implements, stated as invariant, constraint, and interface:

- **Invariant.** An incoming start tag closes down to the deepest open element whose
  `IMPLIED_CLOSERS` row names it, through intervening open elements, so `<p><b>x<div>y`
  closes the `b` and the `p` at the `div` start.
- **Constraint against over-correction.** The scan stops at a scope barrier: a container
  protects its ancestors, so an element inside it never closes an entry-keyed element outside
  it. The authority to adapt is WHATWG HTML 13.2.6 — button scope bounds the search for an
  open `p` (of its barrier list, the members reachable here as open non-closers of `p`
  include `button`, `object`, `select`, `marquee`, and `template`), and the `li` / `dt` /
  `dd` start-tag loops break at any special element other than `address`, `div`, and `p` (so
  `<ul><li>x<ul><li>y` keeps the outer `li` open — the inner `ul` is the barrier). Derive
  each key's barrier set, adapted to this parser's total, non-inserting design, record it as
  a frozen exported constant in `src/core/constants.ts` with TSDoc stating the derivation,
  and pin every barrier you adopt with a vector. Record, per key, where you depart from the
  WHATWG list and why.
- **Interface.** The guide row at `guides/html.md:202` stays true as written; each implicitly
  closed element's span ends at the incoming tag's start (the removal loop at
  `src/core/parsers.ts:165-176` already ends a removed element at `tokenStart`, so the spans
  follow from a correct `stackTarget`). Extend the guide's recovery prose with the barrier
  rule and one example.

Required vectors, each red-first where the current parser answers differently:

- `<p><b>x<div>y` — `p` spans `[0, 7)`, `b` ends at the `div` start (PROBE C's vector,
  adapted; name the row for what it proves, not for the probe).
- `<p><button>x<div>y` — the `p` stays open across the `div` (barrier).
- `<ul><li>x<ul><li>y` — the outer `li` stays open; the inner `li` sequence still closes
  within the inner `ul` (barrier plus the existing sibling rule together).
- A `dt` or `dd` vector through an intervening inline element, and one through its barrier.
- One vector through the overflow path if your measurement shows the depth-capped scan
  reaches the same defect; otherwise record the measurement that shows it cannot.

Host environment: Linux container, Node and npm on PATH, network DENIED in your sandbox — no
installs, no fetches. Dependencies are installed. Run scoped commands: `npm run
check:src:core`, `npx vitest run --config vite.config.ts --no-cache --project src:core`, and
focused file or `-t` filters. Nested `git` invocations from a spawned tool can report "not a
git repository" while your own `git status` succeeds; that is the sandbox, not the tree. The
`prove` MCP instrument is unreachable in your sandbox; your red-first records and
`cmp`-proven mutation restorations are your instrument evidence, and the Orchestrator takes
the host receipts after you exit. Back up any file you mutate for a control into the
repository's ignored `tmp/` area and restore byte-identically, proving it with `cmp`.

## Unknowns

- Whether the overflow scan (`parsers.ts:144-152`) can reach the defect within the depth
  cap's reachable inputs. Measure before deciding; report the reading either way.
- Whether any existing test pins the current shallow-scan behavior. Derive the set by running
  the suite after the parser change and report every row the fix reddened beside the edit
  that re-pinned it; a red row outside the owned files STOPS the unit per the deviation
  contract.

## Scope

Owned files: `src/core/parsers.ts`, `src/core/constants.ts`, `guides/html.md`,
`tests/src/core/parsers.test.ts`, `tests/src/core/HTML.test.ts`, and
`tests/src/core/constants.test.ts` (the table and barrier constants' rows).

Shared, report-only: `src/core/helpers.ts`, `src/core/types.ts` — read freely, return exact
patches if a criterion genuinely needs one, edit neither.

Off-limits: everything else, `package.json` and the lockfile included. No new dependency, no
version bump, no rename of any existing export.

Allowed tools: read, edit, and scoped shell commands in `/home/user/html`. No commit, no
push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide `format` or `lint
--fix`; converge with scoped checks and leave formatting to the non-mutating gates.

## Execution

You are the bench engine reading this brief inside your own CLI: do the work yourself,
directly, and spawn nothing beyond the shell commands your work needs. Never make a
whole-suite gate a criterion for yourself: run scoped projects, record the whole-suite
reading as an observation, and the Orchestrator takes the authoritative gates on the host
after you exit.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact behavioral delta.
2. The barrier sets you adopted, per key, with the WHATWG anchor and every departure named.
3. Red-first evidence per behavioral row: the exact command, its failing count before, the
   same command green after.
4. The mutation account for the scan (disable the deep scan, watch the nested row fail while
   a barrier row holds, restore with `cmp` exit 0).
5. The Unknowns readings, each with its command and result.
6. Observations outside scope, each named against the capability that owns it.
7. Scoped gate readings you took, each with its exit code.
8. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact evidence,
done or not done, and at most one short hypothesis. The named stop conditions: the fix
reddens a row in a file outside the owned list; the barrier design cannot satisfy a required
vector without changing a shared or off-limits file; the guide row's documented behavior
turns out to conflict with a WHATWG-anchored barrier for a required vector. An ancillary
conflict — where the guide example sits, row naming, the barrier constant's exact name within
the `{QUALIFIER}_{NOUN}` form — is yours to decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first; every behavioral row red-first.

1. `npm run check:src:core` exits 0.
2. The required vectors each hold as their own row in the owned test files, the nested rows
   recorded red against the shallow scan first.
3. The barrier constant is exported, frozen, TSDoc-complete, and covered by rows in
   `tests/src/core/constants.test.ts`.
4. The mutation account isolates: disabling the deep scan reddens the nested-close row while
   the barrier rows hold, restoration `cmp` exit 0.
5. The guide's recovery section states the barrier rule with one example, and the implied-close
   row at `guides/html.md:202` reads true against the shipped behavior.
6. `npx vitest run --config vite.config.ts --no-cache --project src:core` exits 0.
7. No banned construct anywhere in the diff.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you exit;
your report's claims are audited against them. Flag any claim you could not close rather than
rounding it up.
