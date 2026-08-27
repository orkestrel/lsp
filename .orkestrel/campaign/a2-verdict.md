# A2 verdict — byte-stream campaign audit, 2026-08-27

Lanes: objective (Grok, bench, executed attacks in both repositories — journal `a2.log`),
subjective (`reviewer`, Opus, native), mechanical (`checker`, Sonnet, native). Containment clean
in both repositories before and after, digests matched on every restore.

## Objective lane — FAIL on claims 1 and 2, both accepted

- **Claim 1 BROKEN, accepted**: P1a moved `backlog` validation ahead of the engine's validators,
  so a construction carrying two invalid options now reports `backlog` where `23808f2` reported
  `command`. P1a's own report had flagged the order change as unobservable; the lane produced
  the observable case. Fix: engine-order validation in `Process`'s constructor prefix, then
  `backlog`, then construct `Supervisor` from a plain literal (also stops getter re-runs after
  a refusal); the auditor's dual-invalid vector becomes the regression row.
- **Claim 2 BROKEN, accepted as a RECORD correction only**: the ended-channel guard IS reachable
  from `Process` — constructor `input` with the default construction-ended stdin reaches
  `#failInputCallback` through the stream-fault forward — and seed-removing it reddened the
  EXISTING `Process` quiet row, so the guard is load-bearing and the quieting behavior predates
  P1b (it sat on `#failInputStream`). No code change; P1b's unreachability argument is corrected
  here: the guard's `Process` consumer is the constructor-input stream-fault path, and the
  unmodified `Process` suite was already pinning it.
- Claims 3-7 CONFIRMED with executed evidence, including: byte fidelity over a
  NUL/invalid-UTF-8/unterminated payload; the `end` barrier under double-end, end-then-stop,
  and pending-write races; `ending` settling while a descendant held the pipe and `exit` waited;
  the `timeout`-coded unconfirmed stop keeping the generation unretired under a seeded
  forced-failure; retired-generation emitter silence with a live grandchild; the cooperative
  phase staying bounded at `grace` with an unread 4 MiB write in flight; and scope honesty
  (package files, banned constructs, `guides/probe.md` blob identity across every campaign
  commit).
- The lane's own first end-flush probe blocked on an unread 4 MiB write until rewritten to race
  a deadline — direct empirical confirmation of the reviewer's defect 5.

## Subjective lane — FAIL on five defects; four accepted, one refuted

- **Accepted**: (1) `Session.ts` class TSDoc states the pooled-buffer premise the same unit
  measured false — the one stale copy, on a barrelled class; (2) lsp `types.ts` and
  `guides/lsp.md` describe a per-step `grace` window where the code arms one shared deadline —
  `close`'s own TSDoc is already correct, making the others drift; (4) an in-body function
  assignment in `Session.test.ts` — the sole real instance in the repository; (5) `end`'s flush
  is unbounded when the child stops reading and neither its TSDoc nor the guide's flagship
  pattern says so — the pattern awaits it bare before arming any window, and the first consumer
  plus the audit probe both prove the trap.
- **REFUTED**: (3) `guides/probe.md:749` naming `createStdioTransport` — that file is a vendored
  MIRROR of the probe package's own guide, correct for probe `0.0.9` as published; the
  documentation law forbids hand-editing a mirror, R1 ruled it off-limits, and it refreshes when
  probe adopts the rename at its re-pin. Expected staleness, already carried as probe's
  obligation.
- **Polish accepted**: (6) the `Supervisor.ts` `deliver` doc voice; (7) referential `below` at
  the named sites and the `guarantee` claim recast; (8) the options table restatement — keep the
  table, drop the deferring clause, add the introducing sentence; (9) the `pooled` variable
  renamed for the falsified premise.
- **Observations recorded, no action**: the fleet-wide interface-imperative versus class-`-s`
  TSDoc split (predates the campaign; a fleet decision); the inline face-bundle type (right
  trade for an interned engine); the text-only `command.input` on a byte face (defensible;
  `write` covers binary preambles); the committed `file:` tarball range (campaign state, owned,
  restoration recorded — acceptance does not pass over it, U7 carries it).
- **Referrals settled**: R1 — the `end` barrier settles under stop/destroy races per the
  objective lane's executed claim-4 evidence; R2 — the `policy/no-nested-functions` instrument
  covers `src/**` and `app/**` while the rule reaches `tests/**`: a scaffold-owned
  instrument-population finding, carried to U7; R3 — settled as objective claim 2.

## Checker lane — PASS

Every mechanically checkable item passed; gate execution correctly deferred to V2's verifier;
the preserved-but-unproven transport guards ruled a carried lsp finding (a successor fixture
whose child hands stdin to a grandchild).

## Terminal

PASS after F2 lands the accepted findings: the two broken claims are a validation-order
restoration plus a record correction, the defects are documentation and one test-shape repair,
and every fix adopts an auditor's verbatim prescription — the round closes on the Orchestrator's
diff read plus the audit's own executed evidence, with the dual-invalid vector adopted as a
regression row.
