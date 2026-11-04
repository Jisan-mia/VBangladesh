"use client";
// The pictures, the b d p q drawings, a word with its letter coloured, and English speech when the phone has an on-device English voice.
import { useEffect, useState } from "react";
import { artGroup } from "../lib/art";
import { MIRROR_SHAPE, splitWord, type Entry, type Mirror } from "../lib/letters";

export function Pic({ letter, className = "ab-pic" }: { letter: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: artGroup(letter) }} />;
}

/** b d p q as a blue stick and an orange belly on a writing line, so which way it faces is plain to see. */
export function Glyph({ letter, className = "ab-glyph" }: { letter: string; className?: string }) {
  const shape = MIRROR_SHAPE[letter as Mirror];
  if (!shape) return null;
  return <svg className={className} viewBox="0 0 64 104" role="img" aria-label={letter}>
    <path className="ab-line" d="M2 80h60" />
    <circle className="ab-belly" cx={shape.belly} cy="62" r="18" />
    <path className="ab-stick" d={`M${shape.stick} ${shape.from}V${shape.to}`} />
  </svg>;
}

/** "Mango" with the M coloured; "Box" with the x coloured. */
export function EnglishWord({ entry }: { entry: Entry }) {
  const [before, letter, after] = splitWord(entry);
  return <b className="ab-word" lang="en">{before}<span>{letter}</span>{after}</b>;
}

// No voices on the site: phone text-to-speech sounds poor, so the word is shown, never spoken.
/** Does nothing: the site uses no spoken voice. */
export function sayEnglish(_word: string) { /* no voice */ }

/** Renders nothing: the site uses no spoken voice. */
export function SayEnglish(_props: { word: string }) { return null; }
