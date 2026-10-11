"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { drawChampion, drawPoster, posterBlob } from "../lib/draw-poster";
import { drawings } from "../lib/drawings";
import { createGameInvitation, EQUIPMENT, findGames, parsePlayerCount, suggestGames, type Game } from "../lib/games";
import { bn, DEFAULT_TIME, gameById, headline, inviteCaption, inviteHash, MAX_NAME, MAX_PLACE, MAX_TIME, parseInvite, placeOf, SPACES, WHEN, type Invite, type Space, type WhenId } from "../lib/invite";
import { championKicker, championNames, championStats, championTitle, parseLudo, PIECES, RESUME_FOR, type Ludo } from "../lib/ludo";
import { LudoScore, savedSession } from "./ludo-score";

const TOOL = "cholo-kheli";
const placeIcons: Record<Space, string> = {
  seated: "M4 13 14 5l10 8M7 11v11h14V11M12 22v-6h4v6",
  courtyard: "M3 22h22M6 22V12l5-4 5 4v10M18 22v-5h5v5M9 15h4",
  field: "M2 22h24M9 22v-5M9 17c-5 0-5-7 0-7 0-5 7-5 7 0 4 0 4 7 0 7ZM21 17a2.5 2.5 0 1 0 .1 0",
};

export function GameArt({ game, className }: { game: Game; className?: string }) {
  const drawing = drawings[game.id];
  if (!drawing) return null;
  return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d={drawing.path} />
    {drawing.labels?.map(label => <text key={label.text + label.x} x={label.x} y={label.y + label.size * 0.35} fontSize={label.size} textAnchor="middle">{label.text}</text>)}
  </svg>;
}

export function InviteBuilder() {
  const [people, setPeople] = useState("৬");
  const [space, setSpace] = useState<Space>("field");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [when, setWhen] = useState<WhenId>("aj");
  const [time, setTime] = useState(DEFAULT_TIME);
  const [place, setPlace] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [friend, setFriend] = useState<Invite | null>(null);
  const [champion, setChampion] = useState<Ludo | null>(null);
  const [notice, setNotice] = useState("");
  // The sticky "দাওয়াত বানাও" waits for a first tap, so it never covers the suggestion on the first screen.
  const [touched, setTouched] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const championPreview = useRef<HTMLCanvasElement>(null);
  const inviteRef = useRef<HTMLElement>(null);
  const inviteVisible = useInView(inviteRef);
  const ludoRef = useRef<HTMLElement>(null);
  const ludoVisible = useInView(ludoRef);

  const players = parsePlayerCount(people);
  const matches = useMemo(() => players === null ? [] : suggestGames(findGames({ players, space, equipment }), space), [players, space, equipment]);
  const game = matches.find(item => item.id === selectedId) ?? matches[0];
  const invite = useMemo<Invite | null>(() => game && players !== null ? { game: game.id, players, space, when, time, place, name } : null, [game, players, space, when, time, place, name]);
  const state = invite ? inviteHash(invite).slice(1) : "";

  useEffect(() => {
    // A shared invitation reopens exactly: same game, count, place and time, ready to forward or change.
    const open = () => {
      const ludo = parseLudo(window.location.hash);
      if (ludo) { setChampion(ludo); playLudo(ludo.wins.length); return; }
      const shared = parseInvite(window.location.hash);
      const sharedGame = shared && gameById(shared.game);
      if (!shared || !sharedGame) return;
      setFriend(shared);
      setPeople(bn(shared.players));
      setSpace(shared.space);
      setEquipment([...sharedGame.equipment]);
      setSelectedId(shared.game);
      setWhen(shared.when);
      setTime(shared.time || DEFAULT_TIME);
      setPlace(shared.place);
    };
    open();
    // A family mid-way through its ludo games gets the scoreboard back after a reload.
    const saved = !window.location.hash && savedSession();
    if (saved && saved.history.length && Date.now() - saved.at < RESUME_FOR) playLudo(saved.players);
    setSite(window.location.host);
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("চলো খেলি আজ বিকেল").then(() => {
      if (cancelled) return;
      if (invite && game && preview.current) drawPoster(preview.current, invite, game, format, site);
      const friendGame = friend && gameById(friend.game);
      if (friend && friendGame && friendPreview.current) drawPoster(friendPreview.current, friend, friendGame, "feed", site);
      if (champion && championPreview.current) drawChampion(championPreview.current, champion, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [invite, game, format, site, friend, champion]);

  function playLudo(count: number) {
    setPeople(bn(count));
    setEquipment(current => current.includes("ludo") ? current : [...current, "ludo"]);
    setSelectedId("ludo");
  }

  function step(by: number) {
    const next = Math.min(16, Math.max(2, (players ?? 6) + by));
    setPeople(bn(next));
    setTouched(true);
  }

  function toggleItem(id: string) {
    // The board is only good for ludo, so ticking it means "we're playing ludo": go straight there, at most four players.
    if (id === "ludo" && !equipment.includes(id)) playLudo(Math.min(players ?? PIECES.length, PIECES.length));
    else setEquipment(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setTouched(true);
  }

  async function copyRules() {
    if (!game || !invite) return;
    try {
      await navigator.clipboard.writeText(createGameInvitation(game, invite.players, `${headline(invite)}, ${placeOf(invite)}`));
      setNotice("নিয়মসহ পুরো মেসেজ কপি হয়েছে। গ্রুপে পেস্ট করে দাও।");
    } catch {
      setNotice("কপি হলো না। ওপরের নিয়মগুলো চেপে ধরে নিজে কপি করে নাও।");
    }
  }

  const friendGame = friend && gameById(friend.game);
  const others = matches.filter(item => item.id !== game?.id);
  const isLudo = game?.id === "ludo";

  return (
    <div className="kheli">
      {champion && (
        <section className="kheli-friend" aria-labelledby="champion-title">
          <canvas ref={championPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`চ্যাম্পিয়নের কার্ড: ${championTitle(champion)}`} />
          <div>
            <p className="kheli-kicker">{championKicker(champion)}</p>
            <h2 id="champion-title">{championNames(champion)}!<br /><span>{championStats(champion)}</span></h2>
            <div className="kheli-friend-actions">
              <a className="kit-primary" href="#ludo">তোমাদের হিসাব রাখো</a>
              <a className="kit-link" href="#rules">লুডুর নিয়ম</a>
            </div>
          </div>
        </section>
      )}
      {friend && friendGame && (
        <section className="kheli-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`দাওয়াতের পোস্টার: ${headline(friend)} ${friendGame.title}`} />
          <div>
            <p className="kheli-kicker">{friend.name ? `${friend.name} তোমাকে খেলতে ডাকছে` : "তোমার জন্য খেলার দাওয়াত"}</p>
            <h2 id="friend-title">{headline(friend)} {friendGame.title}, {placeOf(friend)}।<br /><span>আসছ তো?</span></h2>
            <div className="kheli-friend-actions">
              <a className="kit-primary" href="#rules">নিয়মটা দেখে নাও</a>
              <a className="kit-link" href="#picker">নিজের দাওয়াত বানাও</a>
            </div>
          </div>
        </section>
      )}

      <div className="kheli-picker" id="picker">
        <div className="kheli-count">
          <label htmlFor="players" className="kheli-q">কয়জন?</label>
          <div className="kheli-stepper">
            <button type="button" onClick={() => step(-1)} disabled={players !== null && players <= 2} aria-label="একজন কমাও">−</button>
            <input id="players" inputMode="numeric" value={people} maxLength={4} onChange={event => setPeople(event.target.value)} aria-invalid={players === null} aria-describedby="players-hint" />
            <span aria-hidden="true">জন</span>
            <button type="button" onClick={() => step(1)} disabled={players !== null && players >= 16} aria-label="একজন বাড়াও">+</button>
          </div>
        </div>
        {players === null && <p id="players-hint" className="kheli-error">২ থেকে ১৬-এর মধ্যে একটা সংখ্যা লেখো।</p>}
        {players !== null && <p id="players-hint" className="screen-reader-only">২ থেকে ১৬ জন</p>}

        <fieldset className="kheli-places">
          <legend className="kheli-q">কোথায়?</legend>
          {SPACES.map(option => (
            <button type="button" key={option.id} aria-pressed={space === option.id} onClick={() => { setSpace(option.id); setTouched(true); }}>
              <svg viewBox="0 0 28 26" aria-hidden="true"><path d={placeIcons[option.id]} /></svg>
              <strong>{option.label}</strong><small>{option.detail}</small>
            </button>
          ))}
        </fieldset>

        <fieldset className="kit-chips kheli-gear">
          <legend className="kheli-q">হাতে কী আছে? <small>না থাকলেও চলবে</small></legend>
          {EQUIPMENT.map(item => <button type="button" key={item.id} aria-pressed={equipment.includes(item.id)} onClick={() => toggleItem(item.id)}>{item.label}</button>)}
        </fieldset>
      </div>

      {game && invite ? <>
        <article className="kheli-game" aria-labelledby="game-title">
          <p className="kheli-found" aria-live="polite">{bn(players ?? 0)} জনের জন্য {bn(matches.length)}টা খেলা মিলেছে</p>
          <div className="kheli-game-head">
            <GameArt game={game} className="kheli-art" />
            <div>
              <h2 id="game-title">{game.title}</h2>
              <p>{game.summary}</p>
              <p className="kheli-facts">{bn(game.minPlayers)}–{bn(game.maxPlayers)} জন{game.evenTeams ? " · সমান দুই দল" : ""} · {game.duration}</p>
            </div>
          </div>
          {others.length > 0 && (
            <div className="kit-chips kheli-others" role="group" aria-label="অন্য খেলা">
              <span>অন্য খেলা:</span>
              {others.map(item => <button type="button" key={item.id} onClick={() => { setSelectedId(item.id); setTouched(true); }}>{item.title}</button>)}
            </div>
          )}
        </article>

        {isLudo && players !== null && <section className="kheli-ludo" id="ludo" ref={ludoRef} aria-labelledby="ludo-title"><LudoScore players={players} site={site} /></section>}

        <StickyNext show={touched && !(isLudo ? ludoVisible : inviteVisible)} title={<><strong>{game.title}</strong> ঠিক হলো</>} sub={game.line} href={isLudo ? "#ludo" : "#invite"} label={isLudo ? "হিসাব রাখো" : "দাওয়াত বানাও"} />
      </> : (
        <div className="kheli-empty" role="status">
          <h2>{players === null ? "আগে লেখো কয়জন খেলবে" : "এই বাছাইয়ে কোনো খেলা মিলল না"}</h2>
          <p>{players === null ? "ওপরের ঘরে ২ থেকে ১৬-এর মধ্যে একটা সংখ্যা দাও।" : "জায়গা বদলে দেখো, বা হাতে থাকা জিনিসে টিক দাও। দল বড় হলে ছোট দলে ভাগ হয়ে, এক দলে কয়জন সেটা দিয়ে আবার খোঁজো।"}</p>
        </div>
      )}

      <section className="kheli-invite" id="invite" ref={inviteRef} aria-labelledby="invite-title">
        <h2 id="invite-title">দাওয়াতটা বানাও</h2>
        <p className="kheli-invite-lead">সময় আর জায়গা লিখে দাও, তারপর পাড়ার গ্রুপে বা পাশের বাসায় পাঠাও।</p>
        <div className="kheli-invite-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={invite && game ? `দাওয়াতের পোস্টার: ${headline(invite)} ${game.title}, ${placeOf(invite)}। ${game.line}` : "দাওয়াতের পোস্টার"} />
            {previewError && <p className="kit-status" role="alert">পোস্টারটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="kheli-controls">
            <fieldset className="kit-chips">
              <legend>কবে?</legend>
              {WHEN.map(item => <button type="button" key={item.id} aria-pressed={when === item.id} onClick={() => setWhen(item.id)}>{item.label}</button>)}
            </fieldset>
            <label className="kheli-field"><span>কখন?</span><input value={time} maxLength={MAX_TIME} onChange={event => setTime(event.target.value)} placeholder={DEFAULT_TIME} /></label>
            <label className="kheli-field"><span>কোথায়?</span><input value={place} maxLength={MAX_PLACE} onChange={event => setPlace(event.target.value)} placeholder={SPACES.find(option => option.id === space)!.place} /></label>
            <label className="kheli-field"><span>তোমার নাম <small>না দিলেও চলবে</small></span><input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" /></label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="cholo-kheli-dawat.png" makeImage={() => invite && game ? posterBlob(invite, game, format, site) : Promise.reject(new Error("no game"))} imageKey={`${state}|${format}`} caption={invite && game ? inviteCaption(invite, game) : ""} state={state} disabled={!invite} hint="লিংক খুললে বন্ধু এই দাওয়াতটাই দেখবে, সাথে খেলার নিয়ম।" />
            <button type="button" className="kit-link kheli-copy" onClick={copyRules} disabled={!invite}>নিয়মসহ পুরো মেসেজ কপি করো</button>
            {notice && <p className="kit-status" role="status">{notice}</p>}
          </div>
        </div>
      </section>

      {game && (
        <article className="kheli-rules" id="rules" aria-labelledby="rules-title">
          <h2 id="rules-title">{game.title}: খেলার নিয়ম</h2>
          <p className="kheli-variant"><strong>এখানে যেভাবে খেলবে:</strong> {game.variant}। <strong>যা লাগবে:</strong> {game.supplies}।</p>
          <ol>{game.rules.map((rule, index) => <li key={rule}><span aria-hidden="true">{bn(index + 1)}</span><p>{rule}</p></li>)}</ol>
          <div className="kheli-ending"><strong>শেষ হবে যেভাবে</strong><p>{game.ending}</p></div>
          <p className="kheli-care"><strong>খেয়াল রেখো</strong>{game.care}</p>
          {game.source && <p className="kheli-source"><a href={game.source.url} rel="external">{game.source.title} <span aria-hidden="true">↗</span></a> · এখানকার সহজ নিয়ম তোমার এলাকার সাথে না-ও মিলতে পারে।</p>}
        </article>
      )}
    </div>
  );
}
