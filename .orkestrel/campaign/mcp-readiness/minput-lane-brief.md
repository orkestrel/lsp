# Audit round A-M — the MRTR seam widening (M-input, mcp `74d7f1c`)

You are one lane of an adversarial falsification round. Attempt to refute every claim.
`CONFIRMED` requires naming the attack you tried that failed. A claim you cannot decide is
`UNRESOLVED`, not `CONFIRMED` — say what would settle it. Do not hedge toward an imagined
consensus. Perform the assignment directly and spawn nothing. Edit nothing.

## Subject

mcp `main` at `74d7f1c`: `MCPServerOptions.input` widened from a one-form elicitation to full
MRTR rounds (consumer-chosen keys; elicitation, sampling, and roots kinds; per-kind capability
gating; the sealed state carrying the exact issued round), written by the Opus implementer and
serially integrated by the Orchestrator (patches to `tests/setup.ts`,
`tests/src/core/MCPLegacy.test.ts`, `tests/src/core/parsers.test.ts`, and two declared-non-goals
guide rows). You are rooted in a detached worktree at exactly that commit. The main checkout is
out of bounds. This worktree has no `node_modules`; rule from source, the supplied diffs, and
the supplied run records.

## What the round decides

Whether the MRTR widening is accepted, which the header units then build beside. A finding now
is worth more than a clean pass.

## Supplied evidence (in `tmp/audit/` beside this brief)

- `minput.diff` — the actual commit.
- `minput-report.md` — the writer's report (testimony).
- `runs.md` — Orchestrator-produced run records at the integrated tree: `npm run check` green;
  `test:src:core` 785 passed; `test:guides` 144 passed; `test:policy` 93 passed. The
  conformance baseline (`102 passed, 8 failed`, 43 harness rows green) is the writer's own run,
  labeled as such.
- The spec captures:
  `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\campaign\mcp-readiness\spec-patterns.md`
  (MRTR rows M1–M9) and `r1-report.md` (the checklist) in the same folder.

## Claims

1. The capability gate fires where a round is ISSUED, on both doors — the first round in
   `#input` and the next round in `#retry` — and a retry that answers its round fully, needing
   no further round, executes without re-declaring capabilities. That ordering satisfies M4
   (never send a kind the declared capabilities exclude): no path issues an input request
   without the gate having measured that exact round.
2. `isMCPInputResponse` validates each response against the exact request its key issued —
   the issued schema for elicitation, the dated result shapes for sampling and roots — and a
   response of the wrong kind for its key is refused.
3. The reshape dropped no replay binding: `parseMCPInputState` still enforces principal,
   expiry, id, version, method, name, and digest, refuses an empty round, and the sealed
   `requests` map is what the retry is verified against. Attack the reshape for a binding that
   silently vanished.
4. Consumer `state` still rides sealed and opaque: byte-exact through seal and open, never
   inspected, never present in the retry when absent from the round.
5. The `MCPElicitation` removal and the `elicit → round` rename left no stale reference in
   `src/`, `tests/`, or `guides/`, and the guide's input-policy section (Surface and Types
   rows included) matches the shipped shapes.
6. The three integration patches assert what their names claim: the `MCPLegacy` row still
   proves the legacy-cannot-represent refusal on this exact path; each parsers rejection row
   isolates one binding; the empty-round row is a genuinely new binding the old shape could
   not express.
7. The server no longer stamps `mode: 'form'` onto consumer-composed elicitation params
   (writer's ancillary). Attack its conformance: read the elicitation requirements in the spec
   captures — if an `elicitation/create` request without a `mode` is invalid on the wire, a
   consumer round omitting it now ships an invalid request the old stamping would have made
   valid. Rule whether the guard (`isMCPElicitRequest` or its sibling) refuses the omission or
   admits it.
8. `computeMissingCapabilities` maps kinds to capabilities exactly (`elicitation/create` →
   `elicitation`, `sampling/createMessage` → `sampling`, `roots/list` → `roots`), and the
   `-32021` payload's `requiredCapabilities` record names precisely the missing ones.
9. Scope honesty: the commit touches only the unit's owned files plus the named integration
   patches, and introduces no banned construct (no `any`, no assertion, no suppression, no
   nested function declaration, no misplaced module data).
10. The writer's sound-and-unchanged verdicts hold. Attack at least: "`MCPMethodManagerInterface`
    and the dispatch spine are unchanged", and "no shape of the widening avoids breaking those
    three test files". Say how many you attacked.

## Unknowns

- Whether the sampling `content` single-block constraint (one text/image/audio block, per the
  dated `CreateMessageResult`) matches the schema exactly — the spec captures summarize; where
  they do not settle it, rule `UNRESOLVED` naming the schema anchor that would.

## Verdict shape

Numbered verdicts in claim order (`CONFIRMED` with the failed attack / `BROKEN` with the exact
failing input, state, or interleaving plus the smallest fix / `UNRESOLVED` with what would
settle it / `NOT-EVIDENCED` with the missing capture), findings outside the claims to the
`BROKEN` standard, then exactly one terminal line in the standard `VERDICT: PASS|FAIL` form.
No process diary.
