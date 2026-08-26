# Grok terrain brief: progress-shape swap in /home/user/workflow

Read-only. Return distilled evidence only, with file:line pointers. No raw
file dumps, no decisions, no design, no edits. This bench is read-only;
never write to /home/user/workflow.

## Bounded question

Terrain for one implementation brief over /home/user/workflow. The planned
change replaces the package's progress-reporting shape with the exact MCP
progress notification shape — an object carrying `progress` (required
number), `total` (optional number), and `message` (optional string) — and
removes the `unit` member from the progress surface entirely, updating
every consumer in the same change with no compatibility shim.

Return, as distilled evidence with file:line pointers and no raw dumps:

1. The progress surface as it exists: every type, interface member,
   constant, validator, guard, parser, factory, helper, and class member in
   /home/user/workflow/src that declares, produces, consumes, or forwards
   progress data, each with file:line and its exact current shape, and the
   `unit` member's declaration sites.
2. Every emit and consume site: where progress values are constructed,
   where they cross an emitter or transport, and where a consumer reads
   `unit` or any member the swap removes or renames.
3. The blast set: every test file and row, fixture, guide section, example
   fence, and parity row that asserts the current progress shape or the
   `unit` member — name each with file:line; these are the files the
   change makes false.
4. The guide surfaces: the Surface and Methods tables and prose sections in
   /home/user/workflow/guides/ that state the progress shape.
5. Any existing dependency on @orkestrel/mcp in
   /home/user/workflow/package.json (dependencies and devDependencies),
   and whether any import from it exists in src/ or tests/.
6. The barrel exports touching progress types in
   /home/user/workflow/src/core/index.ts (or wherever the barrel lives).
7. The entity that owns progress reporting: its class, its option object,
   its event map, and its public methods, with file:line.

## Output shape

A distillate with the seven numbered answers above, each answer citing
file:line pointers. No raw dumps, no recommendations, no decisions.
