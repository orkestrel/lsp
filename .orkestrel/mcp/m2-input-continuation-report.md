1. What changed

- [src/core/types.ts](/home/user/mcp/src/core/types.ts:2290): added the prescribed `input` group to `MCPCallOptions`. Its `state` and `responses` leaves are required together. TSDoc now covers continuation data, required-together semantics, and byte-identical retry arguments.
- [src/core/MCPClient.ts](/home/user/mcp/src/core/MCPClient.ts:384): `call` maps the group to top-level `tools/call` parameters while retaining the caller’s `arguments` reference.
- [tests/src/core/MCPClient.test.ts](/home/user/mcp/tests/src/core/MCPClient.test.ts:1250): added recorder placement, real in-process continuation, and changed-argument refusal rows.
- [guides/mcp.md](/home/user/mcp/guides/mcp.md:1177): added a client retry example using `MCPCallOptions.input`, the same tool name, and the same arguments value.
- `tests/guides.test.ts`: unchanged; existing parity coverage accepted the guide edit.

2. Chosen wire placement

```ts
name,
arguments: args,
...(options?.input === undefined
	? {}
	: {
			requestState: options.input.state,
			inputResponses: options.input.responses,
		}),
```

3. Red-first evidence

- Placement row command:

  `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/MCPClient.test.ts -t "places input continuation state and responses as top-level tools/call params"`

  Before: exit `1`; `1 failed`, because `requestState` and `inputResponses` were absent.  
  After: exit `0`; `1 passed`.

- Continuation row command:

  `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/MCPClient.test.ts -t "continues an input-required call with protected state and responses"`

  Before: exit `1`; `1 failed`, because the retry returned another `input_required` result.  
  After: exit `0`; `1 passed`.

- Digest-refusal row command:

  `npx vitest run --config vite.config.ts --no-cache --project src:core tests/src/core/MCPClient.test.ts -t "keeps changed retry arguments under the server digest refusal"`

  Before: exit `1`; `1 failed`, because the altered call resolved with another elicitation instead of rejecting.  
  After: exit `0`; `1 passed`.

4. Legacy-transport reading

[src/core/MCPLegacyClientTransport.ts](/home/user/mcp/src/core/MCPLegacyClientTransport.ts:148) sends `modernInvocationToLegacy(message)`. [src/core/helpers.ts](/home/user/mcp/src/core/helpers.ts:850) returns the invocation unchanged when `_meta` is absent. When `_meta` is present, lines 853–855 copy every top-level parameter except `_meta`, and line 865 sends that translated parameter record. The continuation siblings therefore transit without being stripped or rewritten.

5. Guide reading and prose delta

The original [input-continuation section](/home/user/mcp/guides/mcp.md:1162) documented the wire siblings and server refusals but showed no client API retry.

The added prose and fence at [guides/mcp.md:1177](/home/user/mcp/guides/mcp.md:1177) document:

- the `MCPCallOptions.input` group;
- required `state` and `responses` leaves;
- the same-name and byte-identical-arguments obligation;
- a retry importing `MCPClientInterface` through `@orkestrel/mcp`.

6. Observations outside scope

- HTTP listener proof capability: the exact core-project run reached the existing HTTP rows, but this sandbox rejected `listen(127.0.0.1)` with `EPERM`. No HTTP source or test was changed.
- Stdio guide transcription capability: the unfiltered guides project produced no terminal exit within the sandbox observation window. The non-child-process MCP parity slice completed successfully.

7. Scoped gate readings

- `npm run check:src:core` — exit `0`.
- Behavioral row commands in section 3 — exit `0` after implementation.
- `npx vitest run --config vite.config.ts --no-cache --project guides tests/guides.test.ts -t "^MCP"` — exit `0`; `92 passed`, `47 skipped`.
- `npx vitest run --config vite.config.ts --no-cache --project src:core` — exit `1`; `747 passed`, with the existing HTTP listener rows failing after `EPERM`.
- The same core project excluding those HTTP-only rows — exit `0`; `747 passed`, `2 skipped`.
- Scoped `oxfmt --check` over changed files — exit `0`.
- Scoped `oxlint --deny-warnings` over changed TypeScript files — exit `0`.
- `git diff --check` — exit `0`.
- Diff audit found no `any`, assertions, suppressions, nested function declarations, or caller-input mutation.

8. Claims needing host verification

- Run `npx vitest run --config vite.config.ts --no-cache --project src:core` on a host that permits loopback listeners; the sandbox reading cannot establish the required exit `0`.
- Run the unfiltered guides project on the host because its stdio transcription rows depend on reliable child-process I/O.