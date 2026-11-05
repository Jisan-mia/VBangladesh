"use client";
// The number pad. It is always on screen while a game runs. Only this level's keys show; digits fill rows evenly; মুছো and দেখো
// sit under them. A key that has earned a mango wears a little one (from level 3).
import { LENGTH, bnDigits, markNames, poolOf, type Mark } from "../lib/rules";
import { Mango } from "./mango";

export function Pad({ digits, repeat, input, hints, shown, onKey, onErase, onCheck }: {
  digits: number; repeat: boolean; input: string; hints: Partial<Record<string, Mark>>; shown: boolean;
  onKey: (digit: string) => void; onErase: () => void; onCheck: () => void;
}) {
  const pool = poolOf(digits);
  // 4–5 keys in one row; 6 in two of 3; 7–8 in two of 4; 9–10 in two of 5.
  const columns = pool.length <= 5 ? pool.length : Math.ceil(pool.length / 2);
  return (
    <div className="pk-pad" role="group" aria-label="অঙ্কের প্যাড">
      <div className="pk-digits" style={{ gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }}>
        {[...pool].map(key => {
          const hint = shown ? hints[key] : undefined;
          return <button key={key} type="button" className="pk-key" data-hint={hint} data-used={(!repeat && input.includes(key)) || undefined}
            onClick={() => onKey(key)} aria-label={hint ? `${bnDigits(key)}, ${markNames[hint]}` : bnDigits(key)}>
            {bnDigits(key)}{hint && <Mango mark={hint} />}
          </button>;
        })}
      </div>
      <div className="pk-actions">
        <button type="button" className="pk-key pk-erase" onClick={onErase} disabled={!input}>মুছো<kbd aria-hidden="true">⌫</kbd></button>
        <button type="button" className="pk-key pk-check" onClick={onCheck} data-ready={input.length === LENGTH || undefined}>দেখো<kbd aria-hidden="true">Enter</kbd></button>
      </div>
    </div>
  );
}
