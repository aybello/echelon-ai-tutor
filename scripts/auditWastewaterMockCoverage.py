#!/usr/bin/env python3
"""Offline private-snapshot gate; no database, login, network, or model calls.

python3 scripts/auditWastewaterMockCoverage.py \
  --snapshot /absolute/private/mock-current-content.json \
  --output /absolute/private/mock-coverage-runs.json

The complete snapshot stays outside Git. Tests run only through the authorized
secret-stripping audit runner. The gate is private, exclusive and removed even
when Vitest fails; normal CI skips the three explicitly gated snapshot tests.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    snapshot = args.snapshot.resolve(strict=True)
    output = args.output.resolve()
    if snapshot.is_relative_to(repo) or output.is_relative_to(repo) or snapshot == output:
        parser.error('Snapshot and coverage output must be separate files outside the repository')
    if repo != Path('/home/ubuntu/echelon-ai-tutor'):
        parser.error('Run from the assigned integration repository')
    output.parent.mkdir(parents=True, exist_ok=True)
    gate = Path(tempfile.gettempdir()) / f'echelon-wastewater-mock-coverage-{os.getuid()}.json'
    try:
        fd = os.open(gate, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        parser.error('An offline snapshot coverage gate already exists; do not overwrite another run')
    try:
        with os.fdopen(fd, 'w') as handle:
            json.dump({'input': str(snapshot), 'output': str(output)}, handle)
            handle.write('\n')
        command = [
            'python3', '/home/ubuntu/pr-review/run_audit_safe.py', '--cwd', str(repo), '--',
            'pnpm', 'exec', 'vitest', 'run',
            'server/wastewaterMockAreaResolver.test.ts',
            'server/wastewaterMockSnapshot.test.ts',
            'server/ontarioWastewaterMock.test.ts',
            'server/ontarioWastewaterMockRouter.test.ts',
            'server/mockExamSession.test.ts',
            'server/exam.submitMock.test.ts',
        ]
        return subprocess.run(command, cwd=repo).returncode
    finally:
        gate.unlink(missing_ok=True)


if __name__ == '__main__':
    raise SystemExit(main())
