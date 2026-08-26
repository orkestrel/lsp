import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = mkdtempSync(join(tmpdir(), 'oxexit-'))
writeFileSync(join(dir, '.oxlintrc.json'), JSON.stringify({ rules: { 'no-debugger': 'error' } }))
const bin = '/home/user/lsp/node_modules/oxlint/bin/oxlint'
const child = spawn(process.execPath, [bin, '--lsp'], { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] })
console.log('pid', child.pid)
child.on('exit', (c, s) => console.log('EXIT', c, s, 'at', Date.now() - t0))
child.stdout.resume()
child.stderr.resume()
const t0 = Date.now()
function send(msg) {
	const body = Buffer.from(JSON.stringify(msg), 'utf8')
	child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`)
	child.stdin.write(body)
}
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { processId: process.pid, rootUri: pathToFileURL(dir).href, capabilities: {} } })
const mode = process.argv[2]
setTimeout(() => {
	if (mode === 'shutdown') {
		send({ jsonrpc: '2.0', id: 2, method: 'shutdown' })
		setTimeout(() => send({ jsonrpc: '2.0', method: 'exit' }), 300)
	} else if (mode === 'stdin') {
		child.stdin.end()
	}
}, 1000)
setTimeout(() => { console.log('still alive?', child.exitCode, child.signalCode); child.kill('SIGKILL'); process.exit(0) }, 5000)
