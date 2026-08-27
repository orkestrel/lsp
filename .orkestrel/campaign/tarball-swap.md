# Tarball swap record — @orkestrel/process into lsp, 2026-08-27

- **Replaced range**: `"@orkestrel/process": "^0.0.6"` in lsp `package.json` dependencies.
- **Replacement**: `"file:tmp/tarballs/orkestrel-process-0.0.6.tgz"` — the packed build of the
  process repository at `b07ba7f` (Supervisor extract `5fabc07` plus the Session face), installed
  (never linked) so the pack, `files` list, and exports map are what lsp consumes. The installed
  declarations carry `createSession` and the `Session*` types (verified).
- **Instrument**: `tmp/swap/tarball-swap.sh` (retained as `tarball-swap.sh` beside this record)
  rebuilds, repacks, and reinstalls; re-run it whenever the process source moves — a stale
  tarball is a stale `dist/`.
- **Restoration obligation, release order**: `@orkestrel/process` publishes `0.0.7` first; lsp
  then restores the dependency to `"^0.0.7"`, reinstalls from the registry, re-runs its gates
  against the registry artifact, and only then runs any distribution proof or publish. The
  tarball lives under git-ignored `tmp/` and is never committed; this record and the U7 ROADMAP
  row carry the obligation.
