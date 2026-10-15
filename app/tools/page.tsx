import Link from 'next/link';
import { AllTools } from '../../components/all-tools';
import { catalog, categories } from '../../lib/catalog';
import { previewSlugs } from '../../lib/previews';
import { publicOrigin, serializeSchema, siteMetadata } from '../../shared/seo';
import { HubFrame } from '../../shared/site-shell';

export const metadata = siteMetadata({ title: 'সব টুল — বাংলায় খেলা, কুইজ, হিসাব আর কার্ড | একটুখানি', description: 'একটুখানির সব বাংলা টুল এক জায়গায়: খেলাধুলা, কুইজ, উৎসবের কার্ড, ছোটবেলার স্মৃতি আর রোজকার হিসাব। খুঁজে নাও, খুললেই শুরু। ফ্রি, অ্যাকাউন্ট লাগে না।', path: '/tools' });

export default function ToolsPage() {
  const origin = publicOrigin(process.env.SITE_URL);
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'একটুখানির সব টুল', inLanguage: 'bn-BD', ...(origin ? { url: `${origin}/tools` } : {}), mainEntity: { '@type': 'ItemList', itemListElement: catalog.map((tool, index) => ({ '@type': 'ListItem', position: index + 1, name: tool.name, ...(origin ? { url: `${origin}/${tool.slug}` } : {}) })) } };
  return <HubFrame>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeSchema(schema) }} />
    <section className="container all-tools-page">
      <h1>সব টুল, এক জায়গায়</h1>
      <p className="all-tools-lead">খেলো, মেলাও, বানাও, হিসাব করো। যেটা দরকার খুঁজে নাও, নয়তো ধরন বেছে ঘুরে দেখো।</p>
      <p className="hub-links">এক ধরনের সব এক পাতায়: <Link href="/games">বাংলা গেম</Link> · <Link href="/chhotoder">ছোটদের খেলাঘর</Link> · <Link href="/quiz">কুইজ</Link> · <Link href="/hishab">হিসাবের টুল</Link> · <Link href="/utsob">উৎসব</Link></p>
      <AllTools tools={catalog} categories={categories} previews={previewSlugs()} />
    </section>
  </HubFrame>;
}
