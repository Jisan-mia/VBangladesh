# Registers the next queued tool as a stub, marks it "building" and commits. Usage: python3 scripts/start-tool.py <slug>
# Name and category come from research/build-queue.md; the build agent replaces the placeholder copy.
import json, re, subprocess, sys, tempfile

slug = sys.argv[1]
queue = open('research/build-queue.md').read()
row = re.search(r'^\| *(\d+) *\| *' + re.escape(slug) + r' *\| *([^|]+?) *\| *([^|]+?) *\|[^\n]*?\| *todo *\|', queue, re.M)
if not row: sys.exit(f'{slug}: no todo row in the queue')
wave, name, category = row.group(1), row.group(2), row.group(3)
accents = ['#b4372a', '#1f6f5c', '#2f6fd1', '#b5651d', '#7c4a1e', '#1d5c8a', '#a8326a', '#3d6b21', '#9a4b12', '#24607a']
tool = {'slug': slug, 'name': name, 'category': category, 'action': 'শুরু করো', 'accent': accents[sum(map(ord, slug)) % len(accents)],
        'description': f'{name}: খুলে দেখো, খেলে দেখো।', 'title': f'{name} — একটুখানি'}
with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as handle:
    json.dump([tool], handle, ensure_ascii=False)
if subprocess.run(['python3', 'scripts/scaffold-tools.py', handle.name]).returncode: sys.exit('scaffold failed')
queue = queue.replace(row.group(0), row.group(0)[:row.group(0).rfind('todo')] + 'building' + row.group(0)[row.group(0).rfind('todo') + 4:])
open('research/build-queue.md', 'w').write(queue)
if subprocess.run('git diff --cached --quiet', shell=True).returncode: sys.exit('index already has staged changes')
subprocess.run(['git', 'add', '-A', f'tools/{slug}', f'app/{slug}', 'lib/tool-content.ts', 'lib/share-registry.ts', 'lib/catalog.ts', 'shared/tests/routes.test.ts', 'research/build-queue.md'], check=True)
subprocess.run(['git', 'commit', '-q', '-m', f'Scaffold {slug}'], check=True)
print(f'started {slug} — {name} (wave {wave}, {category})')
