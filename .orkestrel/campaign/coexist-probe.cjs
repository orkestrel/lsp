// Settles G6 unknown 2: can a 'data' listener coexist with readline on one child stdout,
// and does readline's pause gate the byte listener? Control: data listener alone.
const { spawn } = require('node:child_process')
const readline = require('node:readline')

const CHILD = `process.stdout.write('alpha\\n'); process.stdout.write('bet'); setTimeout(() => { process.stdout.write('a\\ngamma\\n') }, 60)`

function run(name, wire) {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, ['-e', CHILD], { stdio: ['ignore', 'pipe', 'pipe'] })
		const record = { name, lines: [], chunks: 0, bytes: 0 }
		wire(child, record)
		child.on('close', () => resolve(record))
	})
}

async function main() {
	// Control: bytes alone — the instrument can see chunks at all.
	const control = await run('control-bytes-alone', (child, record) => {
		child.stdout.on('data', (c) => { record.chunks += 1; record.bytes += c.length })
	})
	// Subject A: readline first, then a data listener.
	const both = await run('readline-plus-data', (child, record) => {
		const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
		rl.on('line', (l) => record.lines.push(l))
		child.stdout.on('data', (c) => { record.chunks += 1; record.bytes += c.length })
	})
	// Subject B: readline paused after first line — does the data listener starve?
	const paused = await run('readline-paused-gates-data', (child, record) => {
		const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
		rl.on('line', (l) => { record.lines.push(l); rl.pause() })
		child.stdout.on('data', (c) => { record.chunks += 1; record.bytes += c.length })
		setTimeout(() => { record.pausedBytesAt250 = record.bytes; rl.resume() }, 250)
	})
	console.log(JSON.stringify({ node: process.version, control, both, paused }, null, 1))
}

main()
