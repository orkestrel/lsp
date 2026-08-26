# M4 probe — where the tasks subscription fragment composes, 2026-08-26

The Orchestrator ran the planner ruling's settling commands. The probe closes the planner's
unknowns 1 and 3 as far as the published sources allow, and confirms the `taskIds` spelling.

## Commands and readings

- `curl https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/2026-07-28/schema.ts`
  — fetched, 98426 bytes, staged at the session scratchpad as `mcp-core-2026-07-28-schema.ts`.
  `grep -n "TaskSubscription\|taskIds\|tasksStatus"` over it returns NOTHING: the core revision
  never references the tasks fragments.
- The core `SubscriptionFilter` (core `schema.ts:1270-1288`) declares `toolsListChanged`,
  `promptsListChanged`, `resourcesListChanged`, and `resourceSubscriptions?: string[]`, with the
  opt-in law in its TSDoc. `SubscriptionsListenRequestParams` (`:1295-1302`) types
  `notifications: SubscriptionFilter`. No extension hook is declared.
- `curl` probes of the ext-tasks repository for a normative spec document — `SPEC.md`, `spec.md`,
  `docs/spec.md`, `specification.md` — all return 404.
- `curl https://modelcontextprotocol.io/docs/extensions/tasks.md` — fetched, 10237 bytes, staged
  as `ext-tasks-docpage.md`. Its whole statement on the carrier: "Servers can push status updates
  via `notifications/tasks`. Clients opt into these through the `subscriptions/listen`
  mechanism." No member-level composition appears.

## The ruling this evidence supports

No published source states a normative composition rule for `TaskSubscriptionNotifications`. The
structural evidence converges on one reading: the fragment is a field set for the listen
request's `notifications` object — its JSDoc calls it "Task-specific fields for the
subscriptions/listen request", and the sibling per-id member `resourceSubscriptions` lives inside
the filter. The implementation therefore places `taskIds` inside the filter object
(`params.notifications.taskIds`), the guide names the composition as this package's reading of an
under-specified extension point, and the conformance-gap note the planner prescribed stands.

The `tasksStatus` spelling in the fragment's prose is a documentation slip in the authority: the
declared member and the generated schema both say `taskIds`, and the doc page names neither. The
`taskIds` ruling stands.
