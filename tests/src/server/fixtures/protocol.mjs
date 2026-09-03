// The base-protocol framing and the standard-input reader every fixture peer shares.
//
// The peers must frame independently of the package under test, so this module implements the
// Content-Length grammar itself and imports nothing from `@src/core`: a peer that framed through
// `encodeLSPMessage` and decoded through `parseLSPMessages` would assert the codec against itself.
// Keeping one copy here is what stops a framing correction from reaching one peer and leaving the
// other measuring the old behaviour.

// The accumulator `listen` fills. One fixture process registers one reader, so one buffer holds it.
let pending = Buffer.alloc(0)

/**
 * Frames a JSON-RPC message as one Content-Length base-protocol frame.
 *
 * @param {unknown} message - The JSON-RPC message to frame.
 * @returns {Buffer} The ASCII header and UTF-8 body as one buffer.
 */
export function frame(message) {
	const body = Buffer.from(JSON.stringify(message), 'utf8')
	return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8'), body])
}

/**
 * Writes one framed JSON-RPC message to standard output.
 *
 * @param {unknown} message - The JSON-RPC message to write.
 * @returns {void}
 */
export function reply(message) {
	process.stdout.write(frame(message))
}

/**
 * Hands every complete frame in a buffer to a handler and returns the bytes that follow them.
 *
 * @param {Buffer} bytes - The retained bytes read so far, in arrival order.
 * @param {(message: unknown) => void} handle - The handler each decoded message reaches.
 * @returns {Buffer} The bytes left after the last complete frame.
 */
export function drain(bytes, handle) {
	let rest = bytes
	for (;;) {
		const boundary = rest.indexOf('\r\n\r\n')
		if (boundary < 0) return rest
		const header = rest.subarray(0, boundary).toString('utf8')
		const declared = /content-length:\s*(\d+)/i.exec(header)
		if (declared === null) {
			rest = rest.subarray(boundary + 4)
			continue
		}
		const length = Number(declared[1])
		if (rest.length < boundary + 4 + length) return rest
		const body = rest.subarray(boundary + 4, boundary + 4 + length).toString('utf8')
		rest = rest.subarray(boundary + 4 + length)
		handle(JSON.parse(body))
	}
}

/**
 * Reads Content-Length framed messages from standard input and hands each decoded one to a handler.
 *
 * @param {(message: unknown) => void} handle - The handler each decoded message reaches.
 * @returns {void}
 */
export function listen(handle) {
	process.stdin.on('data', (chunk) => {
		pending = drain(Buffer.concat([pending, chunk]), handle)
	})
}
