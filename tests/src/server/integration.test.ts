import { createLSPClient } from '@src/core'
import { createStdioTransport } from '@src/server'
import { destroyScratch, createScratch, isRunning } from '@orkestrel/test/server'
import {
	OXLINT_CODE,
	OXLINT_DOCUMENT,
	OXLINT_FILES,
	createOxlintOptions,
	readChildProcesses,
	waitForReaped,
} from '../../setupServer.js'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('src server oxlint receipt', () => {
	// Spawning an interpreter, loading the linter, linting a document, and tearing the session down
	// are four real host operations, so this budget is sized for a contended run rather than an
	// idle one.
	it('reads a real Oxlint diagnostic through the client and leaves no child behind', async () => {
		const scratch = createScratch({ prefix: 'lsp-oxlint-', files: OXLINT_FILES })
		const transport = createStdioTransport(createOxlintOptions(scratch.path, 2_000))
		const client = createLSPClient({
			transport,
			workspace: pathToFileURL(scratch.path).href,
			timeout: 10_000,
		})
		const baseline = new Set(readChildProcesses(process.pid))
		try {
			await client.start()
			const spawned = readChildProcesses(process.pid).filter((pid) => !baseline.has(pid))
			expect(spawned).toHaveLength(1)
			const [pid] = spawned
			expect(client.capabilities?.textDocumentSync).toStrictEqual({
				openClose: true,
				change: 1,
				save: { includeText: false },
			})
			expect(client.encoding).toBe('utf-16')
			const diagnostics = await client.open({
				uri: pathToFileURL(join(scratch.path, 'main.js')).href,
				languageId: 'javascript',
				version: 1,
				text: OXLINT_DOCUMENT,
			})
			expect(diagnostics).toHaveLength(1)
			expect(diagnostics[0]?.code).toBe(OXLINT_CODE)
			expect(diagnostics[0]?.severity).toBe(1)
			expect(diagnostics[0]?.range).toStrictEqual({
				start: { line: 0, character: 0 },
				end: { line: 0, character: 8 },
			})
			await client.destroy()
			await waitForReaped(pid === undefined ? 0 : pid)
			expect(pid === undefined ? true : isRunning(pid)).toBe(false)
		} finally {
			await destroyScratch(scratch)
		}
	}, 30_000)
})
