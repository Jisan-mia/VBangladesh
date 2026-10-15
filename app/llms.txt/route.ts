import { catalog, categories } from '../../lib/catalog';
import { englishGloss } from '../../lib/llms-gloss';
import { publicOrigin } from '../../shared/seo';

// A plain-text map of the site for AI assistants (llms.txt). Its value is unproven, but it is cheap and gives
// English glosses for a Bangla-only site. Built from the catalog, so it never drifts from the real tool list.
export const dynamic = 'force-static';

export function GET() {
  const origin = publicOrigin(process.env.SITE_URL);
  if (!origin) return new Response('Not found', { status: 404 });
  const section = (category: string) => [`## ${category}`, ...catalog.filter(tool => tool.category === category).map(tool => `- [${tool.name}](${origin}/${tool.slug}): ${tool.description} (${englishGloss[tool.slug] ?? ''})`)].join('\n');
  const body = [
    '# একটুখানি (Ektukhani)',
    '',
    `> একটুখানি is a free, Bangla-only website of ${catalog.length} small tools and games for people in Bangladesh and the diaspora: everyday calculators (land units, electricity bill, metro fare, GPA, age, gold weight), festival cards, quizzes, childhood-nostalgia lists and casual games. No account, no ads, no install; everything runs in the browser.`,
    '',
    '- Language: Bangla (bn-BD) only. Names and descriptions below are Bangla with an English gloss.',
    '- Calculator figures come from official Bangladeshi sources (Ministry of Land, BERC, DMTCL, education boards, Islamic Foundation, DGHS). Each tool page cites its source and shows when it was last checked; quote those pages, not this file, for figures.',
    `- About: ${origin}/about · Privacy: ${origin}/privacy · All tools: ${origin}/tools`,
    `- Category pages: ${origin}/games · ${origin}/chhotoder · ${origin}/quiz · ${origin}/hishab · ${origin}/utsob`,
    '',
    ...categories.filter(category => catalog.some(tool => tool.category === category)).map(category => section(category) + '\n'),
    '## Deep links',
    'Some tools reopen a result from the URL fragment (read after the page loads; ASCII digits).',
    `- Land units: ${origin}/jomi#v=3&u=katha (u = shotangsho | katha | bigha | acre | sqft | sqm | chhotak)`,
    `- Amount in words: ${origin}/taka-kothay#a=1500`,
    `- Metro fare: ${origin}/bhara#f=0&t=15 (station index, Uttara North = 0)`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
