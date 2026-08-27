---
paths:
  - 'src/**/*'
  - 'app/**/*'
  - 'configs/**/*'
  - 'tests/**/*'
  - 'scripts/**/*'
  - 'guides/**/*'
  - 'package.json'
  - '.gitattributes'
  - '.github/workflows/*'
---

# Host portability rules

Published source runs on Windows and Linux. Write one implementation that is correct on each host,
or gate the host-specific branch on the host that needs it.

Take the test half from `.claude/rules/tests.md`: it governs a host-varying property inside a test
and the form of a conditional skip.

## Host branching

- Branch on a capability a runtime probe answers — a returned value, a thrown code, a present
  member — wherever the difference is detectable.
- Branch on `process.platform` only where the behavior is platform-defined, and name that fact in
  the symbol's `@remarks`.
- Put a platform-literal table — install root, executable suffix, toolchain name — inside a
  `process.platform` branch, and read it on that platform alone.
- Never flatten a correctly-gated host branch into a single path, and never relax a fail-closed
  check to make one host pass.

## Line endings

- Split arrived text on `/\r\n|\n/`. Never split on `\n` alone, and never split on a bare `\r`.
- Split first, then trim each line; trimming the whole payload leaves a `\r` on every line but the
  last.
- Frame a named protocol — HTTP, LSP, RFC 6455, NDJSON — with the terminator that protocol fixes,
  and leave that terminator alone.
- Emit `\n` from code this package owns. Never emit `os.EOL`.

## Paths

- Normalize each operand of a path comparison with the same normalizer before comparing.
- Never case-fold a containment check. Fold a lookup key only by the file-name case sensitivity the
  consumer declares, and fold the whole key when you fold at all.
- Compose, split, and relativize a host path with `node:path`. Never concatenate a separator
  literal.
- Keep a storage key, an archive key, and a URI path slash-separated, and refuse `\` and a drive
  prefix inside one.
- Refuse the Windows reserved device names and the filename characters Windows rejects, on every
  host.
- Read the temporary directory from `os.tmpdir()`. Never write a `/tmp` literal in source.
- Build a `file:` URI with `pathToFileURL`. Never format one from a path string.

## Processes and executables

- Resolve, spawn, and terminate a child through `@orkestrel/process` where the package declares it.
- Where it is not declared, spawn `process.execPath` with a JavaScript entry. Never spawn a `.bin`
  shim, and never add `shell: true` to reach one.
- Take a resolver's first match only after splitting its output into lines and trimming each one.
  `where` prints a match per line and can name a file that is not an executable.
- Treat `fs.constants.X_OK` as an existence check on Windows, where `accessSync` passes on a plain
  file. Confirm an executable by its name and its file type instead.
- Read an `fs.constants` member before putting it in a flag word. Windows leaves `O_NOFOLLOW`
  undefined, so `O_WRONLY | O_NOFOLLOW` refuses nothing there. Never polyfill the missing member:
  compensate with a check the host supports, or record the limit.
- Read `PROGRAMFILES`, `LOCALAPPDATA`, and `APPDATA` inside the win32 branch and `HOME` inside the
  POSIX branch. Never read one host's root on the other.
- Terminate a Windows child by its process tree. A `SIGTERM` handler never runs there, so gate every
  cooperative-shutdown path on POSIX.
- Treat a permission bit as advisory on Windows: a written mode does not round-trip
  (`chmodSync(dir, 0o500)` reads back `0444` there), so assert modes only where a probe reports they
  round-trip.
- Retry an `EBUSY`, `ENOTEMPTY`, or `EPERM` removal inside a bounded budget, and report the failure
  when the budget ends.

## Terminals

- Gate styling and interactivity on `isTTY`, `NO_COLOR`, and `FORCE_COLOR`, never on the platform.
- Decode `\r`, `\n`, and `\r\n` from a key stream as the same key.
- Never call a Windows console-mode API. Node exposes none, so record the unreached behavior as a
  limit.

## Scripts and packaging

- Write every `package.json` script as a portable command: a Node invocation or an installed binary.
  Never name a `.sh` file there.
- Keep `#!/usr/bin/env node` on an npm bin. npm writes the Windows shim from it.
- Keep an agent hook under `scripts/` in bash, and keep `.gitattributes` `eol=lf`.

## Claims

- Never describe the suite, the host, or CI as POSIX. Name the host and the date behind a reading.
- Run the gate chain on each host a change claims, and record a reading that could not run as a
  limit naming the host it needs.
- Keep a POSIX-shaped `file:///` literal in a guide only as an opaque fictional identifier. Build
  any example a reader executes with `pathToFileURL`.
