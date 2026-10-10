"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { drawJersey, jerseyBlob, sizes, type Format } from "../lib/draw-jersey";
import { bn, caption, cleanName, defaultJersey, humanLine, isBlocked, kitById, kits, numberText, parseNumber, parseShareHash, possessive, quickNumbers, shareHash, sports, tallyItems, MAX_NAME, type Jersey, type KitId } from "../lib/jersey";

const TOOL = "amar-jersey";
// A "most made" line from a handful of people is noise.
const TALLY_MIN = 100;
const formats: Array<{ id: Format; label: string }> = [
  { id: "feed", label: "ফেসবুক পোস্ট" },
  { id: "story", label: "স্টোরি" },
  { id: "square", label: "প্রোফাইল ছবি" },
];

function topOf(tally: Tally, ids: readonly string[]) {
  return ids.reduce((best, id) => (tally.counts[id] ?? 0) > (tally.counts[best] ?? 0) ? id : best, ids[0]);
}

export function JerseyStall() {
  const [jersey, setJersey] = useState<Jersey>(defaultJersey);
  const [numberInput, setNumberInput] = useState("");
  const [gift, setGift] = useState(false);
  const [format, setFormat] = useState<Format>("feed");
  const [friend, setFriend] = useState<Jersey | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const stage = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLCanvasElement>(null);
  const friendCard = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const shown = useMemo<Jersey>(() => ({ ...jersey, from: gift ? jersey.from : "" }), [jersey, gift]);
  const name = cleanName(shown.name);
  const blocked = shown.name.trim() !== "" && isBlocked(shown.name);
  const fromBlocked = gift && shown.from.trim() !== "" && isBlocked(shown.from);
  const state = shareHash(shown).slice(1);
  const kit = kitById(shown.kit)!;
  const line = humanLine(shown.number);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared jersey counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`${shown.name} তোমার নাম ১০`).then(() => {
      if (cancelled) return;
      if (stage.current) drawJersey(stage.current, shown, "stage", site);
      if (card.current) drawJersey(card.current, shown, format, site);
      if (friend && friendCard.current) drawJersey(friendCard.current, friend, "square", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [shown, format, site, friend]);

  const update = (patch: Partial<Jersey>) => {
    setJersey(current => ({ ...current, ...patch }));
    // A changed jersey makes the old count stale.
    setCounted(current => current === "done" ? "idle" : current);
  };

  function pickNumber(raw: string) {
    setNumberInput(raw);
    const number = parseNumber(raw);
    if (number !== null) update({ number });
  }

  function takeGift() {
    if (!friend) return;
    setJersey({ ...friend, from: "" });
    setGift(false);
    document.getElementById("result")?.scrollIntoView({ behavior: "smooth" });
  }

  async function count() {
    setCounted("sending");
    const tally = await addToTally(TOOL, tallyItems(shown));
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const numberIds = Object.keys(everyone?.counts ?? {}).filter(id => id.startsWith("no-"));
  const popular = everyone && everyone.total >= TALLY_MIN && numberIds.length
    ? { number: Number(topOf(everyone, numberIds).slice(3)), kit: kitById(topOf(everyone, kits.map(item => item.id)))!.label }
    : null;
  const friendWho = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";

  return (
    <div className="jersey">
      {friend && (
        <section className="jersey-friend" aria-labelledby="friend-title">
          <canvas ref={friendCard} width={sizes.square.width} height={sizes.square.height} role="img" aria-label={`জার্সির পিঠে ${friend.name || "নাম ছাড়া"}, ${numberText(friend)} নম্বর`} />
          <div>
            {friend.from ? <>
              <p className="jersey-kicker">উপহার এসেছে</p>
              <h2 id="friend-title">{friend.from} তোমার জন্য একটা জার্সি বানিয়েছে!<br /><span>পিঠে {friend.name || "নাম"} · {numberText(friend)}</span></h2>
              <div className="jersey-friend-actions">
                <button type="button" className="kit-primary" onClick={takeGift}>জার্সিটা নিয়ে নাও</button>
                <a className="kit-link" href="#stall">এবার তোমার পালা: কাউকে বানিয়ে দাও</a>
              </div>
            </> : <>
              <p className="jersey-kicker">বন্ধুর জার্সি এসেছে</p>
              <h2 id="friend-title">{friendWho} পিঠে {numberText(friend)} নম্বর।<br /><span>এবার তোমার পালা!</span></h2>
              <a className="kit-primary" href="#stall">আমারটা বানাই</a>
            </>}
          </div>
        </section>
      )}

      <div className="stall" id="stall">
        <div className="stall-awning" aria-hidden="true" />
        <canvas ref={stage} className="stall-shirt" width={sizes.stage.width} height={sizes.stage.height} role="img" aria-label={`${kit.label} জার্সির পিঠে ${name || "তোমার নাম"}, ${numberText(shown)} নম্বর`} />
      </div>

      <div className="stall-controls">
        <label className="jersey-field">
          <span>পিঠে কী নাম লিখবে? <small>বাংলা বা ইংরেজিতে, {bn(MAX_NAME)} অক্ষরের মধ্যে</small></span>
          <input value={jersey.name} maxLength={MAX_NAME} onChange={event => update({ name: event.target.value })} placeholder="যেমন: রাফি বা RAFI" autoComplete="nickname" aria-invalid={blocked || undefined} aria-describedby="name-note" />
          <small id="name-note" className={blocked ? "jersey-warn" : "jersey-sr"} role={blocked ? "alert" : undefined}>{blocked ? "এই নামটা জার্সিতে ছাপানো যাবে না। অন্য নাম লেখো।" : ""}</small>
        </label>

        <fieldset className="jersey-kits">
          <legend>জার্সির রং <span>{kit.label}</span></legend>
          <div className="jersey-kits-row">
            {kits.map(item => (
              <button type="button" key={item.id} aria-pressed={item.id === shown.kit} aria-label={item.label} title={item.label} onClick={() => update({ kit: item.id as KitId })}
                style={{ "--body": item.body, "--sleeve": item.sleeve || item.body, "--stripe": "stripe" in item ? item.stripe : item.body, "--trim": item.trim } as CSSProperties}>
                <i data-stripes={"stripe" in item || undefined} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="kit-chips jersey-numbers">
          <legend>নম্বর</legend>
          {quickNumbers.map(number => <button type="button" key={number} aria-pressed={number === shown.number} onClick={() => { setNumberInput(""); update({ number }); }}>{numberText({ number, digits: shown.digits })}</button>)}
          <label className="jersey-number-input">
            <span className="jersey-sr">অন্য নম্বর, ০ থেকে ৯৯</span>
            <input value={numberInput} inputMode="numeric" maxLength={2} placeholder="অন্য" onChange={event => pickNumber(event.target.value)} aria-invalid={numberInput !== "" && parseNumber(numberInput) === null || undefined} />
          </label>
        </fieldset>

        <div className="jersey-pairs">
          <fieldset className="kit-chips">
            <legend>খেলা</legend>
            {sports.map(sport => <button type="button" key={sport.id} aria-pressed={shown.sport === sport.id} onClick={() => update({ sport: sport.id })}>{sport.label}</button>)}
          </fieldset>
          <fieldset className="kit-chips">
            <legend>নম্বরের অঙ্ক</legend>
            <button type="button" aria-pressed={shown.digits === "bn"} onClick={() => update({ digits: "bn" })} aria-label="বাংলা অঙ্ক">১২৩</button>
            <button type="button" aria-pressed={shown.digits === "en"} onClick={() => update({ digits: "en" })} aria-label="ইংরেজি অঙ্ক">123</button>
          </fieldset>
        </div>
      </div>

      <StickyNext show={Boolean(name) && !resultVisible} title={<><strong>{name || "তোমার নাম"} · {numberText(shown)}</strong></>} sub={line} href="#result" label="জার্সিটা নাও" />

      <section className="jersey-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="jersey-result-head">
          <h2 id="result-title">{name ? <><em>{possessive(name)}</em> জার্সি ছাপা হয়ে গেছে</> : "নামটা লিখলেই ছাপা হবে"}</h2>
          <p>{name ? line : "ওপরে পিঠের নামটা লেখো। রং আর নম্বর যখন খুশি বদলাও।"}</p>
        </div>

        <div className="jersey-result-body">
          <figure className="kit-card jersey-card" data-format={format}>
            <canvas ref={card} width={sizes[format].width} height={sizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="jersey-sr">{kit.label} জার্সি, পিঠে {name || "তোমার নাম"}, {numberText(shown)} নম্বর। {line}</figcaption>
            {previewError && <p className="kit-status" role="alert">জার্সির ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="jersey-controls">
            <fieldset className="kit-chips">
              <legend>কোথায় দেবে?</legend>
              {formats.map(item => <button type="button" key={item.id} aria-pressed={format === item.id} onClick={() => setFormat(item.id)}>{item.label}</button>)}
            </fieldset>
            {format === "square" && <p className="jersey-note">গোল করে কাটলেও নাম আর নম্বর পুরোটা দেখা যাবে।</p>}

            <div className="jersey-gift">
              <button type="button" className="jersey-gift-toggle" aria-pressed={gift} onClick={() => setGift(value => !value)}>
                <b aria-hidden="true" />বন্ধুর জন্য বানাচ্ছি
              </button>
              {gift && <label className="jersey-field">
                <span>তোমার নাম <small>ট্যাগে লেখা থাকবে, কে দিল</small></span>
                <input value={jersey.from} maxLength={MAX_NAME} onChange={event => update({ from: event.target.value })} placeholder="যেমন: তানিয়া" autoComplete="nickname" aria-invalid={fromBlocked || undefined} />
                {fromBlocked && <small className="jersey-warn" role="alert">এই নামটা ট্যাগে লেখা যাবে না।</small>}
              </label>}
            </div>

            <ShareBar tool={TOOL} fileName={`amar-jersey-${format}.png`} makeImage={() => jerseyBlob(shown, format, site)} imageKey={`${state}|${format}`} caption={caption(shown)} state={state} disabled={!name}
              hint={!name ? "আগে পিঠের নামটা লেখো।" : gift ? "লিংক খুললে বন্ধু দেখবে, তুমি ওর জন্য জার্সি বানিয়েছ।" : "লিংক পেলে বন্ধু তোমার জার্সি দেখবে, তারপর নিজেরটা বানাবে।"} />
          </div>
        </div>

        <div className="jersey-everyone">
          {popular && <p>সবচেয়ে বেশি বানানো: <strong>{bn(popular.number)} নম্বর</strong>, <strong>{popular.kit}</strong> <small>({bn(everyone!.total)} জনের গোনা)</small></p>}
          {name && (counted === "done"
            ? <p className="kit-status">গুনে নেওয়া হলো, ধন্যবাদ!</p>
            : <button type="button" className="kit-link" onClick={count} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার রং আর নম্বরটাও গুনে নাও"}</button>)}
          {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          {name && counted !== "done" && <p className="jersey-note">শুধু রং আর নম্বর গোনা হয়, নাম কখনো না।</p>}
        </div>
      </section>
    </div>
  );
}
