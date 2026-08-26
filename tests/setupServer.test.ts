import type { JSONRPCMessage } from '@src/core'
import { readPeerNumber } from './setupServer.js'
import { describe, expect, it } from 'vitest'

const REPORTS: readonly JSONRPCMessage[] = [
	{ jsonrpc: '2.0', method: 'probe/report', params: { shape: 'holder' } },
	{ jsonrpc: '2.0', id: 1, result: { pid: 4242, grandchild: 4243, label: 'held' } },
]

describe('readPeerNumber', () => {
	it('returns the numeric member a result carried', () => {
		expect(readPeerNumber(REPORTS, 'pid')).toBe(4242)
		expect(readPeerNumber(REPORTS, 'grandchild')).toBe(4243)
	})

	it('refuses a member the peer never reported and one it reported off-shape', () => {
		expect(() => readPeerNumber(REPORTS, 'orphan')).toThrow('numeric orphan member')
		expect(() => readPeerNumber(REPORTS, 'label')).toThrow('numeric label member')
		expect(() => readPeerNumber([], 'pid')).toThrow('numeric pid member')
	})
})
