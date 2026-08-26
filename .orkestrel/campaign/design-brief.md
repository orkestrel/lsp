# Design brief: LSP audit rulings for the Orkestrel fleet

One brief, two blind lanes. The subjective lane (`planner`, Opus 5) argues shape, naming,
ergonomics, and design fit. The objective lane (`analyst`, GPT-5.6 Sol) argues correctness,
constraints, and what the code and contracts actually permit, verifying load-bearing evidence
claims against source. Your dispatch names your lane. Neither lane sees the other's answer.
The Orchestrator reconciles; no lane decides.

## Objective

Propose, for each of the four subjects, a ruling with rationale, a unit decomposition with
acceptance-criteria sketches, and risks — the design argument the audit's plan is reconciled
from. Propose; never implement, never accept.

## Context

Working directory: /home/user/scaffold. The fleet checkouts sit beside it:
/home/user/mcp, /home/user/probe, /home/user/html, /home/user/markdown, /home/user/workflow,
/home/user/process, /home/user/tool, /home/user/queue, /home/user/middleware. All readable by
absolute path. Everything is read-only for this round.

Evidence slice, all under /home/user/scaffold/.orkestrel/campaign/ — read before proposing:

- `lsp-spec-distillate.md` — LSP 3.18, anchor-cited: base protocol, lifecycle, the progress
  model, document sync and position encodings, structure-bearing features, diagnostics,
  workspace features, evolution machinery.
- `researcher-external-report.md` — TypeScript 7 native-toolchain LSP matrix (with recorded
  unknowns) and the complete MCP 2026-07-28 anchor: changelog delta, `notifications/progress`,
  `notifications/cancelled`, the `io.modelcontextprotocol/tasks` extension, and the
  modern/legacy/dual-era lifecycle with `server/discover`.
- `fleet-sweep-evidence.md` — absorption-depth `file:line` inventory of the nine checkouts:
  mcp protocol truth, probe's language-server client, html/markdown AST shape, and progress
  mechanisms in workflow, process, tool, queue, middleware.
- `direction-2026-08-25.md` — the user's fixed priors, with the same-day correction. Priors are
  not up for argument: argue how, never whether.
- `orkestrel-fleet-report.md` — the earlier shallow map. Where it disagrees with
  `fleet-sweep-evidence.md`, the sweep wins; the map's stale mcp claim is already corrected.

Code law binds every proposal: each checkout's `AGENTS.md` and `.claude/rules/` (types first,
single-word entity APIs, readonly properties, no unsolicited dependencies, no compatibility
shims, mechanism not product policy, no polling architecture, centralize by kind). A proposal
that needs a new npm package is wrong by construction. Skill: none.

## The four subjects

### 1. mcp — completeness against 2026-07-28 and the shape of the legacy seam

The tree already holds the intended posture: modern stateless core, `MCP_MODERN_VERSION`,
per-request `_meta`, progress and cancellation notifications, `MCPLegacy` as the initialize-era
projection (`fleet-sweep-evidence.md` § 1). Rule on:

- Completeness: which 2026-07-28 mechanisms the tree carries and which it lacks —
  `server/discover` (a `buildDiscoverResult` exists at `mcp/src/core/helpers.ts:890`; is the
  required RPC wired end to end?), `subscriptions/listen`, the input-required retry pattern
  (MRTR / `resultType: "input_required"` / `inputResponses`), the tasks extension
  (`io.modelcontextprotocol/tasks`), the deprecations (Roots, Sampling, Logging), and
  `UnsupportedProtocolVersionError` code -32022 semantics. The objective lane verifies each
  presence or absence against source with `file:line`.
- The legacy seam's shape: the user's words are "an optional legacy wrapper function". Rule on
  whether `MCPLegacy` as it stands is that — optional, composable, paying nothing when unused —
  or needs reshaping, and what its API should feel like.
- The constant naming hazard: `MCP_PROTOCOL_VERSION` declares the newest LEGACY handshake
  revision while its name reads as "the protocol version" (`mcp/src/core/constants.ts:15`,
  comment at :7-13). Rule on rename/reshape against the fleet's naming laws, and on every
  consumer the sweep lists.

### 2. html and markdown — the position and structure gap

The sweep sharpened the gap: html's UTF-16 offsets live only on scanner results
(`HTMLStartTag.next`), never on AST nodes; markdown nodes carry no coordinates at all; neither
package derives outline, folding, or symbol structure; markdown-to-html-to-markdown round
trips are positionless at every hop (`fleet-sweep-evidence.md` § 3). The user wants the gap
filled. Rule on:

- Where source coordinates live: fields on nodes, a side structure, or both — against the
  fleet's derive-state and readonly laws, the existing walk/fold surfaces, and what a consumer
  such as probe needs. Name the unit (UTF-16 offsets exist in the scanner today; LSP defaults
  to UTF-16 positions but negotiates utf-8/utf-32; offsets versus line/character is a real
  fork — rule on it).
- Which LSP-shaped structures earn existence with a real first consumer: an outline
  (DocumentSymbol-like heading/element tree), folding ranges, selection ranges, semantic
  tokens — each is a capability with a creation gate; do not speculate all four into being.
  Name the first consumer for any you propose (probe, scaffold's markdown usage, the guides
  pipeline, an LSP server over these ASTs, or nothing yet).
- What probe gains concretely, citing its current `Issue` shape (line-only, column dropped —
  `probe/src/server/stages/LintStage.ts:418-440`, `probe/src/core/types.ts:183-191`).

### 3. probe — the path toward full LSP, timed with TypeScript 7

Today: a minimal hand-rolled LSP client in one stage — empty `capabilities: {}`, the entire
InitializeResult discarded, own Content-Length framing, no `didChange`, no position-encoding
awareness, diagnostics reduced to message+line; the type stage drives the in-process
TypeScript LanguageService API, not a server (`fleet-sweep-evidence.md` § 2). The user's prior:
keep the LSP direction and aim at full conformance, timed with TS7, whose native toolchain is
standard-LSP with mostly unknown capability rows (`researcher-external-report.md`). Rule on:

- The staged path: what full conformance means for probe as an LSP CLIENT (capability
  declaration, InitializeResult consumption, position encoding, incremental sync, pull versus
  push diagnostics, column/range retention through `Issue`), in what order, and which stages.
- The TS7 seam: when and how the type stage moves from the LanguageService API to driving the
  native LSP server, given the recorded unknowns; what to build now so the move is a transport
  swap rather than a rewrite. Rule on whether probe's LSP client machinery should centralize
  (one client shared by lint and future type stages) — against the no-superfluous-wrappers and
  one-shared-engine laws.
- Note the host constraint from the operating environment: a language server driven as a
  child's child is unmeasurable inside bench sandboxes; tests for this live with the native
  toolchain. Design for that reality; do not propose bench-run proofs.

### 4. workflow, process, tool, queue (and middleware) — exploratory progress contracts

The user's prior: exploratory, no concrete contract yet, leaning to follow MCP's progress
model whichever way the general ruling goes. Evidence: workflow already has
`TaskProgress { current, total?, unit? }` plus report/pulse/silence activity events and a
`LifecycleStatus` union; queue has lifecycle events and retry counts; process streams lines
and exits; tool is deliberately inert; middleware observes through callbacks
(`fleet-sweep-evidence.md` § 4). The MCP anchor: `notifications/progress` with monotonic
`progress`, optional `total`, optional `message`, token-scoped to an active request; the tasks
extension's `working`/`input_required`/`completed`/`failed`/`cancelled` with polling and
cooperative cancel; LSP's alternative is begin/report/end with percentage and a separate
partial-result stream. Rule on:

- Whether one shared progress contract belongs in the fleet at all, and if so where it lives
  (a contract type in `@orkestrel/contract`? per-package?) — mechanism, not product policy.
- What shape it takes leaning MCP: how `{ progress, total?, message? }` monotonic semantics
  reconcile with workflow's `TaskProgress` and activity events, queue's lifecycle, process's
  streams; what maps cleanly and what resists.
- Which packages adopt it first with a real consumer, and which stay untouched (rule
  explicitly on tool's inertness and middleware's callback model).
- This subject returns IDEAS RANKED, not a single mandated design: the user asked to play with
  shapes. Give a recommended shape plus at most two live alternatives with costs.

## Unknowns

- mcp's coverage of `server/discover` end-to-end wiring, `subscriptions/listen`, MRTR, and the
  tasks extension is unverified — the sweep did not inventory them. The objective lane
  resolves each with `file:line` or records honest absence; the subjective lane may assume the
  objective lane's job is happening and argue shape conditionally.
- TS7 native LSP capability rows recorded unknown stay unknown; design under uncertainty and
  say which unknowns change which choices.

## Scope

Read-only. Read anywhere under /home/user/scaffold and the nine sibling checkouts. Write
nothing, run no mutating command. The objective lane may run read-only inspection commands
(`grep`, file reads) only.

## Execution

Perform this assignment directly yourself and spawn nothing.

## Output

Return exactly, per subject 1 through 4:

1. **Ruling proposed** — one paragraph, decisive.
2. **Rationale** — evidence-cited (`file:line` or a campaign document section).
3. **Units** — the bounded work items the ruling implies: name, owned files sketch, acceptance
   criteria sketch, dependency order. For subject 4, ranked ideas instead.
4. **Risks** — what breaks or is lost if the ruling is wrong, and the cheapest probe that
   would settle it.
5. **Alternatives** — at most one per subject (two for subject 4), each ruled on, none left
   open.

Then one **Exit criterion** paragraph: what closes this campaign — the audit report's required
contents and the state each subject must reach for the campaign to end.

No process diary. No implementation. No edits.

## Deviation contract

You are read-only; there is no writing deviation. A missing evidence file or unreadable
checkout stops the affected subject only: name it, rule on the rest.

## Acceptance criteria

- Every subject carries a ruling, rationale, units (or ranked ideas), risks, and a ruled
  alternative.
- Every load-bearing factual claim cites `file:line` or a campaign document section.
- The user priors in `direction-2026-08-25.md` are treated as fixed.
- An exit criterion paragraph exists.
