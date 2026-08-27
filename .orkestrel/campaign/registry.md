# Campaign registry — transport naming and the process byte-stream gap, 2026-08-27

## Goal

Two user-ordered outcomes. First, rename lsp's stdio transport family to the mcp client-half
convention (`StdioClientTransport`, with the deferred rows renamed to `SocketClientTransport`
and `WebSocketClientTransport`). Second, close the carried process finding: give
`@orkestrel/process`'s supervised child a raw byte-chunk stream, then adopt it in lsp's stdio
client transport so the transport drops its direct `node:child_process` use — lsp is the
capability's first real consumer, which is what the creation gate requires.

## Authoritative session

This session (the lsp Orchestrator). One authoritative session per package: this session owns
writes in `orkestrel/lsp` and `orkestrel/process` for this campaign's scope.

## Repositories

| Repository | Branch | HEAD at registry | Dirty | Version |
| ---------- | ------ | ---------------- | ----- | ------- |
| `orkestrel/lsp` | `main` | `0d72cce` | campaign artifacts only | `0.0.3` (bump obliged at release: the campaign moved the published surface) |
| `orkestrel/process` | `main` | `23808f2` | clean | `0.0.6` per catalog |
| `orkestrel/mcp` | `main` | read-only reference | — | `0.0.25` |
| `orkestrel/probe` | `main` | NOT written this campaign | — | `0.0.9`; adopts the lsp rename at its next re-pin |

## Dependency edges in scope

`lsp` runtime-depends on `process ^0.0.6` (a pin per the fleet's caret convention). The
byte-stream adoption makes lsp consume an unpublished process build during development: build
and pack process, install the tarball into lsp, record the replaced range, and restore the
registry copy before any distribution proof or publish. Blast radius at release: process bumps
and publishes first; lsp re-pins, bumps (surface moved by the rename regardless), and
publishes; probe re-pins lsp and adopts `createStdioClientTransport`.

## Units and write scope

| Unit | Repository | Subject | Role / engine |
| ---- | ---------- | ------- | ------------- |
| R1 | lsp | stdio transport family rename + deferred-row renames | `builder` / Sonnet (fully specified) |
| G6 | process (read-only) | Process supervisor absorption for the byte-stream design | Grok (bench) |
| D3 | — | byte-stream API design round | planner (Opus) + Grok objective, blind |
| P1 | process | implement the ruled byte-stream capability | `implementer` / Opus (Sol excluded) |
| L1 | lsp | adopt Process in `StdioClientTransport` over a packed process tarball | `implementer` / Opus |
| A2 | — | audit round over P1 + L1 | Grok objective + reviewer + checker |
| U7 | lsp | consolidated ROADMAP rows (rename, adoption, bump obligations) | `implementer` / Opus |
| V2 | both | authoritative gates, process then lsp (topological order) | `verifier` / Sonnet |

## Exclusions

- `guides/probe.md` in lsp is a vendored mirror carrying the old factory name; never hand-edit —
  it refreshes when probe republishes after adopting the rename.
- No probe writes; probe's adoption is a carried obligation.
- The scaffold complexity-rule adoption belongs to the scaffold session (prompt handed to the
  user), not this campaign.

## Exit criterion

R1's rename is complete with no old name anywhere in lsp's owned (non-vendored) tree; the
process byte-stream capability exists with its guide parity and tests, lands behind the D3
ruling and the A2 audit; lsp's `StdioClientTransport` consumes it with the stdio suite,
integration, and conformance green; lsp's manifest either re-pins a published process release or
documents the tarball state and its restoration; both repositories' gate chains read green
topologically under the verifier; the ROADMAP records the delivered rows and the release-order
obligations.
