// The level list: a choice screen (nothing runs under it). Each level shows the face it introduces, its name, one line, its stars.
import { FEELINGS } from "../lib/faces";
import { bn } from "../lib/lines";
import { levelOf, placeInWorld, recommended, worldLevels, worldOf, type WorldId } from "../lib/levels";
import { Face } from "./art";

export function LevelList({ world, level, stars, onPick, onClose }: { world: WorldId; level: number; stars: Record<number, number>; onPick: (id: number) => void; onClose: () => void }) {
  const suggest = recommended(world, stars), name = worldOf(world).name;
  return <div className="mr-list" role="dialog" aria-label={`${name}: সব লেভেল`}>
    <div className="mr-list-head"><h2>{name}: সব লেভেল</h2><button type="button" className="kit-link" onClick={onClose}>ফিরে যাও</button></div>
    <ol>
      {worldLevels(world).map(item => {
        const earned = stars[item.id] ?? 0, place = placeInWorld(item.id);
        return <li key={item.id}>
          <button type="button" aria-current={item.id === level ? "true" : undefined} className={item.id === suggest ? "next" : ""} onClick={() => onPick(item.id)}
            aria-label={`${bn(place)}: ${item.name}${earned ? `, ${bn(earned)} তারা` : ""}${item.id === suggest ? ", এটা খেলো" : ""}`}>
            <b className="mr-list-n">{bn(place)}</b>
            <span className="mr-list-face"><Face feeling={levelOf(item.id).feeling} fill={FEELINGS[item.feeling].light} /></span>
            <span className="mr-list-text"><strong>{item.finale ? "★ " : ""}{item.name}</strong><small>{item.line}</small></span>
            <span className="mr-stars" aria-hidden="true">{[0, 1, 2].map(k => <i key={k} className={k < earned ? "on" : ""}>★</i>)}</span>
            {item.id === suggest && <em>এটা খেলো</em>}
          </button>
        </li>;
      })}
    </ol>
  </div>;
}
