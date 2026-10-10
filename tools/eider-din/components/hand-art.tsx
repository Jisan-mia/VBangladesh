import { items, type ItemId } from "../lib/eid";
import { handPath, slots, viewBox } from "../lib/hand";

/** The live mehendi hand: dashed guides where a motif could go, henna where an item is ticked. */
export function HandArt({ picked }: { picked: readonly ItemId[] }) {
  return (
    <svg className="ed-hand" viewBox={viewBox} aria-hidden="true">
      <path className="ed-skin-edge" d={handPath} />
      <path className="ed-skin" d={handPath} />
      {items.map(item => <path key={item.id} className="ed-guide" d={slots[item.id]} />)}
      {/* Mounting a motif plays its "dye" animation, so each new tick visibly lands on the hand. */}
      {items.filter(item => picked.includes(item.id)).map(item => <path key={item.id} className="ed-motif" d={slots[item.id]} />)}
    </svg>
  );
}
