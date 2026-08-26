# G1 round verdict — 2026-08-26

The `checker` lane (Sonnet, native, read-only) ruled on the four G1 units against
Orchestrator-captured diff and status evidence (`g1-<repo>-evidence.txt`) and the units' own
reports. Every claim in every repository returned CONFIRMED; its terminal line:

```text
VERDICT: PASS — every claim confirmed in every repository
```

Per-repository readings the Orchestrator accepts on:

- **queue** — the CUT clause at `guides/queue.md:149` now carries the reason: progress belongs
  to the job the queue runs and reaches the consumer through the job's own contract; the queue
  observes lifecycle only. `format:check` exit 0; `test:guides` exit 0, 23 passed.
- **process** — the passage at `guides/process.md:269` states that the line stream is the
  package's progress surface and no separate progress channel exists. `format:check` exit 0;
  `test:guides` exit 0, 100 passed with 1 pre-existing skip the report flags as unrelated.
- **tool** — the mechanism-only blockquote at `guides/tool.md:20-25` states that progress
  reporting is a property of the invoking consumer's execution context, one layer up, never of
  the tool contract; the mcp package name stays unbackticked per the parity constraint.
  `format:check` exit 0; `test:guides` exit 0, 23 passed.
- **middleware** — the passage at `guides/middleware.md:679-680` states that multipart
  processing reports no progress and that a consumer's upload-progress request is the condition
  under which a reporter callback would join `MultipartOptions`; no key or option is presented
  as live. `format:check` exit 0; `test:guides` exit 0, 33 passed.

Lanes that did not run, on the record: the `reviewer` and `analyst` lanes. Each unit is a fully
specified taste-free `builder` unit whose acceptance criteria are mechanical — the audit step
routes such a unit to the `checker`, and the ruling substance was fixed by the campaign audit's
adversarial pass before dispatch (`audit.md:120-155`, both design lanes), so no engine judged
its own work. Final acceptance: the Orchestrator, on this verdict and the captured evidence.
