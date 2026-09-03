// A protocol-faithful Language Server Protocol peer that hands its standard output to a grandchild.
//
// `probe/hold` spawns a detached grandchild that inherits this peer's standard-output descriptor,
// holds it open past this peer's own exit, and releases it only after the file named on the command
// line appears. Node reports a child's `close` only after its stdio closes, so this peer's `close`
// arrives long after its `exit` — the interleaving through which a retired transport generation
// would otherwise leak a stale `exit` and a stale chunk into its replacement. The grandchild writes
// one report frame on release, which is the byte pattern a leak would deliver.
//
// `probe/orphan` spawns the same grandchild and then exits unprompted, so the transport meets a
// child that has ended natively while its generation is still unsettled. The reply is written with
// a completion callback and the exit runs from that callback, so the frame reaches the pipe before
// this peer leaves.
//
// A grandchild whose release file never appears exits on its own deadline, so a failed run leaves
// no process behind.

import { frame, listen, reply } from './protocol.mjs'
import { spawn } from 'node:child_process'

const release = process.argv[2]

// The grandchild's whole purpose is to wait on this path, so a peer launched without one has no
// behaviour to offer. Refusing here reports that at the launch rather than letting a stand-in empty
// path make the grandchild release itself immediately.
if (release === undefined) throw new Error('the holder fixture requires a release path argument')

function hold() {
	const bytes = frame({
		jsonrpc: '2.0',
		method: 'probe/report',
		params: { shape: 'grandchild' },
	}).toString('base64')
	const program = [
		`const bytes = Buffer.from(${JSON.stringify(bytes)}, 'base64')`,
		`const release = ${JSON.stringify(release)}`,
		"const fs = require('node:fs')",
		'const started = performance.now()',
		'const timer = setInterval(() => {',
		'  if (!fs.existsSync(release) && performance.now() - started < 15000) return',
		'  clearInterval(timer)',
		'  process.stdout.write(bytes)',
		'  process.exit(0)',
		'}, 25)',
	].join('\n')
	const grandchild = spawn(process.execPath, ['-e', program], {
		stdio: ['ignore', 1, 'ignore'],
		detached: true,
	})
	grandchild.unref()
	return grandchild.pid
}

function handle(message) {
	if (message.method === 'probe/echo') {
		reply({ jsonrpc: '2.0', id: message.id, result: { pid: process.pid } })
		return
	}
	if (message.method === 'probe/orphan') {
		process.stdout.write(
			frame({ jsonrpc: '2.0', id: message.id, result: { pid: process.pid, grandchild: hold() } }),
			() => process.exit(0),
		)
		return
	}
	if (message.method !== 'probe/hold') return
	reply({
		jsonrpc: '2.0',
		id: message.id,
		result: { pid: process.pid, grandchild: hold() },
	})
}

listen(handle)

process.stdin.on('end', () => process.exit(0))

process.stdout.write(frame({ jsonrpc: '2.0', method: 'probe/ready', params: { shape: 'holder' } }))
