# Audit brief: the codec extraction wave (round 3 of the codec chain)

You are an auditor. Attempt to REFUTE each numbered claim. CONFIRMED requires naming the
attack you tried that failed. A claim you cannot decide is UNRESOLVED, not CONFIRMED — say
what would settle it. You are read-only and cannot execute: rule from the diffs, the source,
the rule texts, and the executed evidence supplied below; where only a run would settle a
claim, return UNRESOLVED naming the run. Do not hedge toward an imagined consensus.

## Subject and chain

- Round 1: codec implementation (0524d8a). Round 2: audit FAIL -> fix (e5aaee3) closed with
  mutation probes; codec then took a typing fix (887f9cb, ArrayBuffer-backed decode
  declarations). This round's subjects, both written by Opus 5:
  - server extraction: commits `59a8e74` + `aaecb8c` in `C:\Users\mikes\WebstormProjects\server`
    (baseline `33b39c7`).
  - mcp extraction: commit `9986b0f` in `C:\Users\mikes\WebstormProjects\mcp`
    (baseline `95fb3e9`).
- This round decides whether the extraction wave is ACCEPTED — the last gate before the
  user's release call. A finding now is worth more than a clean pass.

## Review evidence

- Diffs: `git -C <repo> show <commit>` for each commit above. Status: both trees clean at
  those HEADs (Orchestrator-captured).
- Unit reports (writer-produced; treat their probe outputs as the writer's claims):
  `C:\Users\mikes\WebstormProjects\lsp\.orkestrel\codec\server-extract-report.md` and
  `mcp-extract-report.md`, with their dispatch briefs beside them.
- Codec ground truth: `C:\Users\mikes\WebstormProjects\codec` at `887f9cb`
  (guides/codec.md is the doctrine; the round-2 verdicts sit in
  `lsp\.orkestrel\codec\codec-audit-*.md`).

## Established — verified by the Orchestrator directly, do not re-run

- After the repack (887f9cb) was installed into both consumers: server `npm run check` exit
  0 and test:src 238 passed WITHOUT the WebCrypto copy; mcp `npm run check` exit 0 and
  test:src:core 881 passed. Both lockfiles carry the refreshed tarball.
- The writer-recorded red-then-green for the mcp sentinel refusal (exact failing assertion
  quoted in the report) and the server differential malleability probe are WRITER evidence;
  claims 2 and 4 name what would independently settle them if you cannot verify by reading.

## Numbered claims — attack each

1. **Server surface closure.** The four Base64 helpers left server's published surface
   entirely: no definition, no re-export, no remaining reference in server src, tests, or
   guides; nothing else left the surface with them. Attack by enumerating the barrel and
   grepping the tree yourself.
2. **Token behavior bounded.** On the token surface the ONLY behavioral delta is the
   malleability closure: a signature segment the host atob repaired (whitespace) now
   refuses; canonical tokens verify unchanged; payload-segment and garbage verdicts are
   unchanged. Attack by reading the old implementation at `33b39c7` against the new one and
   constructing a divergent input class the report does not name (e.g. other characters
   atob ignores, padding forms, unicode).
3. **Server containment exact.** After the narrowing, every remaining `try/catch` in the
   token functions wraps only operations that can throw, and every decode failure path is
   an `undefined` check. Attack by finding a throw path now uncontained or a catch that
   swallows what should surface.
4. **Sentinel rewire exact.** `decodeSentinel` differs from the old implementation ONLY in
   the payload grammar (canonical §4 vs regex+atob): OWS trim, marker handling, literal
   passthrough, fatal-UTF-8 refusal, and `encodeSentinel`'s emitted spelling are all
   unchanged. Attack the composition: a payload where regex+atob and codec DISAGREE outside
   the unused-bits class (whitespace inside the payload, `=` placement, length residues),
   and check each against both paths by reading; verify encode emits byte-identical output
   for every reachable input.
5. **`isStandardBase64` scope.** Its remaining call sites are exactly the validators' JSON
   Schema `byte` checks; the sentinel no longer reaches it; no validator behavior moved.
   Enumerate the call sites yourself.
6. **Guides true.** The changed sentences in `guides/mcp.md` (sentinel grammar, the two
   dependency claims) and `guides/server.md` (four rows removed) are accurate against the
   shipped code; no sentence elsewhere in either guide became false through these changes
   (attack: grep both guides for base64/Base64/sentinel/token claims and read each).
7. **Pins and blast radius.** Both manifests pin `file:tmp/tarballs/orkestrel-codec-0.0.1.tgz`
   (git-ignored), the diffs touch nothing outside the briefs' owned files plus
   manifest/lockfile, and no vendored file moved. Attack by reading the diffs' file lists
   against the briefs' scopes.
8. **Shippable as wave members.** With the release re-pin (`^0.0.1`) substituted for the
   tarball ranges, is anything in either tree unready — a stale doc, a dead symbol, a test
   that pins the tarball path, a guide sentence that names tmp/? The whole-tree claim.

## Unknowns

- Whether any external (non-fleet) consumer imported server's deleted helpers: unknowable
  from these trees; state it, do not chase it.

## Verdict shape (exactly this)

Numbered verdicts 1-8 (CONFIRMED with the failed attack / BROKEN with the exact input and
smallest fix / UNRESOLVED with what settles it / NOT-EVIDENCED with the missing capture);
findings fitting no claim to the BROKEN standard; one terminal line
(`VERDICT: PASS — ...` / `VERDICT: FAIL — ...`). No process diary.
