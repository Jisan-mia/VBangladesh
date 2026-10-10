"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, type CardContent } from "../lib/draw-card";
import {
  SLOTS, bn, caption, captainOf, changeFormation, choicesFor, commonIds, crowdXI, defaultTeam, eraLabels, formationIds, formations, lineLabels,
  lineupText, parseShareHash, placePlayer, playerById, possessive, shareHash, spotOf, teamLine, teamTitle, MAX_NAME_LENGTH, type FormationId, type Team,
} from "../lib/ekadosh";

const TOOL = "ekadosh";
// "সবার ভোটে" from three people is noise; wait for a real crowd.
const TALLY_MIN = 20;

/** The pitch, drawn in green marker. The viewBox matches the CSS aspect ratio, so circles stay round. */
function PitchLines() {
  return (
    <svg className="ek-lines" viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden="true">
      <rect x="2" y="2" width="96" height="116" rx="1" />
      <path d="M2 60h96" />
      <circle cx="50" cy="60" r="12" />
      <circle className="ek-dot" cx="50" cy="60" r=".9" />
      <path d="M21 2v19.2h58V2M36 2v7.2h28V2M43 2v-1.6h14V2" />
      <path d="M21 118v-19.2h58V118M36 118v-7.2h28V118M43 118v1.6h14V118" />
      <path d="M39.6 21.2a12 12 0 0 0 20.8 0M39.6 98.8a12 12 0 0 1 20.8 0" />
      <circle className="ek-dot" cx="50" cy="15" r=".9" />
      <circle className="ek-dot" cx="50" cy="105" r=".9" />
    </svg>
  );
}

export function CoachBoard() {
  const [team, setTeam] = useState<Team>(defaultTeam);
  const [friend, setFriend] = useState<Team | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [joined, setJoined] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const picker = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const line = teamLine(team.players);
  const common = useMemo(() => commonIds(team.players, friend), [team.players, friend]);
  const card: CardContent = useMemo(() => ({ team, line, score: friend ? `${bn(common.length)}/${bn(SLOTS)}` : "", common }), [team, line, friend, common]);
  const state = shareHash(team).slice(1);

  useEffect(() => {
    // In-page anchors (#result, #ek-board) also change the hash, so only a real shared XI counts. Their XI goes on my board to agree or disagree with.
    let applied = "";
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      // Pressing Back onto the same link must not wipe the changes made since.
      if (!shared || shareHash(shared) === applied) return;
      applied = shareHash(shared);
      setFriend(shared);
      setTeam({ ...shared, name: "" });
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রাফির স্বপ্নের একাদশ · অধিনায়ক").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, { team: friend, line: teamLine(friend.players), score: "", common: [] }, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function update(next: Team) {
    setTeam(next);
    // A changed XI makes the earlier count stale; let them count again.
    setJoined(current => current === "done" ? "idle" : current);
  }

  function open(slot: number) {
    setActive(slot);
    picker.current?.showModal();
  }

  function choose(id: string) {
    if (active !== null) update(placePlayer(team, active, id));
    picker.current?.close();
  }

  function makeCaptain(id: string) {
    update({ ...team, captain: id });
    picker.current?.close();
  }

  async function join() {
    setJoined("sending");
    // Only the eleven listed player ids are counted; the name never leaves the link.
    const tally = await addToTally(TOOL, team.players);
    if (tally) { setEveryone(tally); setJoined("done"); } else setJoined("failed");
  }

  const spot = active === null ? null : spotOf(team, active);
  const current = active === null ? null : playerById(team.players[active])!;
  const captain = captainOf(team);
  const friendTitle = friend ? `${friend.name ? possessive(friend.name) : "বন্ধুর"} স্বপ্নের একাদশ` : "";

  return (
    <div className="ek">
      {friend && (
        <section className="ek-friend" aria-labelledby="ek-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendTitle}: ${lineupText(friend)}। অধিনায়ক ${captainOf(friend).short}`} />
          <div>
            <p className="ek-kicker">তোমার জন্য একটা দল এসেছে</p>
            <h2 id="ek-friend-title">{friendTitle}, অধিনায়ক {captainOf(friend).short}।<br /><span>তুমি একমত?</span></h2>
            <p>ওর দলটাই নিচের বোর্ডে বসানো আছে। যার সাথে একমত না, তার নাম ছুঁয়ে বদলে দাও।</p>
            <a className="kit-primary" href="#ek-board">আমার দল সাজাই</a>
          </div>
        </section>
      )}

      <div className="ek-board" id="ek-board">
        <div className="ek-clip" aria-hidden="true" />
        <div className="ek-paper">
          <div className="ek-paper-head">
            <p className="ek-tape">{teamTitle(team)}</p>
            <fieldset className="ek-shapes">
              <legend className="ek-sr">কোন ছকে খেলবে?</legend>
              {formationIds.map(id => <button type="button" key={id} aria-pressed={team.formation === id} onClick={() => update(changeFormation(team, id as FormationId))}>{formations[id].label}</button>)}
            </fieldset>
          </div>
          <div className="ek-pitch">
            <PitchLines />
            {team.players.map((id, slot) => {
              const where = spotOf(team, slot), player = playerById(id)!, isCaptain = team.captain === id;
              return (
                <button type="button" key={id} className="ek-token" data-line={where.line} data-captain={isCaptain || undefined} data-common={common.includes(id) || undefined}
                  style={{ "--x": `${where.x}%`, "--y": `${where.y}%` } as CSSProperties} aria-haspopup="dialog" onClick={() => open(slot)}
                  aria-label={`${bn(slot + 1)} নম্বর, ${lineLabels[where.line]}: ${player.name}${isCaptain ? ", অধিনায়ক" : ""}${common.includes(id) ? ", দুজনের দলেই" : ""}। বদলাতে ছুঁয়ে দাও`}>
                  <span className="ek-ring" aria-hidden="true">{bn(slot + 1)}{isCaptain && <b className="ek-band">C</b>}</span>
                  <span className="ek-name" aria-hidden="true">{player.short}</span>
                </button>
              );
            })}
            {friend && <p className="ek-stamp" aria-live="polite"><small>দুজনের মিল</small> {bn(common.length)}/{bn(SLOTS)}</p>}
          </div>
          <p className="ek-note"><b>কোচের নোট:</b> {line}</p>
        </div>
      </div>
      <p className="ek-hint">যাকে বদলাবে বা অধিনায়ক বানাবে, তার নাম ছুঁয়ে দাও।</p>

      <dialog ref={picker} className="ek-sheet" aria-labelledby="ek-sheet-title" onClose={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        {spot && current && active !== null && (
          <div className="ek-sheet-inner">
            <div className="ek-sheet-head">
              <div className="ek-sheet-top">
                <h2 id="ek-sheet-title"><em>{bn(active + 1)} নম্বরে</em> কে খেলবে? <small>{lineLabels[spot.line]}</small></h2>
                <button type="button" className="ek-close" onClick={() => picker.current?.close()}>বন্ধ করো</button>
              </div>
              <div className="ek-now">
                <p>এখন আছেন <b>{current.name}</b></p>
                <button type="button" className="ek-armband" aria-pressed={team.captain === current.id} onClick={() => makeCaptain(current.id)}>
                  <b aria-hidden="true">C</b>{team.captain === current.id ? "উনিই অধিনায়ক" : "অধিনায়ক বানাও"}
                </button>
              </div>
            </div>
            <ul className="ek-list">
              {choicesFor(spot.line).map((player, index, list) => {
                const slot = team.players.indexOf(player.id);
                return (
                  <li key={player.id}>
                    {list[index - 1]?.era !== player.era && <p className="ek-era">{eraLabels[player.era]}</p>}
                    <button type="button" aria-pressed={slot >= 0} onClick={() => choose(player.id)}>
                      <b>{player.name}</b>
                      <small>{player.nation}{player.line !== spot.line ? ` · আসলে ${lineLabels[player.line]}` : ""}</small>
                      {slot >= 0 && <span className="ek-on">{slot === active ? "এখানে" : `মাঠে ${bn(slot + 1)}`}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="ek-source"><b>সূত্র ও যাচাই:</b> নামের বানান প্রথম আলোর খেলার পাতা ধরে, পজিশন প্রত্যেকের উইকিপিডিয়া পাতা দেখে মিলিয়ে নেওয়া। মাঠে আছেন এমন কাউকে বাছলে দুজন জায়গা বদল করবেন। শুধু নাম, কোনো ছবি, জার্সি বা লোগো নেই।</p>
          </div>
        )}
      </dialog>

      <StickyNext show={!resultVisible && active === null} title={<><strong>একাদশ</strong> বোর্ডে উঠেছে</>} sub={line} href="#result" label="ছবিটা দেখো" />

      <section className="ek-result" id="result" ref={result} aria-labelledby="ek-result-title">
        <div className="ek-result-head">
          <h2 id="ek-result-title">{teamTitle(team)}, <em>অধিনায়ক {captain.short}</em></h2>
          <p>{line}</p>
        </div>
        <div className="ek-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ek-card-summary" />
            <figcaption id="ek-card-summary" className="ek-sr">{teamTitle(team)}, {formations[team.formation].label} ছকে: {lineupText(team)}। অধিনায়ক {captain.short}। {line} {friend ? `দুজনের মিল ${bn(common.length)}/${bn(SLOTS)}` : ""}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="ek-controls">
            <label className="ek-field">
              <span>তোমার নাম <small>দিলে বোর্ডের টেপে লেখা থাকবে</small></span>
              <input value={team.name} maxLength={MAX_NAME_LENGTH + 10} onChange={event => setTeam(current => ({ ...current, name: event.target.value }))} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="shopner-ekadosh.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption(team, friend)} state={state}
              hint="লিংক পেলে বন্ধু তোমার একাদশ দেখবে, নিজেরটা সাজালে দেখবে দুজনের কয়জন মিলল।" />
          </div>
        </div>

        <div className="ek-everyone">
          <h3>সবার ভোটে একাদশটা কেমন?</h3>
          {joined !== "done" ? <>
            <p>চাইলে তোমার এগারো জনকে সবার হিসাবে যোগ করো। নাম যাবে না, শুধু কোন খেলোয়াড় বেছেছ সেটা গোনা হবে।</p>
            <button type="button" className="kit-secondary" onClick={join} disabled={joined === "sending"}>{joined === "sending" ? "যোগ হচ্ছে…" : "আমার দলটাও গুনে নাও"}</button>
            {joined === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : everyone && everyone.total >= TALLY_MIN ? <>
            <p>{bn(everyone.total)} জনের দল মিলিয়ে, ৪-৩-৩ ছকে। তোমার দলেও যাঁরা আছেন, মোটা করে লেখা।</p>
            <dl className="ek-crowd">
              {crowdXI(everyone.counts).map(([where, ids]) => (
                <div key={where}><dt>{lineLabels[where]}</dt><dd>{ids.map(id => <span key={id} data-mine={team.players.includes(id) || undefined}>{playerById(id)!.short}</span>)}</dd></div>
              ))}
            </dl>
          </> : <p className="kit-status">যোগ হয়েছে! এখনো খুব কম মানুষ দল বানিয়েছে, তাই সবার একাদশটা এখনই বলা যাবে না। বন্ধুদের লিংক পাঠাও।</p>}
        </div>
      </section>
    </div>
  );
}
