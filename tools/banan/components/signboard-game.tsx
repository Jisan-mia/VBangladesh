"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, sfx, shake } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { badge, bn, compareLine, defaultSet, friendLine, humanLine, isRight, parseResult, possessive, resultHash, rightShare, scoreLine, scoreOf, setById, tallyItems, MAX_NAME_LENGTH, ROUNDS, type Pick, type Result } from "../lib/game";
import { wordSets, type SetId } from "../lib/words";

const TOOL = "banan";

export function SignboardGame() {
  const [setId, setSetId] = useState<SetId>("dokan");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [at, setAt] = useState(0);
  const [name, setName] = useState("");
  const [friend, setFriend] = useState<Result | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const firstPlate = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  const resultVisible = useInView(resultBox);

  const set = setById(setId)!;
  const loan = set.kind === "loan";
  const finished = at >= ROUNDS;
  const word = set.words[Math.min(at, ROUNDS - 1)];
  const picked = picks[at];
  const score = scoreOf(setId, picks);
  const result: Result = { set: setId, picks, name };
  const state = finished ? resultHash(result) : "";

  function start(id: SetId) {
    setSetId(id);
    setPicks([]);
    setAt(0);
    setCompared("idle");
  }

  useEffect(() => {
    // In-page anchors (#card, #board) also change the hash, so only a real shared result replaces the friend.
    const readFriend = () => {
      const shared = parseResult(window.location.hash);
      if (shared) { setFriend(shared); start(shared.set); }
      return shared;
    };
    if (!readFriend()) start(defaultSet(new Date()));
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  // A soft chime as the score appears; confetti only for a perfect 10.
  useEffect(() => {
    if (!finished || !moved.current) return;
    if (score === ROUNDS) { confetti(); sfx.win(); } else sfx.star(1);
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard and screen-reader users land on the next step, never back at the top.
  useEffect(() => {
    if (!moved.current) return;
    if (finished) document.getElementById("card")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    else if (picked === undefined) firstPlate.current?.focus({ preventScroll: true });
    else nextButton.current?.focus({ preventScroll: true });
  }, [at, picked, finished]);

  useEffect(() => {
    if (!finished && !friend) return;
    let cancelled = false;
    loadCardFonts("শুদ্ধ বানান ১০-এ ৮").then(() => {
      if (cancelled) return;
      if (finished && preview.current) drawCard(preview.current, { set: setId, picks, name }, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [finished, setId, picks, name, format, site, friend]);

  function pick(option: Pick, plate: Element) {
    moved.current = true;
    if (isRight(word, option)) sfx.good(); else { sfx.wrong(); shake(plate.closest(".banan-board")); }
    setPicks(current => current.length === at ? [...current, option] : current);
  }

  function advance() {
    moved.current = true;
    setAt(current => current + 1);
  }

  async function compare() {
    setCompared("sending");
    const tally = await addToTally(TOOL, tallyItems(result));
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const nextSet = wordSets[(wordSets.findIndex(item => item.id === setId) + 1) % wordSets.length];
  const caption = loan
    ? `খাঁটি বাংলা কী? রোজ বলা ১০টা ইংরেজি শব্দের বাংলায় আমি ${scoreLine(score)}টা পেরেছি। তুমি বলো তো?`
    : set.sober
    ? `একুশের ৭৫ বছর: ১০টা শব্দের শুদ্ধ বানান, আমি ${scoreLine(score)}টা পেরেছি। তুমিও খেলে দেখো।`
    : `শুদ্ধ বানান কোনটি? সাইনবোর্ডের বানানে আমি ${scoreLine(score)} পেয়েছি। তুমি কয়টা পারবে?`;
  const right = picked !== undefined && isRight(word, picked);

  return (
    <div className="banan" data-sober={set.sober ? "" : undefined}>
      {friend && (
        <section className="banan-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} বানানের কার্ড`} />
          <div>
            <p className="banan-kicker">একটা চ্যালেঞ্জ এসেছে</p>
            <h2 id="friend-title">{friendLine(friend)}<br /><span>একই ১০টা সাইনবোর্ড, এবার তোমার পালা</span></h2>
            <a className="kit-primary" href="#board">আমি খেলি</a>
          </div>
        </section>
      )}

      <div className="banan-stage" id="board">
        <div className="banan-meta">
          <span>{set.label}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="banan-count" aria-label={finished ? "সব শেষ" : `${bn(at + 1)} নম্বর, মোট ${bn(ROUNDS)}টা`}>{finished ? "শেষ" : `${bn(at + 1)}/${bn(ROUNDS)}`}</span>
            <SoundToggle compact />
          </span>
        </div>

        {finished ? (
          <div className="banan-board banan-done" data-tone="0">
            <span className="banan-bolts" aria-hidden="true" />
            <p className="banan-where">{loan ? "১০টা সাইনবোর্ড পড়া শেষ" : "সব সাইনবোর্ড ঠিক করা শেষ"}</p>
            <p className="banan-painted">{scoreLine(score)}</p>
            <p className="banan-rule">{humanLine(score, setId)}</p>
            <a className="banan-plate banan-plate-link" href="#card">কার্ডটা দেখো</a>
          </div>
        ) : (
          <div className="banan-board" data-tone={at % 4} data-picked={picked !== undefined} key={`${setId}-${at}`}>
            <span className="banan-bolts" aria-hidden="true" />
            <p className="banan-where">{word.where}</p>
            {word.loan && <p className="banan-loan"><span className="banan-sr">ইংরেজি শব্দ: </span>‘{word.loan}’</p>}
            {picked === undefined ? <>
              <p className="banan-ask" id="banan-ask">{loan ? "খাঁটি বাংলায় কোনটা? ট্যাপ করো" : "কোন বানানটা শুদ্ধ? ট্যাপ করো"}</p>
              <div className="banan-plates" role="group" aria-labelledby="banan-ask">
                {word.options.map((option, index) => <button type="button" key={option} ref={index === 0 ? firstPlate : undefined} className="banan-plate" onClick={event => pick(index as Pick, event.currentTarget)}>{option}</button>)}
              </div>
            </> : <>
              <p className="banan-verdict" data-right={right}>{right ? "একদম ঠিক!" : loan ? "প্রায়! খাঁটি বাংলায়:" : "প্রায়! শুদ্ধ বানানটা এই:"}</p>
              <p className="banan-painted banan-repaint">{word.options[word.right]}</p>
              {!right && <p className="banan-struck"><span className="banan-sr">তুমি বেছেছিলে </span><s>{word.options[picked]}</s></p>}
              <p className="banan-rule">{word.rule}</p>
            </>}
          </div>
        )}
        <p className="banan-sr" aria-live="polite">{picked !== undefined && !finished ? `${right ? "ঠিক" : "হয়নি"}। ${loan ? `${word.loan}-এর বাংলা` : "শুদ্ধ বানান"} ${word.options[word.right]}। ${word.rule}` : ""}</p>

        {!finished && picked !== undefined && <button type="button" ref={nextButton} className="kit-primary banan-next" onClick={advance}>{at === ROUNDS - 1 ? "স্কোর দেখো" : "পরের সাইনবোর্ড"}</button>}

        <ol className="banan-pips" aria-label="১০টা সাইনবোর্ডের হিসাব">
          {set.words.map((item, index) => {
            const done = picks[index] !== undefined;
            const status = done ? (isRight(item, picks[index]) ? "right" : "wrong") : index === at ? "now" : "";
            return <li key={item.id} data-state={status}><span className="banan-sr">{bn(index + 1)}: {status === "right" ? "ঠিক" : status === "wrong" ? "ভুল" : status === "now" ? "এখন" : "বাকি"}</span><span aria-hidden="true">{bn(index + 1)}</span></li>;
          })}
        </ol>

        <div className="kit-chips banan-sets" role="group" aria-label="অন্য সেট খেলো">
          {wordSets.map(item => <button type="button" key={item.id} aria-pressed={item.id === setId} onClick={() => { moved.current = false; start(item.id); }}>{item.label}</button>)}
        </div>
      </div>

      <StickyNext show={finished && !resultVisible} title={<><strong>{scoreLine(score)}</strong> · {badge(score, setId)}</>} sub={humanLine(score, setId)} href="#card" label="কার্ডটা দেখো" />

      {finished && (
        <section className="banan-result" id="card" ref={resultBox} aria-labelledby="card-title">
          <div className="banan-result-head">
            <p className="banan-kicker">{badge(score, setId)}</p>
            <h2 id="card-title">তোমার স্কোর <em>{scoreLine(score)}</em></h2>
            <p>{humanLine(score, setId)}{friend && friend.set === setId && <strong> {compareLine(score, friend)}</strong>}</p>
          </div>
          <div className="banan-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="banan-sr">{name || (loan ? "আমার বাংলা" : "আমার বানান")}: {scoreLine(score)}, {badge(score, setId)}। {humanLine(score, setId)} কার্ডে কোনো শব্দ নেই, শুধু ঠিক-ভুলের ১০টা ছোট সাইনবোর্ড।</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="banan-controls">
              <label className="banan-field">
                <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={loan ? "khanti-bangla.png" : "shuddho-banan.png"} makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="কার্ডে শব্দ থাকে না, তাই বন্ধু দেখে নকল করতে পারবে না। লিংক খুললে সে একই ১০টা পাবে।" />
            </div>
          </div>

          <section className="banan-review" aria-labelledby="review-title">
            <h3 id="review-title">{loan ? "১০টা শব্দ আরেকবার" : "১০টা বানান আরেকবার"}</h3>
            <ol>
              {set.words.map((item, index) => {
                const ok = isRight(item, picks[index]);
                const share = everyone ? rightShare(everyone.counts, item.id) : null;
                return <li key={item.id} data-right={ok}>
                  <p className="banan-review-word"><span aria-hidden="true">{ok ? "✓" : "✗"}</span><span className="banan-sr">{ok ? "ঠিক" : "ভুল"}: </span>{item.loan && <span className="banan-review-loan">{item.loan} =</span>}<strong>{item.options[item.right]}</strong>{!ok && <s>{item.options[picks[index]]}</s>}</p>
                  <p>{item.rule}</p>
                  {share !== null && <p className="banan-review-share">সবার মধ্যে {bn(share)}% ঠিক বেছেছে</p>}
                </li>;
              })}
            </ol>
            <div className="banan-compare">
              {compared === "done" ? <p className="kit-status">যোগ হয়েছে। নাম ছাড়া, শুধু কোন শব্দে ঠিক-ভুল সেটুকু।</p> : <>
                <button type="button" className="kit-secondary" onClick={compare} disabled={compared === "sending"}>{compared === "sending" ? "একটু দাঁড়াও…" : "সবার সাথে মেলাও"}</button>
                <p className="kit-status">{compared === "failed" ? "এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।" : "কোন শব্দে সবাই কতটা পারে, দেখাবে। নাম যায় না।"}</p>
              </>}
            </div>
          </section>

          <div className="banan-again">
            <button type="button" className="kit-primary" onClick={() => { start(nextSet.id); document.getElementById("board")?.scrollIntoView(); }}>আরেকটা সেট: {nextSet.label}</button>
            <button type="button" className="kit-link" onClick={() => { start(setId); document.getElementById("board")?.scrollIntoView(); }}>এই সেটটাই আবার খেলো</button>
          </div>
        </section>
      )}

      {loan ? <aside className="banan-source" aria-label="শব্দের সূত্র">
        <h2>বাংলা শব্দগুলো কোথা থেকে নেওয়া</h2>
        <p>প্রতিটা বাংলা শব্দ আর তার মানে বাংলা একাডেমির অভিধানভিত্তিক <a href="https://accessibledictionary.gov.bd/bengali-to-bengali/" rel="noopener" target="_blank">অভিগম্য অভিধান</a> মিলিয়ে যাচাই করা (অক্টোবর ২০২৬)। যেমন সেখানে ‘টিচার’-এর মানে লেখা আছে ‘শিক্ষক’।</p>
        <p className="banan-source-line">ইংরেজি শব্দেরই বাংলা রূপ (যেমন হাসপাতাল) বা কষ্ট করে বানানো শব্দ রাখিনি। ইংরেজি বলা ভুল না। এই সেটটা শুধু মনে করিয়ে দেয়, রোজকার শব্দগুলোর সুন্দর বাংলাও আছে।</p>
      </aside> : <aside className="banan-source" aria-label="বানানের সূত্র">
        <h2>বানানগুলো কোথা থেকে নেওয়া</h2>
        <p>প্রতিটা শুদ্ধ বানান বাংলা একাডেমির <em>প্রমিত বাংলা বানানের নিয়ম</em> (পরিমার্জিত সংস্করণ ২০১২) আর একাডেমির অভিধানভিত্তিক <a href="https://accessibledictionary.gov.bd/bengali-to-bengali/" rel="noopener" target="_blank">অভিগম্য অভিধান</a> মিলিয়ে যাচাই করা (অক্টোবর ২০২৬)।</p>
        <p className="banan-source-line">যেসব শব্দের দুটো বানানই অভিধানে আছে (যেমন দারিদ্র্য/দারিদ্র), আর যেগুলোর প্রমিত বানান সম্প্রতি বদলেছে, সেগুলো ইচ্ছা করে রাখিনি। কোনো বানানে ভুল পেলে পাতার নিচের বক্সে জানিও।</p>
      </aside>}
    </div>
  );
}
