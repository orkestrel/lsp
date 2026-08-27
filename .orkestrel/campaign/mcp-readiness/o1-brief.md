# O1 — ecosystem reconciliation across mcp, probe, lsp

- **Role and engine**: `orkestrel`, native Sonnet.
- **Objective**: map the orkestrel dependency state across the mcp, probe, and lsp packages for a
  cross-package readiness campaign and the pending release wave.

## Context

- Read-only. Perform the assignment directly and spawn nothing.
- Repositories: `C:\Users\mikes\WebstormProjects\mcp`, `C:\Users\mikes\WebstormProjects\probe`,
  `C:\Users\mikes\WebstormProjects\lsp`, and `C:\Users\mikes\WebstormProjects\process` for the
  pending release context.
- Known state you verify rather than trust: lsp pins `@orkestrel/process` to a local tarball
  (`file:tmp/tarballs/orkestrel-process-0.0.6.tgz`) pending a process `0.0.7` release; lsp's
  published surface moved (a `StdioClientTransport` rename) and is unpublished; probe pins
  `@orkestrel/lsp` at `^0.0.3` and `@orkestrel/mcp` at `^0.0.25` from the registry.

## Tasks

1. Build the runtime dependency graph among `@orkestrel/*` packages for mcp, probe, and lsp:
   declared ranges versus installed versions (manifest, lockfile, installed
   `node_modules/@orkestrel/*/package.json`). Name drift.
2. mcp's runtime dependency on `@orkestrel/process` `^0.0.6`: which mcp source files import it and
   which exported surface they use (`file:line`). State the blast radius when process publishes
   `0.0.7`: which packages re-pin and republish, in what order, now that mcp sits in the wave.
3. probe's use of `@orkestrel/lsp` and `@orkestrel/mcp`: which files import them and which
   factories, classes, and types they consume (`file:line`).
4. Peer dependency posture: mcp's `router`/`server` peers versus its devDependencies; probe's
   `oxlint`/`typescript`/`vitest` peers. Name inconsistencies.
5. Derive the release order for the wave from runtime dependencies alone
   (process → mcp and lsp → probe, or as the graph actually reads). Flag any cycle or surprise.

## Scope

- Owned files: none. No edits, no web, no registry calls; reconcile from the trees alone, and mark
  registry-dependent facts as unknowns.

## Output

Return the report as your final message (you carry no Write tool): package map, import inventories
with `file:line`, drift findings, release sequencing, unknowns.

## Deviation contract

Stop and report if a named repository is missing or a lockfile contradicts its manifest in a way
you cannot read past. Ancillary reporting-shape choices are yours.

## Acceptance criteria

- Every import claim carries a `file:line` pointer.
- Declared-versus-installed drift is stated per package, including "none found" per package.
