1. **CONFIRMED.** `MCPCallOptions.input` requires `state` and `responses` in one group; the emitted declarations preserve that shape. Existing `resource` and `prompt` parameters remain unchanged. TSDoc states required-together and byte-identical argument obligations. Evidence: `src/core/types.ts:1042`, `src/core/types.ts:1049`, `src/core/types.ts:2290`, `src/core/types.ts:2313`, `dist/src/core/index.d.ts:1886`.

2. **CONFIRMED.** `call` places `requestState` and `inputResponses` beside `name` and `arguments`. The `_meta` stamping spread preserves those siblings and the original `arguments` reference. A direct instrument covering `input` with `progress` returned `control:false, actual:true`; `_meta` contained only `progressToken`. A call without `input` contained neither continuation key. Evidence: `src/core/MCPClient.ts:384`, `src/core/MCPClient.ts:394`, `src/core/MCPClient.ts:420`, `src/core/MCPClient.ts:433`, `src/core/MCPClient.ts:445`.

3. **BROKEN.** The digest-refusal row does not prove that the digest check caused the refusal. It asserts only `code: JSONRPC_INVALID_PARAMS` at `tests/src/core/MCPClient.test.ts:1331`. A direct real-server instrument produced the same matching code when `inputResponses` was omitted, failing earlier with “required together”; the actual changed-digest refusal had a different message but the same code. The recorder row also permits duplicate continuation keys under `_meta` or `arguments`, because it asserts required top-level keys but never asserts their absence elsewhere (`tests/src/core/MCPClient.test.ts:1273`). Assert the digest-specific failure message or an observable that proves the digest branch ran, and add negative placement assertions.

4. **BROKEN.** The fence itself resolves through the public barrel and reuses `'reply'` and the same `callArguments` value (`guides/mcp.md:1183`, `guides/mcp.md:1188`, `guides/mcp.md:1201`; `src/core/index.ts:1`; `package.json:30`). However, the guide still describes the discarded shape: `MCPCallOptions` has only `signal` and `progress` at `guides/mcp.md:2048`; `call` allegedly cannot continue at `guides/mcp.md:2955`; and the declared-gap section says no client-side continuation exists at `guides/mcp.md:3966-3981`. These statements contradict `src/core/types.ts:2318` and `src/core/MCPClient.ts:394`.

5. **BROKEN.** The edited paths stayed within the brief’s ownership, the supplied status is empty, and the legacy reading is correct: `modernInvocationToLegacy` preserves every non-`_meta` parameter (`src/core/helpers.ts:849-865`) and the adapter uses it (`src/core/MCPLegacyClientTransport.ts:148`). The law check fails because the diff adds the reusable `serverWithInput` fixture factory inside a test file (`tests/src/core/MCPClient.test.ts:589`). Test fixtures must move to shared setup, and test files must not declare local fixture factories (`.claude/rules/tests.md:180`, `.claude/rules/tests.md:185`). Its name also misses the required `create{Entity}` factory form (`.claude/rules/names.md:144`). Move and export it as a shared `createInputServer` fixture.

### Findings outside the claims

None.

### Claims attacked and not broken

Claims 1 and 2 survived attacks against partial public option shapes, unchanged adjacent APIs, absent continuation options, progress-token `_meta` stamping, duplicate placement in the shipped implementation, and caller-owned argument identity.

VERDICT: FAIL — 3 broken, 0 unresolved, 0 not-evidenced, 0 findings outside the claims