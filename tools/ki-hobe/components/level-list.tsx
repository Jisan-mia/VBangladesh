// The level list: a choice screen (nothing runs under it). Each level shows its picture, its name, one line, its stars.
import { placeInWorld, recommended, worldLevels, worldOf, type WorldId } from "../lib/levels";
import { bn } from "../lib/lines";
import { Pics } from "./art";

export function LevelList({ world, level, stars, onPick, onClose }: { world: WorldId; level: number; stars: Record<number, number>; onPick: (id: number) => void; onClose: () => void }) {
  const suggest = recommended(world, stars), name = worldOf(world).name;
  return <div className="ki-list" role="dialog" aria-label={`${name}: সব লেভেল`}>
    <div className="ki-list-head"><h2>{name}: সব লেভেল</h2><button type="button" className="kit-link" onClick={onClose}>ফিরে যাও</button></div>
    <ol>
      {worldLevels(world).map(item => {
        const earned = stars[item.id] ?? 0, place = placeInWorld(item.id);
        return <li key={item.id}>
          <button type="button" aria-current={item.id === level ? "true" : undefined} className={item.id === suggest ? "next" : ""} onClick={() => onPick(item.id)}
            aria-label={`${bn(place)}: ${item.name}${earned ? `, ${bn(earned)} তারা` : ""}${item.id === suggest ? ", এটা খেলো" : ""}`}>
            <b className="ki-list-n">{bn(place)}</b>
            <span className="ki-list-pic"><Pics pics={[item.pic]} height={46} /></span>
            <span className="ki-list-text"><strong>{item.finale ? "★ " : ""}{item.name}</strong><small>{item.line}</small></span>
            <span className="ki-stars" aria-hidden="true">{[0, 1, 2].map(k => <i key={k} className={k < earned ? "on" : ""}>★</i>)}</span>
            {item.id === suggest && <em>এটা খেলো</em>}
          </button>
        </li>;
      })}
    </ol>
  </div>;
}
