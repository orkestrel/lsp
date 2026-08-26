# Unit L5-A — vendor the LSP 3.18 metaModel mirror and its refresh mechanism

Role and engine: `builder`, Sonnet, native subagent, sole writer in `/home/user/lsp`. You
perform this assignment directly and spawn nothing. The work is fully specified; where
reality diverges, stop and report rather than improvising.

Before working, read in order: `/home/user/lsp/AGENTS.md`; the applicable rules —
`.claude/rules/documentation.md` (the vendored-mirror law), `.claude/rules/writing.md`,
`.claude/rules/workspace.md`; no skill binds this unit; the guide `guides/lsp.md`.

## Objective

The LSP 3.18.0 metaModel instance is committed as a byte-exact mirror at
`tests/fixtures/metaModel.json`, reproducible by a committed refresh script, and the guide
names the tracked protocol version, the refresh procedure, and the conformance boundary
sentence.

## Context

Baseline: lsp commit `6690bc7`, tree clean at dispatch. The design round's reconciliation
(`.orkestrel/campaign/l5-design-reconciliation.md`) fixes this unit's shape; the follow-on
L5-B unit builds the conformance suite over the fixture you land.

- The verified bytes: SHA-256
  `caae8df639a4248520a3f589fd72945365e9d8ebca5baf564161a515430d9d41`, 434,788 bytes,
  `metaData.version` `3.18.0`. A byte-identical staged copy sits at
  `/home/user/scaffold/tmp/cursor/sources/lsp-3.18-metaModel.json` (the Orchestrator
  hashed it and an independently fetched copy on 2026-08-26; they are identical).
- The canonical source URL:
  `https://microsoft.github.io/language-server-protocol/specifications/lsp/3.18/metaModel/metaModel.json`.
- `/home/user/lsp/scripts/` exists (`codex.sh`, `cursor.sh`, `deps.sh`, `ollama.sh`);
  `tests/fixtures/` does not exist yet and this unit creates it.
- The mirror law: fetched bytes stay bytes — no reformatting, no comments, no trailing
  newline the fetch did not produce.
- Host environment: Linux container, Node and npm on PATH, network AVAILABLE to you
  through the preconfigured proxy (`curl` works as-is).

## The work

1. Write `scripts/metamodel.sh`, matching the repository's script conventions you observe
   in the existing `scripts/*.sh` files: it fetches the canonical URL to a temporary path,
   prints the fetched file's SHA-256 and its parsed `metaData.version`, and moves it to
   `tests/fixtures/metaModel.json` only when the parse succeeds. The script is the refresh
   mechanism and carries the source URL; it takes no arguments.
2. Produce `tests/fixtures/metaModel.json` by running the script. Verify the landed file's
   SHA-256 equals the pin above and its byte length equals 434,788. If the fetch fails or
   the digest differs, copy the staged bytes from the path above instead, verify the same
   digest, and report the fetch outcome as a deviation observation — upstream drift
   between the Orchestrator's fetch and yours is a finding, never something to absorb.
3. Add to `guides/lsp.md`, where the guide's structure best carries it (yours to decide
   and record): a short conformance passage naming Language Server Protocol 3.18 as the
   tracked version, the mirror at `tests/fixtures/metaModel.json` as fetched bytes
   refreshed by the `scripts/metamodel.sh` script, and the boundary sentence — the
   conformance proof covers the subset of the protocol this package speaks, and the
   diagnostic surface is the string-message form matching the client's advertised
   capability. Follow the writing rules; no counts, no `should`.
4. If `guides/README.md`'s concept index owes a row or path for the conformance proof per
   its existing shape, add the smallest true entry; if its shape carries nothing for it,
   leave the file untouched and say so.

## Scope

Owned files: `tests/fixtures/metaModel.json`, `scripts/metamodel.sh`, `guides/lsp.md`,
`guides/README.md`.

Off-limits: everything else — `src/**`, all other `tests/**`, `vite.config.ts`,
`package.json`, the lockfile.

Allowed tools: read, edit, write, and scoped shell commands in `/home/user/lsp`. No commit,
no push, no `git checkout`/`restore`/`stash`/`reset`/`clean`, no tree-wide `format` or
`lint --fix`.

## Execution

You are a native subagent: do the work yourself, directly, and spawn nothing. Run scoped
checks only; the Orchestrator takes the authoritative gates on the host after you exit.

## Output

Your final message is the unit report, in this shape and nothing else:

1. What changed: each owned file with the exact delta, quoting the guide passage.
2. The fetch outcome: the script's printed digest and version, the landed file's SHA-256
   and byte length, and whether the staged-copy fallback ran.
3. Scoped gate readings with exit codes: `npx oxfmt --check` over the owned prose and
   script files it accepts, `npx oxlint --deny-warnings` likewise, and `git diff --check`.
4. Observations outside scope, each named against the capability that owns it.
5. Claims you flag as needing host verification.

No process diary.

## Deviation contract

A conflict with the primary objective stops the unit: report expected, found, exact
evidence, done or not done, and at most one short hypothesis. The named stop conditions:
the fetched and staged digests both fail the pin; the guide cannot carry the passage
without contradicting an existing sentence. Ancillary conflicts — where the passage sits,
the script's exact echo format — are yours to decide, record, and carry on from.

## Acceptance criteria

Ordered cheap-first.

1. `tests/fixtures/metaModel.json` exists, parses as JSON, `metaData.version` reads
   `3.18.0`, SHA-256 equals the pin, and the byte length is 434,788.
2. `scripts/metamodel.sh` names the canonical URL and the destination path, and running it
   reproduces the file byte-identically (or the fetch-outcome deviation is reported).
3. The guide passage names the tracked version, the mirror path, the refresh script, and
   the subset boundary.
4. Scoped `oxfmt --check`, `oxlint --deny-warnings`, and `git diff --check` over the owned
   files exit 0.

## Review evidence

The Orchestrator captures the actual diff and the actual `git status` output after you
exit; your report's claims are audited against them. Flag any claim you could not close
rather than rounding it up.
