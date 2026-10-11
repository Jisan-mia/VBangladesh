# Adds one tool's search keywords to lib/search-keywords.ts. Usage: python3 scripts/add-keywords.py <slug> "word, word, …"
import json, sys, unicodedata
slug, words = sys.argv[1], [unicodedata.normalize('NFC', w.strip().lower()) for w in sys.argv[2].split(',') if w.strip()]
words = list(dict.fromkeys(words))[:14]
assert 6 <= len(words), f'{slug}: need at least 6 keywords'
path = 'lib/search-keywords.ts'
s = open(path, encoding='utf-8').read()
assert f'"{slug}":' not in s, f'{slug} already has keywords'
anchor = 'export const searchKeywords: Record<string, readonly string[]> = {\n'
s = s.replace(anchor, anchor + f'  "{slug}": {json.dumps(words, ensure_ascii=False)},\n', 1)
open(path, 'w', encoding='utf-8').write(s)
print(f'keywords: {slug} ({len(words)})')
