import Link from "next/link";
import { catalog, categories, flagship } from "../lib/catalog";
import { previewSlugs } from "../lib/previews";
import { ToolCard } from "./tool-card";

// The homepage shows a few tools per category; the full, searchable list lives at /tools.
const PER_CATEGORY = 4;

export function ToolDirectory() {
  const previews = new Set(previewSlugs());
  return <section className="home-container home-directory" id="more" aria-labelledby="home-tools-title">
    <div className="home-directory-heading">
      <h2 id="home-tools-title">আরও আছে, একটুখানি সময় পেলেই</h2>
      <p>খেলা, কুইজ, পুরোনো দিনের গল্প আর রোজকার হিসাব। যেটা ভালো লাগে, খুলে দেখো।</p>
      <Link className="home-all-link" href="/tools">সব টুল একসাথে দেখো ({new Intl.NumberFormat("bn-BD").format(catalog.length)}টা) →</Link>
    </div>
    {categories.map((category, index) => {
      const tools = catalog.filter(tool => tool.category === category && tool.slug !== flagship);
      if (!tools.length) return null;
      return <div className="home-group" key={category}>
        <div className="home-group-head"><h3>{category}</h3>{tools.length > PER_CATEGORY && <Link href={`/tools#c=${index}`}>সবগুলো ({new Intl.NumberFormat("bn-BD").format(tools.length)}) →</Link>}</div>
        <ul className="home-tool-grid">{tools.slice(0, PER_CATEGORY).map(tool => <li className="home-tool" key={tool.slug}><ToolCard tool={tool} hasPreview={previews.has(tool.slug)} level={4} /></li>)}</ul>
      </div>;
    })}
  </section>;
}
