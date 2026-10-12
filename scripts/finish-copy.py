# Commits a copy-review batch: NFC, the batch's tests and types, then commits only those tools' paths.
# Usage: python3 scripts/finish-copy.py "<batch name>" <slug> [<slug> ...]
import glob, subprocess, sys, unicodedata

batch, slugs = sys.argv[1], sys.argv[2:]
N = lambda text: unicodedata.normalize('NFC', text)
run = lambda cmd: subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=True, text=True)

for slug in slugs:
    for path in glob.glob(f'tools/{slug}/**/*', recursive=True) + glob.glob(f'app/{slug}/**/*', recursive=True):
        if path.endswith(('.ts', '.tsx', '.css', '.json')):
            raw = open(path, encoding='utf-8').read()
            if N(raw) != raw: open(path, 'w', encoding='utf-8').write(N(raw))
tests = [test for slug in slugs for test in glob.glob(f'tools/{slug}/tests/*.test.ts')]
if tests:
    result = run(['node', '--import', 'tsx', '--no-warnings', '--test', *tests])
    if result.returncode: sys.exit('tests failed:\n' + result.stdout[-2500:])
types = [line for line in run('npx tsc --noEmit').stdout.splitlines() if any(f'tools/{slug}/' in line or f'app/{slug}/' in line for slug in slugs)]
if types: sys.exit('type errors:\n' + '\n'.join(types))
if run('git diff --cached --quiet').returncode: sys.exit('index already has staged changes; commit or reset them first')
run(['git', 'add', '-A', *[path for slug in slugs for path in (f'tools/{slug}', f'app/{slug}')]])
if run('git diff --cached --quiet').returncode == 0: sys.exit('nothing changed for this batch')
commit = run(['git', 'commit', '-q', '-m', batch if batch.startswith('Upgrade') else f'Copy review: {batch}'])
if commit.returncode: sys.exit('commit failed: ' + commit.stderr)
print(f'done: {batch} ({len(slugs)} tools)')
