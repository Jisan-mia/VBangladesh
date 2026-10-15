"use client";
// IP: what we avoided — no Meena, Sisimpur or any TV/app characters, no real phone maker's dial pad or ringtone; the pad, phone and ring are our own code art and tones.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import {
  beats, bn, cardLine, DEMO, dial, endLine, expected, glows, hiddenCount, LEVELS, LEVEL_COUNT, levelOf, missLine, newRound, nextPiece, parseNumber, peek,
  promptLine, rhyme, roundStars, sayLine, slots, target, WHO_NAME, whose, type Round, type Who,
} from "../lib/game";

const TOOL = "ammur-number";
const PRIVATE = "নম্বরটা কোথাও রাখা হয় না, পাতা বন্ধ করলেই মুছে যায়।";
const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});
const ring = () => [0, 0.16, 0.62, 0.78].forEach(delay => tone(1320, 0.11, 0.05, "sine", delay));

export function NumberGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  // The numbers live only in this state, in page memory: never in storage, the address, the card, a log or the network. Reloading clears them.
  const [numbers, setNumbers] = useState<Partial<Record<Who, string>>>({});
  const [who, setWho] = useState<Who>("ammu");
  const [round, setRound] = useState<Round | null>(null);
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [lit, setLit] = useState<{ at: number; show: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [idle, setIdle] = useState(false);
  const [stars, setStars] = useState(0);
  const [showing, setShowing] = useState(false);
  const [gate, setGate] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const taught = useRef(false);
  const card = useRef<HTMLCanvasElement>(null);

  const stopListening = () => { timers.current.forEach(clearTimeout); timers.current = []; setLit(null); };
  /** Plays the digits as a little tune, lighting each box; `show` lets the hidden ones be seen while it plays. */
  function listen(next: Round, show: boolean) {
    stopListening();
    const length = target(next), times = beats(length, slow);
    setLit({ at: -1, show });
    times.forEach((time, index) => timers.current.push(setTimeout(() => { setLit({ at: index, show }); sfx.note(Number(next.number[index])); }, time + 250)));
    timers.current.push(setTimeout(() => setLit(null), times[length - 1] + 900));
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function start(number: string, level: number, carry?: Round) {
    const next = newRound(level, number, carry?.eased, carry?.rightRun);
    setRound(next); setPhase("play"); setMessage("");
    listen(next, levelOf(level).showFirst);
  }
  const firstOpen = () => LEVELS.find(each => each.step <= levels.unlocked && !levels.stars[each.step])?.step ?? levels.unlocked;

  function setNumber(person: Who, number: string) {
    setNumbers(before => ({ ...before, [person]: number }));
    setWho(person); setGate(count => count + 1);
    start(number, round?.level ?? firstOpen());
  }
  function clearNumbers() { stopListening(); setNumbers({}); setRound(null); setGate(count => count + 1); }

  // The preview-image script's `#og`: the demo number and the card, nothing saved.
  useEffect(() => { if (location.hash === "#og") { setNumbers({ ammu: DEMO }); setShowing(true); } }, []);

  // A finished piece rests a beat, then the next, longer piece plays. A finished number rings, then the round waits.
  useEffect(() => {
    if (!round || phase !== "play" || round.stage === "play") return;
    const timer = round.stage === "piece"
      ? setTimeout(() => { const next = nextPiece(round); setRound(next); setMessage(""); listen(next, levelOf(next.level).showFirst); }, slow ? 1500 : 1000)
      : setTimeout(() => {
        const earned = roundStars(round);
        levels.record(round.level, earned);
        setStars(earned); sfx.win();
        if (round.level === LEVEL_COUNT) confetti();
        atBreak();
        setPhase("end");
      }, 1700);
    return () => clearTimeout(timer);
  }, [round, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // The ghost finger comes back after a quiet wait.
  useEffect(() => {
    setIdle(false);
    if (!round || phase !== "play") return;
    const timer = setTimeout(() => setIdle(true), 7000);
    return () => clearTimeout(timer);
  }, [round, phase]);

  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts(cardFontSample).then(() => { if (live && card.current) drawCard(card.current, who, location.host); });
    return () => { live = false; };
  }, [showing, who]);

  function tap(digit: number, element: HTMLElement) {
    if (!round || phase !== "play") return;
    if (lit) stopListening();
    const { round: next, event } = dial(round, digit);
    if (event === "ignore") return sfx.tap();
    if (event === "miss") { tone(330, 0.14, 0.06, "sine"); shake(element); setMessage(missLine(next)); }
    else { sfx.note(digit); setMessage(""); taught.current = true; }
    if (event === "piece") sfx.good();
    if (event === "end") ring();
    setRound(next);
  }
  function lookAgain() {
    if (!round || round.stage !== "play") return;
    sfx.tap();
    const next = peek(round);
    setRound(next); listen(next, true);
  }
  function pickWho(person: Who) {
    const number = numbers[person];
    if (!number || person === who) return;
    sfx.tap(); setWho(person); start(number, round?.level ?? firstOpen());
  }

  const number = numbers[who];
  const both = Boolean(numbers.ammu && numbers.abbu);
  const parentForm = <NumberForm onSet={setNumber} onClear={clearNumbers} has={Boolean(number)} />;

  let play;
  if (!round || !number) {
    play = <div className="an-setup">
      <PhoneArt />
      <p className="an-setup-line">আম্মু বা আব্বু নম্বরটা একবার দিলেই খেলা শুরু।</p>
      <ParentGate key={gate} label="নম্বর দাও">{parentForm}</ParentGate>
      <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setNumbers({ ammu: DEMO }); setWho("ammu"); start(DEMO, firstOpen()); }}>নমুনা নম্বরে দেখো</button>
      <p className="an-private">{PRIVATE}</p>
    </div>;
  } else {
    const level = levelOf(round.level), length = target(round), shown = Boolean(lit?.show);
    const boxes = slots(round, shown), hidden = hiddenCount(round);
    const want = round.stage === "play" ? expected(round) : -1;
    const firstTime = !taught.current && round.piece === 0;
    const ghost = phase === "play" && round.stage === "play" && !lit && (firstTime || glows(round) || idle);
    const key = (digit: number) => <button type="button" key={digit} className={`an-key${glows(round) && digit === want ? " is-glow" : ""}`}
      {...press(element => tap(digit, element))}>{bn(digit)}{ghost && digit === want && <Ghost />}</button>;
    const box = (index: number) => {
      const kind = boxes[index];
      return <span key={index} className={`an-box is-${kind}${lit?.at === index ? " is-lit" : ""}`}>{kind === "hidden" ? "" : kind === "later" ? "·" : bn(round.number[index])}</span>;
    };
    play = <>
      <div className="an-top">
        <p className="an-level"><b>ধাপ {bn(level.step)}</b> <span>{level.label}</span></p>
        <button type="button" className="an-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
        <SoundToggle compact />
      </div>
      {both && <div className="an-who" role="group" aria-label="কার নম্বর">
        {(["ammu", "abbu"] as Who[]).map(person => <button type="button" key={person} aria-pressed={person === who} onClick={() => pickWho(person)}>{WHO_NAME[person]}</button>)}
      </div>}
      <div className="an-screen" role="img" aria-label={`${whose(who)} নম্বর: ${bn(length)}টার ${bn(round.typed)}টা চাপা হয়েছে`}>
        <span className="an-for">{number === DEMO ? "নমুনা নম্বর" : `${whose(who)} নম্বর`}</span>
        <span className="an-boxes">
          {[0, 1, 2, 3, 4].map(box)}<i>-</i>{[5, 6, 7].map(box)}<i>-</i>{[8, 9, 10].map(box)}
        </span>
      </div>
      <p className={`an-q${round.stage !== "play" ? " is-done" : ""}`} aria-live="polite">{promptLine(round, who, Boolean(lit))}</p>
      <div className="an-pad">
        {KEYS.map(key)}
        <button type="button" className="an-key an-look" onClick={lookAgain}>আবার দেখাও</button>
        {key(0)}
        <span className={`an-call${round.stage === "end" ? " is-ringing" : ""}`} aria-hidden="true"><Handset /></span>
      </div>
      <p className="an-msg" aria-live="polite">{message}</p>
      <p className="an-rhyme">{(shown || hidden === 0) && <>{rhyme(round.number, length)} <SpeakButton text={rhyme(round.number, length)} /></>}</p>

      {phase === "end" && <div className="an-over" role="status">
        <StarReveal count={stars} />
        <p className="an-end-line">{endLine(round, who)}</p>
        <p className="an-end-note">{sayLine(who)}</p>
        <div className="an-end-actions">
          <button type="button" className="kit-primary" onClick={() => { sfx.tap(); start(number, round.level, round); }}>আবার খেলো</button>
          <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); stopListening(); setPhase("closed"); }}>শেষ</button>
        </div>
        {round.level < LEVEL_COUNT && <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); start(number, round.level + 1, round); }}>পরের ধাপ: {levelOf(round.level + 1).label}</button>}
        <ShowParentButton onClick={() => setShowing(true)} />
      </div>}
      {phase === "closed" && <div className="an-over">
        <p className="an-end-line">ফোন রেখে দিলাম।</p>
        <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); start(number, round.level, round); }}>আবার খেলো</button>
      </div>}
    </>;
  }

  return (
    <div className="an" data-slow={slow || undefined}>
      <div className="an-play">{play}</div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(who, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={cardLine(who)} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      {round && <details className="an-drawer">
        <summary>সব ধাপ</summary>
        <LevelGrid count={LEVEL_COUNT} noun="ধাপ" current={round.level} unlocked={levels.unlocked} stars={levels.stars} onPick={step => number && start(number, step, round)} />
        <p>{LEVELS.map(each => `ধাপ ${bn(each.step)}: ${each.label}`).join(" · ")}। তারা শুধু এই ফোনে মনে রাখে কোন ধাপ খেলা হলো, নম্বরটা না।</p>
      </details>}
      <div className="an-parent">
        <ParentGate key={gate} label="বড়দের জন্য">
          {round && number && parentForm}
          <ShareToolLink title="আম্মুর নম্বর" text="ছোটদের আম্মু-আব্বুর ফোন নম্বর মুখস্থ করার খেলা, ৪–৮ বছরের জন্য। নম্বর কোথাও রাখা হয় না। ফ্রি, বিজ্ঞাপন নেই।" />
        </ParentGate>
        <p>{round && `${PRIVATE} `}কোন ধাপে কয় তারা, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}

/** The parent's one field: whose number, and the number itself. It goes into page memory only. */
function NumberForm({ onSet, onClear, has }: { onSet: (who: Who, number: string) => void; onClear: () => void; has: boolean }) {
  const [who, setWho] = useState<Who>("ammu");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    const number = parseNumber(draft);
    if (!number) { setError("০১ দিয়ে শুরু ১১ অঙ্কের মোবাইল নম্বর দাও।"); return; }
    setDraft(""); setError(""); onSet(who, number);
  };
  return <div className="an-form">
    <div className="an-who" role="group" aria-label="কার নম্বর">
      {(["ammu", "abbu"] as Who[]).map(person => <button type="button" key={person} aria-pressed={person === who} onClick={() => setWho(person)}>{whose(person)} নম্বর</button>)}
    </div>
    <label className="an-field">মোবাইল নম্বর
      {/* No form, no name and autocomplete off, so the browser has nothing to remember. */}
      <input type="tel" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={20} placeholder="১১ অঙ্ক, ০১ দিয়ে শুরু"
        value={draft} onChange={event => { setDraft(event.target.value); setError(""); }} onKeyDown={event => { if (event.key === "Enter") submit(); }} />
    </label>
    {error && <p className="an-error" role="alert">{error}</p>}
    <button type="button" className="kit-primary" onClick={submit}>খেলা শুরু করো</button>
    <p className="an-private">{PRIVATE}</p>
    {has && <button type="button" className="kk-link" onClick={onClear}>নম্বর মুছে দাও</button>}
  </div>;
}

function PhoneArt() {
  return <svg className="an-phone-art" viewBox="0 0 120 160" aria-hidden="true">
    <rect x="22" y="6" width="76" height="148" rx="14" fill="#16332a" />
    <rect x="30" y="20" width="60" height="26" rx="6" fill="#dff3ea" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(index => <circle key={index} cx={34 + index * 5.2} cy="33" r="1.8" fill="#0f7a5a" />)}
    {Array.from({ length: 12 }, (_, index) => <circle key={index} cx={42 + (index % 3) * 18} cy={64 + Math.floor(index / 3) * 22} r="7" fill={index === 11 ? "#2fbf71" : index === 9 ? "none" : "#ffffff"} />)}
  </svg>;
}

function Handset() {
  return <svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="#fff" /></svg>;
}

function Ghost() {
  return <svg className="an-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#16332a" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}
