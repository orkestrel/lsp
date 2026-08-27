# G6 — process supervisor absorption for the byte-stream design

Read-only. Modify no file. Return evidence with `file:line` pointers. No raw dumps, no
decisions, no design proposals.

## Question

How does `@orkestrel/process`'s supervised child work internally — spawn, stdout consumption,
lifecycle, options — and what are the constraints on adding a raw byte-chunk stream beside the
existing line stream?

## Scope

- `C:/Users/mikes/WebstormProjects/process/src/**` (read at depth)
- `C:/Users/mikes/WebstormProjects/process/guides/README.md` and `guides/process.md` (headings
  plus the sections on the supervised child)
- `C:/Users/mikes/WebstormProjects/process/tests/**` (structure; skim the Process suite)
- `C:/Users/mikes/WebstormProjects/process/package.json`
- Nothing else. Do NOT read the lsp repository (a writer is active there).

## Evidence sought

1. `ProcessInterface` and the `Process` class: every member with a one-line meaning and
   `file:line`; the constructor options; how `lines` is implemented (readline? split where? on
   which stream events?); whether stdout is consumed eagerly at spawn or lazily at first
   `lines` read; what happens to stdout bytes nobody reads.
2. The lifecycle: spawn path (does it use `buildSpawn`?), `exit`/`close` handling, `stop` and
   `destroy` semantics, the `PROCESS_GRACE` default, stdin (`writable`, `send`, the `delivery`
   bound), stderr (the `stderr` text event: decode point, framing).
3. Generation or single-use: can one `Process` respawn, or is it one child per instance? What
   refuses a second start? What does mcp's stdio transport do about reconnect (one `Process`
   per connection?) — answer ONLY from process's own declarations and guide, not by reading
   mcp.
4. Constraints on a byte stream: where raw `Uint8Array` chunks could be surfaced (a `chunk`
   event on the event map? an `AsyncIterable` member beside `lines`?), whether `lines` and a
   byte stream could coexist on one child (readline consumes the stream — say what the code
   shows), and whether any existing option already selects stdout handling.
5. The event map and emitter composition (does `Process` follow the stateful-emitter pattern
   with `EmitterHooks` options?), and the guide's Surface/Methods table shape for the class.
6. The tests: which suites drive `Process`, with what fixtures (real children? scripts?), and
   the patterns a new capability's tests would mirror.
7. `package.json`: version, dependencies, scripts — confirm the fleet-standard gate chain.

## Return shape

- `Question`: one line.
- `Evidence`: concise facts grouped by the numbered items, with pointers.
- `Distillate`: the smallest context a designer needs to rule where the byte stream lives and
  what it must not break.
- `Unknowns`: unresolved facts.
- `Deviation`: only if something blocked the reading.
