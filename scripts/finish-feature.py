# Commits a feature added to a live tool: NFC, that tool's tests and types, optional catalog line, §6 row → done, commit only its paths.
# Usage: python3 scripts/finish-feature.py <slug> "<commit message>" ["<catalog description>" "<action>"]
import glob, re, subprocess, sys, unicodedata

N = lambda text: unicodedata.normalize('NFC', text)
slug, message = sys.argv[1:3]
catalog_line = sys.argv[3:5] if len(sys.argv) > 4 else None
run = lambda cmd: subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=True, text=True)

for path in glob.glob(f'tools/{slug}/**/*', recursive=True):
    if path.endswith(('.ts', '.tsx', '.css', '.json')):
        raw = open(path, encoding='utf-8').read()
        if N(raw) != raw: open(path, 'w', encoding='utf-8').write(N(raw))

tests = glob.glob(f'tools/{slug}/tests/*.test.ts')
if tests:
    result = run(['node', '--import', 'tsx', '--no-warnings', '--test', *tests])
    if result.returncode: sys.exit(f'tests failed for {slug}:\n' + result.stdout[-2000:])
types = [line for line in run('npx tsc --noEmit').stdout.splitlines() if f'tools/{slug}/' in line or f'app/{slug}/' in line]
if types: sys.exit('type errors:\n' + '\n'.join(types))

paths = [f'tools/{slug}', f'app/{slug}', 'research/build-queue.md']
if catalog_line:
    catalog = open('lib/catalog.ts').read()
    catalog, count = re.subn(r'(\{ slug: "' + re.escape(slug) + r'", name: "[^"]+", description: ")[^"]*(", category: "[^"]+", action: ")[^"]*(" \})',
                             lambda m: m.group(1) + N(catalog_line[0]) + m.group(2) + N(catalog_line[1]) + m.group(3), catalog)
    if count != 1: sys.exit(f'catalog row for {slug} not found')
    open('lib/catalog.ts', 'w').write(catalog)
    paths.append('lib/catalog.ts')

queue = open('research/build-queue.md').read()
queue, count = re.subn(r'(\| ' + re.escape(slug) + r' \|[^\n]*?\| *)(?:todo|building)( *\|)', r'\1done\2', queue)
if count != 1: sys.exit(f'§6 row for {slug} not found')
open('research/build-queue.md', 'w').write(queue)

if run('git diff --cached --quiet').returncode: sys.exit('index already has staged changes; commit or reset them first')
run(['git', 'add', '-A', *paths])
commit = run(['git', 'commit', '-q', '-m', message])
if commit.returncode: sys.exit('commit failed: ' + commit.stderr)
print(f'done: {slug} — {message}')
