"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { hiss, tone } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { ainLine, bn, cleanPara, defaultAin, groups, inOrder, matchCount, matchLine, parseShareHash, possessive, rules, shareHash, toggleRule, MAX_PARA_LENGTH, type Ain, type RuleId } from "../lib/ain";

const TOOL = "golir-ain";
// Below these, "৩টা পাড়া লিখেছে" reads as an empty room and percentages are noise.
const SOCIAL_PROOF_MIN = 50;
const COMPARE_MIN = 20;
// A piece of chalk touching the wall: a dry scratch and a tiny knock.
const chalk = () => { hiss(0.06, 0.09, 3800, "highpass"); tone(1500, 0.03, 0.04, "square"); };
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export function AinWall() {
  const [ticked, setTicked] = useState<RuleId[]>(defaultAin.ticked);
  const [paraInput, setParaInput] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Ain | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const ain = useMemo(() => ({ ticked, para: cleanPara(paraInput) }), [ticked, paraInput]);
  const state = shareHash(ain).slice(1);
  const line = ainLine(ticked);
  const match = matchLine(ticked, friend);
  const friendName = friend?.para ? `${possessive(friend.para)} গলির` : "তোমার বন্ধুর গলির";

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared wall replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("আমাদের পাড়ার আইন").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, ain, format, site, friend);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [ain, format, site, friend]);

  function toggle(id: RuleId) {
    if (!ticked.includes(id)) chalk();
    setTicked(current => toggleRule(current, id));
    setCompared(current => current === "done" ? "idle" : current);
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, ticked);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const ranked = compared === "done" && everyone ? inOrder(ticked).map(rule => ({ rule, share: percent(everyone.counts[rule.id] ?? 0, everyone.total) })).sort((a, b) => a.share - b.share) : [];
  const ours = ain.para ? `আমাদের ${possessive(ain.para)}` : "আমাদের";
  const caption = match
    ? `${match}! ${ours} গলির ক্রিকেটে ${bn(ticked.length)}টা আইন ছিল। তোমার গলিতে কী কী চলত?`
    : `${ours} গলির ক্রিকেটের ${bn(ticked.length)}টা আইন, দেয়ালে লিখে দিলাম। তোমার গলিতে কী কী চলত?`;

  return (
    <div className="ga">
      {friend && (
        <section className="ga-friend" aria-labelledby="ga-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} আইন: ${inOrder(friend.ticked).map(rule => rule.label).join(", ")}`} />
          <div>
            <p className="ga-kicker">তোমার জন্য একটা দেয়াল এসেছে</p>
            <h2 id="ga-friend-title">{friendName} ক্রিকেটে {bn(friend.ticked.length)}টা আইন ছিল।<br /><span>তোমার গলিতে কী ছিল?</span></h2>
            <a className="kit-primary" href="#ga-wall">আমার গলির আইন লিখি</a>
          </div>
        </section>
      )}

      <div className="ga-wall" id="ga-wall">
        <p className="ga-wall-title" aria-hidden="true">আমাদের পাড়ার আইন</p>
        <label className="ga-para">
          <span className="ga-sr">তোমার পাড়ার নাম, না দিলেও চলবে</span>
          <input value={paraInput} maxLength={MAX_PARA_LENGTH} onChange={event => setParaInput(event.target.value)} placeholder="পাড়ার নাম লেখো (না দিলেও চলবে)" autoComplete="off" enterKeyHint="done" />
        </label>
        <div className="ga-wall-body">
          {ticked.length ? (
            <ol className="ga-rules" data-many={ticked.length > 8} aria-label="দেয়ালে লেখা আইন">
              {inOrder(ticked).map(rule => <li key={rule.id} data-match={Boolean(friend?.ticked.includes(rule.id))}>{rule.label}</li>)}
            </ol>
          ) : <p className="ga-empty">দেয়ালটা এখনো ফাঁকা।</p>}
          <svg className="ga-stumps" viewBox="0 0 80 130" aria-hidden="true"><path d="M10 14 11 120M40 13v107M70 14l-1 106M6 8l30-1M44 7l30 2M-2 122l84-2" /></svg>
        </div>
        <p className="ga-line" aria-live="polite">{line}</p>
      </div>

      <div className="ga-hintrow">
        <p className="ga-hint">{friend ? <>তোমার গলিতে যেগুলো চলত, টিক দাও। <b>হলুদ দাগ</b> মানে ওদের গলিতেও ছিল।</> : "তোমার গলিতে যেগুলো চলত, টিক দাও। আবার চাপলে মুছে যাবে।"}</p>
        <SoundToggle compact />
      </div>
      {groups.map(group => (
        <fieldset className="ga-group" key={group.id}>
          <legend>{group.label}</legend>
          <div className="ga-chips">
            {rules.filter(rule => rule.group === group.id).map(rule => (
              <button type="button" key={rule.id} aria-pressed={ticked.includes(rule.id)} data-friend={Boolean(friend?.ticked.includes(rule.id))} onClick={() => toggle(rule.id)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13l5 5L20 6" /></svg>
                {rule.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      <StickyNext show={ticked.length > 0 && !resultVisible} title={<><strong>{bn(ticked.length)}টা</strong> আইন{friend ? ` · মিল ${bn(matchCount(ticked, friend.ticked))}টা` : ""}</>} sub={line} href="#result" label="পোস্টার দেখো" />

      <section className="ga-result" id="result" ref={result} aria-labelledby="ga-result-title">
        <div className="ga-result-head">
          <h2 id="ga-result-title">{ticked.length ? <>{ain.para ? possessive(ain.para) : "তোমার"} গলির <em>{bn(ticked.length)}টা</em> আইন, দেয়ালে লেখা</> : "দেয়ালে এখনো কোনো আইন নেই"}</h2>
          <p>{ticked.length ? match || "ছবিটা পোস্ট করো, দেখো বন্ধুরা কোন আইন নিয়ে তর্ক শুরু করে।" : "ওপর থেকে তোমার গলির অন্তত একটা আইনে টিক দাও।"}</p>
        </div>
        <div className="ga-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ga-card-summary" />
            <figcaption id="ga-card-summary" className="ga-sr">{ain.para ? `${possessive(ain.para)} ` : "আমাদের "}পাড়ার আইন: {inOrder(ticked).map(rule => rule.label).join(", ")}। {line}</figcaption>
            {previewError && <p className="kit-status" role="alert">পোস্টারের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="ga-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="golir-ain.png" makeImage={() => cardBlob(ain, format, site, friend)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} disabled={!ticked.length} hint={ticked.length ? "লিংক খুললে বন্ধু তোমার দেয়াল দেখবে, নিজের আইনে টিক দিলেই দেখবে কয়টা মেলে।" : ""} />
            {ticked.length > 0 && (
              <div className="ga-everyone">
                <h3>সব পাড়ার সাথে মেলাবে?</h3>
                {compared !== "done" || !everyone ? <>
                  <p>দেখো কোন আইনটা প্রায় সব গলিতে ছিল, আর কোনটা শুধু তোমাদের মতো অল্প কয়েকটায়। পাড়ার নাম যাবে না, শুধু টিকগুলো গোনা হবে।</p>
                  <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সব পাড়ার সাথে মেলাও"}</button>
                  {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                </> : everyone.total < COMPARE_MIN ? (
                  <p className="kit-status">মেলানো হলো! এখনো মাত্র {bn(everyone.total)}টা পাড়া লিখেছে, তাই হিসাবটা পরে বোঝা যাবে। বন্ধুদের লিংক পাঠাও।</p>
                ) : (
                  <div className="ga-rare">
                    <p><span>তোমাদের সবচেয়ে আলাদা আইন</span><strong>{ranked[0].rule.label}</strong><em>{bn(ranked[0].share)}% পাড়ায় ছিল</em></p>
                    {ranked.length > 1 && <p><span>প্রায় সব গলিতে যেটা ছিল</span><strong>{ranked.at(-1)!.rule.label}</strong><em>{bn(ranked.at(-1)!.share)}% পাড়ায় ছিল</em></p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="ga-proof">এখন পর্যন্ত <strong>{bn(everyone.total)}টা পাড়া</strong> নিজেদের আইন মিলিয়েছে</p>}
      </section>
    </div>
  );
}
