"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ToolListing } from "../lib/catalog";
import { makeSearch } from "../lib/search";
import { searchKeywords } from "../lib/search-keywords";
import { ToolCard } from "./tool-card";

const bn = new Intl.NumberFormat("bn-BD");

// Search + category chips over every tool. Server-rendered with all tools listed, so links and SEO work without JS.
export function AllTools({ tools, categories, previews }: { tools: readonly ToolListing[]; categories: readonly string[]; previews: string[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<number | null>(null);
  const withPreview = useMemo(() => new Set(previews), [previews]);
  const search = useMemo(() => makeSearch(tools, searchKeywords), [tools]);
  const restored = useRef(false);
  useEffect(() => {
    const match = /c=(\d+)/.exec(window.location.hash);
    if (match && categories[Number(match[1])]) setCategory(Number(match[1]));
    const asked = new URLSearchParams(window.location.search).get("q");
    if (asked) setQuery(asked.slice(0, 60));
    restored.current = true;
  }, [categories]);
  // Keep the search and chip in the URL (without new history steps), so Back from a tool returns to the same list.
  useEffect(() => {
    if (!restored.current) return;
    const q = query.trim();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${q ? `?q=${encodeURIComponent(q)}` : ""}${category === null ? "" : `#c=${category}`}`);
  }, [query, category]);
  const shown = search(query).filter(tool => category === null || tool.category === categories[category]);
  return <div className="all-tools">
    <label className="all-tools-search"><span className="all-tools-label">টুল খোঁজো</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="বাংলা বা ইংরেজিতে: ঈদ, cricket, chotobela…" /></label>
    <div className="kit-chips all-tools-chips" role="group" aria-label="ধরন বেছে নাও">
      <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)}>সব</button>
      {categories.map((name, index) => tools.some(tool => tool.category === name) && <button type="button" key={name} aria-pressed={category === index} onClick={() => setCategory(current => current === index ? null : index)}>{name}</button>)}
    </div>
    <p className="kit-status" role="status" aria-live="polite">{bn.format(shown.length)}টা টুল</p>
    <ul className="home-tool-grid">{shown.map(tool => <li className="home-tool" key={tool.slug}><ToolCard tool={tool} hasPreview={withPreview.has(tool.slug)} level={2} /></li>)}</ul>
    {!shown.length && <div className="all-tools-empty">
      <p>“{query.trim()}” দিয়ে কিছু পেলাম না। অন্য বানানে বা ইংরেজিতে লিখে দেখো।</p>
      <button type="button" className="kit-secondary" onClick={() => { setQuery(""); setCategory(null); }}>সব টুল দেখাও</button>
    </div>}
  </div>;
}
