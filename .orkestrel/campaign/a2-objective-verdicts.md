**FAIL — claims 1 and 2 BROKEN.**

Containment: before and after, both repositories were clean.

| Capture | lsp `61d9a3a` | process `b07ba7f` |
| --- | --- | --- |
| Before `git status --porcelain` | empty | empty |
| Before `git diff --stat` | empty | empty |
| After `git status --porcelain` | empty | empty |
| After `git diff --stat` | empty | empty |

No residual change. Seeded files restored: lsp `StdioClientTransport.ts` digest `dfb327641ab64ff06746549eb98805d603cb7567f063e807de22dc76fb904af4` (MATCH); process `Supervisor.ts` restore MATCH.

---

### 1. P1a preserved every `Process` behavior — **BROKEN**

Failing input: `createProcess({ command: { file: '', arguments: [] }, workspace, backlog: 0 })`.

Executed: `node tmp/cursor/a2/attacks-process.mjs` → dual-invalid throws `Invalid option 'backlog'` (`code: 'invalid'`, `value: 0`). Command-only throws `Invalid command file`. Backlog-only throws `Invalid option 'backlog'`.

At `23808f2`, `Process` validated command, workspace, grace, drain, delivery, evidence, then backlog (`p1a-report.md` diff). Now `Process.ts` validates backlog first (`validateBytes` at `Process.ts:67-70`) and only then constructs `Supervisor`, which validates the rest (`Supervisor.ts:136-141`). Two invalid options now report backlog instead of command.

Named vectors that held under the same script and `node tmp/cursor/a2/run-suite.mjs … src:server` (process: 8 files, `169 passed | 6 skipped (175)`):

- delivery bound: `Process.send` of a 4 MiB payload with `delivery: 50` settled `false` in 73 ms while `code`/`signal` stayed null
- evidence truncation: 16-byte tail `ence-secret-tail`
- concurrent `stop` barrier: three calls returned the same promise
- drain window: suite drain/orphan rows green; Session descendant probe under claim 5

Smallest fix: in `Process`’s constructor, run the engine validators in the `23808f2` order, then `validateBytes(backlog)`, then construct `Supervisor` from a plain literal (as `Session` already does) so getters are not re-run after a refusal.

---

### 2. P1b’s ended-channel guard is unreachable from `Process` — **BROKEN**

The deliver argument is true and insufficient. `Process.send` on a construction-ended channel does not register a write callback (`writable: false`, `writableEnded: true`, `send` → `false`, no `error`). `writable: true` plus `stop` destroys stdin; `writableEnded` stays false; pending write settles `false` with no `error`.

The guard is still reached from `Process`. Seed-removed

```
if (this.#child.stdin.writableEnded) { this.#settleWrites(); return }
```

from `Supervisor.#failInputCallback` (`Supervisor.ts:438-441`), then `Process.test.ts` went red at `keeps an ended channel quiet after its input phase settles and a later host fault arrives` (`Process.test.ts:249-267`): `errors.count` was not 0. The Session quiet row reddened the same way. Restore MATCH.

Path: constructor `input` of 4 MiB plus default `writable !== true` (`stdin.end()`), child exits, stream fault after `#input` hits 0. `#failInputStream` now forwards to `#failInputCallback`, where the moved `writableEnded` check lives. That is a `Process` consumer, not `Session.end()`.

This is not a silent `Process` behavior change versus P1a (the same quieting used to sit on `#failInputStream`). The unreachability claim is false. The guard is load-bearing for the existing `Process` row.

Smallest fix: keep the guard; correct the P1b reachability argument to name this constructor-input stream-error path.

---

### 3. `Session` stdout contract — **CONFIRMED**

`attacks-process.mjs` payload `[0, 1, 255, 254, 13, 65, 10, 66, 128, 0]` (NUL, invalid UTF-8, CR, LF, unterminated): concatenation matched; emitted view was a plain `Uint8Array`, not a `Buffer`; `byteOffset === 0` and backing length equalled the chunk; mutating it filled only that buffer; order was `stdout` then `exit` with no later `stdout`. Process `Session.test.ts` fidelity/ownership/after-exit rows included in the green server suite.

---

### 4. `end` is not termination; barrier holds under races — **CONFIRMED**

Same script: double-`end` shared one promise; `end` on `sleep` left `stopping: false`, `settled: false`, `code: null`; `end` then self-exit on echo `{ code: 0, drained: true }` with `stopping: false`; `end` then `stop` confirmed; `end` after `stop` was a no-op; pending 4 MiB write plus `end` settled `false` with zero `error` events; concurrent `end`+`stop` completed. Suite `Session end` describe green.

---

### 5. `ending` settles at native exit strictly before `exit` when a descendant holds the pipe — **CONFIRMED**

Orphan child, drain 400 ms: at `ending`, descendant pid 9400 still running, `settled: false`, `code: 0`, `signal: null`; `exit` still pending 150 ms later; then `exit` `{ code: 0, signal: null, drained: false }`. Facts agreed at both moments. Suite orphan row green.

---

### 6. L1 preserved every documented transport obligation — **CONFIRMED**

Suites: lsp `src:server` `20 passed (20)`; `guides` `27 passed (27)`; `conformance` `243 passed (243)`.

- Timeout-coded unconfirmed stop / unretired generation: this host’s `stop()` confirms (taskkill). Seeded `if (!stopped)` → `if (true)` after `await session.stop()`; stubborn peer `close()` threw `timeout`; `start()` threw `duplicate`; transport `exit` count stayed 0 (`#conclude` returns while `#closing` is set, `#retire` never ran). Native `stop() === false` was not produced. Restore MATCH.
- Retired-generation silence before the next `start`: unprompted exit then 200 ms wait — no extra `chunk`/`error`, `send` false, next `start` allowed. Holder: `close()`, release grandchild without `start`, leaked chunks `[]`.
- Cooperative phase bounded by one `grace` when the child stops reading stdin: sleep fixture, unawaited 4 MiB `send`, `close()` with `grace: 200` finished in 351 ms, child reaped, pending send `false`. Session-level race against a 200 ms deadline finished in 204 ms.

---

### 7. Campaign scope is honest — **CONFIRMED**

- lsp `package.json` / `package-lock.json`: only commit `8307f2c` (`git log c9537f2^..HEAD -- package.json package-lock.json`). Swap sets `"@orkestrel/process": "file:tmp/tarballs/orkestrel-process-0.0.6.tgz"`; lockfile `resolved` is that tarball.
- process `package.json`: `git diff 23808f2..b07ba7f -- package.json` empty. `Process.test.ts` empty in that range.
- Banned constructs: `node tmp/cursor/a2/banned.mjs` over added lines in `23808f2..b07ba7f` (process `*.ts`/`*.mjs`) and `c9537f2..61d9a3a` plus the swap commit (lsp) — no `any`, assertions, ts-suppressions, or `oxlint-disable` in non-comment added lines.
- `guides/probe.md`: blob `67d8dfe39e0a13c7daddd958671a35caea3c0d5d` at `c9537f2~1`, `c9537f2`, `8307f2c`, `61d9a3a`, and HEAD.

---

Executed: `git status --porcelain` / `git diff --stat` (before and after, both repos); `git rev-parse` / `git log` / `git diff` / `git show` for the named commits; `node tmp/cursor/a2/attacks-process.mjs`; `node tmp/cursor/a2/banned.mjs`; `node tmp/cursor/a2/run-suite.mjs` for process `src:server` and `guides`, lsp `src:server`, `guides`, and `conformance`; `node tmp/cursor/a2/run-transport.mjs`; `node tmp/cursor/a2/run-flush.mjs`; `node tmp/cursor/a2/run-timeout-seed.mjs`; `node tmp/cursor/a2/run-guard-seed.mjs`.

FAIL — 1, 2 BROKENThat background probe is the first end-flush run that blocked on a 4 MiB `send` to a child that never read stdin. It was killed (exit 1), rewritten so `close()` is raced against a deadline, and the retry held: close finished in 351 ms with grace 200. Those results are already in the audit verdict.
