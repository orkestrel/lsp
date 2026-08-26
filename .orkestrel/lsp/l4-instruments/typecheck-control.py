#!/usr/bin/env python3
"""Prove the scoped server typecheck can fail, and restore the pristine bytes afterwards.

The control replaces the conditional spread that keeps an absent `directory` absent with a direct
optional property, which `exactOptionalPropertyTypes` must refuse at the check stage.
"""

import pathlib
import shutil
import subprocess

ROOT = pathlib.Path('/home/user/lsp')
KEEP = ROOT / 'tmp' / 'scratch' / 'pristine' / 'StdioTransport.control.ts'
TARGET = ROOT / 'src' / 'server' / 'transports' / 'StdioTransport.ts'
OLD = '\t\t\t\t\t...(directory === undefined ? {} : { cwd: directory }),\n'
NEW = '\t\t\t\t\tcwd: directory,\n'

original = TARGET.read_text(encoding='utf8')
assert original.count(OLD) == 1, 'anchor must occur exactly once'
KEEP.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(TARGET, KEEP)
TARGET.write_text(original.replace(OLD, NEW), encoding='utf8')
result = subprocess.run(
    ['npm', 'run', 'check:src:server'], cwd=ROOT, capture_output=True, text=True, timeout=600
)
shutil.copyfile(KEEP, TARGET)
restored = subprocess.run(['cmp', str(KEEP), str(TARGET)], capture_output=True, text=True)
print('control exit:', result.returncode)
print((result.stdout + result.stderr).strip())
print('restored:', 'identical' if restored.returncode == 0 else restored.stdout + restored.stderr)
