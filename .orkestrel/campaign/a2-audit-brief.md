# A2 — falsification audit of the byte-stream campaign

Subjects: the process repository `C:/Users/mikes/WebstormProjects/process` at `b07ba7f`
(P1a `5fabc07` Supervisor extract, P1b Session face) and the lsp repository
`C:/Users/mikes/WebstormProjects/lsp` at `61d9a3a` (R1 rename `c9537f2`, the tarball swap
`8307f2c`, L1 adoption `61d9a3a`), with the unit reports under
`C:/Users/mikes/WebstormProjects/lsp/.orkestrel/campaign/` (`p1a-report.md`, `p1b-report.md`,
`l1-report.md`) as the audited units' own claims.

Attempt REFUTATION of each numbered claim. CONFIRMED with evidence, BROKEN with the exact
failing input plus the smallest fix, or COULD-NOT-ATTACK named as such.

Read before ruling: the lsp repository's `AGENTS.md` and `.claude/rules/quality.md`
§ Falsification; `.orkestrel/campaign/d3-reconciliation.md`; the three unit reports; then the
diffs (`git -C <repo> diff <base>..<head>`).

## Claims

1. **P1a preserved every `Process` behavior.** The suite being byte-identical is necessary, not
   sufficient — attack behaviors the suite may not pin: the `delivery` bound through the moved
   write map, stderr evidence truncation, the drain window, validation order, `stop`'s barrier
   under concurrent calls.
2. **P1b's ended-channel guard is unreachable from `Process`.** The report's argument: a
   `Process` write callback exists only through `deliver`; with `writable !== true` the channel
   ends at construction and `deliver` refuses at `!stdin.writable`; with `writable: true`
   nothing sets `writableEnded` before `stop` destroys the pipe. Attack the argument — a path
   where a `Process` consumer reaches the callback with `writableEnded` true would make the
   guard a silent `Process` behavior change.
3. **`Session`'s stdout contract holds adversarially**: every event carries an owned plain
   `Uint8Array` copy; concatenation equals the child's exact bytes for binary, NUL-bearing,
   invalid-UTF-8, and unterminated payloads; nothing emits after the terminal moment.
4. **`end` is not a termination and its barrier holds under races**: end-then-self-exit,
   end-then-stop, double-end, end-with-pending-`delivery`-bounded-write, end-after-stop, and a
   stdin fault after `end` staying quiet.
5. **`ending` settles at native exit strictly before `exit` when a descendant holds the pipe**,
   and the two agree with `code`/`signal` at both moments.
6. **L1 preserved every documented transport obligation** (the mapping table in `l1-report.md`):
   in particular the `timeout`-coded unconfirmed stop keeping the generation unretired while the
   session's own `exit` event fires, the retired-generation emitter silence between a retirement
   and the next `start` (the report names the `#owns` current-generation half as
   preserved-but-unproven — attack that window), and the cooperative phase staying bounded by
   one `grace` deadline even when the child stops reading stdin (the `end` flush case).
7. **The campaign's scope is honest**: lsp `package.json`/`package-lock.json` changed only in
   the swap commit `8307f2c` and carry the `file:` tarball; process `package.json` is untouched
   across `23808f2..b07ba7f`; no banned construct (`any`, assertions, ts-suppressions,
   `oxlint-disable`) entered any diff; `guides/probe.md` is byte-identical across the campaign.

## Execution rights and containment

You hold the OBJECTIVE lane and may EXECUTE to falsify, in BOTH repositories: scoped
non-mutating suite runs (`npm run test:src:server` in each repo, `npm run test:guides`,
lsp `npm run test:conformance`), `node` one-off scripts you write under `tmp/cursor/a2/` in the
lsp repo (create it), and read-only `git` commands. For a seeded mutation, apply it to a tracked
file, run the narrowest suite, and restore the exact bytes; capture `git status --porcelain`
and `git diff --stat` in BOTH repos before you begin and after you finish and report all four;
any residual change is a deviation you must name. Never run `format`, `lint --fix`, `build`,
full `npm test`, or any git command that discards changes. Windows host: prefer script files
over inline `node -e` with `${...}`.

## Output

Per-claim verdicts with evidence and executed commands, then one line: PASS if no claim is
BROKEN, else FAIL listing them. No process diary.
