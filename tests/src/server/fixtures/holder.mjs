// A protocol-faithful Language Server Protocol peer that hands its standard output to a grandchild.
//
// `probe/hold` spawns a detached grandchild that inherits this peer's standard-output descriptor,
// holds it open past this peer's own exit, and releases it only after the file named on the command
// line appears. Node reports a child's `close` only after its stdio closes, so this peer's `close`
// arrives long after its `exit` — the interleaving through which a retired transport generation
// would otherwise leak a stale `exit` and a stale chunk into its replacement. The grandchild writes
// one report frame on release, which is the byte pattern a leak would deliver.
//
// A grandchild whose release file never appears exits on its own deadline, so a failed run leaves
// no process behind.

import { spawn } from 'node:child_process'

const release = process.argv[2] ?? ''

let pending = Buffer.alloc(0)

function frame(message) {
	const body = Buffer.from(JSON.stringify(message), 'utf8')
	return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8'), body])
}

function reply(message) {
	process.stdout.write(frame(message))
}

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
		'const started = Date.now()',
		'const timer = setInterval(() => {',
		'  if (!fs.existsSync(release) && Date.now() - started < 15000) return',
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
	if (message.method !== 'probe/hold') return
	reply({
		jsonrpc: '2.0',
		id: message.id,
		result: { pid: process.pid, grandchild: hold() },
	})
}

function drain() {
	for (;;) {
		const boundary = pending.indexOf('\r\n\r\n')
		if (boundary < 0) return
		const header = pending.subarray(0, boundary).toString('utf8')
		const declared = /content-length:\s*(\d+)/i.exec(header)
		if (declared === null) {
			pending = pending.subarray(boundary + 4)
			continue
		}
		const length = Number(declared[1])
		if (pending.length < boundary + 4 + length) return
		const body = pending.subarray(boundary + 4, boundary + 4 + length).toString('utf8')
		pending = pending.subarray(boundary + 4 + length)
		handle(JSON.parse(body))
	}
}

process.stdin.on('data', (chunk) => {
	pending = Buffer.concat([pending, chunk])
	drain()
})

process.stdin.on('end', () => process.exit(0))

process.stdout.write(frame({ jsonrpc: '2.0', method: 'probe/ready', params: { shape: 'holder' } }))
