# How to resume this campaign in a fresh session

This file is the entry point. Read it first, then `state.md` beside it, then `ROADMAP.md` at the
repository root. Everything else in `.orkestrel/` is evidence those three point into.

## What this campaign is

An LSP 3.18 specification audit across ten Orkestrel repositories that grew into an
implementation campaign. Its centre is `@orkestrel/lsp`, a new package that gives the fleet one
Language Server Protocol implementation so no consumer carries private framing, correlation, or
lifecycle code for a language server again. The audit's findings across the other packages
became the M, H, P, and W waves.

## The first commands to run

Read the live state rather than trusting any document's snapshot of it:

```sh
for r in lsp mcp markdown html workflow probe scaffold; do
  printf '== %s (%s)\n' "$r" "$(git -C /home/user/$r rev-parse --abbrev-ref HEAD)"
  git -C /home/user/$r status --short
  git -C /home/user/$r log --oneline -1
done
```

Then probe the Codex bench for liveness with a bounded round-tripped model call before planning
any routing, per `.agents/orchestration.md` § Execution loop. A version string and an
authentication check are not liveness.

## The branch rule

This repository works on `main`. Every other campaign repository works on
`claude/lsp-spec-audit-est33d`. Commit and push to those and no others.

## Where work is recorded

Every campaign artifact lives in THIS repository under `.orkestrel/`, one folder per package —
`lsp/`, `mcp/`, `markdown/`, `html/`, `probe/`, `workflow/` — with the cross-package record
under `.orkestrel/campaign/`. Never put a campaign artifact in the package it is about; a
published package's tree is its product.

A working directory does not survive a session boundary. Retain a brief, a report, a verdict,
an instrument, and its acceptance evidence into `.orkestrel/<package>/` as the unit is
dispatched and as it returns, and treat `tmp/` as a launch copy only.

## The standing user rulings

These are fixed priors. A round argues how, never whether.

- **mcp is 2026-07-28-native**, with an optional legacy wrapper for older revisions. The
  package's audit defects are addressed with full proof and evidence.
- **The lsp client pins the protocol it implements.** There is no compatibility mode for older
  servers; a server selecting outside the offer fails `start` with a `protocol` error.
- **Conformance tooling stays on the development side.** `vscode-languageserver-protocol` and
  the conformance runner are development dependencies, never runtime imports.
- **workflow's progress follows the mcp shape**, with `unit` removed. Landed.
- **The campaign record goes in the lsp repository**, nested per package. Landed.

## What only the user decides

- The M6 naming blessing — the mcp rename cascade, `SUPPORTED_CLIENT_PROTOCOL_VERSIONS` and the
  adapter family name included. Do not rename before it.
- The P3 `@typescript/native-preview` install.
- Publishing, at campaign end: the user's decision and the user's credential, run in layer order
  through the `orkestrel-publish` skill. Never substitute an API key, an access token, or a
  copied auth file, and never ask the user to paste a token into the conversation.

## The order the remaining work takes

`ROADMAP.md` § The campaign's end names it; `state.md` carries each unit's standing, its brief
path, and the ruling it implements.
