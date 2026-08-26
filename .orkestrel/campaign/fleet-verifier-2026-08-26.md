# Fleet verifier sweep, 2026-08-26

Independent `verifier` dispatches (Sonnet, read-only plus Bash, one per checkout) ran the
authoritative gate chain — `format:check`, `lint:check`, `check`, `build`, `test` — in
each touched checkout, in slices per the writing-concurrency rules. Each row records the
verifier's returned verdict; the Orchestrator accepted each reading against the
verifier's own exit-code report.

| Checkout | Verdict | Reading |
| --- | --- | --- |
| `markdown` | GREEN | Full chain exit 0 at `a02494e`. |
| `queue` | GREEN | Full chain exit 0 at its G1 head. |
| `html` | GREEN | Full chain exit 0 at `a533947`, after the Orchestrator's `npm ci` restored the empty `node_modules` tree (166 packages; the first red was `oxfmt: not found`, an install absence rather than a gate failure). |
| `workflow` | GREEN | Full chain exit 0 at `c01e1a5`, after the Orchestrator's `npm ci` (186 packages; the first red was the same install absence, surfacing as TS2688 missing type definitions). |
| `scaffold` | GREEN | Full chain exit 0 at `c51d7ce`, after the Orchestrator's `npm ci` (177 packages). |
| `tool` | GREEN | Full chain exit 0 at its G1 head. |
| `middleware` | GREEN | Full chain exit 0 at its G1 head. |
| `probe` | GREEN | Full chain exit 0 at `1db0372`. The verifier flagged a stderr line during the "recycles the resident runner" row; the Orchestrator confirmed it against the test body: the fixture plants a `refuse-warm` file so the replacement warm's `vite.config.ts` throws "the workspace refuses this warm", and the row asserts that exact refusal (`tests/src/server/stages/RuntimeStage.test.ts:1284` and the refusal assertions that follow). The line is the planted negative path, and the observation closes. |
| `process` | RED, then repaired | The first read failed one row, `Process.test.ts` "reaches the terminal moment on stop alone with no destroy call", reproducible alone. The Orchestrator's instruments settled the mechanism: the drain bound destroys the held pipes — correct behavior — and the unguarded `late` fixture holder crashed on the destroyed stream's error, freezing the file-side proof. The g2-orphan-fixture unit landed the stderr error guard with red-first, green, and mutation-binding records; the Orchestrator's own deciding re-run read `56 passed | 1 skipped (57)` exit 0. The clean re-verify at `2a47ed1` read GREEN: format, lint, check, build each exit 0, and `npm test` exit 0 at src `148 passed | 8 skipped (156)`, policy `93`, config `46`, setup `10`, guides `100 passed | 1 skipped (101)`. |
| `mcp` | GREEN | Full chain exit 0 at `aa20c37`: format (217 files), lint, check, build, and `npm test` at src `1151 passed | 1 skipped (1152)` (the skip pre-existing), policy `93`, config `46`, setup `75`, guides `144`, conformance `42`, integration `4`. The build's API Extractor version notice is informational and moved no exit code. |
| `lsp` | GREEN | Full chain exit 0 at `759b899` on `main`: format (147 files), lint, check, build, and `npm test` at src `104`, policy `93`, setup `16`, config `46`, guides `23`, conformance `243` — the conformance suite drove the real language server on the first pass. |

Every touched checkout reads GREEN, so the exit criterion's verifier requirement is met on 2026-08-26.

The install repairs (`npm ci --no-audit --no-fund`) were the Orchestrator's own tracked
commands, per the bench-sandbox network rule; no verifier and no unit installed anything.
