# Codex-side brief: objective lane, design adversarial pass

## Reader

You (the GPT-5.6 Sol engine) are reading this brief inside `codex exec`, launched read-only,
rooted at `/home/user/scaffold`. Perform the assignment directly. Spawn nothing. Work read-only
and in-process: no writes, no subprocess launches, no network calls. Network access is denied in
this sandbox, so every source you cite must be local and reached by direct file read.

## Objective

Read and execute the shared design brief at
`/home/user/scaffold/.orkestrel/campaign/design-brief.md` exactly, as written. That file is the
authoritative brief: its Context, Unknowns, Scope, Acceptance criteria, Review evidence, and
Output sections govern your work. This document adds only the lane assignment and the
environment facts you need to execute that brief; it restates nothing the shared brief already
states, so do not treat this document as a substitute for reading it in full.

## Your lane: OBJECTIVE

You hold the objective lane of the adversarial design pass. Argue correctness, constraints, and
what the code and contracts actually permit — not shape, taste, naming, or ergonomics. A separate
subjective lane is arguing shape and API feel on the same shared brief, blind to your answer, in a
clean context. Do not soften your findings into design-taste framing, and do not defer a
correctness question because it "reads fine" stylistically. Where the shared brief's own scope
calls for a taste judgment you cannot make objectively, say so explicitly rather than guessing.

## Evidence discipline

Verify every load-bearing evidence claim you rely on against source, and cite it `file:line`.
Do not accept a claim in the shared brief, in this document, or in your own prior reasoning
without checking it against the actual file content when it is load-bearing to your verdict.
Resolve the shared brief's named unknowns explicitly — `server/discover` wiring, the
`subscriptions/listen` transport behavior, the input-required retry pattern, the tasks extension,
protocol deprecations, and `-32022` error-code semantics — each with a `file:line` citation or an
explicitly recorded absence (state exactly what you searched and where, if you cannot find it).

## Host environment facts

- Working directory: `/home/user/scaffold`. Sandbox: `read-only`. No writes, no installs, no
  network.
- Sibling checkouts referenced by the shared design brief live at the following absolute paths,
  and are readable directly (they are not inside `/home/user/scaffold`, so a relative path or a
  scan rooted at the launch directory will miss them):
  - `/home/user/mcp`
  - `/home/user/probe`
  - `/home/user/html`
  - `/home/user/markdown`
  - `/home/user/workflow`
  - `/home/user/process`
  - `/home/user/tool`
  - `/home/user/queue`
  - `/home/user/middleware`
  Read any of these the shared brief's Context or Unknowns sections point you to, by absolute
  path.
- Network access is denied. Every source you cite is a local file; do not claim to have consulted
  an external specification, changelog, or web page. Where the shared brief's unknowns require
  external protocol knowledge you cannot verify locally, record that as an explicit gap rather
  than asserting an unverified belief.

## Output

Your final message must be exactly the report shape the shared design brief's Output section
specifies. Do not append commentary, a process diary, or a summary of what you did outside that
shape.
