# Wires a finished tool into the site and commits only its files. Run from the repo root with the dev server up.
# Usage: python3 scripts/finish-tool.py <slug> "<catalog description>" "<action>" "<og title with |>" "<og subtitle>" <bg> <ink> <accent> [hash]
import glob, re, subprocess, sys, unicodedata

N = lambda text: unicodedata.normalize('NFC', text)
slug, desc, action, og_title, og_sub, bg, ink, accent = sys.argv[1:9]
hash_state = sys.argv[9] if len(sys.argv) > 9 else ''
run = lambda cmd: subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=True, text=True)

# 1. The tool's own tests and types must be clean.
tests = glob.glob(f'tools/{slug}/tests/*.test.ts')
if tests:
    result = run(['node', '--import', 'tsx', '--no-warnings', '--test', *tests])
    if result.returncode: sys.exit(f'tests failed for {slug}:\n' + result.stdout[-2000:])
types = [line for line in run('npx tsc --noEmit').stdout.splitlines() if f'tools/{slug}/' in line or f'app/{slug}/' in line]
if types: sys.exit('type errors:\n' + '\n'.join(types))

# 2. Normalize the tool's text to NFC (read first, then write).
for path in glob.glob(f'tools/{slug}/**/*', recursive=True):
    if path.endswith(('.ts', '.tsx', '.css', '.json')):
        raw = open(path, encoding='utf-8').read()
        if N(raw) != raw: open(path, 'w', encoding='utf-8').write(N(raw))

# 3. The catalog line shown on the homepage and /tools.
catalog = open('lib/catalog.ts').read()
catalog, count = re.subn(r'(\{ slug: "' + re.escape(slug) + r'", name: "[^"]+", description: ")[^"]*(", category: "[^"]+", action: ")[^"]*(" \})',
                         lambda m: m.group(1) + N(desc) + m.group(2) + N(action) + m.group(3), catalog)
if count != 1: sys.exit(f'catalog row for {slug} not found')
open('lib/catalog.ts', 'w').write(catalog)

# 4. Thumbnail + social image from the live card, then point content.ts at the social image.
og = run(['node', 'scripts/og-image.mjs', slug, f'public/previews/{slug}.webp', f'public/social/{slug}.png', og_title, og_sub, bg, ink, accent, hash_state])
if og.returncode: sys.exit('og image failed: ' + og.stderr[-800:])
content_path = f'tools/{slug}/content.ts'
content = open(content_path).read()
if 'socialImage' not in content:
    def add_image(m):
        key = '"socialImage"' if m.group(1).startswith('"') else 'socialImage'
        return f'{m.group(0)} {key}: {m.group(2)}/social/{slug}.png{m.group(2)},'
    content, count = re.subn(r'("?slug"?\s*:\s*)([\'"])' + re.escape(slug) + r'\2\s*,', add_image, content, count=1)
    if count != 1: sys.exit('could not set socialImage')
    open(content_path, 'w').write(content)

# 5. Queue status → done.
queue = open('research/build-queue.md').read()
queue, count = re.subn(r'(\| *\d+ *\| *' + re.escape(slug) + r' *\|[^\n]*?\| *)(?:todo|building)( *\|)', r'\1done\2', queue)
open('research/build-queue.md', 'w').write(queue)

# 6. Commit only this tool's paths (other agents may be mid-edit; never sweep their files).
if run('git diff --cached --quiet').returncode: sys.exit('index already has staged changes; commit or reset them first')
name = re.search(r'slug: "' + re.escape(slug) + r'", name: "([^"]+)"', catalog).group(1)
run(['git', 'add', '-A', f'tools/{slug}', f'app/{slug}', f'public/previews/{slug}.webp', f'public/social/{slug}.png', 'lib/catalog.ts', 'research/build-queue.md'])
commit = run(['git', 'commit', '-q', '-m', f'Add {name} ({slug})'])
if commit.returncode: sys.exit('commit failed: ' + commit.stderr)
print(f'done: {slug} — {name}')
