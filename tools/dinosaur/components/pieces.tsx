// SVG renderers for the path-data art, the size picture (a dinosaur on a bar over buses), and the fact card: pictures first, words for the grown-up.
import { boneShapes, BOX, dinoShapes, mouthShapes, vehicleShapes, type BoneKind, type Shape } from "../lib/art";
import { bn, DIET_NAME, DIET_WORD, sizeLine, sizeScale, whenLine, type Dino } from "../lib/dinos";

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

export function Mouth({ dino, id = "dn-mouth" }: { dino: Dino; id?: string }) {
  return <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" focusable="false">
    <defs><clipPath id={id}><circle cx="50" cy="50" r="48" /></clipPath></defs>
    <circle cx="50" cy="50" r="48" fill="#f4ead2" />
    <g clipPath={`url(#${id})`} transform="translate(4 0)"><Shapes shapes={mouthShapes(dino.teeth, dino.look)} /></g>
    <circle cx="50" cy="50" r="48" fill="none" stroke="#4a3320" strokeWidth="3" />
  </svg>;
}

export function Leaf() {
  return <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M8 40Q6 12 40 8Q42 38 8 40Z" fill="#5f9e4a" /><path d="M10 38Q22 24 36 12" stroke="#2f6a26" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </svg>;
}

export function Meat() {
  return <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M22 8Q40 6 40 22Q40 34 26 32L18 30Q8 26 10 16Q12 8 22 8Z" fill="#b8472f" />
    <path d="M24 13Q34 13 34 21" stroke="#e08467" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M20 30L10 40" stroke="#f1e6c8" strokeWidth="6" strokeLinecap="round" />
    <circle cx="8" cy="39" r="4" fill="#f1e6c8" /><circle cx="11" cy="43" r="4" fill="#f1e6c8" />
  </svg>;
}

/** The buses roll in one after another, each a little sooner after the last (a wave, not a metronome). */
const BUS_DELAYS = [260, 340, 400, 440];

/**
 * The dinosaur's real length: a bar of exactly that many metres with the dinosaur standing on it, over as many buses (a rickshaw
 * for the small ones) as cover it, all to one scale. Each bus is numbered, so counting buses is the fact. Plays its own small entrance.
 */
export function SizePicture({ dino, scene = false }: { dino: Dino; scene?: boolean }) {
  const { kind, unit, count, scale } = sizeScale(dino.lengthM), length = dino.lengthM * scale, inside = length > 150;
  const art = 92, artW = art * BOX.width / BOX.height, artX = Math.max(0, Math.min(300 - artW, 10 + length / 2 - artW / 2));
  return <svg className={`dn-size${scene ? " dn-size-scene" : ""}`} viewBox="0 0 300 206" role="img" aria-label={sizeLine(dino.lengthM)}>
    <rect className="dn-size-sky" width="300" height="206" />
    <g className="dn-size-dinog"><svg x={artX} y={0} width={artW} height={art} viewBox={`0 0 ${BOX.width} ${BOX.height}`}><Shapes shapes={dinoShapes(dino.look)} /></svg></g>
    <rect className="dn-size-bar" x="10" y="96" width={length} height="24" fill={dino.look.color} stroke={dino.look.shade} strokeWidth="2" />
    <text x={inside ? 20 : 16 + length} y="113" className={`dn-size-label${inside ? " in" : ""}`}>{bn(dino.lengthM)} মিটার</text>
    <rect className="dn-size-under" y="176" width="300" height="30" />
    <path className="dn-size-ground" d="M0 176H300" />
    {Array.from({ length: count }, (_, i) => <g key={i} transform={`translate(${10 + i * unit * scale} 176)`}><g className="dn-size-bus" style={{ animationDelay: `${BUS_DELAYS[Math.min(i, BUS_DELAYS.length - 1)]}ms` }}>
      <Shapes shapes={vehicleShapes(kind, unit * scale * 0.97)} />
      <text x={unit * scale * 0.485} y="22" textAnchor="middle" className="dn-size-n">{bn(i + 1)}</text>
    </g></g>)}
  </svg>;
}

/** The food, in pictures: the mouth, an arrow, the leaf or the meat. */
export function FoodRow({ dino }: { dino: Dino }) {
  return <div className="dn-food" data-diet={dino.diet}>
    <span className="dn-food-mouth"><Mouth dino={dino} id={`dn-mouth-${dino.id}`} /></span>
    <svg className="dn-food-arrow" viewBox="0 0 40 24" aria-hidden="true" focusable="false"><path d="M4 12H32M24 4L34 12L24 20" /></svg>
    <span className="dn-food-icon">{dino.diet === "plant" ? <Leaf /> : <Meat />}</span>
    <span className="dn-food-words"><b>{DIET_NAME[dino.diet]}</b><small>{DIET_WORD[dino.diet]}</small></span>
  </div>;
}

/** Everything a find teaches. The size picture shows on the card unless the board already carries it (`scene` off). `full` adds the plain lines for a reader. */
export function FactCard({ dino, children, action, scene = true, full = false }: { dino: Dino; children?: React.ReactNode; action?: React.ReactNode; scene?: boolean; full?: boolean }) {
  return <article className="dn-facts" aria-label={`${dino.name}: যা জানলাম`}>
    <header>
      <div className="dn-facts-name">
        <h3>{dino.name}</h3>
        <p className="dn-science">{dino.science} <i lang="la">({dino.latin})</i></p>
      </div>
      {action}
    </header>
    {scene && <SizePicture dino={dino} />}
    <FoodRow dino={dino} />
    {full && <dl>
      <dt>মাপ</dt><dd>{sizeLine(dino.lengthM)}</dd>
      <dt>খেত</dt><dd>{dino.food}</dd>
      <dt>কবে</dt><dd>{whenLine(dino)}</dd>
    </dl>}
    <p className="dn-wow">{dino.wow}</p>
    {children}
  </article>;
}

/** A pointing finger that shows the first move to children who can't read yet. */
export function GhostFinger() {
  return <svg viewBox="0 0 48 56" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M18 6Q18 1 22.5 1Q27 1 27 6V24L37 26Q44 28 43 35L40 49Q39 54 33 54H20Q15 54 12 49L5 37Q3 33 7 31Q10 30 13 33L18 38Z" fill="#fff" stroke="#2b1d12" strokeWidth="2.4" strokeLinejoin="round" opacity=".92" />
  </svg>;
}
