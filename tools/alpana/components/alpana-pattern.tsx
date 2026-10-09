import type { RefObject } from "react";
import { borderPositions, describePattern, palettes, patternRings, radialPositions, roundSvgValue, type Motif, type PatternSettings } from "../lib/pattern";

export function MotifDrawing({ motif }: { motif: Motif }) {
  if (motif === "leaf") return <g>
    <path d="M0 0C-27-13-31-41 0-62C31-41 27-13 0 0Z" />
    <path d="M0-4V-54M0-17l-14-13M0-28l14-13M0-38l-9-9" />
    <path d="M-7-1c-9 5-18 1-21-7M7-1c9 5 18 1 21-7" />
  </g>;
  if (motif === "geometry") return <g>
    <path d="M0 0-27-31 0-62 27-31 0 0ZM0-11-17-31 0-51 17-31 0-11Z" />
    <path d="M0-22-8-31 0-40 8-31 0-22Z" />
    <circle cx="-31" cy="-31" r="2" fill="currentColor" stroke="none" />
    <circle cx="31" cy="-31" r="2" fill="currentColor" stroke="none" />
  </g>;
  return <g>
    <path d="M0 0C-22-20-23-43 0-62C23-43 22-20 0 0Z" />
    <path d="M0-4C-26-3-36-24-21-38C-9-32-3-19 0-4ZM0-4C26-3 36-24 21-38C9-32 3-19 0-4Z" />
    <path d="M0-10V-48M-8-43l8-9 8 9" />
    <circle cx="0" cy="-28" r="3" />
  </g>;
}

type PatternProps = {
  settings: PatternSettings;
  svgRef?: RefObject<SVGSVGElement | null>;
  appearance?: "color" | "trace";
};

export function AlpanaPattern({ settings, svgRef, appearance = "color" }: PatternProps) {
  const palette = palettes.find(item => item.id === settings.palette)!;
  const background = appearance === "trace" ? "#ffffff" : palette.background;
  const ink = appearance === "trace" ? "#161616" : palette.ink;
  const detail = appearance === "trace" ? "#161616" : palette.detail;
  const rings = patternRings(settings);
  const centerScale = settings.layout === "border" ? 0.73 : 1;
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="1600" height="1600" role="img" aria-label={describePattern(settings)} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect width="800" height="800" fill={background} />
    <g transform={"translate(400 400) scale(" + centerScale + ")"} stroke={ink} color={ink} strokeWidth="2.1">
      <circle r="341" strokeWidth="1.7" />
      <circle r="351" strokeWidth="1" />
      {radialPositions(settings.symmetry * 6, 365, -90).map((position, index) => <g key={"edge-" + index} transform={"translate(" + position.x + " " + position.y + ") rotate(" + position.rotation + ")"}>
        <path d="M-3 0Q0-11 3 0Q0 7-3 0Z" fill={ink} stroke="none" />
      </g>)}
      {radialPositions(settings.symmetry, 0, -90).map((position, index) => <g key={"center-" + index} transform={"rotate(" + position.rotation + ") scale(1.32)"}>
        <MotifDrawing motif={settings.motif} />
      </g>)}
      <circle r="12" fill={background} strokeWidth="2.2" />
      <circle r="4" fill={detail} stroke="none" />
      <circle r="99" strokeWidth="1.5" />
      <circle r="105" stroke={detail} strokeWidth="1" />
      {rings.map((ring, ringIndex) => <g key={ringIndex}>
        <circle r={roundSvgValue(ring.radius + ring.size * 1.13 + 8)} stroke={detail} strokeWidth="1" />
        {radialPositions(ring.count, ring.radius, ring.phase).map((position, index) => <g key={index} transform={"translate(" + position.x + " " + position.y + ") rotate(" + position.rotation + ") scale(" + roundSvgValue(ring.size / 62) + ")"}>
          <MotifDrawing motif={settings.motif} />
          <circle cy="8" r="2.4" fill={ink} stroke="none" />
        </g>)}
      </g>)}
      {radialPositions(settings.symmetry * 3, 329, -90).map((position, index) => <circle key={"dot-" + index} cx={position.x} cy={position.y} r="2.2" fill={detail} stroke="none" />)}
    </g>
    {settings.layout === "border" && <g stroke={ink} color={ink} strokeWidth="2.1">
      <rect x="29" y="29" width="742" height="742" strokeWidth="1.7" />
      <rect x="38" y="38" width="724" height="724" stroke={detail} strokeWidth="1" />
      {borderPositions(settings.symmetry).map((position, index) => <g key={index} transform={"translate(" + position.x + " " + position.y + ") rotate(" + position.rotation + ") scale(.76)"}>
        <MotifDrawing motif={settings.motif} />
      </g>)}
      {[{ x: 74, y: 74 }, { x: 726, y: 74 }, { x: 726, y: 726 }, { x: 74, y: 726 }].map((corner, index) => <g key={index} transform={"translate(" + corner.x + " " + corner.y + ")"}>
        <path d="M0-17 17 0 0 17-17 0 0-17Z" />
        <circle r="4" fill={detail} stroke="none" />
      </g>)}
    </g>}
  </svg>;
}
