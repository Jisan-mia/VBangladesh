"use client";
// IP: what we avoided — no লুডু/সাপলুডু board, no Snakes-and-Ladders or any app's look, no TV characters; the straight numbered track is the public research design (Siegler & Ramani 2008), and the river, ghats, নৌকা and চরকি are our own code art.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, hiss, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, speak, useKidsSession } from "../../../shared/kids-kit";
import { BOAT, BOATS } from "../lib/art";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import {
  botSpin, bn, endLine, expected, ghatLabel, hint, levelOf, methodLine, newRace, spin, spinValue, starsOf, step, tap,
  LEVEL_COUNT, WORDS, type Player, type Race, type Today,
} from "../lib/race";

const TOOL = "dosh-ghater-nouka";
const SPIN_MS = 800;

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});

function Boat({ player, at, slow, G }: { player: Player; at: number; slow: boolean; G: number }) {
  const colors = BOATS[player];
  return <svg className={`dg-boat dg-boat-${player}`} viewBox="0 0 100 60" aria-hidden="true" style={{ left: at * G + G / 2, transition: slow ? "none" : undefined }}>
    <path d={BOAT.roof} fill={colors.roof} /><path d={BOAT.hull} fill={colors.hull} />
    <path d={BOAT.pole} stroke="#5b4636" strokeWidth="2.5" /><path d={BOAT.flag} fill={colors.flag} />
  </svg>;
}

function Ghost() {
  return <svg className="dg-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** The চরকি: one dot on top (১), two below (২). No prizes on it, only the number of ghats to move. */
function Spinner({ angle, slow, label, active, ghost, onSpin, small }: { angle: number; slow: boolean; label: string; active: boolean; ghost: boolean; onSpin?: () => void; small?: boolean }) {
  const face = <svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M4 50a46 46 0 0 1 92 0z" fill="#ffe3a3" /><path d="M4 50a46 46 0 0 0 92 0z" fill="#bfe3ea" />
    <circle cx="50" cy="50" r="46" fill="none" stroke="#1d2b53" strokeWidth="4" />
    <circle cx="50" cy="26" r="7" fill="#1d2b53" /><circle cx="39" cy="74" r="7" fill="#1d2b53" /><circle cx="61" cy="74" r="7" fill="#1d2b53" />
    <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "50px 50px", transition: slow ? "none" : `transform ${SPIN_MS}ms cubic-bezier(.2,.7,.2,1)` }}>
      <path d="M50 52V16" stroke="#c0392b" strokeWidth="6" strokeLinecap="round" /><path d="M50 7l-9 14h18z" fill="#c0392b" /><circle cx="50" cy="50" r="7" fill="#c0392b" />
    </g>
  </svg>;
  if (!onSpin) return <span className={`dg-spin${small ? " dg-spin-small" : ""}`} data-active={active}>{face}</span>;
  return <button type="button" className="dg-spin" data-active={active} aria-label={`${label}: চরকি ঘোরাও`} {...press(onSpin)}>{face}{ghost && <Ghost />}</button>;
}

function Dots({ value }: { value: number | null }) {
  if (!value) return <span className="dg-dots" aria-hidden="true" />;
  return <span className="dg-dots" role="img" aria-label={`${bn(value)} ঘাট যাবে`}>{Array.from({ length: value }, (_, index) => <i key={index} />)}<b>{bn(value)}</b></span>;
}

export function NoukaGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const [level, setLevel] = useState(1);
  const [race, setRace] = useState<Race>(() => newRace(1));
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [duo, setDuo] = useState(false);
  const [angles, setAngles] = useState<[number, number]>([0, 0]);
  const [spinning, setSpinning] = useState<Player | null>(null);
  const [pop, setPop] = useState<{ ghat: number; player: Player; key: number } | null>(null);
  const [focus, setFocus] = useState<Player>(0);
  const [view, setView] = useState(360);
  const [idle, setIdle] = useState(true);
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<Today>({ games: 0, counted: 0, n: 10 });
  const [showing, setShowing] = useState(false);
  const river = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLCanvasElement>(null);
  const was = useRef<[number, number]>([0, 0]);
  const picked = useRef(false);

  // One ghat column: a 96px target and a 12px gap, a little tighter only on 320px phones so three ghats still fit.
  const G = Math.min(108, Math.max(88, Math.floor(view / 3)));
  const spec = levelOf(level), n = race.n, want = expected(race), help = hint(race);
  const other = duo ? "আব্বু-আম্মু" : "আব্বু";
  const childTurn = phase === "play" && race.turn === 0 && !race.over && spinning === null;

  // Start where the child left off: the first open level without stars.
  useEffect(() => {
    if (!levels.loaded || picked.current) return;
    picked.current = true;
    const start = Array.from({ length: levels.unlocked }, (_, index) => index + 1).find(open => !levels.stars[open]) ?? levels.unlocked;
    setLevel(start); setRace(newRace(start));
  }, [levels.loaded, levels.unlocked, levels.stars]);

  useEffect(() => {
    const measure = () => setView(river.current?.clientWidth ?? 360);
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, []);

  // The camera waits a moment at the end of a turn, so the child sees the boat land before it pans to the other boat.
  useEffect(() => { const timer = setTimeout(() => setFocus(race.turn), 700); return () => clearTimeout(timer); }, [race.turn]);

  // Every ghat a boat reaches: the number rises over it, a note one step higher, and the word if the phone has a Bangla voice.
  useEffect(() => {
    ([0, 1] as const).forEach(player => {
      if (race.pos[player] > was.current[player]) {
        const ghat = race.pos[player];
        setPop({ ghat, player, key: Date.now() + player });
        sfx.note(ghat - 1, 0.22); hiss(0.18, 0.05, 700);
        speak(WORDS[ghat]);
      }
    });
    was.current = [...race.pos];
  }, [race.pos]);

  // আব্বু's boat, and the child's boat after a right guess, count their own way one ghat at a time.
  useEffect(() => {
    if (phase !== "play" || race.over || spinning !== null) return;
    if (race.auto || (race.turn === 1 && !duo && race.spin !== null)) {
      const timer = setTimeout(() => setRace(current => step(current)), race.auto ? 600 : 850);
      return () => clearTimeout(timer);
    }
    if (race.turn === 1 && !duo && race.spin === null) {
      const timer = setTimeout(() => turnSpinner(1), 1000);
      return () => clearTimeout(timer);
    }
  }, [race, phase, duo, spinning]);

  // A nudge from the ghost finger when the child has waited a while.
  useEffect(() => {
    setIdle(false);
    if (!childTurn) return;
    const timer = setTimeout(() => setIdle(true), 6000);
    return () => clearTimeout(timer);
  }, [race, childTurn]);

  useEffect(() => {
    if (!race.over) return;
    const earned = starsOf(race.misses);
    const timer = setTimeout(() => {
      levels.record(level, earned);
      setStars(earned);
      setToday(before => ({ games: before.games + 1, counted: before.counted + race.counted, n: Math.max(before.n, race.n) }));
      sfx.win();
      if (level === LEVEL_COUNT) confetti();
      atBreak();
      setPhase("end");
    }, 900);
    return () => clearTimeout(timer);
  }, [race]); // once per finished race; a re-render must not cancel the timer

  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts(cardFontSample(today)).then(() => { if (live && card.current) drawCard(card.current, today, location.host); });
    return () => { live = false; };
  }, [showing, today]);

  function turnSpinner(player: Player) {
    if (phase !== "play" || race.over || race.turn !== player || race.spin !== null || spinning !== null) { sfx.tap(); return; }
    const value = player === 1 && !duo ? botSpin(race, Math.random) : spinValue(Math.random);
    const land = (value === 1 ? 0 : 180) + (Math.random() - 0.5) * 100;
    setAngles(before => {
      const next: [number, number] = [...before];
      next[player] = before[player] - (before[player] % 360) + 720 + land;
      return next;
    });
    setSpinning(player);
    sfx.pick();
    if (!slow) for (let index = 0; index < 6; index++) tone(1500, 0.02, 0.03, "square", 0.08 + index * index * 0.012);
    setIdle(false);
    setTimeout(() => { setRace(current => spin(current, value)); setSpinning(null); sfx.drop(); }, slow ? 150 : SPIN_MS);
  }

  function onGhat(player: Player, ghat: number, button: HTMLElement) {
    const { race: next, outcome } = tap(race, player, ghat);
    if (outcome === "ignore") { sfx.tap(); return; }
    if (outcome === "miss") { tone(330, 0.14, 0.06, "sine"); shake(button); }
    setRace(next);
  }

  function restart(nextLevel = level, nextDuo = duo) {
    setLevel(nextLevel); setDuo(nextDuo);
    setRace(newRace(nextLevel)); was.current = [0, 0]; setFocus(0); setPop(null);
    setPhase("play");
  }

  const p = race.pos[focus];
  // Show the boat and the two ghats ahead of it, but never slide the boat itself out of view.
  const cam = Math.max(0, Math.min((n + 1) * G - view, Math.max((p + 3) * G - view + 8, p * G - G * 0.3), p * G + G / 2 - 40));
  const ghostOn = childTurn && ((today.games === 0 && race.pos[0] === 0) || idle);

  const bank = (player: Player) => <div className={`dg-bank dg-bank-${player}`} style={{ gridTemplateColumns: `repeat(${n + 1}, ${G}px)` }}>
    <span className="dg-jetty" aria-hidden="true" />
    {Array.from({ length: n }, (_, index) => {
      const ghat = index + 1, target = race.turn === player && ghat === want;
      const cls = ["dg-ghat", ghat <= race.pos[player] ? "is-past" : "", ghat === race.pos[player] ? "is-here" : "", ghat === n ? "is-goal" : "",
        target && help === 2 ? "is-next" : "", target && help === 1 ? "is-hint" : ""].filter(Boolean).join(" ");
      return <button type="button" key={ghat} className={cls} disabled={player === 1 && !duo} data-target={target || undefined} aria-label={ghatLabel(ghat)}
        {...press(element => onGhat(player, ghat, element))}>
        <b>{bn(ghat)}</b><small>{WORDS[ghat]}</small>
        {player === 0 && target && help === 2 && ghostOn && <Ghost />}
      </button>;
    })}
  </div>;

  const marks = n === 10 ? Array.from({ length: 10 }, (_, index) => index + 1) : [1, 5, 10, 15, 20];

  return (
    <div className="dg" data-slow={slow || undefined}>
      <div className="dg-play">
        <div className="dg-top">
          <p className="dg-level"><b>ধাপ {bn(level)}</b> <span>{spec.title}</span></p>
          <button type="button" className="dg-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle compact />
        </div>

        <div className="dg-line" role="img" aria-label={`তোমার নৌকা ${race.pos[0] ? `${bn(race.pos[0])} নম্বর ঘাটে` : "শুরুর জেটিতে"}, ${other} ${race.pos[1] ? `${bn(race.pos[1])} নম্বর ঘাটে` : "শুরুর জেটিতে"}। শেষ ঘাট ${bn(n)}।`}>
          <span className="dg-line-bar" />
          {Array.from({ length: n }, (_, index) => <i key={index} style={{ left: `${((index + 1) / n) * 100}%` }} />)}
          {marks.map(mark => <b key={mark} style={{ left: `${(mark / n) * 100}%` }}>{bn(mark)}</b>)}
          {([0, 1] as const).map(player => <em key={player} className={`dg-mark-${player}`} style={{ left: `${(race.pos[player] / n) * 100}%` }} />)}
        </div>

        <div className="dg-row" data-turn={race.turn === 0 && !race.over}>
          <Spinner angle={angles[0]} slow={slow} label="তোমার চরকি" active={childTurn && race.spin === null} ghost={ghostOn && race.spin === null} onSpin={() => turnSpinner(0)} />
          <p className="dg-who"><b>তুমি</b><Dots value={race.turn === 0 ? race.spin : null} /></p>
        </div>

        <div className="dg-river" ref={river}>
          <div className="dg-track" style={{ width: (n + 1) * G, transform: `translateX(${-cam}px)`, transition: slow ? "none" : undefined, "--g": `${G}px` } as CSSProperties}>
            {bank(0)}
            <div className="dg-water">
              <Boat player={0} at={race.pos[0]} slow={slow} G={G} />
              <Boat player={1} at={race.pos[1]} slow={slow} G={G} />
              {pop && <span key={pop.key} className={`dg-pop dg-pop-${pop.player}`} style={{ left: pop.ghat * G + G / 2 }} aria-hidden="true">{bn(pop.ghat)}<small>{WORDS[pop.ghat]}</small></span>}
            </div>
            {bank(1)}
          </div>
        </div>
        <p className="dg-sr" aria-live="polite">{pop ? `${pop.player ? other : "তুমি"}: ${ghatLabel(pop.ghat)}` : ""}</p>

        <div className="dg-row dg-row-1" data-turn={race.turn === 1 && !race.over}>
          <Spinner angle={angles[1]} slow={slow} label={`${other}র চরকি`} small={!duo} active={race.turn === 1 && race.spin === null && phase === "play"} ghost={false} onSpin={duo ? () => turnSpinner(1) : undefined} />
          <p className="dg-who"><b>{other}</b><Dots value={race.turn === 1 ? race.spin : null} /></p>
        </div>

        <div className="dg-mode" role="group" aria-label="নিচের নৌকা কে চালাবে">
          <span>নিচের নৌকা:</span>
          <button type="button" aria-pressed={!duo} onClick={() => { sfx.tap(); restart(level, false); }}>ফোন চালাবে</button>
          <button type="button" aria-pressed={duo} onClick={() => { sfx.tap(); restart(level, true); }}>বড়রা চালাবে</button>
        </div>

        {phase === "end" && (
          <div className="dg-over dg-end" role="status">
            <StarReveal count={stars} />
            <p className="dg-end-line">{endLine(race, other)}</p>
            <p className="dg-end-note">{methodLine(race)}</p>
            <p className="dg-end-note">এবার সিঁড়িতে উঠতে উঠতে জোরে গুনে দেখো।</p>
            <div className="dg-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="dg-over">
            <p className="dg-end-line">নৌকা ঘাটে বাঁধা হলো।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>নতুন খেলা</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(today, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`আজ ১ থেকে ${bn(today.n)} গুনে নৌকা চালানো হলো, ${bn(today.games)}টা খেলা, ${bn(today.counted)}টা ঘাট।`} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="dg-drawer">
        <summary>সব ধাপ</summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} noun="ধাপ" onPick={pick => restart(pick)} />
      </details>
      <div className="dg-parent">
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="দশ ঘাটের নৌকা" text="১ থেকে ২০ গোনার নৌকাবাইচ, ছোটদের জন্য। ফ্রি, অ্যাকাউন্ট লাগে না।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন ধাপে কয় তারা, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
