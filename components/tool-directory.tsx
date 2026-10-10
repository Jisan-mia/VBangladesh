import Image from "next/image";
import Link from "next/link";
import { catalog, categories, flagship } from "../lib/catalog";

// Each thumbnail is the tool's real share card (public/previews/<slug>.webp, made from the live page).
function ToolPreview({ slug }: { slug: string }) {
  return <div className={"home-preview home-preview-" + slug} aria-hidden="true">
    <div className="home-preview-art"><Image src={"/previews/" + slug + ".webp"} alt="" fill sizes="(max-width: 640px) 104px, (max-width: 900px) 40vw, 25vw" /></div>
  </div>;
}

export function ToolDirectory() {
  return <section className="home-container home-directory" id="more" aria-labelledby="home-tools-title">
    <div className="home-directory-heading">
      <h2 id="home-tools-title">আরও আছে, একটুখানি সময় পেলেই</h2>
      <p>আঁকাআঁকি, পুরোনো দিনের গল্প, বন্ধুদের সাথে খেলা আর রোজকার হিসাব। যেটা ভালো লাগে, ছুঁয়ে দেখো।</p>
    </div>
    {categories.map(category => <div className="home-group" key={category}>
      <h3>{category}</h3>
      <ul className="home-tool-grid">
        {catalog.filter(tool => tool.category === category && tool.slug !== flagship).map(tool => <li className="home-tool" key={tool.slug}>
          <Link className="home-tool-link" href={"/" + tool.slug} prefetch={false}>
            <ToolPreview slug={tool.slug} />
            <div className="home-tool-copy">
              <h4>{tool.name}</h4>
              <p className="home-tool-description">{tool.description}</p>
              <span className="home-tool-action">{tool.action}<svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="M3 10h13M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            </div>
          </Link>
        </li>)}
      </ul>
    </div>)}
  </section>;
}
