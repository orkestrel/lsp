import type { JSONRPCMessage, LSPDecodeState, LSPExit } from '@src/core'
import type { StdioClientTransportOptions } from '@src/server'
import { parseLSPMessages } from '@src/core'
import { isRunning } from '@orkestrel/test/server'
import { waitForCondition } from '@orkestrel/test'
import { WORKSPACE_ROOT } from './setup.js'
import { fileURLToPath } from 'node:url'

/** The protocol-faithful child peer the server suite spawns. */
export const FIXTURE_PEER = fileURLToPath(
	new URL('tests/src/server/fixtures/peer.mjs', WORKSPACE_ROOT),
)

/** The child peer that hands its standard output to a pipe-holding grandchild. */
export const FIXTURE_HOLDER = fileURLToPath(
	new URL('tests/src/server/fixtures/holder.mjs', WORKSPACE_ROOT),
)

/**
 * The value this process carries in `LSP_FIXTURE_AMBIENT` so a child can report what it inherited.
 *
 * @remarks A host adds variables to a child's environment on its own account: Windows copies `PATH`,
 * `TEMP`, `USERPROFILE`, and the rest of its required set into every child whatever environment the
 * spawn configured, so `PATH` reports the same value there whether a spawn replaced the environment
 * or inherited it. No host injects this variable, so a child that reports it inherited the parent's
 * environment and a child that reports `null` received the configured environment alone.
 */
export const FIXTURE_AMBIENT = 'inherited'

process.env.LSP_FIXTURE_AMBIENT = FIXTURE_AMBIENT

/**
 * The exit a child reports on this host after a transport kills it.
 *
 * @remarks A POSIX host records the signal that ended the process and no exit code. Windows carries
 * no signal to record: `stopChild` ends the tree through the host's `taskkill` utility, and a
 * process the host terminates reports the exit code `1`. Each reading names the same event on the
 * host that produced it, so the expectation is read from the running host rather than fixed to one.
 */
export const KILLED_EXIT: LSPExit = Object.freeze(
	process.platform === 'win32' ? { code: 1, signal: null } : { code: null, signal: 'SIGKILL' },
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
}): StdioClientTransportOptions {
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
 * Builds transport options that spawn the holder peer through the current Node executable.
 *
 * @param release - The path whose appearance releases the grandchild holding the child's output.
 * @param grace - The cooperative termination window in milliseconds.
 * @returns Stdio transport options naming the holder peer as the child command.
 * @remarks The grace window also bounds the wait for the child's stdio close, and the holder's
 * grandchild outlives that wait, so keep it short enough that a close stays quick.
 */
export function createHolderOptions(release: string, grace: number): StdioClientTransportOptions {
	return { server: { command: [process.execPath, FIXTURE_HOLDER, release] }, grace }
}

/**
 * Builds transport options that spawn Oxlint's language server over the given workspace.
 *
 * @param directory - The workspace directory the language server lints.
 * @param grace - The cooperative termination window in milliseconds.
 * @returns Stdio transport options naming Oxlint's language-server mode as the child command.
 */
export function createOxlintOptions(directory: string, grace: number): StdioClientTransportOptions {
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
 * Reads one numeric member of the first result payload the fixture peer returned.
 *
 * @param messages - The decoded peer messages, in arrival order.
 * @param key - The result member to read.
 * @returns The member's value.
 * @throws An `Error` naming the member when no result carried it as a number.
 * @remarks A caller that needs the value cannot proceed without it, so an absent or off-shape member
 * fails here rather than reaching an assertion as a stand-in number.
 */
export function readPeerNumber(messages: readonly JSONRPCMessage[], key: string): number {
	const value = readPeerResult(messages, key)
	if (typeof value !== 'number')
		throw new Error(`the fixture peer reported no numeric ${key} member`)
	return value
}

/**
 * Reads the process identifier the fixture peer reported for itself.
 *
 * @param messages - The decoded peer messages, in arrival order.
 * @returns The child's own process identifier.
 * @throws An `Error` when no echo result carried an identifier.
 */
export function readPeerPid(messages: readonly JSONRPCMessage[]): number {
	return readPeerNumber(messages, 'pid')
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
