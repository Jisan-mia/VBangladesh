"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, sfx, tone } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, caption, defaultTeams, drawLetter, gameTitle, humanLine, letters, MAX_NAME, occasions, parseShareHash, ROUND_SECONDS, scoreLine, scores, shareHash, teamName, turnOf, type Game, type OccasionId, type Round } from "../lib/game";

const TOOL = "ganer-koli";
const SAVED = "ganer-koli-game";

/** A short reed-like buzz when time runs out, so a noisy room hears it. The screen says it too. */
function timeUpBuzz() {
  tone(220, 0.7, 0.1, "sawtooth");
  tone(223, 0.7, 0.1, "sawtooth");
  buzz([120, 60, 120]);
}

function ClayPot() {
  return <svg className="koli-pot" viewBox="0 0 120 120" aria-hidden="true">
    <g className="koli-pot-chits">
      <rect x="38" y="10" width="18" height="30" rx="2" transform="rotate(-14 47 25)" />
      <rect x="56" y="4" width="18" height="34" rx="2" transform="rotate(6 65 21)" />
      <rect x="70" y="14" width="16" height="26" rx="2" transform="rotate(20 78 27)" />
    </g>
    <path className="koli-pot-body" d="M34 40h52c2 6-1 10-6 12 22 10 30 28 24 44-6 16-26 22-44 22s-38-6-44-22c-6-16 2-34 24-44-5-2-8-6-6-12z" />
    <path className="koli-pot-rim" d="M32 36h56a4 4 0 0 1 0 8H32a4 4 0 0 1 0-8z" />
    <path className="koli-pot-band" d="M22 80c24 8 52 8 76 0" />
    <path className="koli-pot-band" d="M26 92c22 7 46 7 68 0" />
  </svg>;
}

export function SingingLid() {
  const [teams, setTeams] = useState<[string, string]>(defaultTeams);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [occasion, setOccasion] = useState<OccasionId>("aj");
  const [current, setCurrent] = useState<{ letter: string; startedAt: number } | null>(null);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [lastScorer, setLastScorer] = useState<0 | 1 | null>(null);
  const [friend, setFriend] = useState<Game | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const picker = useRef<HTMLDetailsElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const game: Game = { teams, rounds, occasion };
  const state = shareHash(game).slice(1);
  const [a, b] = scores(rounds);
  const turn = turnOf(rounds);
  const timeUp = Boolean(current) && left <= 0;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared score card counts as a friend's game.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    try {
      const saved = parseShareHash(localStorage.getItem(SAVED) ?? "");
      if (saved) { setTeams(saved.teams); setRounds(saved.rounds); setOccasion(saved.occasion); }
    } catch { /* private mode: the game just isn't kept across reloads */ }
    setLoaded(true);
    setSite(window.location.host);
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  // Keep the score on this phone, so an accidental reload in the middle of Eid night doesn't wipe it.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SAVED, state); } catch { /* nothing to do */ }
  }, [state, loaded]);

  useEffect(() => {
    if (!current) return;
    let buzzed = false;
    const tick = () => {
      const remaining = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - current.startedAt) / 1000));
      setLeft(remaining);
      if (remaining === 0 && !buzzed) { buzzed = true; timeUpBuzz(); }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [current]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("গানের কলি দল ক").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, game, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function start(letter: string) {
    sfx.pick();
    setCurrent({ letter, startedAt: Date.now() });
    setLeft(ROUND_SECONDS);
    setLastScorer(null);
  }

  /** The big button: draws a letter, or, mid-round, records that nobody sang and draws the next one. */
  function next() {
    const done = current ? [...rounds, { letter: current.letter, team: null }] : rounds;
    if (current) setRounds(done);
    start(drawLetter(done.map(round => round.letter)));
  }

  function sang(team: 0 | 1) {
    if (!current) return;
    setRounds([...rounds, { letter: current.letter, team }]);
    setCurrent(null);
    setLastScorer(team);
    sfx.good();
  }

  function pick(letter: string) {
    if (picker.current) picker.current.open = false;
    start(letter);
  }

  function undo() {
    if (current) { setCurrent(null); return; }
    setRounds(rounds.slice(0, -1));
    setLastScorer(null);
  }

  function newGame() {
    if (rounds.length && !window.confirm("এই খেলার স্কোর মুছে নতুন করে শুরু করবে?")) return;
    setRounds([]); setCurrent(null); setLastScorer(null);
  }

  function rename(index: 0 | 1, value: string) {
    const nextTeams: [string, string] = [...teams];
    nextTeams[index] = value.replace(/,/g, "").slice(0, MAX_NAME);
    setTeams(nextTeams);
  }

  const turnName = teamName(teams, turn);
  const status = current
    ? timeUp ? "সময় শেষ! গেয়ে থাকলে দলের বোর্ডে চাপো, নইলে পরের অক্ষর।" : <>এবার <b>{turnName}</b>: “{current.letter}” দিয়ে শুরু, এমন একটা গান ধরো!</>
    : lastScorer !== null ? <><b>{teamName(teams, lastScorer)}</b> পেল ১ পয়েন্ট! পরের অক্ষর তুলবে {turnName}।</>
      : rounds.length ? `এবার অক্ষর তুলবে ${turnName}।` : "অক্ষর তোলো। সেই অক্ষর দিয়ে শুরু, এমন গান ধরতে হবে ৩০ সেকেন্ডে।";
  const mainLabel = current ? "কেউ পারেনি, পরের অক্ষর" : rounds.length ? "পরের অক্ষর তোলো" : "অক্ষর তোলো";

  return (
    <div className="koli">
      {friend && (
        <section className="koli-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`বন্ধুদের স্কোরকার্ড: ${gameTitle(friend)}, ${scoreLine(friend)}`} />
          <div>
            <p className="koli-kicker">বন্ধুরা খেলে পাঠিয়েছে</p>
            <h2 id="friend-title">{scoreLine(friend)}। <span>এবার তোমাদের পালা!</span></h2>
            <p>দুই দল বানাও, নিচে অক্ষর তোলো।</p>
          </div>
        </section>
      )}

      <div className="koli-lid" data-timeup={timeUp}>
        <div className="koli-knobs" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="koli-stage">
          <ClayPot />
          <div className="koli-chit" key={current?.letter ?? "empty"} data-empty={!current} aria-live="polite" aria-atomic="true">
            {current ? <><span className="koli-sr">অক্ষর </span><b>{current.letter}</b></> : <span className="koli-chit-ask">?</span>}
          </div>
          <div className="koli-clock" aria-hidden="true">{current ? <><b>{bn(left)}</b><span>সেকেন্ড</span></> : <><b>{bn(ROUND_SECONDS)}</b><span>সেকেন্ড</span></>}</div>
        </div>
        <div className="koli-keys" role="progressbar" aria-label="বাকি সময়" aria-valuemin={0} aria-valuemax={ROUND_SECONDS} aria-valuenow={current ? left : ROUND_SECONDS} aria-valuetext={`${bn(current ? left : ROUND_SECONDS)} সেকেন্ড বাকি`}>
          {Array.from({ length: ROUND_SECONDS }, (_, index) => <i key={index} data-gone={Boolean(current) && index >= left} data-black={[1, 3, 6, 8, 10].includes(index % 12)} />)}
        </div>
        <p className="koli-status" role="status">{status}</p>
      </div>

      <div className="koli-teams">
        {([0, 1] as const).map(index => (
          <div className="koli-board" key={index} data-turn={Boolean(current) && turn === index} data-scored={lastScorer === index}>
            <input value={teams[index]} maxLength={MAX_NAME} onChange={event => rename(index, event.target.value)} onBlur={() => { if (!teams[index].trim()) rename(index, defaultTeams[index]); }} aria-label={`${index === 0 ? "প্রথম" : "দ্বিতীয়"} দলের নাম`} />
            <button type="button" onClick={() => sang(index)} disabled={!current} aria-label={`${teamName(teams, index)} গেয়েছে, এক পয়েন্ট দাও। এখন ${bn(index === 0 ? a : b)}`}>
              <b key={index === 0 ? a : b}>{bn(index === 0 ? a : b)}</b>
              <span>{current ? "গেয়েছে +১" : "পয়েন্ট"}</span>
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="kit-primary koli-draw" data-mid={Boolean(current) && !timeUp} onClick={next}>{mainLabel}</button>

      <div className="koli-tools">
        {(current || rounds.length > 0) && <button type="button" className="kit-link" onClick={undo}>{current ? "অক্ষরটা ফেরত রাখো" : "শেষ রাউন্ডটা ফেরাও"}</button>}
        {rounds.length > 0 && <button type="button" className="kit-link" onClick={newGame}>নতুন খেলা</button>}
        <SoundToggle compact />
      </div>

      <details className="koli-pick" ref={picker}>
        <summary>অন্তাক্ষরীর নিয়মে খেলছ? অক্ষর নিজে বাছো</summary>
        <p>আগের গানটা যে অক্ষরে শেষ হয়েছে, সেটা চাপো। টাইমার চালু হবে।</p>
        <div className="koli-letters">{letters.map(letter => <button type="button" key={letter} onClick={() => pick(letter)} aria-pressed={current?.letter === letter}>{letter}</button>)}</div>
      </details>

      <StickyNext show={rounds.length >= 3 && !current && !resultVisible} title={<strong>{bn(a)} — {bn(b)}</strong>} sub={`${teamName(teams, 0)} বনাম ${teamName(teams, 1)}`} href="#result" label="স্কোরকার্ড দেখো" />

      <section className="koli-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="koli-result-head">
          <h2 id="result-title">খেলা শেষে <em>স্কোরকার্ড</em></h2>
          <p>{rounds.length ? humanLine(game) : "খেলতে খেলতেই এখানে হারমোনিয়ামের ডালায় চকে স্কোর উঠবে। শেষে শেয়ার করো।"}</p>
        </div>
        <div className="koli-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="koli-sr">স্কোরকার্ড: {gameTitle(game)}, {scoreLine(game)}। {humanLine(game)}</figcaption>
            {previewError && <p className="kit-status" role="alert">স্কোরকার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা রিলোড করে দেখো।</p>}
          </figure>
          <div className="koli-controls">
            <fieldset className="kit-chips">
              <legend>কবেকার খেলা?</legend>
              {occasions.map(item => <button type="button" key={item.id} aria-pressed={occasion === item.id} onClick={() => setOccasion(item.id)}>{item.label}</button>)}
            </fieldset>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="ganer-koli.png" makeImage={() => cardBlob(game, format, site)} imageKey={`${state}|${format}`} caption={caption(game)} state={state} disabled={!rounds.length} hint={rounds.length ? "লিংক খুললে বন্ধুরা এই স্কোরকার্ডটাই দেখবে।" : "আগে অন্তত একটা রাউন্ড খেলো।"} />
          </div>
        </div>
      </section>
    </div>
  );
}
