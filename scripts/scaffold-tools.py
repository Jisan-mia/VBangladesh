# Registers new tools as working stubs. Usage: python3 scripts/scaffold-tools.py tools.json   (run from repo root)
# tools.json: [{"slug","name","category","description","action","accent","title","h1"}]
import json, re, sys, unicodedata, os
N = lambda x: unicodedata.normalize('NFC', x)
tools = json.load(open(sys.argv[1]))
var = lambda slug: slug.replace('-', '_')
for t in tools:
    slug = t['slug']; d = f'tools/{slug}'
    assert not os.path.exists(d), f'{slug} exists'
    os.makedirs(d); os.makedirs(f'app/{slug}')
    name, title, desc = t['name'], t['title'], t['description']
    open(f'{d}/content.ts', 'w').write(N(f'''import type {{ SiteContent }} from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {{
  slug: "{slug}",
  name: "{name}",
  title: "{title}",
  description: "{desc} ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "{desc}",
  cta: "{t['action']}",
  guideTitle: "{name} যেভাবে ব্যবহার করবে",
  guideIntro: "{name}: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    {{ question: "{name} কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" }},
    {{ question: "{name} কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" }},
    {{ question: "{name}-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" }},
    {{ question: "{name}-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" }},
  ],
  accent: "{t['accent']}",
}};
'''))
    open(f'{d}/page.tsx', 'w').write(f'''import {{ StudioPage }} from "../../shared/studio-page";
import {{ site }} from "./content";

export default function Page() {{
  return <StudioPage site={{site}}><p>{{site.lead}}</p></StudioPage>;
}}
''')
    open(f'{d}/share.ts', 'w').write('import type { ToolShare } from "../../shared/share-types";\n\n// Sharing by short link isn\'t wired up for this tool yet.\nexport const share: ToolShare | null = null;\n')
    open(f'app/{slug}/page.tsx', 'w').write(f'''import Product from '../../tools/{slug}/page';
import {{ site }} from '../../tools/{slug}/content';
import {{ pageMetadata }} from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {{
  return <div className="tool-{slug}"><Product /></div>;
}}
''')
# registries
for path, kind in [('lib/tool-content.ts', 'content'), ('lib/share-registry.ts', 'share')]:
    s = open(path).read()
    imports = ''.join(f"import {{ {'site' if kind=='content' else 'share'} as {var(t['slug'])} }} from '../tools/{t['slug']}/{'content' if kind=='content' else 'share'}';\n" for t in tools)
    last = max(m.end() for m in re.finditer(r"^import .*\n", s, re.M))
    s = s[:last] + imports + s[last:]
    entries = ''.join(f"  '{t['slug']}': {var(t['slug'])},\n" for t in tools)
    anchor = 'export const toolContent = {\n' if kind == 'content' else 'export const shareRegistry: Record<ToolSlug, ToolShare | null> = {\n'
    end = s.index('};', s.index(anchor))
    s = s[:end] + entries + s[end:]
    open(path, 'w').write(s)
s = open('lib/catalog.ts').read()
rows = ''.join(N(f'  {{ slug: "{t["slug"]}", name: "{t["name"]}", description: "{t["description"]}", category: "{t["category"]}", action: "{t["action"]}" }},\n') for t in tools)
end = s.index('] as const satisfies readonly ToolListing[];')
s = s[:end] + rows + s[end:]
open('lib/catalog.ts', 'w').write(s)
s = open('shared/tests/routes.test.ts').read()
end = s.index('].sort();', s.index('const expectedSlugs = ['))
s = s[:end] + '  ' + ', '.join(f"'{t['slug']}'" for t in tools) + ',\n' + s[end:]
open('shared/tests/routes.test.ts', 'w').write(s)
print('scaffolded', len(tools), 'tools')
