# L5 audit — Orchestrator receipts and probe (2026-08-26)

The reviewer's verdict (`l5-audit-reviewer-verdict.md`) left claim 7 not-evidenced for the
L5-A commit and referred a runner-behavior question to execution. Both closed on the host.

## Claim 7, the L5-A half — CLOSED, in scope

`git -C /home/user/lsp show --stat 586758d` reports exactly:

```text
 .prettierignore              |     3 +
 guides/lsp.md                |     8 +
 scripts/metamodel.sh         |    41 +
 tests/mirrors/metaModel.json | 16064 +++++++++++++++++++++++++++++++++++++++++
 4 files changed, 16116 insertions(+)
```

The set equals the L5-A r2 owned list plus the `.prettierignore` edit the design record
declares as the Orchestrator's own, assigned to this audit round — a declared condition,
not a scope breach. `sha256sum tests/mirrors/metaModel.json` reads
`caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`, equal to the pin.

## The emptied-table referral — SETTLED by probe

Instrument: a probe file in the lsp `probe` project (not gate-selected) holding a describe
whose only case is `it.each([])` beside an anchored sibling, run by
`npx vitest run --config vite.config.ts --no-cache --project probe`, then swept. The
reading, verbatim:

```text
FAIL  |probe| tmp/probe/emptyEach.test.ts > a suite whose rows all come from an empty table
Error: No test found in suite a suite whose rows all come from an empty table
 Test Files  1 failed (1)
      Tests  1 passed (1)
```

Vitest fails a suite whose whole `it.each` population empties. Read against the landed
`tests/conformance.test.ts` describe structure: the numerals, structures, and guards
blocks hold only `it.each` cases, so a fully emptied table is loud. The residual gap the
membership assertions must close is the GROWN population — a new local symbol gaining no
row reddens nothing — and the F2 fix in the L5.1 brief targets exactly that.

## Round bookkeeping

The first lane (Opus reviewer) returned FAIL, so the audit step owes the second lane. The
L5.1 fix routes to the Opus `implementer`; the Sol `analyst` lane then audits the combined
L5+L5.1 round — the second lane on the FAIL, the fix-round auditor whose engine wrote
neither the fix nor the verdict, and the carrier of the reviewer's referrals
(`readProperty` inheritance, the `isInstalledDiagnostic` degenerate predicate) — in one
dispatch behind the bench queue.
