## Question

Which ROADMAP “Fleet findings carried forward” rows are already on the owning repo’s `main`, which stay open, and which cannot be verified from here?

## Evidence

| Finding | Verdict | Pointer |
| --- | --- | --- |
| scaffold — session-assembly duplication | **open** | `HOST_PATHS` still vendors the instruction set (`scaffold/src/core/constants.ts:124-159`). `PROPOSAL.md:1-8` and `:110-121` record a 2026-08-26 proposal; slimming is refused; attach-scoping is complementary, not landed. `main` = `origin/main` = `825c4640` (`0.0.55`). Reflog after clone: `0.0.54`, host-portability sweep, campaign-closure record, `0.0.55`. |
| scaffold — inert `.oxlintignore` under oxlint 1.80.0 | **open** | File still present (`scaffold/.oxlintignore:1-20`). Still vendored (`host.json` storage `dotfiles/oxlintignore`; `HOST_PATHS` at `constants.ts:155`). Lint scripts have no `--ignore-path` (`package.json:65,73`; `compilers.ts:312-313`). Exclusion lives in rc `ignorePatterns` (`scaffold/.oxlintrc.json:3`). Lockfile still pins oxlint 1.80.0. |
| fleet — guides-execution gap | **open** | `markdown/tests/guides.test.ts:1-3` still: “The four constants below…”. Drop-in still resolves names via `fenceImports` (`:142-151`) and never executes a fence. File ends after link checks (`:154-170`). Contrast: `mcp/tests/guides.test.ts` and `scaffold/tests/guides.test.ts` have executed-fence sections; markdown does not. markdown `main` = `origin/main` = `fdd5f55d` (`0.0.12`). |
| mcp — transport-ingress backpressure | **open** | Still named as the unimplemented closer (`mcp/guides/mcp.md:4023-4025`, `:4036-4038`). `MCPClientTransportInterface.send` still takes only `message` (`mcp/src/core/types.ts:2266`). mcp `main` = `origin/main` = `7c73772d` (“Add the Windows CI axis”). Reflog after clone: `0.0.25`, then that CI commit. No commit names the capability. |
| mcp — `below`/`above` file-wide sweep | **open** | Did not run. Writing law: `scaffold/.claude/rules/writing.md:51-52`. Hits remain in mcp guides (`guides/mcp.md:246,717,1039,…`; `guides/websocket.md:101,196`; `guides/tool.md:157`; plus `test.md` / `server.md` / `router.md` / `process.md` / `scaffold.md` / `sse.md` / `emitter.md` / `contract.md`). Same words remain in tests and src. |
| markdown — vocabulary sweep | **open** | Exact sites still hit: `via` at `guides/markdown.md:158,194,227,453`, `src/core/helpers.ts:2669`, `src/core/parsers.ts:193`. Imperative TSDoc openers still at `helpers.ts:434` (“Split one GFM table row…”) and `:500` (“Derive the per-column…”). |
| markdown — CommonMark `U+0000` replacement | **open** | No ruling in markdown src. `splitLines` (`helpers.ts:87-109`) does not replace `U+0000`. No `U+0000` / `FFFD` in `markdown/src`. Parser tests do not cover NUL replacement. html’s NUL→`U+FFFD` lives only in the vendored html mirror (`markdown/guides/html.md:181,204,243`). |
| markdown and html — reused-identity engine divergence | **open** | Still divergent. html `walkNodes` / `rewriteDocument` use `WeakSet` identity (`html/src/core/helpers.ts:1188-1193`, `:1321`). markdown `walkNodes` / `rewriteDocument` walk without a visited set (`markdown/src/core/helpers.ts:2628-2665`, `:2873-2891`). html tests pin diamond identity (`html/tests/src/core/helpers.test.ts:1308`). No commit names a reconciliation. html `main` = `origin/main` = `ddd2433a` (`0.0.7`). |
| html — spans-to-markdown inbound projection | **open** | `html/src` has no `markdown` symbol. `htmlToMarkdown` lives in markdown and returns only a document, no span map (`markdown/src/core/helpers.ts:2551-2606`). html’s `HTMLParseResult` spans stay in html (`html/src/core/types.ts:173-176`). |
| html — barrel membership of `findOpenPosition` and `projectDepth` | **shipped** on html `main` `ddd2433a` | Exported from helpers (`html/src/core/helpers.ts:103`, `:135`) with `@orkestrel/html` examples. Barrel re-exports helpers (`html/src/core/index.ts:5`). Surface rows in `guides/html.md:102-103`. `tests/guides.test.ts:38` `INTERNAL` is empty, so they are not stranded. Introducing commit not in the local reflog (clone `a533947f`, then `0.0.7`). |
| probe — RuntimeStage frame-basis / un-remapped Vitest stacks | **open** | Still lowers Vitest’s 1-based `stacks[].column` by one (`probe/src/server/stages/RuntimeStage.ts:921-926`). Pin still expects stored character `15` (`RuntimeStage.test.ts:163-200`). Guide still states the runtime stage lowers a Vitest frame by one (`guides/probe.md:771`). Vitest still `^4.1.11` (`probe/package.json:114`). probe `main` = `origin/main` = `bd4bb70a` (`0.0.9`). Reflog: pull, `0.0.8`, overlay case-sensitivity, `0.0.9`. `p2-settle-instrument.sh` is absent under `WebstormProjects` (campaign pruned, as `lsp/ROADMAP.md:151-153` says). |

Sibling `main` vs `origin/main` (SHA equality): scaffold, mcp, markdown, html, probe match. lsp local `main` `1d351fba` is ahead of `origin/main` `2c0eba82`; the fleet-findings section is in this lsp checkout at `ROADMAP.md:123-153`.

## Distillate

**Strike** (shipped on owning `main`):

- html barrel membership of `findOpenPosition` and `projectDepth` — keep the rest of that bullet.

**Keep** (still open on owning `main`):

- scaffold session-assembly duplication
- scaffold inert `.oxlintignore` / `--ignore-path`
- fleet guides-execution gap (`markdown/tests/guides.test.ts` drop-in unchanged)
- mcp transport-ingress backpressure
- mcp `below`/`above` file-wide sweep
- markdown vocabulary sweep (named `via` / TSDoc sites still hit)
- markdown CommonMark `U+0000` replacement question
- markdown and html reused-identity engine divergence
- html spans-to-markdown inbound projection
- probe RuntimeStage Vitest un-remapped frame basis

## Unknowns

- Introducing commit for `findOpenPosition` / `projectDepth` (present at html HEAD `ddd2433a`; not named in the post-clone reflog).
- Whether oxlint 1.80.0 gained `.oxlintignore` support later than this pin; the scripts still do not pass `--ignore-path`.
- Whether a Vitest release after `4.1.11` remaps `error.stacks` through source maps; this checkout has not moved the pin.
- Full pre-clone `git log --oneline -20` subject lines (see Deviation).

## Deviation

Shell `git log --oneline -20 main` was rejected in this session. GitHub commit-list fetches were rejected too. Substituted: each repo’s `refs/heads/main` / `refs/remotes/origin/main` SHAs, `logs/refs/heads/main` reflogs, and current-tree reads. No file was modified.
