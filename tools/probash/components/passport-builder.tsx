"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, stampStyle, type CardContent } from "../lib/draw-card";
import { bn, chapterById, commonLine, defaultPicks, moments, packs, pageOrder, parseShareHash, passportLine, percentOf, possessive, shareHash, toggleMoment, whoLine, MAX_CITY_LENGTH, MAX_NAME_LENGTH, TOTAL, type MomentId, type PackId, type Passport } from "../lib/probash";

const TOOL = "probash";
// Below this, "৩ জন মিলিয়েছে" reads as an empty room rather than company.
const SOCIAL_PROOF_MIN = 50;
// "১০০% মানুষের আছে" after two votes is noise, not a finding.
const TALLY_MIN = 30;

function cardFor(passport: Passport, friend: Passport | null): CardContent {
  return { name: passport.name, city: passport.city, pack: passport.pack, picked: passport.picked, line: passportLine(passport.picked), match: commonLine(passport.picked, friend) };
}

export function PassportBuilder() {
  const [picked, setPicked] = useState<MomentId[]>(defaultPicks);
  const [pack, setPack] = useState<PackId | "">("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Passport | null>(null);
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [joined, setJoined] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const own: Passport = useMemo(() => ({ picked, pack, city, name }), [picked, pack, city, name]);
  const card = useMemo(() => cardFor(own, friend), [own, friend]);
  const state = shareHash(own).slice(1);
  const line = passportLine(picked);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared passport replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রাফির প্রবাস জীবন সিল").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, cardFor(friend, null), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function toggle(id: MomentId) {
    setPicked(current => toggleMoment(current, id));
    // Changed stamps make the old comparison stale; let them compare again.
    setJoined(current => current === "done" ? "idle" : current);
  }

  async function join() {
    setJoined("sending");
    // Only fixed moment ids are counted; city, name and pack never leave the link.
    const tally = await addToTally(TOOL, picked);
    if (tally) { setEveryone(tally); setJoined("done"); } else setJoined("failed");
  }

  const friendName = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const ranked = joined === "done" && everyone && everyone.total >= TALLY_MIN
    ? moments.filter(moment => picked.includes(moment.id)).map(moment => ({ moment, percent: percentOf(everyone.counts[moment.id] ?? 0, everyone.total) })).sort((a, b) => b.percent - a.percent)
    : [];
  const caption = card.match
    ? `${card.match}! আমার প্রবাস জীবনের পাসপোর্টে ${bn(TOTAL)}-এ ${bn(picked.length)}টা সিল। তোমার কয়টা?`
    : `আমার প্রবাস জীবনের পাসপোর্টে ${bn(TOTAL)}-এ ${bn(picked.length)}টা সিল! ${line} তোমার কয়টা?`;

  return (
    <div className="pb">
      {friend && (
        <section className="pb-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} প্রবাস জীবনের পাসপোর্ট`} />
          <div>
            <p className="pb-kicker">তোমার জন্য একটা পাসপোর্ট এসেছে</p>
            <h2 id="friend-title">{friendName} পাসপোর্টে {bn(TOTAL)}-এ <em>{bn(friend.picked.length)}টা</em> সিল।<br />তোমার কয়টা?</h2>
            <a className="kit-primary" href="#pb-pages">আমারটা মেলাই</a>
          </div>
        </section>
      )}

      <div className="pb-booklet">
        <div className="pb-cover">
          <p className="pb-cover-title"><span>প্রবাস জীবন</span><span className="pb-count" aria-live="polite">{bn(TOTAL)}-এ <strong>{bn(picked.length)}</strong></span></p>
          <fieldset className="pb-packs">
            <legend>প্রবাসে আছি</legend>
            {packs.map(option => <button type="button" key={option.id} aria-pressed={pack === option.id} onClick={() => setPack(current => current === option.id ? "" : option.id)}>{option.chip}</button>)}
          </fieldset>
        </div>

        <div className="pb-pages" id="pb-pages">
          {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="pb-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের পাসপোর্ট মিলিয়েছে</p>}
          {pageOrder(pack).map((chapter, index) => (
            <fieldset className="pb-page" key={chapter.id} data-mine={chapter.id === pack || undefined}>
              <legend><span>পাতা {bn(index + 1)}</span>{chapter.label}</legend>
              <div className="pb-stamps">
                {moments.filter(moment => moment.chapter === chapter.id).map(moment => {
                  const style = stampStyle(moment.id);
                  return (
                    <button type="button" key={moment.id} className="pb-stamp" data-shape={style.shape} style={{ "--ink": style.ink, "--tilt": `${style.tilt}deg` } as CSSProperties} aria-pressed={picked.includes(moment.id)} onClick={() => toggle(moment.id)}>
                      <small aria-hidden="true">— {chapterById(moment.chapter).stamp} —</small>
                      <span>{moment.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <StickyNext show={picked.length > 0 && !resultVisible} title={<><strong>{bn(TOTAL)}-এ {bn(picked.length)}টা</strong> সিল</>} sub={line} href="#result" label="পাসপোর্ট দেখো" />

      <section className="pb-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="pb-result-head">
          <h2 id="result-title">{picked.length ? <>তোমার পাসপোর্টে <em>{bn(TOTAL)}-এ {bn(picked.length)}টা</em> সিল</> : "পাসপোর্টের পাতা এখনো ফাঁকা"}</h2>
          <p>{picked.length ? line : "ওপরের পাতাগুলো থেকে যা যা তোমার জীবনে হয়েছে, ছুঁয়ে দাও।"}</p>
        </div>

        <div className="pb-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pb-card-summary" />
            <figcaption id="pb-card-summary" className="pb-sr">প্রবাস জীবন{whoLine(own) ? `, ${whoLine(own)}` : ""}: {bn(TOTAL)}-এ {bn(picked.length)}টা সিল। {moments.filter(moment => picked.includes(moment.id)).map(moment => moment.label).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">পাসপোর্টের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="pb-controls">
            <div className="pb-fields">
              <label className="pb-field">
                <span>নাম <small>না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <label className="pb-field">
                <span>কোন শহরে <small>না দিলেও চলবে</small></span>
                <input value={city} maxLength={MAX_CITY_LENGTH} onChange={event => setCity(event.target.value)} placeholder="যেমন: রিয়াদ" autoComplete="off" />
              </label>
            </div>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="probash-jibon.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} disabled={!picked.length} hint={picked.length ? "লিংক পেলে বন্ধু দেখবে তোমার পাসপোর্ট, আর নিজেরটা মেলাতে পারবে।" : ""} />
            <p className="pb-also">দেশে ফেরার দিন গুনছ? <a href="/deshe-fera">দেশে ফেরা</a>-তে লাগেজ ট্যাগ বানাও, বাড়ির সবাই রোজ দিন গুনবে।</p>
          </div>
        </div>

        {picked.length > 0 && (
          <div className="pb-everyone">
            <h3>সবার পাসপোর্টের সাথে মেলাবে?</h3>
            {joined !== "done" ? <>
              <p>দেখো কোন সিলটা প্রায় সবার আছে, আর কোনটা অল্প কয়েকজনের। শুধু সিলগুলো গোনা হবে; নাম, শহর বা ছবি যাবে না।</p>
              <button type="button" className="kit-secondary" onClick={join} disabled={joined === "sending"}>{joined === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {joined === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : !ranked.length ? (
              <p className="kit-status">যোগ হয়েছে! এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন মেলালেই মজাটা শুরু।</p>
            ) : <>
              <p>{bn(everyone!.total)} জনের পাসপোর্টের সাথে মেলানো হলো।</p>
              <div className="pb-rare">
                <p><span>সবচেয়ে বেশি জনের সাথে মিলেছে</span><strong>{ranked[0].moment.card}</strong><em>{bn(ranked[0].percent)}% মানুষের</em></p>
                {ranked.length > 1 && <p><span>তোমার সবচেয়ে বিরল সিল</span><strong>{ranked.at(-1)!.moment.card}</strong><em>{ranked.at(-1)!.percent < 30 ? "মাত্র " : ""}{bn(ranked.at(-1)!.percent)}% মানুষের</em></p>}
              </div>
              <ul className="pb-bars">{ranked.map(({ moment, percent }) => <li key={moment.id}><span>{moment.card}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>)}</ul>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
