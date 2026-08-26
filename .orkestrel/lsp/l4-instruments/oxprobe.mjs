import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = mkdtempSync(join(tmpdir(), 'oxprobe-'))
writeFileSync(join(dir, '.oxlintrc.json'), JSON.stringify({ rules: { 'no-debugger': 'error' } }, null, 2))
const file = join(dir, 'main.js')
const text = 'debugger\n'
writeFileSync(file, text)

const bin = '/home/user/lsp/node_modules/oxlint/bin/oxlint'
const child = spawn(process.execPath, [bin, '--lsp'], { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] })
child.stderr.on('data', (d) => console.log('STDERR:', d.toString()))
let buf = Buffer.alloc(0)
child.stdout.on('data', (d) => {
	buf = Buffer.concat([buf, d])
	for (;;) {
		const i = buf.indexOf('\r\n\r\n')
		if (i < 0) return
		const header = buf.subarray(0, i).toString('utf8')
		const m = /Content-Length: (\d+)/i.exec(header)
		const len = Number(m[1])
		if (buf.length < i + 4 + len) return
		const body = buf.subarray(i + 4, i + 4 + len).toString('utf8')
		buf = buf.subarray(i + 4 + len)
		console.log('IN <<', body.slice(0, 1200))
	}
})
function send(msg) {
	const body = Buffer.from(JSON.stringify(msg), 'utf8')
	child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`)
	child.stdin.write(body)
	console.log('OUT >>', JSON.stringify(msg).slice(0, 400))
}
const uri = pathToFileURL(file).href
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { processId: process.pid, rootUri: pathToFileURL(dir).href, capabilities: { general: { positionEncodings: ['utf-16'] }, textDocument: { synchronization: {}, publishDiagnostics: {}, diagnostic: {} } } } })
setTimeout(() => {
	send({ jsonrpc: '2.0', method: 'initialized', params: {} })
	send({ jsonrpc: '2.0', method: 'textDocument/didOpen', params: { textDocument: { uri, languageId: 'javascript', version: 1, text } } })
}, 1200)
setTimeout(() => { send({ jsonrpc: '2.0', id: 2, method: 'textDocument/diagnostic', params: { textDocument: { uri } } }) }, 3000)
setTimeout(() => { console.log('DONE, killing'); child.kill('SIGKILL'); process.exit(0) }, 6000)
