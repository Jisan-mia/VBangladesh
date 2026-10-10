import type { CSSProperties } from "react";
import { cow, fence, labelSpots, ORIGIN, place, points, shadow, stretch, tagAnchor, VIEW, type Part } from "../lib/art";

const at = (x: number, y: number): CSSProperties => ({ left: `${(x / VIEW.width) * 100}%`, top: `${(y / VIEW.height) * 100}%` });
const Path = ({ part }: { part: Part }) => <path d={part.d} fill={part.fill ?? "none"} stroke={part.stroke} strokeWidth={part.width} strokeDasharray={part.dash?.join(" ")} opacity={part.opacity} strokeLinecap="round" strokeLinejoin="round" />;

type Props = {
  girthIn: number;
  lengthIn: number;
  girthLabel: string;
  lengthLabel: string;
  name?: string;
  /** The how-to diagram: also names the two bony points. */
  guide?: boolean;
};

/** The cow on the হাট fence. It stretches a little with the measurements; labels stay HTML so they never distort. */
export function CowArt({ girthIn, lengthIn, girthLabel, lengthLabel, name, guide }: Props) {
  const scale = stretch(girthIn, lengthIn);
  const girthTo = place(...labelSpots.girth.target, scale);
  const lengthTo = place(...labelSpots.length.target, scale);
  const shoulder = place(points.shoulder.x, points.shoulder.y, scale);
  const pin = place(points.pin.x, points.pin.y, scale);
  const tag = place(tagAnchor.x, tagAnchor.y, scale);
  const pointSpots = { shoulder: { x: 372, y: 206 }, pin: { x: 54, y: 62 } };
  return (
    <div className="ojon-art" data-guide={guide || undefined}>
      <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} aria-hidden="true" focusable="false">
        {fence.map((part, index) => <Path key={index} part={part} />)}
        <g className="ojon-cow" style={{ transform: `scale(${scale.x}, ${scale.y})`, transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px` }}>
          <Path part={shadow} />
          {cow.map((part, index) => <Path key={index} part={part} />)}
        </g>
        <g className="ojon-leaders">
          <path d={`M${labelSpots.length.x} ${labelSpots.length.y + 10}L${lengthTo.x} ${lengthTo.y}`} />
          <path d={`M${labelSpots.girth.x} ${labelSpots.girth.y - 9}L${girthTo.x} ${girthTo.y}`} />
          {guide && <path d={`M${pointSpots.shoulder.x} ${pointSpots.shoulder.y - 9}L${shoulder.x} ${shoulder.y}`} />}
          {guide && <path d={`M${pointSpots.pin.x} ${pointSpots.pin.y + 9}L${pin.x} ${pin.y}`} />}
        </g>
        {name && (
          <g className="ojon-tag">
            <path d={`M${tag.x} ${tag.y + 6}v12`} />
          </g>
        )}
      </svg>
      <span className="ojon-chip" style={at(labelSpots.length.x, labelSpots.length.y)}>{lengthLabel}</span>
      <span className="ojon-chip" style={at(labelSpots.girth.x, labelSpots.girth.y)}>{girthLabel}</span>
      {guide && <span className="ojon-chip ojon-chip-point" style={at(pointSpots.shoulder.x, pointSpots.shoulder.y)}>কাঁধের হাড়</span>}
      {guide && <span className="ojon-chip ojon-chip-point" style={at(pointSpots.pin.x, pointSpots.pin.y)}>পিন বোন</span>}
      {name && <span className="ojon-name" style={at(tag.x, tag.y + 28)}>{name}</span>}
    </div>
  );
}
