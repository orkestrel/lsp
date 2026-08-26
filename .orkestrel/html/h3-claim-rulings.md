# H3 audit — Orchestrator rulings on the referred claims (2026-08-26)

The reviewer's verdict (`h3-audit-reviewer-verdict.md`) referred claim 1 to a host probe and
claim 2 to a host fetch. Both instruments ran on 2026-08-26; the readings and rulings
follow.

## Claim 1 — the stop condition is per-entry, and the shipped `break` is the defect

Instrument: `tmp/probe/impliedChain.test.ts` in `/home/user/html` (the reviewer's prescribed
probe, retained beside this record), run by
`npx vitest run --config vite.config.ts --no-cache --project probe
tmp/probe/impliedChain.test.ts`, exit 0, readings recorded to
`h3-impliedChain-probe.txt`:

```text
DEEP   : "<table><tr><td><p><button>x<td>y</td></button></p></td></tr></table>"
CONTROL: "<table><tr><td><p>x<td>y</td></tr></table>" rendered as
         "<table><tr><td><p>x</p></td><td>y</td></tr></table>"
```

The control closes the cell, so the reviewer's trace stands and the finding holds. The deep
input nests the second `td` inside `button` and emits inverted close order — malformed
output no serializer round-trips.

Ruling: **per-entry barriers.** Each candidate is ruled by its own `IMPLIED_BARRIERS` row
and a blocked candidate is skipped, never a wall for shallower candidates. The fetched
WHATWG HTML "has an element in scope" algorithm is per-element — each close check consults
the target element's own scope list, and the cell-closing steps pop every element above the
cell, button scope included. No transitive rule exists in the authority. The fix is
`continue` in place of the `break` at `src/core/parsers.ts:192`, leaving the
deepest-to-shallowest walk and the shallowest-unblocked selection unchanged. The expected
deep render becomes
`<table><tr><td><p><button>x</button></p></td><td>y</td></tr></table>`. The documents the
reviewer lists at `src/core/constants.ts:122`, `guides/html.md:50`, and `guides/html.md:192`
already read per-entry and stay true under the fix.

## Claim 2 — the barrier rows conform, with one unrecorded departure

Instrument: the WHATWG HTML parsing section fetched on the host on 2026-08-26
(`whatwg-parsing.html` in the Orchestrator scratchpad), with the special-element list and
the scope definitions extracted and diffed mechanically against
`src/core/constants.ts:137-339` (the script and its full output are in this record's
acceptance evidence). The readings:

- The `p` row equals button scope minus `caption`, `table`, `td`, and `th` — the recorded
  table-descendant omission the reviewer already verified against the package's own
  vocabularies. No member is missing and none is extra.
- The `li`, `dt`, and `dd` rows equal the special-element list minus the recorded exclusion
  categories — the `address`, `div`, and `p` pass-through elements, the parser-void, raw,
  and literal elements, and each row's own close targets. No member is missing and none is
  extra.
- The `td`, `th`, `tr`, `thead`, `tbody`, and `tfoot` rows equal the table-scope triple
  `html`, `table`, `template` exactly.
- The `option` and `optgroup` rows are `['select']` and the `rt` and `rp` rows are
  `['ruby']`, the recorded insertion-mode adaptations.

Ruling: the derivation claim **holds** under the recorded departures. Two TSDoc alignments
are owed:

1. The unrecorded departure the reviewer named: `html` sits in the `p` row and the table
   rows, and in a conforming tree builder a nested `html` start tag never re-enters the
   stack, so it never acts as a barrier there — this total parser stacks it, so here it
   does. One clause in the TSDoc at `src/core/constants.ts:122-136` records it.
2. A stale rationale: the fetched living standard's base scope list contains `select`, so
   the clause "`select` is added because the conforming in-select mode…" describes a
   conforming member rather than an addition. The clause changes to state membership.

## Consequences carried to the fix round

- Claim 1 fix: `continue` at `src/core/parsers.ts:192`, pinned by the deep probe vector as
  a literal red-first test row.
- Claim 3 fix (BROKEN): the reviewer's prescription verbatim — literal vectors per adopted
  barrier class replacing the self-derived loop at `tests/src/core/parsers.test.ts:160-170`,
  plus the barrier-check-disable mutation control.
- Claim 4 fix (BROKEN): the reviewer's prescription verbatim — the row's Behavior cell
  gains "bounded by `IMPLIED_BARRIERS`" and `guides/html.md:192` drops "inline".
- Claim 2 alignments: the two TSDoc clauses above.
- F1: the depth-projection and deepest-position helpers extract to `src/core/helpers.ts`
  as exported leaves with tests — folded into the fix unit because the extraction rewrites
  the same `src/core/parsers.ts:164-194` region as the claim 1 fix, and serializing two
  writers over one region doubles the churn. Recorded as a re-baseline of the H-wave units,
  not a rescope.

## Round bookkeeping

The first lane (Opus reviewer) returned FAIL, so the audit step owes the second lane. H3's
writer was Sol, so routing the H3.1 fix to the Opus `implementer` lets one Sol `analyst`
pass audit the combined H3+H3.1 round — the second lane on the FAIL and the fix-round
auditor whose engine did not write the fix, in one dispatch after the bench frees from
L5-B.
