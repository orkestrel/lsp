// A protocol-faithful Language Server Protocol peer spawned as a real child process.
//
// It reads Content-Length framed JSON-RPC from standard input and answers on standard output. The
// `probe/*` methods let a test drive the byte patterns and the exit behaviour a transport proof
// needs: a frame delivered in two writes, two frames delivered in one write, and an unprompted
// exit. Passing `--stubborn` makes the peer ignore both the cooperative stdin close and `SIGTERM`,
// which is the case a grace window must escalate past.

import { frame, listen, reply } from './protocol.mjs'

const stubborn = process.argv.includes('--stubborn')

function replySplit(message) {
	const bytes = frame(message)
	const cut = Math.floor(bytes.length / 2)
	process.stdout.write(bytes.subarray(0, cut))
	setTimeout(() => process.stdout.write(bytes.subarray(cut)), 25)
}

function replyCoalesced(first, second) {
	process.stdout.write(Buffer.concat([frame(first), frame(second)]))
}

function handle(message) {
	const method = message.method
	if (method === 'probe/echo') {
		reply({
			jsonrpc: '2.0',
			id: message.id,
			result: {
				pid: process.pid,
				directory: process.cwd(),
				variable: process.env.LSP_FIXTURE_VALUE ?? null,
				ambient: process.env.LSP_FIXTURE_AMBIENT ?? null,
				received: message.params ?? null,
			},
		})
		return
	}
	if (method === 'probe/split') {
		replySplit({ jsonrpc: '2.0', method: 'probe/report', params: { shape: 'split' } })
		return
	}
	if (method === 'probe/coalesce') {
		replyCoalesced(
			{ jsonrpc: '2.0', method: 'probe/report', params: { shape: 'first' } },
			{ jsonrpc: '2.0', method: 'probe/report', params: { shape: 'second' } },
		)
		return
	}
	if (method === 'probe/exit') {
		const code = typeof message.params?.code === 'number' ? message.params.code : 0
		process.exit(code)
	}
}

listen(handle)

if (stubborn) {
	process.on('SIGTERM', () => undefined)
	process.on('SIGHUP', () => undefined)
	process.stdin.on('end', () => undefined)
	// The pending timer is what keeps a stubborn peer alive, and its deadline is what stops a peer
	// whose transport never escalated from outliving the run that spawned it.
	setTimeout(() => process.exit(9), 20_000)
} else {
	process.stdin.on('end', () => process.exit(0))
}

process.stdout.write(frame({ jsonrpc: '2.0', method: 'probe/ready', params: { stubborn } }))
