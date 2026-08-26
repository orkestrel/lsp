import { appendFileSync } from 'node:fs'
const target = process.argv[2]
setInterval(() => {
	appendFileSync(target, `late:${Date.now()}\n`)
}, 20)
