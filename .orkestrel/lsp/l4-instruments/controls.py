#!/usr/bin/env python3
"""Prove the check and test instruments can fail on the seams the conditional spreads guard.

The first control replaces the spread that keeps an absent `directory` absent with a direct
optional property, which `resolveExecutable`'s `workspace?: string` declaration must refuse under
`exactOptionalPropertyTypes`. The second replaces the environment spread with an unconditional one,
which hands every unconfigured child an empty environment. Each restores the pristine bytes and
proves the restoration with `cmp`.
"""

import pathlib
import re
import shutil
import subprocess

ROOT = pathlib.Path('/home/user/lsp')
KEEP = ROOT / 'tmp' / 'scratch' / 'pristine' / 'StdioTransport.controls.ts'
TARGET = ROOT / 'src' / 'server' / 'transports' / 'StdioTransport.ts'

CONTROLS = [
    {
        'name': 'C1-workspace-explicit-undefined',
        'gate': ['npm', 'run', 'check:src:server'],
        'old': '\t\t\t\t\t...(directory === undefined ? {} : { workspace: directory }),\n',
        'new': '\t\t\t\t\tworkspace: directory,\n',
    },
    {
        'name': 'C2-unconditional-environment',
        'gate': ['npm', 'run', 'test:src:server'],
        'old': '\t\t\t\t\t...(environment === undefined ? {} : { env: { ...environment } }),\n',
        'new': '\t\t\t\t\tenv: { ...environment },\n',
    },
]

FAIL = re.compile(r'^ FAIL .*> (.+)$')

original = TARGET.read_text(encoding='utf8')
KEEP.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(TARGET, KEEP)
for control in CONTROLS:
    assert original.count(control['old']) == 1, control['name']
    TARGET.write_text(original.replace(control['old'], control['new']), encoding='utf8')
    result = subprocess.run(
        control['gate'], cwd=ROOT, capture_output=True, text=True, timeout=600
    )
    text = result.stdout + result.stderr
    shutil.copyfile(KEEP, TARGET)
    restored = subprocess.run(['cmp', str(KEEP), str(TARGET)], capture_output=True, text=True)
    titles = [m.group(1) for m in (FAIL.match(l.rstrip()) for l in text.split('\n')) if m]
    print('==', control['name'], 'exit', result.returncode)
    print('\n'.join(line for line in text.split('\n') if 'error TS' in line or 'Tests ' in line))
    if titles:
        print('failing rows:', titles)
    print('restored:', 'identical' if restored.returncode == 0 else restored.stdout + restored.stderr)
