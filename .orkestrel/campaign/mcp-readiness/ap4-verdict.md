The design-departure and silent-drop claims hold. Every numbered claim is **CONFIRMED**. The reconciliation section to walk is titled **Findings adopted**, not "Accepted findings".

## 1. Graduated fallback — CONFIRMED

`#execute` builds record+text, text, then receipt, widest first, and returns `arms.find(isBoundedJSON) ?? minimal` (`src/server/ProbeServer.ts:240-243`). Bounds come from `this.#server.limit` (`:221-222`).

Attack that failed: return an unadmitted record or text arm. `find` only returns an arm that `isBoundedJSON` admits. The installed dispatcher then snapshots that same object with the same triple (`node_modules/@orkestrel/mcp/dist/src/core/index.js:4501-4506`: `bytes: limit.content`, `keys`, `depth`). A passing arm is the object the dispatcher accepts.

Attack that failed: the last arm is huge because `formatReceipt` interpolates `reason`. `reason` arrives inside a `tools/call` bounded by `DEFAULT_MCP_LIMITS.message` (1_048_576). `limit.content` on the composed server is 4_194_304. The receipt block is a handful of keys (`resultType`, `content`, `type`, `text`) at depth 2 versus keys 4096 and depth 32. Bounds that refuse it are not this server's. The comment at `:237-239` states that invariant.

The writer's mutation-probe runs are testimony. This ruling is from the code path, not those runs.

## 2. One closing-line implementation — CONFIRMED

`formatProof` is the only producer of `receipt ${token}` / `no receipt` under `src/` (`src/core/helpers.ts:80-81`). `formatVerdict` and `formatReceipt` both call it (`:109`, `:149`). `computeReceipt` mints the token, not the line.

Attack that failed: a third renderer in source. Sweep of `src/` for those literals hits only `formatProof` and its TSDoc. Tests and the guide quote the line; they do not produce it.

## 3. Bounds from `limit` only; `content` → `bytes` — CONFIRMED

`ProbeServer` has no `#limits` field and does not import `DEFAULT_MCP_LIMITS`. `#publish` passes `limit: { keys: PROBE_KEYS }` once (`:188`). `#execute` reads `limit.content`, `limit.keys`, and `limit.depth` off the getter (`:221-222`).

Installed `MCPServerInterface.limit` is `Required<MCPLimitOptions>` (`node_modules/@orkestrel/mcp/dist/src/core/index.d.ts:3861`). `MCPLimitOptions.content` is serialized UTF-8 bytes of one complete produced tool-call result (`:3104`). `MCPJSONLimitOptions.bytes` is that same quantity (`:2962-2964`). `createMCPServer` resolves omitted leaves, including `content: 4194304` and `depth: 32` (`index.js:4136-4144`, `4157-4158`). The dispatcher snapshots execution results with `{ bytes: this.#limits.content, keys, depth }` (`:4501-4504`). The mapping matches that declaration.

Attack that failed: a second configured copy used at admission time. `PROBE_KEYS` is the publish input; admission reads the resolved getter.

## 4. Accepted findings landed or named — CONFIRMED

Walk of **Findings adopted** and the rulings that required a landing in this unit:

- **F1** (`#limits` second copy) — landed: getter derivation above.
- **F2** (`LINT_DEADLINE` TSDoc) — landed verbatim at `src/core/constants.ts:104-105`. `LintStage` reads `LINT_DEADLINE` at `grace` and `timeout` (`src/server/stages/LintStage.ts:148-151`).
- **Objective finding** (bound rows drive a hand-built server) — named under **Deviation state** in `tmp/units/p4-report.md`. `ProbeServer.test.ts` still drives `createMCPServer` through `readCall`; the shipped-composition drives are in `tests/src/bin/main.test.ts`.
- **Graduated fallback** — landed (`ProbeServer.ts:231-243`).
- **`_meta` widening sentence** — landed (`guides/probe.md:531-533`).
- **Constants stay public** / **routed onward** (`buildModernResult` bypass, `MCPLimitOptions.keys` doc-versus-enforcement) — recorded as not this unit, not dropped.

Attack that failed: a Findings-adopted row with no landing and no deviation name.

## 5. Reframed bound rows are honest — CONFIRMED

The row is named `refuses a record-bearing result under the installed default key bound` (`tests/src/server/ProbeServer.test.ts:356`). Its comment calls it a pin on the installed default and on what `PROBE_KEYS` buys, and says the shipped composition is not readable here (`:346-355`). `readCall` still builds `createMCPServer` (`:50-70`). The `PROBE_KEYS` assertion reads the constant, not a second literal (`:367`).

Attack that failed: a remaining comment or name that claims to test `ProbeServer`'s own wiring. The helper's "composed the way `ProbeServer` composes its own" describes the fixture, not the pin. The pin's own comment disclaims the shipped composition.

## 6. Guide sentences vs shipped code — CONFIRMED

**368-issue cut.** `serializeJSON` counts each object's own keys plus each array's length (`index.js:701`, `:748`). A prove verdict with reason and receipt is 38 keys with no issues; the call-result wrapper adds 6 (`resultType`, `content`, slot, `type`, `text`, `structuredContent`) → 44. A ranged `Issue` (`origin`, `path`, `message`, `range` + `start`/`end` + `line`/`character` each) plus its array slot is 11. `44 + 11×368 = 4092 ≤ 4096`; `44 + 11×369 = 4103 > 4096`. The record-alone check (`38 + 11N`) flips at the same integer. Matches `guides/probe.md:529-531` and `src/core/constants.ts:119-124`. Installed package is `@orkestrel/mcp` 0.0.25.

Attack that failed: an off-by-one between the record check and the whole-result check on keys. No integer N admits the verdict and refuses the pair.

**Client outcome.** Installed `buildCallOutcome` prefers `structuredContent` by presence and returns `{ resultType: 'complete', value }` with no content blocks (`index.js:933-945`). Matches `guides/probe.md:510-512`.

**`verdict.receipt`.** The text-block last line is `formatProof` (`helpers.ts:81`, `:149`). The structured field is the token, absent when unproven (`src/core/types.ts:352-353`). Matches `guides/probe.md:503-507`.

**`_meta` widening.** The composed server's `limit.keys` is `PROBE_KEYS` (4096) and is the same leaf the dispatcher applies to `_meta` (`index.js:4173-4176`). Metadata bytes stay `metadata: 16384`; depth still binds. Matches `guides/probe.md:531-533`.

**Helper rows.** `guides/probe.md:120-121` match `formatProof` and `formatReceipt` in `helpers.ts:80-110`.

## Findings outside the claims

None at the BROKEN standard.

VERDICT: CONFIRMED
