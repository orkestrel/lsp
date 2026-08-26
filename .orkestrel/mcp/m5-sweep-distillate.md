# M5 enumeration sweep — Grok distillate, persisted by the Orchestrator

Driver: the `grok` role (Cursor Grok bridge), 2026-08-26. Bench round-tripped live
(`agent --version` `2026.08.11-e8db854`); journal `/home/user/mcp/tmp/cursor/m5.log`;
session id `dbf55d5b-5f5d-4a71-900f-29a7ace6c524`; the mcp tree clean before and after.

## The load-bearing readings

- **No producer and no registration site exists for `roots`, `sampling`, or `logging`**
  in the swept trees: `buildDiscoverResult` (`src/core/helpers.ts:1026`) stamps only
  `tools`, optional `resources`/`prompts`/`completions`, and tasks `extensions`; the
  `MCPServer.ts:313` `methods.add` inventory carries no `roots/list`, no
  `sampling/createMessage`, and no `logging/setLevel`.
- **Receipt parsing sits exactly where the dated schema admits the family**:
  `isMCPInputRequest` (`src/core/validators.ts:1646-1647`) admits the
  `sampling/createMessage` and `roots/list` arms, and both are present in the vendored
  `ext-tasks-2026-07-28-schema.json` (`$defs.CreateMessageRequest:1774`,
  `$defs.ListRootsRequest:2343`, the `InputRequest`/`InputResponse` anyOf refs at
  `:2198-2221`).
- **Logging is metadata-level validation only**: `MCPLoggingLevel` (`types.ts:211`),
  `isMCPLoggingLevel` (`validators.ts:148`), and the
  `_meta['io.modelcontextprotocol/logLevel']` read (`parsers.ts:126`) validate inbound
  dated metadata; no `Logging*`/`SetLevel*` def exists in the vendored schema and no
  `logging/setLevel` conformance row exists (`tests/setupConformance.ts:606`).
- Declaration sites: `MCPClientCapabilities.roots` (`types.ts:224`),
  `MCPClientCapabilities.sampling` (`types.ts:225`), `MCPServerCapabilities.logging`
  (`types.ts:239`), the `MCPInputRequest` arms (`types.ts:566`, `:570`) under the union
  TSDoc at `:559` that already narrates the deprecation.
- Guide sites: `guides/mcp.md:113`, `:640`, `:1141`, `:1169`, `:1294-1295`, `:1993`,
  `:2044`, `:2118`, `:2173`, `:3861`, `:3864`, `:3869`.
- Homonyms excluded on the record: `createMessagePortTransport` (browser), workspace and
  package roots in test infrastructure, Vite `logLevel`, the generic emitter
  "logging, tracing" prose, and the schema's English "display, logging, and debugging".
- Unswept-population negatives recorded: `src/server/` and the named core files match no
  family pattern.

The full row tables are in the driver's returned distillate inside the session transcript;
the journal file reproduces the run.
