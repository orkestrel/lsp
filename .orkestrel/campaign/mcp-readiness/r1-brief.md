# R1 — MCP protocol and SDK research

- **Role and engine**: `researcher`, native Sonnet. Ladder note: bounded primary-source research
  belongs to Grok first; the Cursor bench is single-lane and holds the mcp absorption unit, so this
  unit runs on the native lane. Recorded substitution.
- **Objective**: distill the current Model Context Protocol specification into an audit checklist
  for the `@orkestrel/mcp` package, with a citation on every row.

## Context

- Read-only. Perform the assignment directly and spawn nothing.
- Follow `.claude/rules/writing.md` for the report prose. State requirements as testable rows.
- The subject package (read later by other lanes, not by you): a TypeScript MCP client and server
  with stdio, HTTP, and WebSocket transports, tested against `@modelcontextprotocol/conformance`
  `0.2.0-alpha.10`.

## Tasks

1. Fetch `https://modelcontextprotocol.io/sitemap.xml`. Name the current specification revision id
   (a date) and each earlier revision the site still lists.
2. Fetch the relevant pages with the `.md` suffix and distill requirements at MUST/SHOULD level:
   - base protocol: lifecycle (`initialize`, capability negotiation, version negotiation), JSON-RPC
     shapes, batching status;
   - transports: stdio requirements (framing, stderr logging, shutdown); streamable HTTP
     requirements (`Mcp-Session-Id` session management, `MCP-Protocol-Version` header, SSE stream
     use, resumability with `Last-Event-ID`, DELETE teardown, security: `Origin` validation,
     localhost binding, authentication);
   - server features: tools (including `outputSchema`/`structuredContent`, annotations), resources
     (templates, subscriptions), prompts, completion, logging, pagination;
   - client features: sampling, roots, elicitation;
   - utilities: cancellation, progress, ping;
   - authorization: the OAuth 2.1 requirements headline only.
3. Fetch `https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md`.
   Distill the SDK's public naming: server, client, and transport class names, and the tool,
   resource, and prompt registration APIs, for a naming comparison.
4. Query the npm registry for `@modelcontextprotocol/conformance`: latest version, and whether
   `0.2.0-alpha.10` is behind it. Name what the package covers where its README states it.
5. Read these local skill references and fold their checklist items into the same checklist:
   - `C:\Users\mikes\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\3e15ad7c-f49e-474e-9a48-0693c4524399\57f6d8d5-6f06-4868-911d-413a4fcd7fdc\skills\mcp-builder\reference\node_mcp_server.md`
   - `C:\Users\mikes\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\3e15ad7c-f49e-474e-9a48-0693c4524399\57f6d8d5-6f06-4868-911d-413a4fcd7fdc\skills\mcp-builder\reference\evaluation.md`

## Scope

- No repository reading beyond the named local reference files. No edits anywhere. No decisions
  about the subject package.

## Output

Return the report as your final message (you carry no Write tool):

- **Revisions**: current spec revision id; headline changes between listed revisions.
- **Checklist**: requirement rows grouped by area — requirement, MUST or SHOULD, citation.
- **SDK naming**: the inventory from task 3.
- **Conformance**: the reading from task 4.
- **Unknowns**: what you could not resolve, named as unknown.

## Deviation contract

Stop and report if a primary source is unreachable; name the URL and the failure. Ancillary
formatting choices are yours to decide and record.

## Acceptance criteria

- Every checklist row carries a citation to a spec page or a named reference file.
- The current revision id is stated from the fetched sitemap, not from memory.
