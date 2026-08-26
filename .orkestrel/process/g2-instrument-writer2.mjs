import { appendFileSync } from 'node:fs'
const target = process.argv[2]
if (process.argv[3] === 'guard') process.stderr.on('error', () => undefined)
let index = 0
setInterval(() => {
	const marker = `late:${String(index)}\n`
	index += 1
	process.stderr.write(marker)
	appendFileSync(target, marker)
}, 20)
