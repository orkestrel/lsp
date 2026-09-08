# @orkestrel/lsp

> A typed Language Server Protocol client over an injected byte transport: a host-independent core
> carrying the base-protocol framing codec, the JSON-RPC and protocol guards, and an `LSPClient`
> that completes the initialize handshake, owns opened document URIs, and selects pull or push
> diagnostics from the server's own capabilities, beside a server environment whose
> `StdioClientTransport` carries those bytes over a language server run as a child process.

Create a client with the `createLSPClient` function, hand it a transport, and
call `start()` before you open a document. The client reaches its peer only
through the transport it is handed, so any implementation of
`LSPTransportInterface` drives the same client, and the stdio transport ends the
child's whole tree inside a bounded termination window. Part of the `@orkestrel`
line.

## Install

```sh
npm install @orkestrel/lsp
```

## Requirements

- Node.js >= 22.12.0
- ESM and CommonJS builds for the `.` and `./server` entry points
- TypeScript `moduleResolution` set to `node16`, `nodenext`, or `bundler`

## Usage

```ts
import { createLSPClient } from '@orkestrel/lsp'
import { createStdioClientTransport } from '@orkestrel/lsp/server'
import { pathToFileURL } from 'node:url'

declare const directory: string

const transport = createStdioClientTransport({
	server: { command: ['my-language-server', '--stdio'], directory },
	grace: 5_000,
})
const client = createLSPClient({ transport, workspace: pathToFileURL(directory).href })
await client.start()
await client.destroy()
```

## Guide

For the full surface — the client lifecycle, the transport seam, the stdio child
transport, the framing codec and its retained decode state, the protocol guards,
and the `LSPError` failure type — see the
[Language Server Protocol client guide](https://github.com/orkestrel/lsp/blob/main/guides/lsp.md).

## Package

Typed entry points per the `exports` field in `package.json`: the
host-independent client, framing codec, guards, constants, and `LSPError` from
`@orkestrel/lsp`, and the Node stdio transport — `StdioClientTransport` and
`createStdioClientTransport` — from `@orkestrel/lsp/server`.

## License

MIT © [Orkestrel](https://github.com/orkestrel) — see the
[license](https://github.com/orkestrel/lsp/blob/main/LICENSE).
