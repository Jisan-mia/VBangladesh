"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  addDays, bn, cleanLetter, dateLabel, isDate, latestOpen, letterCaption, letterCard, letterState, localToday, objective, openChoices, openLabel, parseShared, recipient, recipients,
  relations, replies, replyCaption, replyCard, replyState, sections, MAX_NAME, MAX_TEXT, type CardView, type Lines, type RecipientId, type Reply, type Shared,
} from "../lib/chithi";
import { Envelope } from "./envelope";

const TOOL = "chithi";

/** Redraws a card canvas once the Bangla fonts are in. */
function useCard(canvas: RefObject<HTMLCanvasElement | null>, view: CardView | null, key: string, format: CardFormat, site: string) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!view) return;
    let cancelled = false;
    loadCardFonts("চিঠি লিখি").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, view, format, site);
      setFailed(false);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
    // key stands in for the view, which is rebuilt every render
  }, [key, format, site]); // eslint-disable-line react-hooks/exhaustive-deps
  return failed;
}

export function LetterBuilder() {
  const [today, setToday] = useState("");
  const [to, setTo] = useState<RecipientId>("amma");
  const [dear, setDear] = useState<string>(recipient("amma").dear);
  const [lines, setLines] = useState<Lines>([0, 0, 0]);
  const [text, setText] = useState("");
  const [from, setFrom] = useState("");
  const [open, setOpen] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [shared, setShared] = useState<Shared | null>(null);
  const [opened, setOpened] = useState(false);
  const [reply, setReply] = useState<Pick<Reply, "re" | "by">>({ re: "bhore", by: "ammu" });
  const preview = useRef<HTMLCanvasElement>(null);
  const replyCanvas = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const compose = useRef<HTMLElement>(null);
  const composeVisible = useInView(compose);

  useEffect(() => {
    const now = localToday(new Date());
    setToday(now);
    setSite(window.location.host);
    // In-page anchors (#result, #compose) also change the hash, so only a real shared letter replaces the one on screen.
    const read = () => { const found = parseShared(window.location.hash); if (found) { setShared(found); setOpened(false); } };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const who = recipient(to);
  const future = to === "future";
  const day = today || "2026-10-10";
  const letter = useMemo(() => cleanLetter({ to, dear, lines, text, from, open, written: today }), [to, dear, lines, text, from, open, today]);
  const state = letterState(letter);
  const view = letterCard(letter, day);
  const sealed = Boolean(view.seal);
  const choices = useMemo(() => openChoices(day), [day]);

  const sharedView = shared ? (shared.kind === "letter" ? letterCard(shared.letter, day) : replyCard(shared.reply)) : null;
  const replyTo = shared?.kind === "letter" && shared.letter.to !== "future" ? shared.letter : null;
  const replyFull: Reply | null = replyTo ? { ...reply, to: replyTo.from } : null;
  const replyView = replyFull ? replyCard(replyFull) : null;

  const previewError = useCard(preview, today ? view : null, `${state}|${day}`, format, site);
  const replyError = useCard(replyCanvas, opened ? replyView : null, replyFull ? `${replyState(replyFull)}|${opened}` : "", "feed", site);

  function pick(id: RecipientId) {
    setTo(id);
    setDear(recipient(id).dear);
    if (id === "future" && !open) setOpen(choices[1].date);
  }

  const cycle = (section: number) => setLines(current => current.map((index, at) => at === section ? (index + 1) % 3 : index) as Lines);

  const lineButton = (section: number) => {
    const index = lines[section];
    return (
      <button type="button" className="ch-line" onClick={() => cycle(section)}>
        <span key={`${to}${index}`} className="ch-ink">{who.lines[section][index]}</span>
        <span className="ch-cycle" aria-hidden="true">{bn(index + 1)}/৩</span>
        <span className="ch-sr">, {sections[section]}, চাপলে পরের লাইন</span>
      </button>
    );
  };

  return (
    <div className="ch">
      {shared && sharedView && (
        <section className="ch-arrived" aria-labelledby="ch-arrived-title">
          <p className="ch-kicker">{sharedView.seal ? "একটা আটকানো খাম" : shared.kind === "reply" ? "চিঠির উত্তর এসেছে" : "তোমার নামে একটা চিঠি এসেছে"}</p>
          <h2 id="ch-arrived-title">{sharedView.header}</h2>
          <Envelope key={JSON.stringify(shared)} view={sharedView} onOpen={() => setOpened(true)} />
          {(opened || sharedView.seal) && (
            <div className="ch-turn">
              <p><strong>এবার তোমার পালা।</strong> তুমিও কাউকে একটা চিঠি লেখো, অনেক দিন তো লেখা হয় না।</p>
              <a className={replyFull ? "kit-link" : "kit-primary"} href="#compose">আমিও একটা চিঠি লিখি</a>
            </div>
          )}
        </section>
      )}

      {opened && replyFull && replyView && (
        <section className="ch-reply" id="reply" aria-labelledby="ch-reply-title">
          <h2 id="ch-reply-title">{replyTo?.from ? objective(replyTo.from) : "ওকে"} উত্তর পাঠাও</h2>
          <fieldset className="kit-chips">
            <legend>কী লিখবে?</legend>
            {replies.map(item => <button type="button" key={item.id} aria-pressed={reply.re === item.id} onClick={() => setReply(current => ({ ...current, re: item.id }))}>{item.label}</button>)}
          </fieldset>
          <fieldset className="kit-chips">
            <legend>তুমি ওর কে?</legend>
            {relations.map(item => <button type="button" key={item.id} aria-pressed={reply.by === item.id} onClick={() => setReply(current => ({ ...current, by: item.id }))}>{item.label}</button>)}
          </fieldset>
          <figure className="kit-card">
            <canvas ref={replyCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${replyView.header}: ${replyView.sheet.body.join(" ")}`} />
            {replyError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <ShareBar tool={TOOL} fileName="chithi-uttor.png" makeImage={() => cardBlob(replyView, "feed", site)} imageKey={replyState(replyFull)} caption={replyCaption(replyFull)} state={replyState(replyFull)} hint="লিংকটা ওকেই পাঠাও। খুললে ও খামে তোমার উত্তর পাবে।" />
        </section>
      )}

      <section className="ch-compose" id="compose" ref={compose} aria-labelledby="ch-compose-title">
        <h2 id="ch-compose-title" className="ch-sr">চিঠি লেখো</h2>
        <fieldset className="ch-to">
          <legend>কাকে লিখবে?</legend>
          <div>{recipients.map(item => <button type="button" key={item.id} aria-pressed={to === item.id} onClick={() => pick(item.id)}>{item.label}</button>)}</div>
        </fieldset>

        <div className="ch-desk">
          <div className="ch-pad" data-future={future}>
            <p className="ch-date">{today ? dateLabel(today) : " "}</p>
            <p className="ch-greet">
              প্রিয় {future ? who.dear : <input className="ch-blank ch-dear" value={dear} maxLength={MAX_NAME} onChange={event => setDear(event.target.value)} onBlur={() => { if (!dear.trim()) setDear(who.dear); }} aria-label="কাকে লিখছ, নাম বা ডাকনাম" style={{ width: `${Math.max(2.5, [...dear].length * 0.6 + 0.4)}em` }} />},
            </p>
            {lineButton(0)}
            {lineButton(1)}
            <label className="ch-own">
              <span className="ch-sr">নিজের কথা, {bn(MAX_TEXT)} অক্ষরের মধ্যে</span>
              <textarea value={text} maxLength={MAX_TEXT} rows={2} onChange={event => setText(event.target.value)} placeholder="এখানে নিজের কথা লেখো…" />
            </label>
            {lineButton(2)}
            <p className="ch-sign">
              ইতি,<br />
              {who.sign} <input className="ch-blank ch-from" value={from} maxLength={MAX_NAME} onChange={event => setFrom(event.target.value)} placeholder={who.fallback === "আমি" ? "আমি (নাম)" : "তোমার নাম"} aria-label="তোমার নাম" autoComplete="nickname" />
            </p>
          </div>
          <p className="ch-hint">{text.length > MAX_TEXT - 40 ? `আর ${bn(Math.max(0, MAX_TEXT - text.length))} অক্ষর লেখা যাবে` : "লাইনে চাপ দিলে বদলাবে, প্রতিটায় তিনটা করে।"}</p>
        </div>

        {future && (
          <fieldset className="ch-when">
            <legend>খামটা কবে খুলবে?</legend>
            <div className="kit-chips">
              {choices.map(choice => <button type="button" key={choice.date} aria-pressed={open === choice.date} onClick={() => setOpen(choice.date)}>{choice.label}</button>)}
            </div>
            <label className="ch-when-date">
              <span>অথবা নিজে তারিখ দাও</span>
              <input type="date" value={open} min={addDays(day, 1)} max={latestOpen(day)} onChange={event => { if (isDate(event.target.value) && event.target.value > day) setOpen(event.target.value); }} />
            </label>
            <p className="ch-note">{open ? `${openLabel(open)}-এর আগে লিংক খুললে খাম বন্ধ থাকবে।` : ""} চমক, গোপন নয়: লেখাটা লিংকের ভেতরেই থাকে।</p>
          </fieldset>
        )}
      </section>

      <StickyNext show={Boolean(today) && !resultVisible && (!shared || composeVisible)} title={<><strong>চিঠি তৈরি?</strong></>} sub={future ? "খামটা আটকে রাখো" : `${objective(letter.dear)} পাঠাও`} href="#result" label={future ? "খাম আটকাও" : "খামে ভরো"} />

      <section className="ch-result" id="result" ref={result} aria-labelledby="ch-result-title">
        <h2 id="ch-result-title">{sealed ? "খামটা আটকানো হলো" : "চিঠিটা খামে ভরা হলো"}</h2>
        <p className="ch-result-line">{view.human}</p>
        <div className="ch-result-body">
          <figure className="kit-card ch-card" data-format={format} data-in={resultVisible}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ch-summary" />
            <figcaption id="ch-summary" className="ch-sr">{view.header}। {sealed ? `খাম আটকানো, খুলবে ${view.seal!.label}` : [view.sheet.greeting, ...view.sheet.body, view.sheet.signoff, view.sheet.signer].join(" ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="ch-share">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="chithi.png" makeImage={() => cardBlob(view, format, site)} imageKey={`${state}|${day}|${format}`} caption={letterCaption(letter, day)} state={state}
              hint={sealed ? "লিংকটা নিজের কাছে রেখে দাও। খোলার দিনের আগে খাম বন্ধ থাকবে। মনে রেখো, লেখাটা লিংকেই আছে।" : "যাকে লিখলে, লিংকটা তাকে পাঠাও। সে খামটা খুলে পুরো চিঠি পড়বে, চাইলে উত্তরও দেবে।"} />
            <p className="ch-note">লিংক যার কাছে যাবে, সে পুরো চিঠি পড়তে পারবে। ফেসবুকের প্রিভিউতে লেখাটা দেখায় না।</p>
          </div>
        </div>
      </section>
    </div>
  );
}
