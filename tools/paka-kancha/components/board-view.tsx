"use client";
// The board: one row per try. A digit level shows a mango beside every digit; a basket level shows the digits plain and a tray of
// mangoes (পাকা first) at the end of the row. Rows not yet played are dim; the one being typed shows the next free cell. Once the
// game is over only the tries made stay, so the result fits under them.
import type { CSSProperties, Ref } from "react";
import { LENGTH, bn, bnDigits, count, markNames, type Mark } from "../lib/rules";
import { Mango } from "./mango";

export const rowWords = (guess: string, marks: readonly Mark[], basket: boolean) => basket
  ? `${bnDigits(guess)}: ${count(marks, "p")}টা পাকা, ${count(marks, "a")}টা আধপাকা`
  : [...guess].map((digit, index) => `${bnDigits(digit)} ${markNames[marks[index]]}`).join(", ");

export function Tray({ marks }: { marks: readonly Mark[] }) {
  return <span className="pk-tray" aria-hidden="true">
    {Array.from({ length: LENGTH }, (_, slot) => marks[slot] === "k" || !marks[slot]
      ? <i key={slot} className="pk-slot" />
      : <span key={slot} className="pk-slot" data-has style={{ "--i": slot } as CSSProperties}><Mango mark={marks[slot]} /></span>)}
  </span>;
}

export function Row({ guess, marks, number, fresh, win, basket, label }: {
  guess: string; marks: readonly Mark[]; number?: number; fresh?: boolean; win?: boolean; basket?: boolean; label?: string;
}) {
  return <li className="pk-row" data-fresh={fresh || undefined} data-win={win || undefined} data-basket={basket || undefined}
    aria-label={`${label ?? (number ? `${bn(number)} নম্বর চেষ্টা` : "উদাহরণ")}: ${rowWords(guess, marks, Boolean(basket))}`}>
    <span className="pk-n" aria-hidden="true">{number ? bn(number) : ""}</span>
    {[...guess].map((digit, index) => (
      <span key={index} className="pk-cell" data-mark={basket ? undefined : marks[index]} style={{ "--i": index } as CSSProperties} aria-hidden="true">
        <b>{bnDigits(digit)}</b>{!basket && <Mango mark={marks[index]} />}
      </span>
    ))}
    {basket && <Tray marks={marks} />}
  </li>;
}

export function BoardView({ guesses, rows, input, tries, basket, over, won, typing }: {
  guesses: readonly string[]; rows: readonly Mark[][]; input: string; tries: number; basket: boolean; over: boolean; won: boolean;
  typing: Ref<HTMLLIElement>;
}) {
  const last = rows.length - 1;
  return (
    <ol className="pk-rows" data-basket={basket || undefined} aria-label={`তোমার চেষ্টা, ${bn(tries)} বারের মধ্যে`}>
      {Array.from({ length: over ? rows.length : tries }, (_, index) => {
        if (index < rows.length) return <Row key={index} number={index + 1} guess={guesses[index]} marks={rows[index]} fresh={index === last} win={won && index === last} basket={basket} />;
        const current = index === rows.length && !over;
        return <li key={index} ref={current ? typing : undefined} className="pk-row" data-empty={!current || undefined} data-current={current || undefined} data-basket={basket || undefined}
          aria-label={current ? `এখন: ${input ? bnDigits(input).split("").join(" ") : "খালি"}` : undefined} aria-hidden={!current}>
          <span className="pk-n" aria-hidden="true">{bn(index + 1)}</span>
          {Array.from({ length: LENGTH }, (_, slot) => <span key={slot} className="pk-cell" data-next={(current && slot === input.length) || undefined}><b>{current ? bnDigits(input[slot] ?? "") : ""}</b></span>)}
          {basket && <Tray marks={[]} />}
        </li>;
      })}
    </ol>
  );
}
