import type { JSONRPCMessage, LSPDecodeState } from '@src/core'
import type { StdioTransportOptions } from '@src/server'
import { parseLSPMessages } from '@src/core'
import { isRunning } from '@orkestrel/test/server'
import { resolveRoot, waitForCondition } from '@orkestrel/test'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/** The workspace root, resolved from this module's conventional `tests/` location. */
export const WORKSPACE_ROOT = resolveRoot(import.meta)

/** The protocol-faithful child peer the server suite spawns. */
export const FIXTURE_PEER = fileURLToPath(
	new URL('tests/src/server/fixtures/peer.mjs', WORKSPACE_ROOT),
)

/** The Oxlint entry the live receipt drives in its language-server mode. */
export const OXLINT_ENTRY = fileURLToPath(new URL('node_modules/oxlint/bin/oxlint', WORKSPACE_ROOT))

/** The document the Oxlint receipt opens, carrying exactly one rule violation. */
export const OXLINT_DOCUMENT = 'debugger\n'

/** The rule the Oxlint receipt pins, reported as this diagnostic code. */
export const OXLINT_CODE = 'eslint(no-debugger)'

/** The workspace the Oxlint receipt lints, pinned to one rule so its diagnostics stay fixed. */
export const OXLINT_FILES: Readonly<Record<string, string>> = Object.freeze({
	'.oxlintrc.json': `${JSON.stringify({ rules: { 'no-debugger': 'error' } }, null, '\t')}\n`,
	'main.js': OXLINT_DOCUMENT,
})

/**
 * Builds transport options that spawn the fixture peer through the current Node executable.
 *
 * @param options - The peer's stubbornness, working directory, environment, and grace window.
 * @returns Stdio transport options naming the fixture peer as the child command.
 */
export function createPeerOptions(options?: {
	readonly stubborn?: boolean
	readonly directory?: string
	readonly environment?: Readonly<Record<string, string | undefined>>
	readonly grace?: number
}): StdioTransportOptions {
	const command =
		options?.stubborn === true
			? [process.execPath, FIXTURE_PEER, '--stubborn']
			: [process.execPath, FIXTURE_PEER]
	return {
		server: {
			command,
			...(options?.directory === undefined ? {} : { directory: options.directory }),
			...(options?.environment === undefined ? {} : { environment: options.environment }),
		},
		...(options?.grace === undefined ? {} : { grace: options.grace }),
	}
}

/**
 * Builds transport options that spawn Oxlint's language server over the given workspace.
 *
 * @param directory - The workspace directory the language server lints.
 * @param grace - The cooperative termination window in milliseconds.
 * @returns Stdio transport options naming Oxlint's language-server mode as the child command.
 */
export function createOxlintOptions(directory: string, grace: number): StdioTransportOptions {
	return { server: { command: [process.execPath, OXLINT_ENTRY, '--lsp'], directory }, grace }
}

/**
 * Decodes recorded transport chunks into the messages they framed.
 *
 * @param chunks - The raw chunks recorded from the transport's `chunk` event, in arrival order.
 * @returns Every complete message the chunks carried.
 * @remarks Decoding runs through the package's own parser, so a chunk boundary that falls inside a
 * frame is carried across calls exactly as a client carries it.
 */
export function collectPeerMessages(chunks: readonly Uint8Array[]): readonly JSONRPCMessage[] {
	const messages: JSONRPCMessage[] = []
	let state: LSPDecodeState | undefined = undefined
	for (const chunk of chunks) {
		const [decoded, next] = parseLSPMessages(chunk, state)
		messages.push(...decoded)
		state = next
	}
	return messages
}

/**
 * Reads one member of the first result payload the fixture peer returned.
 *
 * @param messages - The decoded peer messages, in arrival order.
 * @param key - The result member to read.
 * @returns The member's value, or `undefined` when no result carries it.
 */
export function readPeerResult(messages: readonly JSONRPCMessage[], key: string): unknown {
	for (const entry of messages) {
		if (!('result' in entry)) continue
		const result: unknown = entry.result
		if (typeof result !== 'object' || result === null) continue
		if (key in result) return Reflect.get(result, key)
	}
	return undefined
}

/**
 * Reads the process identifier the fixture peer reported for itself.
 *
 * @param messages - The decoded peer messages, in arrival order.
 * @returns The child's own process identifier.
 * @throws An `Error` when no echo result carried an identifier.
 */
export function readPeerPid(messages: readonly JSONRPCMessage[]): number {
	const pid = readPeerResult(messages, 'pid')
	if (typeof pid !== 'number') throw new Error('the fixture peer reported no process identifier')
	return pid
}

/**
 * Reads the shape label of every report notification the fixture peer sent.
 *
 * @param messages - The decoded peer messages, in arrival order.
 * @returns Each report's shape label, in arrival order.
 */
export function readPeerShapes(messages: readonly JSONRPCMessage[]): readonly unknown[] {
	const shapes: unknown[] = []
	for (const entry of messages) {
		if (!('method' in entry) || entry.method !== 'probe/report') continue
		shapes.push(entry.params?.shape)
	}
	return shapes
}

/**
 * Reads one snapshot of the host process table, keeping the children of one parent.
 *
 * @param parent - The parent process identifier.
 * @returns Every child identifier this snapshot reports, in table order.
 * @throws The host's own error when it provides no `ps` process table, which is the mechanism this
 * reading depends on.
 */
export function readProcessTable(parent: number): readonly number[] {
	const table = execFileSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' })
	const children: number[] = []
	for (const line of table.split('\n')) {
		const [pid, ppid] = line.trim().split(/\s+/)
		if (pid === undefined || ppid === undefined) continue
		if (Number(ppid) === parent && Number.isInteger(Number(pid))) children.push(Number(pid))
	}
	return children
}

/**
 * Reads the identifiers of the live child processes one parent owns.
 *
 * @param parent - The parent process identifier.
 * @returns Every child identifier both snapshots reported, in table order.
 * @remarks A child a language server spawns for itself is invisible to a caller holding only the
 * transport, so the host process table is where its identifier comes from. Reading that table costs
 * a child of its own, and that child appears in its own output, so two snapshots are intersected and
 * only a child that outlived both survives.
 */
export function readChildProcesses(parent: number): readonly number[] {
	const earlier = new Set(readProcessTable(parent))
	return readProcessTable(parent).filter((pid) => earlier.has(pid))
}

/**
 * Waits until the host no longer reports a process at the recorded identifier.
 *
 * @param pid - The process identifier recorded while the child was live.
 * @param budget - The elapsed-time limit in milliseconds. Default: `5000`.
 * @returns A promise that resolves once the identifier is free.
 * @throws An `Error` naming the identifier when the budget elapses while it is still held.
 */
export async function waitForReaped(pid: number, budget = 5_000): Promise<void> {
	await waitForCondition(`process ${String(pid)} to be reaped`, () => !isRunning(pid), { budget })
}
