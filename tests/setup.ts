import { resolveRoot } from '@orkestrel/test'

/** Resolves the workspace root from this module's conventional `tests/` location. */
export const WORKSPACE_ROOT = resolveRoot(import.meta)
