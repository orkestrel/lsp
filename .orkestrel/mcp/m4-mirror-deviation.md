# Deviation

## Expected

The unit must keep `tests/mirrors/ext-tasks-2026-07-28-schema.json` byte-identical to the staged authority and pass a scoped formatting check over the mirror, `tests/setupConformance.ts`, and `tests/conformance.test.ts`.

## Found

The byte-identical mirror has the pinned SHA-256. The repository formatter rejects that mirror's JSON formatting. The brief makes `.prettierignore` report-only, so this unit cannot exclude the vendored authority from formatting. Reformatting the mirror would violate the byte-identical digest requirement.

## Exact evidence

The vendored mirror retains the required digest:

```text
$ sha256sum tests/mirrors/ext-tasks-2026-07-28-schema.json
bf30afb7ac251e3e22c037b7a685f60ef6603031b5484c0d08b1fa0bbe86d460  tests/mirrors/ext-tasks-2026-07-28-schema.json
```

The package-equivalent scoped formatting check exits 1:

```text
$ npx --no-install oxfmt --config .oxfmtrc.json --check tests/mirrors/ext-tasks-2026-07-28-schema.json tests/setupConformance.ts tests/conformance.test.ts
Checking formatting...

tests/mirrors/ext-tasks-2026-07-28-schema.json (2ms)

Format issues found in above 1 files. Run without `--check` to fix.
Finished in 4ms on 3 files using 4 threads.
```

The brief's literal Prettier command also exits 1:

```text
$ npx --no-install prettier --check tests/mirrors/ext-tasks-2026-07-28-schema.json tests/setupConformance.ts tests/conformance.test.ts
Checking formatting...
[warn] tests/mirrors/ext-tasks-2026-07-28-schema.json
[warn] tests/setupConformance.ts
[warn] tests/conformance.test.ts
[warn] Code style issues found in 3 files. Run Prettier with --write to fix.
```

The stopped tree has this status:

```text
$ git status --short
 M tests/conformance.test.ts
 M tests/setupConformance.ts
?? tests/mirrors/
```

## Done

- `tests/mirrors/ext-tasks-2026-07-28-schema.json` contains the byte-identical staged authority.
- `tests/setupConformance.ts` contains the digest and schema-ID pins, the structural readers, the drift helper, and the typed row arrays.
- `tests/conformance.test.ts` contains the schema pin and row-driven conformance suites.
- The outside-membership schema-title control failed through `readConformanceDrift` and was removed afterward.
- `npx --no-install oxlint --deny-warnings tests/setupConformance.ts tests/conformance.test.ts` exited 0.
- `npm run check` exited 0.

## Not done

The final acceptance sequence stopped at the formatting criterion. The final checksum criterion and final `npx vitest run --project conformance` criterion did not run in sequence after a green formatting check. The unit is not complete.