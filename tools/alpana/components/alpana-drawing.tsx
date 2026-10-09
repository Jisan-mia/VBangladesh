import { memo, useId, type RefObject, type SVGProps } from "react";
import { drawingPath, strokeTransforms, type DrawingStroke } from "../lib/drawing";
import { palettes, type PatternSettings } from "../lib/pattern";

const Stroke = memo(function Stroke({ stroke, id, trace }: { stroke: DrawingStroke; id: string; trace: boolean }) {
  return <g stroke={trace ? "#161616" : stroke.color} strokeWidth={stroke.width} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <defs><path id={id} d={drawingPath(stroke.points)} /></defs>
    {strokeTransforms(stroke).map(transform => <use key={transform} href={"#" + id} transform={transform} />)}
  </g>;
});

type DrawingProps = {
  settings: PatternSettings;
  strokes: DrawingStroke[];
  activeStroke?: DrawingStroke | null;
  svgRef?: RefObject<SVGSVGElement | null>;
  trace?: boolean;
  interaction?: SVGProps<SVGSVGElement>;
};

export function AlpanaDrawing({ settings, strokes, activeStroke, svgRef, trace = false, interaction }: DrawingProps) {
  const id = useId().replaceAll(":", "");
  const palette = palettes.find(item => item.id === settings.palette)!;
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="1600" height="1600" role="img" aria-label="আপনার হাতে আঁকা আলপনা" {...interaction}>
    <rect width="800" height="800" fill={trace ? "#ffffff" : palette.background} />
    <g transform="translate(400 400)">
      {interaction && <g data-export-ignore="" fill="none" stroke={palette.ink} opacity=".28" strokeWidth="1" pointerEvents="none"><circle r="388" strokeDasharray="5 7" /><path d="M-388 0H388M0-388V388" strokeDasharray="5 7" /><circle r="4" /></g>}
      {strokes.map((stroke, index) => <Stroke key={index} stroke={stroke} id={id + "-stroke-" + index} trace={trace} />)}
      {activeStroke && <Stroke stroke={activeStroke} id={id + "-active"} trace={trace} />}
    </g>
  </svg>;
}
