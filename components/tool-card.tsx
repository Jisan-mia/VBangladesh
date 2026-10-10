import Image from "next/image";
import Link from "next/link";
import type { ToolListing } from "../lib/catalog";

const firstLetter = (name: string) => [...new Intl.Segmenter("bn", { granularity: "grapheme" }).segment(name)][0]?.segment ?? "";

// One card used on the homepage and the all-tools page. The thumbnail is the tool's real share card when one exists.
export function ToolCard({ tool, hasPreview, level = 3 }: { tool: ToolListing; hasPreview: boolean; level?: 2 | 3 | 4 }) {
  const Heading = `h${level}` as const;
  return <Link className="home-tool-link" href={"/" + tool.slug} prefetch={false}>
    <div className={"home-preview home-preview-" + tool.slug} aria-hidden="true">
      {hasPreview
        ? <div className="home-preview-art"><Image src={"/previews/" + tool.slug + ".webp"} alt="" fill sizes="(max-width: 640px) 104px, (max-width: 900px) 40vw, 25vw" /></div>
        : <span className="home-preview-letter">{firstLetter(tool.name)}</span>}
    </div>
    <div className="home-tool-copy">
      <Heading>{tool.name}</Heading>
      <p className="home-tool-description">{tool.description}</p>
      <span className="home-tool-action">{tool.action}<svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="M3 10h13M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    </div>
  </Link>;
}
