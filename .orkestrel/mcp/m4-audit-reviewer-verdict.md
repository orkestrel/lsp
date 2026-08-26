# m4 round — subjective lane verdict, verbatim

Lane: subjective review, engine Opus 5, role `reviewer`, clean context, over the
Sol-written units. Brief: `lsp/tmp/units/m4-audit-reviewer-brief.md`. Subject:
`m4-mirror` (`2b823f9`), `m4-mirror.1` (`bc54b38`), `m4-stream` (`bef9f40`) at head
`c2a35d4`. Returned 2026-08-26. The Orchestrator's reconciliation is in
`m4-round-audit-verdict.md` beside this file.

---

# Audit verdict — m4 round, subjective lane (design fit, naming, vocabulary, voice)

Lane held: **subjective**, as dispatched. Engine Opus 5, `reviewer`, clean context, read-only. Subject: `m4-mirror` (`2b823f9`), `m4-mirror.1` (`bc54b38`), and `m4-stream` (`bef9f40`) in `/home/user/mcp` at `c2a35d4`. Every reading below rests on the supplied captures and on the files at head; I ran no command, so each conclusion drawn from source rather than from a supplied measurement is labeled a derivation.

## 1. Single-word surface — CONFIRMED

Refutation attempted and failed on each named surface.

- The parameter `tasks` (`src/core/helpers.ts:886`) is one descriptive word. I attacked its *shape* as well as its spelling: `.claude/rules/names.md` § Split behavioral variants would forbid a third argument that selects a different algorithm, but this one selects whether one datum is carried by the same intersection, which that rule classifies as data. I then attacked it as derivable state — encoding support as a member of the `supported` filter instead — and `src/core/types.ts:1414-1419` refutes that: support derives from two configured options a consumer never writes into a filter, so a filter member would be an invented sentinel. The boolean is the honest shape.
- Members added by the mirror units are `TaskSchemaRow.symbol`, `.expected`, `.model` (`tests/setupConformance.ts:87-95`) — one word each. The added module helpers take `{verb}{Noun}`: `readSchemaPath`, `readTaskVariant`, `readCreateTaskResult`, `formatConformanceValue`, `createTaskSchemaRow`, and their siblings, matching the `read*` form the file already carried in `readConformanceRelease` and `readConformanceTemplate`. The added constants are qualified UPPER_SNAKE_CASE, which `names.md:34` exempts.
- `taskIds` stays confined to wire shapes: it names a member only on `MCPSubscriptionFilter` (`src/core/types.ts:1421`) and on the returned filter object (`helpers.ts:906`, `MCPServer.ts:1345`). Elsewhere it appears as a local binding (`requestedTaskIds`, `taskIds`), which the entity-member rule does not reach.

The claim's own test — "single descriptive words or the `{verb}{Noun}` form" — admits `tasks`. A different naming rule refuses it; that sits in finding F1 rather than here, because the claim does not assert it.

## 2. One concept, one term — CONFIRMED

I attacked each of the four concepts the claim names and could not break any.

- **The agreed set.** The type is `MCPSubscriptionFilter` throughout; `notifications` is the wire key and `filter` the parameter name, and that duality is declared and reasoned at `src/core/types.ts:1386-1393` and restated at `guides/mcp.md:827-834`, not drifted into. The stream unit's local `resolved` names the act, and the guide ties the two in one sentence: "acknowledges the identifiers that resolved" (`guides/mcp.md:891`), then "The agreed set is fixed" (`:899`).
- **The delivery.** `notification` in code, "frame" in guide prose — established before this round at `guides/mcp.md:821` and `:975`, so the round introduced no synonym.
- **The acknowledgement.** `buildSubscriptionAcknowledgement`, the `notifications/subscriptions/acknowledged` method, the guide's "acknowledgement", and the row `TaskSubscriptionAcknowledgedNotifications` all carry one term; the row uses the authority's coordinate, which is what a mirror row owes.
- **The snapshot.** "snapshot" is the settled prose term across `src/core/types.ts:769`, `:796`, `:843`, `:952` and `guides/mcp.md:905`, `:948`, `:961`; `MCPTaskDetail` is the type name and `DetailedTask` the schema coordinate the rows must spell. One concept, one prose term, one type name derived from the authority.

## 3. Comment and TSDoc voice — NOT-EVIDENCED

The claim's population is empty in the artifact it names. `bef9f40` adds no `//` comment and no `@remarks`: its `MCPServer.ts` hunk is code only, its `helpers.ts` import hunk is an import, and its matcher hunk is code only (`m4-commit-bef9f40.txt:34-121`, corroborated by the same diff in `m4-stream-report.md:172-263`). The only documentation the commit adds is one `@param` line at `src/core/helpers.ts:880`.

I checked that line against the claim's conjuncts anyway, and it splits: it is in the file's established voice, states behavior of the component, and takes exactly the form `.claude/rules/typescript.md:77` mandates for a boolean parameter — but it narrates the ternary at `helpers.ts:898` rather than stating a constraint the code cannot show. That conjunct cannot fairly rule against a `@param` whose wording the rules prescribe. So the round has no member of the claimed population to attack, and the claim as written could not have been falsified by the evidence this round had. The line's separate rule break is finding F2.

## 4. Mirror design fit — BROKEN

Two of the three conjuncts hold. The rows read as data: each `TASK_SCHEMA_*_ROWS` array is a literal table, the projection functions sit above them, and `.claude/rules/tests.md:184` places data tables in a setup file at any size. The digest pin is discoverable: `TASK_SCHEMA_DIGEST` sits at `tests/setupConformance.ts:98` under its own TSDoc line, at the head of the block, and the commit message quotes it.

The third conjunct — "the `.1` closure … leaves no seam a reader would trip on" — is false at `tests/setupConformance.ts:561-562`.

**What is wrong.** The corrected `TaskStatusNotificationParams metadata` row's expected value now carries roughly 600 characters of upstream documentation prose, escaped inline, including the authority's own malformed link `{@link SubscriptionsListenRequestsubscriptions/listen}`. The seam is inside one function: `readTaskNotificationMetadata` (`tests/setupConformance.ts:436-444`) names the fields it proves at the definition level — it reads `['$defs','NotificationMetaObject','type']` and `['$defs','NotificationMetaObject','properties']`, deliberately excluding that definition's own `description` (`tests/mirrors/ext-tasks-2026-07-28-schema.json:2425`) — and then takes `properties` wholesale, which drags the property-level `description` back in. The function applies two different projection disciplines one line apart, and the row absorbed the cost.

**Why it matters.** The prose adds no proof the digest pin does not already give: `readFileDigest` compares the file's raw bytes at `tests/setupConformance.ts:184-192`, so any reword of that description already fails. What the prose does add is a red row nobody can read — a reader meeting a failure here cannot tell a structural drift from a wording change, which is the one distinction the row exists to make. It also plants third-party text inside authored source, where `.claude/rules/documentation.md` keeps fetched bytes in the mirror instead.

**What right looks like.** Project the coordinate the row's own name claims. Replace the `metadata.properties` read with a path read of the property's reference — `['$defs','NotificationMetaObject','properties','io.modelcontextprotocol/subscriptionId','$ref']` — and set the expected side to `'#/$defs/RequestId'`. The row then matches its definition-level sibling's discipline, the escaped blob leaves the source, and the digest row keeps covering every byte the row stops naming.

## 5. Guide coherence with the wired surface — CONFIRMED

I tried to break this by walking each guide sentence about the delivery surface against the landed code, and each held.

- `guides/mcp.md:881-886` ("only when a consumer configured BOTH `task` and `subscription`", "DERIVED … no third flag") matches `MCPServer.ts:1332-1335` exactly, including the absence of a stored flag.
- `:889-891` ("resolves every one through `MCPTaskManagerInterface.task(id, options)`", "in request order, duplicates intact") matches the loop at `MCPServer.ts:1340-1342`; `MCPTaskOptions.tasks` is that interface (`types.ts:1043-1048`), so the guide names the interface method rather than the field chain, which is the right spelling for a reader.
- `:895` ("the member is omitted entirely rather than acknowledged as an empty array") matches `MCPServer.ts:1345`.
- `:896-897` ("A `taskIds` that is not an array of strings never reaches the read at all") matches `isMCPSubscriptionFilter` at `validators.ts:1392-1393`.
- `:905` ("`isMCPTaskNotification` gates the branch before the agreed set is read") matches the short-circuit at `helpers.ts:935-938`.
- The fence at `:924-929` predicts `{}` for a `false` third argument and the request order preserved for `true`; both follow from `helpers.ts:898` and `:906` (derivation, from source rather than an executed fence).
- The Surface rows at `:2085-2086` describe the third argument and the tasks branch in the same terms the signatures carry.

Concept order matches too: the guide runs filter keys, wiring, derived support, authorization at acknowledgement, fixed lifetime; the code runs derive, build, resolve, acknowledge, listen, match.

## Findings outside the claims

**F1 — `src/core/helpers.ts:886`: the boolean parameter is named as a noun.** `tasks` is a plural noun; `.claude/rules/names.md` § General vocabulary requires booleans to read as assertions, and its value-level table fixes the form as a camelCase adjective or past participle. The package's own booleans obey it — `duplex` (`types.ts:2224`) and `connected` (`:2655`) — while `subscribe`, `listChanged`, and `isError` are protocol-owned spellings this rule does not reach. `tasks` is this package's own invention, so it takes the rule unmitigated. Why it matters: a call site reads `buildSubscriptionFilter(requested, supported, tasks)` as a third collection rather than as a switch. What right looks like: rename it `enabled`, and reword the `@param` around it. Avoid `honoured` — `guides/mcp.md:853` already binds that word to the filter itself.

**F2 — `src/core/helpers.ts:880`: the `@param` omits the mandated default.** The parameter is declared `tasks = false`, and `.claude/rules/typescript.md:79` requires "Write a default as 'Default: …'". The line stops after the boolean clause. Why it matters: a caller reading the published TSDoc cannot tell that omitting the argument is legal, which is the whole reason the existing two-argument call sites keep their behavior. What right looks like: append `Default: \`false\`` to that `@param`.

**F3 — `2b823f9` carries reformatting the mirror did not need, unaccounted for in its message.** The commit expands pre-existing fixture literals throughout `tests/setupConformance.ts` — the hunks at `m4-commit-2b823f9.txt:754-887` covering the image and audio tool fixtures, `CONFORMANCE_CONTENTS`, `readConformanceTemplate`, `CONFORMANCE_PROMPTS`, and `buildConformanceMessages` — none of which touch the Tasks mirror. The commit message describes only the vendoring, the pins, and the row suites. Two supplied facts bound the reading: `format:check` was green at the baseline `f1632ad` (per `m4-mirror-brief.md:46`) and is green at head (per `bc54b38`'s message), so oxfmt accepts both the single-line and the expanded form and did not force the change; and `m4-mirror-deviation.md:35-41` shows `prettier --check` flagging `tests/setupConformance.ts` while `oxfmt --check` at `:23-30` flags only the mirror. Derivation, from those two facts rather than from a run: the expansion came from the Prettier invocation the brief's acceptance criterion named (`m4-mirror-brief.md:167`), not from the repository's formatter. Why it matters: a reader auditing the mirror cannot separate the unit's edits from churn, and the campaign record states a change set the commit does not contain. What right looks like: keep a unit's diff to what its message names, and fix the brief's acceptance criterion to name `oxfmt`, the formatter `package.json:72-73` actually runs.

**F4 — `guides/mcp.md:3917-3930`: the guide's account of the conformance project no longer describes the project.** That section defines the run as "it starts the real Streamable HTTP server from this package's source and runs `@modelcontextprotocol/conformance`", and the project now also carries the Tasks schema authority pins, which start no server and drive no client. Nothing in `guides/` names `tests/mirrors/`, the digest pin, or the row suites — the only reference to that directory outside the setup file is `.prettierignore:14`. The recorded "23 passed / 0 failed" line stays true of the foreign runner, so the number is not the defect; the definition around it is. The reconciliation's guide-site carrier list (`m4-design-reconciliation.md:193-206`) enumerates the guide edits `m4-guide` owns and does not name this section, and `guides/` was off-limits to `m4-mirror` (`m4-mirror-brief.md:97`), so the prose describing the widened mechanism reached head with no carrier. Why it matters: the guide is where a reader learns what this package's conformance evidence covers, and it now understates that evidence by the whole schema-authority half. What right looks like: a successor unit owning `guides/mcp.md` § Declared conformance gaps, restating the project as the foreign-runner run plus the digest-pinned schema mirror, and naming the mirror path and the digest constant.

**F5 — `tests/conformance.test.ts:58`: the test title states an order the module does not have.** The title reads "pins the schema raw-byte digest before parsing", and `tests/setupConformance.ts:195` parses the schema at module load, in `TASK_SCHEMA = readTaskSchema(TASK_SCHEMA_PATH)`, before any `it` body runs. Why it matters: the title is the reader's only account of what the row guards, and it describes a sequence the artifact reverses — the drift class this audit exists to catch. What right looks like: name the row for what it proves at the moment it runs, such as "pins the vendored schema's raw-byte digest", and leave the load-time check to speak for itself.

## Referral to the objective lane

**R1 — whether the digest row can redden at all.** `readTaskSchema` throws on a digest mismatch (`tests/setupConformance.ts:186-188`) and runs at module load, so a changed mirror appears to fail collection of `tests/conformance.test.ts` before the digest row executes, and the row would then only ever pass. That is a test-adequacy and reachability question — `.claude/rules/tests.md:306` ("confirm each assertion would fail for the defect it claims to catch") — and it needs a run to settle. I state the reading and rule nothing on it. Its naming half is F5, which stands on its own.

**R2 — the formatter path behind F3.** Which tool produced the reformatting in `2b823f9`, and whether the tree is reproducible under `npm run format`, needs an executed comparison rather than my derivation.

VERDICT: FAIL -- 1 broken, 0 unresolved, 1 not-evidenced, 5 findings outside the claims
