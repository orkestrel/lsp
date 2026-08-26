# User direction, 2026-08-25

Rulings the user stated mid-campaign, after the absorption evidence landed. These are fixed
priors for the design round: the round argues how, never whether.

## mcp — repair to 2026-07-28-native with a legacy wrapper

The package is intended to be MCP revision 2026-07-28 under the hood, by default, always true
to 2026-07-28, with an optional legacy wrapper function adding compatibility with older
revisions. The 2026-07-28 lifecycle page's own terms name the target posture: a **modern**-core
implementation, optionally **dual-era** through the wrapper (see the researcher report's
lifecycle section).

### Correction, same day (fleet-sweep evidence)

The drift claim this section first carried is falsified. The shallow map had reported
`SUPPORTED_PROTOCOL_VERSIONS` omitting `2026-07-28`; the deep sweep read the tree as it is:
`MCP_MODERN_VERSION = '2026-07-28'` (`src/core/constants.ts:21`), `SUPPORTED_PROTOCOL_VERSIONS`
listing it first (`constants.ts:33`), per-request `_meta` version and capability parsing,
`notifications/progress` with a reporter, `notifications/cancelled`, a stateless modern core
whose bare server rejects `initialize`, and `MCPLegacy` as the legacy projection. The intent
stands as the prior; the open design questions become completeness against the revision
(`server/discover`, `subscriptions/listen`, the input-required retry pattern, the tasks
extension, the deprecation list) and the shape of the legacy wrapper and the
`MCP_PROTOCOL_VERSION` constant, whose name reads as "the protocol version" while it declares
the newest legacy handshake revision.

## probe — toward full LSP

The user endorses probe's LSP direction: keep it, deepen it, and aim at full LSP conformance,
timed with the move to TypeScript 7, whose native toolchain replaces the tsserver protocol with
standard LSP.

## html and markdown — the position gap is the gap to fill

The asymmetry the map found — html nodes carrying UTF-16 offsets, markdown nodes carrying no
position data, neither package deriving outline/folding/symbol structures — is exactly the gap
the user wants filled. The design round shapes what alignment with LSP structures
(DocumentSymbol, Range/Position, FoldingRange, and related) looks like for each package and what
probe gains from it.

## workflow, process, tool, queue — progress surfaces stay exploratory

No concrete progress contract is decided. The design round proposes shapes to play with, taking
the general MCP-versus-LSP ruling as input, with the user leaning toward the progress model
following MCP either way (`notifications/progress` tokens, and the tasks extension's status
model, per the researcher report).

# User direction, 2026-08-25, after the audit

Rulings the user stated on the delivered audit (`audit.md`). Each is fixed; the plan in
`plan.md` carries them.

## mcp, html, markdown, probe — repairs and fills proceed with full proof

The audit's defect findings and rulings for mcp, html, markdown, and probe are confirmed.
Every repair and fill lands with full proof and evidence that the result works as intended:
red-before-green defect proofs, adversarial falsification before acceptance, and host-taken
evidence wherever a proof drives a child process or a listener.

## workflow — adopt MCP's progress model directly, no adapter

The audit's held-open subject is closed by the user: workflow changes to the way MCP does it.
An adapter is another point of breakage, and workflow exists to work well with agents through
MCP. The objective lane's semantic findings (replacement versus monotonic semantics, the
`unit` field, the `note` overlap) become constraints the adoption unit resolves and proves,
never a reason to hold. The reporter-replay probe becomes the unit's failing proof rather
than a decision gate.

## lsp — a new package, the way mcp is a package

The `LanguageClient` idea grows into `@orkestrel/lsp`: a package mirroring how `@orkestrel/mcp`
carries its protocol — types-first from the LSP 3.18 specification, an `LSPClient` first, and
eventually an `LSPServer` built the way `MCPServer` was. probe consumes `LSPClient` instead of
growing its own client. The `LSPServer` is a recorded trajectory with triggers, not part of
this campaign.

# User direction, 2026-08-25, on the plan's confirmations

## Repository and blessings

The user created the `orkestrel/lsp` repository; the session attached and scaffolded it
(core and server environments; seed dependencies `@orkestrel/contract`, `@orkestrel/emitter`,
`@orkestrel/process`). The mcp renames in M6 are blessed. The provenance side-lookup ruling
and the zero-based-stored coordinate ruling stand, the side-lookup on the user's deferral to
the Orchestrator's reasoning.

## workflow `unit` — ruled on evidence, override open

The user challenged the claimed weight of the `unit` field. The evidence read: the only
readers are `workflow/src/core/cloners.ts:129` (copies it) and `workflow/src/core/validators.ts:253`
(checks it is a string) — plumbing, not consumers; no renderer, formatter, or behavioral
consumer reads it anywhere in `src/`, `tests/`, or `guides/`; the guide documents it as
"observer-facing text", which is the job MCP's `message` field does. The field's weight was
overstated in the audit. Ruling: workflow adopts MCP's exact shape `{ progress, total?,
message? }`; `unit` retires; the re-admitting trigger — a consumer that formats by a
machine-readable unit distinct from the message text — is recorded in the guide.

Final, same day, from the user: get rid of `unit` and clean workflow up accordingly — no
loose ends. The override is closed. W1 removes the field and every piece of plumbing that
carried it: the `TaskProgress` declaration, the cloner and validator branches, every test
constructing it, and the guide rows naming it.

## TypeScript 7 — deferred outright

`@typescript/native-preview` is not installed and TypeScript 7 is not adopted in this
campaign. The receipt gate leaves the campaign; probe's guide records it as the trigger that
reopens the adapter question. `TypeStage` stays on the in-process LanguageService.

## lsp — conformance testing is a required capability

The lsp package adopts the conformance-test approach the mcp package carries
(`mcp/tests/setupConformance.ts` with its pinned `CONFORMANCE_SPEC`, the same pattern the
ollama package uses): tests that prove parity and compatibility with the LSP specification on
a type basis and a runtime basis wherever possible, driven by the staged 3.18.0
`metaModel.json` as a fixture. Everything foreign — the metaModel, vendored specification
artifacts, any protocol-types package used for comparison — enters as a development
dependency or vendored fixture only, never as a runtime dependency or any other
runtime-level requirement.

## Addendum, same day — the mcp client's era boundary mirrors the server's

Stated after the M1+M1.1 falsification round surfaced the client's automatic legacy
fallback as a documented door. The client side uses the latest protocol; the package has no
use case of its own for automatic legacy negotiation, so client-side era routing is the
consumer's decision, never a silent behavior. The client always pushes for the latest
revision; when a peer cannot speak it, the accommodation is an explicit adaptive wrapper —
the client analog of the server's legacy decorator — that the consumer opts into, and that
wrapper converts the legacy peer's protocol into what the modern surface understands,
forcing every consumer-visible interaction to the latest protocol no matter what the peer
speaks.

Consequences carried into the plan: the automatic fallback in `MCPClient` negotiation and
the built-in legacy pin path move out of the core client into the explicit wrapper; the
core client refuses a peer it cannot negotiate modern with, naming the wrapper in the
error; the tests and guide rows pinning the fallback sequence are repaired red-first with
the behavior change; the m-audit verdict's ruling that retained the fallback as designed is
superseded by this instruction on the record. The wrapper's family naming lands coherently
in the M6 cascade beside `MCPDualEra`.
