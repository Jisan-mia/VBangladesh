// The title: the pond (the game's own picture) is the start button, with খেলো under it; then the three worlds, the level chip and one line.
import type { Pic } from "../lib/art";
import { WORLDS, levelOf, placeInWorld, type WorldId } from "../lib/levels";
import { bn } from "../lib/lines";
import { Pics, TitleArt } from "./art";

const WORLD_PIC: Record<WorldId, Pic> = { pukur: "coconut", uthan: "askStick", akash: "orbit" };

export function Title({ world, level, onStart, onWorld, onList, blurAfter }: {
  world: WorldId; level: number; onStart: () => void; onWorld: (id: WorldId) => void; onList: () => void;
  blurAfter: (run: () => void) => (event: { currentTarget: HTMLElement }) => void;
}) {
  const spec = levelOf(level), name = spec.finale ? `★ ${spec.name}` : spec.name;
  return <div className="ki-title">
    <button type="button" className="ki-start" onClick={blurAfter(onStart)} aria-label={`খেলো: ${name}`}>
      <TitleArt />
      <span className="ki-start-label">খেলো</span>
    </button>
    <ul className="ki-worlds" aria-label="কোন জায়গায় খেলবে?">
      {WORLDS.map(item => <li key={item.id}>
        <button type="button" aria-pressed={item.id === world} onClick={blurAfter(() => onWorld(item.id))}>
          <Pics pics={[WORLD_PIC[item.id]]} height={46} /><span>{item.name}</span>
        </button>
      </li>)}
    </ul>
    <button type="button" className="ki-level-chip" onClick={blurAfter(onList)}>
      <Pics pics={[spec.pic]} height={30} /><b>{bn(placeInWorld(level))}</b> · {name} <span>সব লেভেল</span>
    </button>
    <p className="ki-line">{spec.line}</p>
  </div>;
}
