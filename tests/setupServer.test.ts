import { waitForCondition } from '@orkestrel/test'
import { readChildProcesses, readProcessTable } from './setupServer.js'
import { spawn } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('readProcessTable', () => {
	it('keeps the rows naming the given parent and drops every other row', () => {
		expect(readProcessTable(process.pid).length).toBeGreaterThan(0)
		expect(readProcessTable(process.pid + 1_000_000)).toStrictEqual([])
	})
})

describe('readChildProcesses', () => {
	it('reports a child of the given parent while the host still holds its row', async () => {
		const child = spawn(process.execPath, ['-e', 'setTimeout(() => undefined, 30000)'], {
			stdio: ['ignore', 'ignore', 'ignore'],
		})
		await new Promise<void>((resolve) => child.once('spawn', () => resolve()))
		const pid = child.pid ?? 0
		try {
			expect(readChildProcesses(process.pid)).toContain(pid)
		} finally {
			child.kill('SIGKILL')
			await waitForCondition(
				`process ${String(pid)} to leave the host table`,
				() => !readProcessTable(process.pid).includes(pid),
				{ budget: 5_000 },
			)
		}
		expect(readChildProcesses(process.pid)).not.toContain(pid)
	})

	it('excludes the reader each snapshot spawns to read the table', () => {
		// Reading the table costs a child of its own, and `ps` lists itself, so one snapshot always
		// reports at least that reader. The intersection is what removes it: the first snapshot's
		// reader is reaped before the second runs, so nothing survives both. A parent owning no other
		// child therefore reports rows through one snapshot and none through the pair, which is the
		// difference a single-snapshot implementation could not produce.
		expect(readProcessTable(process.pid).length).toBeGreaterThan(0)
		expect(readChildProcesses(process.pid)).toStrictEqual([])
	})
})
