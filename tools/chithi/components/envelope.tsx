"use client";

import { useEffect, useRef, useState } from "react";
import { countdown, type CardView, type Sheet } from "../lib/chithi";

/** The letter as it reads on the blue pad: real text, so screen readers and copy-paste work. */
export function LetterPaper({ sheet, className = "" }: { sheet: Sheet; className?: string }) {
  return (
    <article className={`ch-pad ch-paper ${className}`} aria-label="চিঠি">
      {sheet.date && <p className="ch-date">{sheet.date}</p>}
      <p className="ch-greet">{sheet.greeting}</p>
      {sheet.body.map((line, index) => <p key={index} className="ch-body">{line}</p>)}
      <p className="ch-sign">{sheet.signoff}<br />{sheet.signer}</p>
    </article>
  );
}

function Stamps() {
  return (
    <span className="ch-stamps" aria-hidden="true">
      <span className="ch-stamp" data-kind="ilish"><svg viewBox="0 0 60 40"><path d="M8 20c8-11 26-11 34 0-8 11-26 11-34 0Zm34 0 12-9v18Z" fill="#e6ecf3" /><circle cx="15" cy="18" r="2" fill="#1d2b53" /></svg></span>
      <span className="ch-stamp" data-kind="shapla"><svg viewBox="0 0 60 40"><g fill="#f4f7ef">{[-60, -30, 0, 30, 60].map(turn => <ellipse key={turn} cx="30" cy="16" rx="4.5" ry="11" transform={`rotate(${turn} 30 27)`} />)}</g><circle cx="30" cy="25" r="3.5" fill="#f2c94c" /><ellipse cx="30" cy="34" rx="20" ry="4" fill="#1f5e40" /></svg></span>
    </span>
  );
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** A closed yellow envelope that opens on a tap: the flap lifts, the blue sheet slides out and unfolds. A sealed one stays shut. */
export function Envelope({ view, onOpen }: { view: CardView; onOpen?: () => void }) {
  const [stage, setStage] = useState<"closed" | "opening" | "open">("closed");
  const timer = useRef<number | undefined>(undefined);
  const letter = useRef<HTMLDivElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { if (stage === "open") { letter.current?.focus({ preventScroll: true }); onOpen?.(); } }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  function open() {
    if (view.seal || stage !== "closed") return;
    if (reducedMotion()) { setStage("open"); return; }
    setStage("opening");
    timer.current = window.setTimeout(() => setStage("open"), 1150);
  }

  if (stage === "open") return <div ref={letter} tabIndex={-1} className="ch-opened"><LetterPaper sheet={view.sheet} className="ch-unfold" /></div>;

  return (
    <div className="ch-envelope-wrap">
      <div className="ch-env" data-stage={stage} data-sealed={Boolean(view.seal)}>
        <div className="ch-env-back" />
        <div className="ch-env-letter" aria-hidden="true" />
        <div className="ch-env-front">
          <Stamps />
          <p className="ch-env-to">{view.to}</p>
          {view.from && <p className="ch-env-from">{view.from}</p>}
        </div>
        <div className="ch-env-flap" />
        {view.seal && <p className="ch-env-seal"><small>খুলবে</small>{view.seal.label}</p>}
      </div>
      {view.seal
        ? <p className="ch-env-wait"><strong>{countdown(view.seal.days)}</strong> খোলার দিনের আগে খামটা খোলা যাবে না। {view.seal.written}</p>
        : <button type="button" className="kit-primary ch-open" onClick={open} disabled={stage !== "closed"}>{stage === "closed" ? "খামটা খোলো" : "খোলা হচ্ছে…"}</button>}
    </div>
  );
}
