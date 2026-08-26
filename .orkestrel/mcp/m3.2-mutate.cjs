// Applies one named mutation to /home/user/mcp/src/core/MCPClient.ts for the
// M3.2 closure probes. Each mutation must match exactly once or the script fails.
const { readFileSync, writeFileSync } = require('node:fs')
const path = '/home/user/mcp/src/core/MCPClient.ts'
const source = readFileSync(path, 'utf8')
const which = process.argv[2]
let from
let to
if (which === 'snapshot') {
	from = '\tlisten(\n\t\tnotifications: MCPSubscriptionFilter | undefined,\n\t\toptions: MCPListenOptions,\n\t): MCPSubscriptionStream {\n\t\tconst signal = options.signal\n\t\tconst capacity = options.capacity ?? DEFAULT_MCP_SUBSCRIPTION_CAPACITY\n\t\treturn this.#openSubscription(notifications, signal, capacity)\n\t}'
	to = '\tasync *listen(\n\t\tnotifications: MCPSubscriptionFilter | undefined,\n\t\toptions: MCPListenOptions,\n\t): MCPSubscriptionStream {\n\t\tconst signal = options.signal\n\t\tconst capacity = options.capacity ?? DEFAULT_MCP_SUBSCRIPTION_CAPACITY\n\t\tyield* this.#openSubscription(notifications, signal, capacity)\n\t}'
} else if (which === 'reorder') {
	from = "\t\tif ('method' in owned && this.#reportProgress(owned)) return\n\t\tif ('method' in owned && this.#routeSubscription(owned)) return"
	to = "\t\tif ('method' in owned && this.#routeSubscription(owned)) return\n\t\tif ('method' in owned && this.#reportProgress(owned)) return"
} else {
	console.error('unknown mutation')
	process.exit(2)
}
const first = source.indexOf(from)
if (first === -1 || source.indexOf(from, first + 1) !== -1) {
	console.error('mutation anchor not unique')
	process.exit(3)
}
writeFileSync(path, source.replace(from, to))
console.log('mutated: ' + which)
