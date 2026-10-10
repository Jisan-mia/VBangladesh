"use client";

import { useEffect, useMemo, useState } from "react";
import type { ToolListing } from "../lib/catalog";
import { ToolCard } from "./tool-card";

const bn = new Intl.NumberFormat("bn-BD");
const fold = (text: string) => text.normalize("NFC").toLowerCase();

// Search + category chips over every tool. Server-rendered with all tools listed, so links and SEO work without JS.
export function AllTools({ tools, categories, previews }: { tools: readonly ToolListing[]; categories: readonly string[]; previews: string[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<number | null>(null);
  const withPreview = useMemo(() => new Set(previews), [previews]);
  useEffect(() => {
    const match = /c=(\d+)/.exec(window.location.hash);
    if (match && categories[Number(match[1])]) setCategory(Number(match[1]));
  }, [categories]);
  const needle = fold(query.trim());
  const shown = tools.filter(tool => (category === null || tool.category === categories[category]) && (!needle || fold(`${tool.name} ${tool.description} ${tool.category}`).includes(needle)));
  return <div className="all-tools">
    <label className="all-tools-search"><span className="all-tools-label">টুল খোঁজো</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="খোঁজো: যেমন ক্রিকেট, বয়স, ঈদ…" /></label>
    <div className="kit-chips all-tools-chips" role="group" aria-label="ধরন বেছে নাও">
      <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)}>সব</button>
      {categories.map((name, index) => <button type="button" key={name} aria-pressed={category === index} onClick={() => setCategory(current => current === index ? null : index)}>{name}</button>)}
    </div>
    <p className="kit-status" role="status" aria-live="polite">{bn.format(shown.length)}টা টুল</p>
    <ul className="home-tool-grid">{shown.map(tool => <li className="home-tool" key={tool.slug}><ToolCard tool={tool} hasPreview={withPreview.has(tool.slug)} level={2} /></li>)}</ul>
    {!shown.length && <p className="all-tools-empty">এই নামে কিছু পেলাম না। অন্য একটা শব্দ দিয়ে খোঁজো।</p>}
  </div>;
}
