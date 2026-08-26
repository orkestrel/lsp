#!/usr/bin/env python3
"""Run one mutation at a time against the server suite and restore the pristine bytes after each.

Each entry names the claim it attacks, the exact production text it disables, and the replacement.
The runner asserts the old text occurs exactly once, applies the edit, runs the scoped project,
records the failing test titles, rewrites the pristine bytes, and proves the restoration with `cmp`.
"""

import json
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path('/home/user/lsp')
SCRATCH = ROOT / 'tmp' / 'scratch'
PRISTINE = SCRATCH / 'pristine'
TARGET = ROOT / 'src' / 'server' / 'transports' / 'StdioTransport.ts'

MUTATIONS = [
    {
        'name': 'M1a-empty-command-code',
        'claim': 'start rejects an empty command with code spawn',
        'old': "throw new LSPError('The stdio transport requires a command executable', { code: 'spawn' })",
        'new': "throw new LSPError('The stdio transport requires a command executable', { code: 'closed' })",
    },
    {
        'name': 'M1b-spawn-fault-code',
        'claim': 'start rejects a host spawn fault with code spawn',
        'old': "\t\t\t\t\t\t\tcode: 'spawn',",
        'new': "\t\t\t\t\t\t\tcode: 'closed',",
    },
    {
        'name': 'M2-live-always-false',
        'claim': 'start refuses a second call while the child is live',
        'old': '\t\treturn child !== undefined && child.exitCode === null && child.signalCode === null\n',
        'new': '\t\treturn false && child !== undefined\n',
    },
    {
        'name': 'M9-live-always-true',
        'claim': 'start spawns a fresh child after close and after an unprompted exit',
        'old': '\t\treturn child !== undefined && child.exitCode === null && child.signalCode === null\n',
        'new': '\t\treturn child !== undefined || true\n',
    },
    {
        'name': 'M3a-join-chunks',
        'claim': 'a frame split across host reads arrives unjoined',
        'old': "\t\tchild.stdout?.on('data', (chunk: Buffer) => this.#emitter.emit('chunk', chunk))\n",
        'new': "\t\tlet joined = Buffer.alloc(0)\n\t\tchild.stdout?.on('data', (chunk: Buffer) => {\n\t\t\tjoined = Buffer.concat([joined, chunk])\n\t\t\tthis.#emitter.emit('chunk', joined)\n\t\t})\n",
    },
    {
        'name': 'M3b-split-chunks',
        'claim': 'coalesced frames arrive as the single chunk the host read',
        'old': "\t\tchild.stdout?.on('data', (chunk: Buffer) => this.#emitter.emit('chunk', chunk))\n",
        'new': "\t\tchild.stdout?.on('data', (chunk: Buffer) => {\n\t\t\tfor (const byte of chunk) this.#emitter.emit('chunk', Buffer.from([byte]))\n\t\t})\n",
    },
    {
        'name': 'M4-no-cooperative-end',
        'claim': 'close ends the child cooperatively and surfaces its own exit',
        'old': '\t\tif (stdin !== null && !stdin.writableEnded && !stdin.destroyed) stdin.end()\n',
        'new': '\t\tif (stdin === null) return\n',
    },
    {
        'name': 'M5-no-escalation',
        'claim': 'close kills a child that outlives its grace window',
        'old': '\t\tif (child.exitCode === null && child.signalCode === null)\n\t\t\tawait stopChild(child, this.#grace, this.#grace)\n',
        'new': '',
    },
    {
        'name': 'M6-no-exit-event',
        'claim': 'the transport emits the exit the host reported',
        'old': "\t\tchild.on('close', (code: number | null, signal: NodeJS.Signals | null) =>\n\t\t\tthis.#emitter.emit('exit', { code, signal }),\n\t\t)\n",
        'new': '',
    },
    {
        'name': 'M7-no-send-guard',
        'claim': 'send resolves false before the first start and after close resolves',
        'old': '\t\tif (child === undefined || child.exitCode !== null || child.signalCode !== null) return false\n',
        'new': '',
    },
    {
        'name': 'M8-no-directory',
        'claim': 'the configured directory reaches the child',
        'old': '\t\t\t\t\t...(directory === undefined ? {} : { cwd: directory }),\n',
        'new': '',
    },
    {
        'name': 'M10-send-writes-nothing',
        'claim': 'the Oxlint receipt round-trips real bytes through the child',
        'old': '\t\t\tstdin.write(bytes, (fault: Error | null | undefined) =>\n\t\t\t\tresolve(fault === null || fault === undefined),\n\t\t\t)\n',
        'new': '\t\t\tresolve(true)\n',
    },
]

FAIL = re.compile(r'^ FAIL .*> (.+)$')


def run_suite():
    result = subprocess.run(
        ['npm', 'run', 'test:src:server'],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=600,
    )
    text = result.stdout + result.stderr
    titles = []
    for line in text.split('\n'):
        match = FAIL.match(line.rstrip())
        if match and match.group(1) not in titles:
            titles.append(match.group(1))
    counts = re.search(r'^\s+Tests\s+(.+)$', text, re.MULTILINE)
    return result.returncode, titles, counts.group(1).strip() if counts else 'no count reported'


def main():
    PRISTINE.mkdir(parents=True, exist_ok=True)
    keep = PRISTINE / TARGET.name
    shutil.copyfile(TARGET, keep)
    original = TARGET.read_text(encoding='utf8')
    records = []
    for mutation in MUTATIONS:
        occurrences = original.count(mutation['old'])
        if occurrences != 1:
            print(f"{mutation['name']}: anchor occurs {occurrences} times, expected 1", flush=True)
            sys.exit(1)
        TARGET.write_text(original.replace(mutation['old'], mutation['new']), encoding='utf8')
        code, titles, counts = run_suite()
        shutil.copyfile(keep, TARGET)
        restored = subprocess.run(['cmp', str(keep), str(TARGET)], capture_output=True, text=True)
        records.append(
            {
                'name': mutation['name'],
                'claim': mutation['claim'],
                'exit': code,
                'counts': counts,
                'failing': titles,
                'cmp': 'identical' if restored.returncode == 0 else restored.stdout + restored.stderr,
            }
        )
        print(json.dumps(records[-1], indent=2), flush=True)
    (SCRATCH / 'mutations.json').write_text(json.dumps(records, indent=2), encoding='utf8')
    print('MUTATION RUN COMPLETE', flush=True)


main()
