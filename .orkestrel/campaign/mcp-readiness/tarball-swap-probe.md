# Tarball swap record — the wave into probe, 2026-08-27

The user directed the campaign not to wait for publishing and to use the tarball method. probe
now consumes the unpublished wave locally.

- **Replaced range**: `"@orkestrel/lsp": "^0.0.3"` in probe `package.json` dependencies.
- **Replacement**: `"file:tmp/tarballs/orkestrel-lsp-0.0.3.tgz"` — packed from the lsp
  repository at `dfbdaca` (the `StdioClientTransport` rename over the process Session face).
  For the pack, lsp's own process range was temporarily set to `^0.0.6` so the packed manifest
  carries a registry-shaped range; the `file:` pin was restored immediately after and lsp's tree
  verified clean.
- **Added**: an `overrides` entry routing every `@orkestrel/process` resolution to
  `file:tmp/tarballs/orkestrel-process-0.0.6.tgz` — the packed process at `5365c51` (Session
  face; `0.0.7` content labeled `0.0.6`), copied from lsp's recorded tarball. The override also
  reaches mcp's transitive process dependency inside probe, which is the truthful preview of the
  release wave: the byte-stream campaign proved `Process` unchanged there.
- **Verified at install**: `node_modules/@orkestrel/lsp/dist/src/server/index.d.ts` declares
  `createStdioClientTransport`; the installed process serves `createSession` as a function.
- **Instruments**: `lsp/tmp/pack-lsp.sh` (pack) and `probe/tmp/probe-swap.sh` (copy, install,
  verify). Re-run the pair whenever the lsp source moves — a stale tarball is a stale `dist/`.
- **Restoration obligation, release order**: `process` publishes `0.0.7`; `lsp` restores its
  process range to `^0.0.7`, bumps, and publishes; `mcp` re-pins process `^0.0.7`, bumps with
  its campaign surface changes, and publishes; probe then deletes the `overrides` entry,
  restores `@orkestrel/lsp` to the published rename release, reinstalls from the registry,
  re-runs its gates against registry artifacts, and only then runs any distribution proof or
  publish. The tarballs live under git-ignored `tmp/` and are never committed.
