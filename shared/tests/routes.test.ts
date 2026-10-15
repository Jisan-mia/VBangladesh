import assert from 'node:assert/strict';
import test from 'node:test';
import { getToolContent, toolSlugs } from '../../lib/tool-content';
import robots from '../../app/robots';
import sitemap from '../../app/sitemap';
import { pageMetadata, siteMetadata, websiteSchema } from '../seo';
import { hubOf, hubs } from '../../lib/hubs';

const isApp = (node: { '@type'?: unknown }) => [node['@type']].flat().includes('WebApplication');

const expectedSlugs = [
  'alpana', 'amar-chhotobela', 'bazar-note', 'bhagabhagi', 'bhara', 'bhashar-chhobi',
  'chhotto-para', 'cholo-kheli', 'rannakhata', 'riksharong', 'shobdo-khela', 'shubhechha',
  'gpa', 'komon-porlo', 'argentina-na-brazil', 'koto-din-baki', 'mishtir-baksho',
  'taka-kothay',
  'amar-jersey',
  'boyos',
  'iftar-plate',
  'cinema-poster',
  'banan',
  'dom-atkano',
  'salami-chek',
  'eta-na-ota',
  'deshe-fera',
  'biye-kobe',
  'himu',
  'pitha',
  'upohar',
  'namer-design',
  'dawat',
  'desh-cheno',
  'bhori',
  'tong',
  'golir-ain',
  'amar-bochhor',
  'daknam',
  'cha-mudra',
  'matir-bank',
  'shesh-bol',
  'dhoyahin',
  'ghuri',
  'flames',
  'moner-boyos',
  'bagdhara',
  'sehri-iftar',
  'chithi',
  'bangla-typing',
  'jam',
  'bhorta',
  'eider-din',
  'ganer-koli',
  'attiyo',
  'studior-chhobi',
  'koto-cheno',
  'eidjatra',
  'probash',
  'char-priyo',
  'dhadha',
  'tokhon-ekhon',
  'namta',
  'prothom-ay',
  'ami-bolechhilam',
  'mache-bhate',
  'jomi',
  'ek-koti',
  'rokto',
  'cassette',
  'jibh',
  'matcher-mon',
  'current-gelo',
  'projonmo',
  'mama-jaben',
  'mess-jibon',
  'ekadosh',
  'gorur-ojon',
  'starter-pack',
  'mishron',
  'raat-jaga',
  'betoner-bhag',
  'bidyut-bill',
  'mondop',
  'grade-dao',
  'adda',
  'kalbaishakhi-aam',
  'dudh-uthlano',
  'jhalmuri-sap',
  'danguli',
  'antenna-thik-koro',
  'sir-ghurlei-thamo',
  'deri-hoye-gelo',
  'chor-police',
  'bostar-pahar',
  'tarer-fanke-belun',
  'paka-kancha',
  'jora-melao',
  'chhok-jora',
  'churui-tarao',
  'handi-bhanga',
  'peoner-cycle',
  'sap-ludu',
  'baghbandi',
  'baicher-nouka',
  'vo-katta',
  'bhangti-nai',
  'jam-chharao',
  'shobdo-khoja',
  'carrom',
  'pati-buni',
  'sudoku',
  'switchboard',
  'golokdhadha',
  'ponero-ghor',
  'chhobi-photao',
  'ghontar-sur',
  'konta-nei',
  'bhul-kothay',
  'atir-aam',
  'bhimruler-chak',
  'churir-bazar',
  'mukhe-mukhe-hisab',
  'chhobir-tukro',
  'sat-chara',
  'chhip-felo',
  'latim',
  'nodi-par',
  'penalty',
  'golir-badminton',
  'kagojer-urojahaj',
  'marble-sinri',
  'roshi-tana',
  'moshar-raat',
  'al-dhore-hati',
  'o-te-ojogor',
  'kar-chinho',
  'nam-shikhi',
  'sourojogot',
  'dosh-ghater-nouka',
  'golper-mor',
  'juktoborno',
  'ghori-dekhi',
  'moner-rong',
  'sat-tukro',
  'nirapode-thaki',
  'gune-dekhi',
  'hat-dhui',
  'abc-bazar',
  'ulto-khela',
  'dinosaur',
  'ki-hobe',
  'shoman-bhag',
  'chhaya-melao',
  'mongole-rover',
  'daripalla',
].sort();
const origin = 'https://example.org';
// Guide and per-tool privacy pages stay reachable but noindex, so only tool pages and category hubs are in the sitemap.
const expectedPaths = ['/', '/tools', ...hubs.map(hub => `/${hub.slug}`), '/about', '/privacy', ...expectedSlugs.map(slug => `/${slug}`)];

function withSiteUrl(value: string | undefined, check: () => void) {
  const previous = process.env.SITE_URL;
  if (value === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = value;
  try { check(); }
  finally {
    if (previous === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previous;
  }
}

function contentFor(slug: string) {
  const site = getToolContent(slug);
  assert.ok(site, `registered content for ${slug}`);
  return site;
}

test('the consolidated registry contains each of the twelve tools exactly once', () => {
  assert.deepEqual([...toolSlugs].sort(), expectedSlugs);
});

test('registered content identifies the route that loads it', () => {
  assert.deepEqual(toolSlugs.map(slug => contentFor(slug).slug), toolSlugs);
});

test('unknown, nested and inherited object names are not tool routes', () => {
  const invalid = ['', '__proto__', 'constructor', 'toString', 'missing', 'alpana/guide', '/alpana', 'ALPANA'];
  assert.deepEqual(invalid.map(slug => getToolContent(slug)), invalid.map(() => undefined));
});

test('published tool metadata keeps canonical and social URLs on its own nested route', () => {
  withSiteUrl(origin, () => {
    const actual = toolSlugs.map(slug => {
      const metadata = pageMetadata(contentFor(slug));
      return { canonical: metadata.alternates?.canonical, social: metadata.openGraph?.url, base: metadata.metadataBase ? new URL(String(metadata.metadataBase)).origin : undefined };
    });
    assert.deepEqual(actual, toolSlugs.map(slug => ({ canonical: `/${slug}`, social: `${origin}/${slug}`, base: origin })));
  });
});

test('guide and privacy metadata resolve within their tool instead of the app root', () => {
  withSiteUrl(origin, () => {
    const actual = toolSlugs.flatMap(slug => ['/guide', '/privacy'].map(path => {
      const metadata = pageMetadata(contentFor(slug), { path, title: 'বাংলা পাতার নাম', description: 'বাংলা পাতার বিবরণ' });
      return [metadata.alternates?.canonical, metadata.openGraph?.url];
    }));
    assert.deepEqual(actual, toolSlugs.flatMap(slug => ['/guide', '/privacy'].map(path => [`/${slug}${path}`, `${origin}/${slug}${path}`])));
  });
});

test('unpublished tool metadata has no invented canonical or social URL and stays unindexed', () => {
  withSiteUrl(undefined, () => {
    const actual = toolSlugs.map(slug => {
      const metadata = pageMetadata(contentFor(slug));
      return { canonical: metadata.alternates?.canonical, social: metadata.openGraph?.url, robots: metadata.robots };
    });
    assert.deepEqual(actual, toolSlugs.map(() => ({ canonical: undefined, social: undefined, robots: { index: false, follow: false } })));
  });
});

test('hub metadata uses its own root-level route without a tool prefix', () => {
  withSiteUrl(origin, () => {
    const actual = ['/', '/about', '/privacy'].map(path => {
      const metadata = siteMetadata({ path, title: 'বাংলা পাতার নাম', description: 'বাংলা পাতার বিবরণ' });
      return [metadata.alternates?.canonical, metadata.openGraph?.url];
    });
    assert.deepEqual(actual, ['/', '/about', '/privacy'].map(path => [path, origin + path]));
  });
});

test('tool schemas describe one application at its route rather than twenty separate websites', () => {
  withSiteUrl(origin, () => {
    const actual = toolSlugs.map(slug => {
      const graph = websiteSchema(contentFor(slug))['@graph'];
      return {
        applications: graph.filter(isApp).map(node => 'url' in node ? node.url : undefined),
        websites: graph.filter(node => node['@type'] === 'WebSite').length,
      };
    });
    assert.deepEqual(actual, toolSlugs.map(slug => ({ applications: [`${origin}/${slug}`], websites: 0 })));
  });
});

test('tool FAQ schema preserves the complete visible content', () => {
  const actual = toolSlugs.map(slug => {
    const faq = websiteSchema(contentFor(slug))['@graph'].find(node => node['@type'] === 'FAQPage');
    return faq && 'mainEntity' in faq ? faq.mainEntity : undefined;
  });
  const expected = toolSlugs.map(slug => contentFor(slug).faq.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })));
  assert.deepEqual(actual, expected);
});

test('published breadcrumbs lead from the hub to the matching tool', () => {
  withSiteUrl(origin, () => {
    const actual = toolSlugs.map(slug => {
      const breadcrumbs = websiteSchema(contentFor(slug))['@graph'].find(node => node['@type'] === 'BreadcrumbList');
      return breadcrumbs && 'itemListElement' in breadcrumbs ? breadcrumbs.itemListElement?.map(item => ({ ...item, item: new URL(item.item).href })) : undefined;
    });
    const expected = toolSlugs.map(slug => {
      const hub = hubOf(slug);
      return [
        { '@type': 'ListItem', position: 1, name: 'একটুখানি', item: `${origin}/` },
        ...(hub ? [{ '@type': 'ListItem', position: 2, name: hub.name, item: `${origin}/${hub.slug}` }] : []),
        { '@type': 'ListItem', position: hub ? 3 : 2, name: contentFor(slug).name, item: `${origin}/${slug}` },
      ];
    });
    assert.deepEqual(actual, expected);
  });
});

test('unpublished application schema omits deployment URLs', () => {
  withSiteUrl(undefined, () => {
    const urls = toolSlugs.flatMap(slug => websiteSchema(contentFor(slug))['@graph'].filter(isApp).map(node => 'url' in node ? node.url : undefined));
    assert.deepEqual(urls, toolSlugs.map(() => undefined));
  });
});

test('the published sitemap contains all sixty-three pages once under the public origin', () => {
  withSiteUrl(origin, () => {
    assert.deepEqual(sitemap().map(page => page.url).sort(), expectedPaths.map(path => origin + path).sort());
  });
});

test('published robots point at the consolidated sitemap', () => {
  withSiteUrl(origin, () => {
    const published = robots();
    assert.equal(published.sitemap, `${origin}/sitemap.xml`);
    const rules = [published.rules].flat();
    assert.deepEqual(rules[0], { userAgent: '*', allow: '/', disallow: '/api/' });
    // Training crawlers may read the site but not the personal share pages.
    assert.ok(rules.some(rule => [rule.userAgent].flat().includes('GPTBot') && [rule.disallow].flat().includes('/s/')));
  });
});

test('unpublished routes do not publish a sitemap or allow indexing', () => {
  withSiteUrl(undefined, () => {
    assert.deepEqual({ robots: robots(), sitemap: sitemap() }, { robots: { rules: { userAgent: '*', disallow: '/' } }, sitemap: [] });
  });
});
