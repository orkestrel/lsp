# Correction to the L6-E report, 2026-08-26

The sentence in `l6-e-probe-report.md` § 1 reading "The refusal precedes warming, so no server is
spawned for it" is false and is superseded by this note. The L6 analyst audit lane
(`l6-audit-analyst-verdict.md`, claim 8) ruled:

> Missing options are refused before `#warmed()` is awaited at
> `/home/user/probe/src/server/stages/LintStage.ts:104-117`. The claim that this refusal precedes
> warming is false. `LintStage` starts `#warm()` during construction at
> `/home/user/probe/src/server/stages/LintStage.ts:76-82`, and `#warm` starts the client at
> `:141-157`. A caller can invoke the missing-options refusal only after construction has begun
> warming. The smallest correction is to state that refusal precedes awaiting the existing warm.

The corrected statement: the refusal precedes awaiting the existing warm. Construction starts the
warm regardless, so a server is spawned by construction, not by the refused inspection. The
product prose never carried the false claim — the guide row at `guides/probe.md:228` and the
source comment at `src/server/stages/LintStage.ts:106-108` state the refusal against serving, not
warming — so this correction reaches the record alone.
