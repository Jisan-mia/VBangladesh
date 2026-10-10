"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, type CardContent } from "../lib/draw-card";
import { bn, catById, categories, cleanTitle, commonLine, defaults, describe, headline, parseShareHash, placePick, possessive, resolveTyped, samePick, shareHash, sharedPicks, shelfLine, tallyId, MAX_NAME_LENGTH, MAX_TITLE_LENGTH, SLOTS, type CatId, type Choice, type Shelf as ShelfState } from "../lib/shelf";
import { Shelf } from "./shelf";

const TOOL = "char-priyo";
// "৬০% মানুষের তাকে আছে" after three votes is noise; wait for a real crowd per list.
const TALLY_MIN = 20;

function cardFor(shelf: ShelfState, friend: ShelfState | null): CardContent {
  return { cat: shelf.cat, name: shelf.name, picks: shelf.picks, line: shelfLine(shelf.cat, shelf.picks), match: commonLine(shelf, friend) };
}

export function ShelfBuilder() {
  const [cat, setCat] = useState<CatId>("natok");
  const [picksByCat, setPicksByCat] = useState<Record<CatId, Choice[]>>(defaults);
  const [active, setActive] = useState(0);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<ShelfState | null>(null);
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [joined, setJoined] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const picks = picksByCat[cat];
  const category = catById(cat);
  const own: ShelfState = useMemo(() => ({ cat, picks, name }), [cat, picks, name]);
  const card = useMemo(() => cardFor(own, friend), [own, friend]);
  const state = shareHash(own).slice(1);
  const now = describe(cat, picks[active]);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared shelf replaces the friend.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (shared) { setFriend(shared); setCat(shared.cat); setActive(0); }
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রাফির চার প্রিয় নাটক").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site]);

  function changed() { setJoined(current => current === "done" ? "idle" : current); }

  function chooseCategory(id: CatId) {
    setCat(id);
    setActive(0);
    changed();
  }

  function place(pick: Choice) {
    setPicksByCat(all => ({ ...all, [cat]: placePick(all[cat], active, pick) }));
    setActive(slot => (slot + 1) % SLOTS);
    changed();
  }

  function submitTyped(event: FormEvent) {
    event.preventDefault();
    const pick = resolveTyped(cat, draft);
    if (pick === null) return;
    place(pick);
    setDraft("");
  }

  async function join() {
    setJoined("sending");
    // Only the list id and curated item ids are counted; typed titles and the name never leave the link.
    const ids = picks.filter((pick): pick is number => typeof pick === "number").map(pick => tallyId(cat, pick));
    const tally = await addToTally(TOOL, [cat, ...ids]);
    if (tally) { setEveryone(tally); setJoined("done"); } else setJoined("failed");
  }

  const voters = everyone?.counts[cat] ?? 0;
  const ranked = everyone && voters >= TALLY_MIN
    ? category.items.map((item, index) => ({ item, index, percent: Math.round(((everyone.counts[tallyId(cat, index)] ?? 0) / voters) * 100) })).sort((a, b) => b.percent - a.percent).slice(0, 5)
    : [];
  const friendName = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const sameList = friend?.cat === cat;
  const both = sharedPicks(own, friend);
  const titles = picks.map(pick => describe(cat, pick).title);
  const caption = card.match
    ? `${card.match}! ${headline(own)}: ${titles.join(", ")}। তোমার চারটা কী?`
    : `${headline(own)}: ${titles.join(", ")}। তোমার চারটা কী?`;

  return (
    <div className="cp">
      {friend && (
        <section className="cp-friend" aria-labelledby="friend-title">
          <div className="cp-friend-shelf" aria-hidden="true"><Shelf cat={friend.cat} picks={friend.picks} shared={sameList ? both : undefined} small /></div>
          <div>
            <p className="cp-kicker">তোমার জন্য একটা তাক এসেছে</p>
            <h2 id="friend-title">{friendName} চার প্রিয় {catById(friend.cat).label}<br /><span>তোমার চারটা কী?</span></h2>
            <ol className="cp-friend-list">
              {friend.picks.map(pick => { const item = describe(friend.cat, pick); const mine = sameList && both.some(other => samePick(other, pick)); return <li key={String(pick)}>{item.title}{mine && <b>দুজনেরই</b>}</li>; })}
            </ol>
            <a className="kit-primary" href="#cp-shelf">আমার তাক সাজাই</a>
          </div>
        </section>
      )}

      <div className="cp-pick">
        <div className="cp-stage" id="cp-shelf">
          <fieldset className="cp-cats">
            <legend className="cp-sr">কোন তাক সাজাবে?</legend>
            {categories.map(item => <button type="button" key={item.id} aria-pressed={cat === item.id} onClick={() => chooseCategory(item.id)}>{item.label}</button>)}
          </fieldset>
          <Shelf cat={cat} picks={picks} active={active} onPick={slot => setActive(slot)} />
          <p className="cp-now" aria-live="polite"><b>{bn(active + 1)} নম্বরে:</b> {now.title}{now.by && <small> · {now.by}</small>}</p>
        </div>

        <div className="cp-picker">
          <h2 className="cp-picker-title">তাকের <em>{bn(active + 1)} নম্বরে</em> কোন {category.label}?</h2>
          <p className="cp-hint">যেটা বদলাবে, তাকে সেটা ছুঁয়ে দাও। তারপর এখান থেকে বেছে নাও।</p>
          <div className="cp-items">
            {category.items.map((item, index) => {
              const slot = picks.findIndex(pick => pick === index);
              return (
                <button type="button" key={index} aria-pressed={slot >= 0} onClick={() => place(index)}>
                  <b>{item.title}</b><small>{item.by}</small>
                  {slot >= 0 && <span className="cp-slot" aria-label={`তাকের ${bn(slot + 1)} নম্বরে আছে`}>{bn(slot + 1)}</span>}
                </button>
              );
            })}
          </div>
          <form className="cp-typed" onSubmit={submitTyped}>
            <label htmlFor="cp-typed">তালিকায় নেই? নিজে লেখো <small>{bn(MAX_TITLE_LENGTH)} অক্ষরের মধ্যে</small></label>
            <div>
              <input id="cp-typed" value={draft} maxLength={MAX_TITLE_LENGTH + 10} onChange={event => setDraft(event.target.value)} placeholder={`যেমন: পছন্দের ${category.of} নাম`} autoComplete="off" />
              <button type="submit" className="kit-secondary" disabled={!cleanTitle(draft)}>তাকে রাখো</button>
            </div>
          </form>
          <p className="cp-source"><b>সূত্র:</b> বাংলা উইকিপিডিয়া। তালিকার সব নাম আর বানান সেখানকার পাতা দেখে মিলিয়ে নেওয়া। নামের পাশে নাটকে লেখক বা পরিচালক, সিনেমায় পরিচালক, বইয়ে লেখক, গানে শিল্পী বা গীতিকার। ভুল চোখে পড়লে পাতার নিচের বক্সে জানাও।</p>
        </div>
      </div>

      <StickyNext show={!resultVisible} title={<><strong>চারটা</strong> তাকে উঠেছে</>} sub={card.line} href="#result" label="কার্ডটা দেখো" />

      <section className="cp-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="cp-result-head">
          <h2 id="result-title">{headline(own, "তোমার")}</h2>
          <p>{card.line}</p>
        </div>
        <div className="cp-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cp-card-summary" />
            <figcaption id="cp-card-summary" className="cp-sr">{headline(own)}: {titles.join(", ")}। {card.line} {card.match}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="cp-controls">
            <label className="cp-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="char-priyo.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} hint="লিংক পেলে বন্ধু দেখবে তোমার তাক, আর পাশে নিজেরটা সাজাতে পারবে।" />
          </div>
        </div>

        <div className="cp-everyone">
          <h3>সবার তাকে কোন {category.label} বেশি?</h3>
          {joined !== "done" ? <>
            <p>তোমার তাকের তালিকার {category.label}গুলো সবার হিসাবে যোগ হবে। নিজে লেখা নাম আর তোমার নাম যাবে না, শুধু গোনা হবে।</p>
            <button type="button" className="kit-secondary" onClick={join} disabled={joined === "sending"}>{joined === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {joined === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : ranked.length ? <>
            <p>{bn(voters)} জনের {category.of} তাকের সাথে মেলানো হলো।</p>
            <ul className="cp-bars">{ranked.map(({ item, index, percent }) => <li key={index} data-mine={picks.includes(index) || undefined}><span>{item.title}</span><i style={{ width: `${Math.max(percent, 2)}%` }} /><b>{bn(percent)}%</b></li>)}</ul>
          </> : <p className="kit-status">যোগ হয়েছে! এখনো খুব কম মানুষ এই তাক সাজিয়েছে, তাই কোনটা এগিয়ে সেটা এখনই বলা যাবে না। বন্ধুদের লিংক পাঠাও।</p>}
        </div>
      </section>
    </div>
  );
}
