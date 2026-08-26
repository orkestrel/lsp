import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
const dir = mkdtempSync(join(tmpdir(), 'oxsd-'))
writeFileSync(join(dir, '.oxlintrc.json'), JSON.stringify({ rules: { 'no-debugger': 'error' } }))
const bin = '/home/user/lsp/node_modules/oxlint/bin/oxlint'
const child = spawn(process.execPath, [bin, '--lsp'], { cwd: dir, stdio: ['pipe','pipe','pipe'] })
child.stderr.resume()
let buf = Buffer.alloc(0)
const t0 = Date.now()
child.on('exit', (c,s) => console.log('EXIT', c, s, Date.now()-t0))
child.stdout.on('data', (d) => { buf = Buffer.concat([buf,d]); for(;;){ const i=buf.indexOf('\r\n\r\n'); if(i<0)return; const m=/Content-Length: (\d+)/i.exec(buf.subarray(0,i).toString()); const n=Number(m[1]); if(buf.length<i+4+n)return; const body=buf.subarray(i+4,i+4+n).toString(); buf=buf.subarray(i+4+n); console.log(Date.now()-t0, 'IN <<', body.slice(0,200)) } })
function send(m){ const b=Buffer.from(JSON.stringify(m)); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b) }
send({ jsonrpc:'2.0', id:1, method:'initialize', params:{ processId:process.pid, rootUri:pathToFileURL(dir).href, capabilities:{} } })
setTimeout(()=>{ console.log('sending shutdown'); send({ jsonrpc:'2.0', id:2, method:'shutdown' }) }, 800)
setTimeout(()=>{ console.log('alive?', child.exitCode); child.kill('SIGKILL'); process.exit(0) }, 4000)
