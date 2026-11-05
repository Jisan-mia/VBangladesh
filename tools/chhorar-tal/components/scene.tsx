// A ছড়া's picture. `full` draws it finished (cards, the level list, the end screen); otherwise it is drawn empty and each
// line's drawing is switched on by `upTo` (a data attribute the stylesheet fades in), so the picture grows with the ছড়া.
import { memo, useEffect, type Ref } from "react";
import { sceneMarkup } from "../lib/scenes";

type Props = { id: string; upTo?: number; full?: boolean; svgRef?: Ref<SVGSVGElement>; className?: string };

export const Scene = memo(function Scene({ id, upTo = 0, full = false, svgRef, className = "ct-scene-art" }: Props) {
  return <svg ref={svgRef} className={className} viewBox="0 0 320 200" aria-hidden="true" focusable="false" data-id={id} dangerouslySetInnerHTML={{ __html: sceneMarkup(id, full ? 99 : 0) }} />;
});

/** Switches on the first `upTo` line drawings of a live scene. Touches attributes only, so React never redraws the picture. */
export function useBuilt(svg: { current: SVGSVGElement | null }, id: string, upTo: number) {
  useEffect(() => {
    svg.current?.querySelectorAll(".p").forEach(node => node.toggleAttribute("data-on", Number((node as SVGElement).dataset.line) < upTo));
  }, [svg, id, upTo]);
}
