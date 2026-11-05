// The title: a ring of the six faces is the start button (the game's own art), then the worlds, the level chip and one line.
import { FEELINGS, ORDER } from "../lib/faces";
import { bn } from "../lib/lines";
import { WORLDS, levelOf, placeInWorld, type WorldId } from "../lib/levels";
import { FaceAt, SceneArt } from "./art";

const AT: readonly (readonly [number, number])[] = [[62, 62], [150, 50], [238, 62], [62, 158], [150, 170], [238, 158]];

export function Title({ world, level, onStart, onWorld, onList, blurAfter }: {
  world: WorldId; level: number; onStart: () => void; onWorld: (id: WorldId) => void; onList: () => void;
  blurAfter: (run: () => void) => (event: { currentTarget: HTMLElement }) => void;
}) {
  const spec = levelOf(level), name = spec.finale ? `★ ${spec.name}` : spec.name;
  return <div className="mr-title">
    <button type="button" className="mr-start" onClick={blurAfter(onStart)} aria-label={`খেলো: ${name}`}>
      <svg className="mr-ring" viewBox="0 0 300 220" aria-hidden="true">
        {ORDER.map((feeling, index) => <FaceAt key={feeling} feeling={feeling} fill={FEELINGS[feeling].light} x={AT[index][0]} y={AT[index][1]} size={88} className="mr-ring-face" delay={index * 140} />)}
      </svg>
      <span className="mr-start-label">খেলো</span>
    </button>
    <ul className="mr-worlds" aria-label="কোন পাতা খেলবে?">
      {WORLDS.map(item => <li key={item.id}>
        <button type="button" aria-pressed={item.id === world} onClick={blurAfter(() => onWorld(item.id))}>
          <span className="mr-world-pic"><SceneArt prop={item.prop} /></span><span>{item.name}</span>
        </button>
      </li>)}
    </ul>
    <button type="button" className="mr-level-chip" onClick={blurAfter(onList)}>
      <b>{bn(placeInWorld(level))}</b> · {name} <span>সব লেভেল</span>
    </button>
    <p className="mr-line">{spec.line}</p>
  </div>;
}
