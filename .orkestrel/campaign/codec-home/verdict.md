# Codec-home ruling — verdict and reconciliation

Question: does any existing `@orkestrel` package make an honest shared home for the standard
Base64 codec, beyond `@orkestrel/server`?

## Evidence chain

- Grok absorption lane (ask mode, `codec-home-absorb.log`): charter/environment/codec-surface
  rows for all 46 non-mcp/server fleet guides. Load-bearing discoveries: the fleet holds FOUR
  Base64 implementations (server helpers pair; mcp sentinel inlines + `isStandardBase64`;
  browser core's table-based pair, lenient decoder, six call sites; msg's decode-only half),
  and `msg.md:11-15` is the only charter that names Base64.
- orkestrel catalog lane: placement band is L0-L2 (mcp and server both L3); shared runtime
  deps of both: `contract` (L0), `emitter` (L1); L0 leaves: contract, msg, sse, test; nothing
  at or below L2 depends on mcp or server (no cycle risk in the band).
- Orchestrator source verification: msg charter quote confirmed; browser codec confirmed at
  `browser/src/core/helpers.ts:107-150` (padded standard-alphabet encoder, lenient
  non-throwing decoder, fixtures `'AQ ID\n'`/`'AQ!ID'` pinned in `helpers.test.ts:73,77`);
  mcp core lib `["ESNext","WebWorker"]` confirmed; msg registry: 0.0.8, zero deps, email
  parser description.

## Adversarial pass (one brief, blind lanes)

- Subjective lane (Opus 5, planner): winner **D** (new L0 leaf), 9/10. contract 6, status quo
  4, msg 3, browser 1. msg is "D done dishonestly" — its encoding layer is a means to the
  email parser, not an offered service. contract is defended doctrine (`is*`/`*Of`/`parse*`);
  an encoder is a fourth kind with no family. browser exports a domain judgment (leniency) as
  if it were a contract. Named risks: the leaf strands (migration needs an owner); the name
  `codec` invites a utils bag — ship a written membership bar or narrow to `base64`.
- Objective lane (Cursor Grok substituting for Sol, recorded; `codec-home-objective.log`):
  winner **D**, 8. contract 6, msg 5, status quo 3, browser 0. browser is disqualified
  outright: L3, same layer as mcp/server — inversion. contract bump republishes the fleet DAG
  (44/49 manifests), making a codec defect a fleet event. A shared leaf must be ES-only (no
  `atob`/`btoa` host assumption) and can ship strict decode for mcp/server plus a NAMED
  lenient variant later for browser. Named risk: no cross-fixture matrix exists proving a
  table-based strict decoder agrees with `atob` on every input `isStandardBase64` accepts.

## Ruling

Both lanes converge independently: **D — a new dedicated L0 leaf package** is the only honest
shared home. Reconciled recommendation:

1. Name `@orkestrel/codec` with a written membership bar in the guide charter (byte<->text
   codecs with a named RFC/WHATWG spec; no domain formats, no parsers) — or `@orkestrel/base64`
   if the narrower scope is preferred. ES-only implementation: table-based, no `atob`/`btoa`,
   no `Buffer`.
2. First wave scope: mcp + server only — the pair whose semantics already match. mcp's
   `isStandardBase64` STAYS in mcp (JSON Schema `byte` membership is MCP protocol policy).
   browser converges later only via a named lenient variant (`decodeBase64Lenient`) or never;
   msg stays untouched.
3. The implementation brief must carry the fixture matrix: table decoder vs `atob`/`btoa` vs
   `isStandardBase64` acceptance, over the full octet space and the malformed classes.
4. Release coupling: codec 0.0.1 -> mcp 0.0.27 + server 0.0.17 -> probe, toolbox re-pin.
   Confined to the mcp/server cascade; never touches the contract DAG.
5. Runner-up on both lanes was contract (zero new edges) — rejected for charter dilution and
   fleet-wide blast radius. Status quo remains the honest fallback if no 50th package is
   wanted: two small local copies, no new edges, no misdescribed manifest line.

Package creation, naming, and the wave are the user's decision. Nothing is implemented from
this ruling; the record is the deliverable.

Routing ledger: absorption = Cursor Grok (bench live, probe `READY`); ecosystem = orkestrel
(native); subjective = Opus 5 (native subagent); objective = Cursor Grok substituting for the
user-excluded Sol bench (standing user routing, recorded); reconciliation + acceptance =
Orchestrator. A Fable workflow launched before the routing correction was killed by the user
interrupt with no results consumed.
