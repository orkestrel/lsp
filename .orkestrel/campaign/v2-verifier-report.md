# V2 — topological gate evidence, verifier / Sonnet, 2026-08-27

Both repositories, dependencies first, each gate a bare command with its real output read.

## process at `5365c51`, clean

| Gate | Exit | Summary |
| ---- | ---- | ------- |
| `format:check` | 0 | 151 files, all correctly formatted |
| `lint:check` | 0 | no violations under `--deny-warnings` |
| `check` | 0 | root and scoped `tsc --noEmit`, no diagnostics |
| `build` | 0 | core and server bundles plus declarations |
| `test` | 0 | src 174 passed, 6 skipped; policy 93; config 46; setup 10; guides 106 passed, 2 skipped |

## lsp at `7a38867`, clean

| Gate | Exit | Summary |
| ---- | ---- | ------- |
| `format:check` | 0 | 154 files, all correctly formatted |
| `lint:check` | 0 | no violations under `--deny-warnings` |
| `check` | 0 | root and scoped `tsc --noEmit`, no diagnostics |
| `build` | 0 | core and server bundles plus declarations |
| `test` | 0 | src 159; policy 110; setup 13; config 46; guides 27; conformance 243 |

GREEN — every gate in both repositories, single attempts, no anomalies.

# Acceptance

The Orchestrator accepts the campaign on this evidence, 2026-08-27. The registry's exit criterion
is closed on every row: the rename is complete with the old names surviving only in the vendored
mirror that refreshes at probe's re-pin; the `Session` capability exists behind the D3 ruling and
the A2 audit with its guide parity and real-child tests; `StdioClientTransport` consumes it with
the transport suite, integration, and conformance green; the manifest documents the tarball state
with its restoration recorded in `tarball-swap.md` and the ROADMAP's release-order paragraph; and
both gate chains read green topologically under an independent verifier. Publishing remains the
user's decision; the release order is recorded. The campaign folder is retained; its prune is the
owner's call per the debrief procedure.
