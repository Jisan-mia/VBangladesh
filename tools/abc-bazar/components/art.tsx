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

// Only on-device voices: a network voice would send the word off the phone.
const englishVoice = () => typeof speechSynthesis === "undefined" ? undefined
  : speechSynthesis.getVoices().find(voice => /^en[-_](GB|IN|US)/i.test(voice.lang) && voice.localService) ?? speechSynthesis.getVoices().find(voice => /^en[-_]/i.test(voice.lang) && voice.localService);

/** Says an English word if the phone has an English voice; otherwise does nothing. */
export function sayEnglish(word: string) {
  const voice = englishVoice();
  if (!voice) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
}

/** A speaker button that only appears when an English voice exists. */
export function SayEnglish({ word }: { word: string }) {
  const [voice, setVoice] = useState(false);
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const check = () => setVoice(Boolean(englishVoice()));
    check();
    speechSynthesis.addEventListener("voiceschanged", check);
    return () => speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);
  if (!voice) return null;
  return <button type="button" className="kk-speak" onClick={() => sayEnglish(word)} aria-label={`শোনো: ${word}`}><span aria-hidden="true">🔈</span></button>;
}
