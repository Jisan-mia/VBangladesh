// The pictures on the cards: each is defined once as a <symbol> (from lib/pictures.ts) and every card <use>s it.
import { PICTURES, worldSet } from "../lib/pictures";

const ID = (id: number) => `jm-pic-${id}`;

/** The symbols of one table's pictures (and any extra ids, such as old toys on a friend's old board). Render once per game. */
export function Symbols({ world, extra = [] }: { world: number; extra?: readonly number[] }) {
  const { base, twins } = worldSet(world);
  const ids = [...base, ...twins.map(([twin]) => twin), ...extra.filter(id => !base.includes(id))];
  return (
    <svg className="jm-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {ids.map(id => (
          <symbol key={id} id={ID(id)} viewBox="0 0 64 64">
            {PICTURES[id].parts.map((part, index) => (
              <path key={index} d={part.d} fill={part.fill ?? "none"} stroke={part.stroke} strokeWidth={part.stroke ? part.width ?? 1.5 : undefined} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

export function Pic({ id }: { id: number }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href={`#${ID(id)}`} /></svg>;
}
