# D3 subjective lane verdicts — planner / Opus 5, 2026-08-27

Retained from the agent's report; the architecture it proposes was overruled by
`d3-reconciliation.md` on probe evidence, and its surviving rulings are recorded there. Summary
of record:

1. **Stdout bytes**: a `stdout` event on `ProcessEventMap`, always live, no mode — push symmetry
   with `stderr`; a mode makes `lines`/`truncated`/`backlog` false on a byte child. (Overruled:
   the Orchestrator's coexistence probe showed the always-attached `data` listener defeats
   readline's pause, breaking documented lossless backpressure; the lane's own named fallback —
   a package-owned framer — was judged higher-risk than the objective lane's sibling.)
2. **Raw stdin writes**: `write(bytes: Uint8Array): Promise<boolean>` as its own method; the
   overload hides a terminator behind an argument's runtime type — the exact footgun a
   Content-Length transport cannot survive; `delivery` bounds the channel, not the method; both
   methods delegate to one `#deliver` orchestrator. (Adopted.)
3. **Cooperative close**: `end(): Promise<void>` — `close` borrows the Node event name the
   package already refused for `closed`; `end` is ordinary English; never rejects, idempotent
   stable barrier, not a termination, pending writes flush, quiet host faults after
   `writableEnded`. (Adopted onto the sibling; void-versus-boolean confirmed in the naming
   follow-up.)
4. **One class**: everything on `Process` — a second class duplicates the engine. (Overruled:
   the interned shared engine answers the duplication argument, and the sibling omits rather
   than falsifies the line members.)
5. **lsp adoption map**: keep generation scoping, duplicate refusal, exit-once, the grace split;
   delete direct spawn and the stop sequencing; named mismatches — the `grace` collision (the
   transport's cooperative window must never be passed as `ProcessOptions.grace`), exit settling
   at the terminal moment behind `drain`, spawn faults arriving twice, `writable: true`
   mandatory (moot on the sibling, whose stdin stays open), stderr `evidence` strictly better
   than `resume()`. (Adopted, with the native-exit correction from the objective lane.)
6. **Proofs**: byte-fidelity rows including no-trailing-newline, lone `\r`, and invalid-UTF-8
   payloads; exact-byte echo; refusal rows after `end`/`stop`/`destroy`; `delivery`-bounded
   `write` against an unbounded control; `end` idempotence, non-termination, flush; the
   coexistence probe promoted to a standing test (superseded by the sibling's exclusive attach);
   lsp obligations green unmodified. (Merged into the P1b catalogue.)
7. **Blast radius**: `EmitterHooks` widening is additive and compiles unchanged; external
   `ProcessInterface` implementers break under its route (moot on the sibling); process bumps,
   lsp re-pins then bumps, mcp unobliged; the guide owes Types/Surface/Methods rows, a Standard
   input subsection, a terminal-moment sentence, and Vocabulary rows. (Adopted, adjusted to the
   sibling shape.)

Tensions it named for the record: always-live versus mode; `stdout` versus `chunk` as the event
name; two stdin verbs versus one overload; `end` versus `close`; void versus boolean; forwarding
the host `Buffer` unaltered (overruled — the objective lane's copy-per-chunk adopted); the
framer as fallback-not-unit.
