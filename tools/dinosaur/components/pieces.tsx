// SVG renderers for the path-data art, plus the fact card and the size picture shared by the dig and the finder's book.
import { boneShapes, BOX, dinoShapes, mouthShapes, vehicleShapes, type BoneKind, type Shape } from "../lib/art";
import { bn, DIET_NAME, DIET_WORD, sizeLine, sizeScale, whenLine, type Dino } from "../lib/dinos";
import { SpeakButton } from "../../../shared/kids-kit";

/** Paths in the art's own units. `tint` paints everything one colour (the skeleton's shadow, an unfound page). */
export function Shapes({ shapes, tint }: { shapes: readonly Shape[]; tint?: string }) {
  return <>{shapes.map((shape, i) => <path key={i} d={shape.d} fill={shape.fill && shape.fill !== "none" ? tint ?? shape.fill : "none"} stroke={shape.stroke ? tint ?? shape.stroke : undefined}
    strokeWidth={shape.width} strokeLinecap="round" strokeLinejoin="round" opacity={shape.opacity} />)}</>;
}

export function DinoArt({ dino, tint }: { dino: Dino; tint?: string }) {
  return <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} width="100%" height="100%" aria-hidden="true" focusable="false"><Shapes shapes={dinoShapes(dino.look)} tint={tint} /></svg>;
}

export function BoneArt({ kind }: { kind: BoneKind }) {
  return <svg viewBox="-32 -24 64 48" width="100%" height="100%" aria-hidden="true" focusable="false"><Shapes shapes={boneShapes(kind)} /></svg>;
}

export function Mouth({ dino }: { dino: Dino }) {
  return <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" focusable="false">
    <defs><clipPath id="dn-mouth"><circle cx="50" cy="50" r="48" /></clipPath></defs>
    <circle cx="50" cy="50" r="48" fill="#fff8e8" />
    <g clipPath="url(#dn-mouth)" transform="translate(4 0)"><Shapes shapes={mouthShapes(dino.teeth, dino.look)} /></g>
    <circle cx="50" cy="50" r="48" fill="none" stroke="#7a6243" strokeWidth="3" />
  </svg>;
}

export function Leaf() {
  return <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M8 40Q6 12 40 8Q42 38 8 40Z" fill="#6fae5b" /><path d="M10 38Q22 24 36 12" stroke="#3f7a32" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </svg>;
}

export function Meat() {
  return <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M22 8Q40 6 40 22Q40 34 26 32L18 30Q8 26 10 16Q12 8 22 8Z" fill="#c8553d" />
    <path d="M24 13Q34 13 34 21" stroke="#e98a6f" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M20 30L10 40" stroke="#f6ecd4" strokeWidth="6" strokeLinecap="round" />
    <circle cx="8" cy="39" r="4" fill="#f6ecd4" /><circle cx="11" cy="43" r="4" fill="#f6ecd4" />
  </svg>;
}

/** The dinosaur's length as a bar, over buses (or rickshaws for the small ones) drawn to the same scale. */
export function SizePicture({ dino }: { dino: Dino }) {
  const { kind, unit, count, scale } = sizeScale(dino.lengthM), length = dino.lengthM * scale, inside = length > 150;
  return <svg className="dn-size" viewBox="0 0 300 104" role="img" aria-label={sizeLine(dino.lengthM)}>
    <rect x="10" y="6" width={length} height="26" rx="13" fill={dino.look.color} stroke={dino.look.shade} strokeWidth="2" />
    <text x={inside ? 22 : 18 + length} y="24" className={`dn-size-label${inside ? " in" : ""}`}>{dino.name} · {bn(dino.lengthM)} মিটার</text>
    {Array.from({ length: count }, (_, i) => <g key={i} transform={`translate(${10 + i * unit * scale} 100)`}><Shapes shapes={vehicleShapes(kind, unit * scale * 0.97)} /></g>)}
  </svg>;
}

/** Everything a find teaches: names, size, food, when, and one wow line. */
export function FactCard({ dino, children }: { dino: Dino; children?: React.ReactNode }) {
  const said = `${dino.name}। ${sizeLine(dino.lengthM)} ${DIET_NAME[dino.diet]}: ${dino.food}। ${dino.wow}`;
  return <article className="dn-facts" aria-label={`${dino.name}: যা জানলাম`}>
    <header>
      <h3>{dino.name}</h3>
      <p className="dn-science">{dino.science} <i lang="la">({dino.latin})</i></p>
      <SpeakButton text={said} />
    </header>
    <SizePicture dino={dino} />
    <dl>
      <dt>মাপ</dt><dd>{sizeLine(dino.lengthM)}</dd>
      <dt>খেত</dt><dd>{dino.food} ({DIET_WORD[dino.diet]})</dd>
      <dt>কবে</dt><dd>{whenLine(dino)}</dd>
    </dl>
    <p className="dn-wow">{dino.wow}</p>
    {children}
  </article>;
}
