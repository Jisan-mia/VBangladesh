"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { banglaAmount, englishAmount, figures, formatTyping, parseAmount } from "../lib/number-words";
import { DEFAULT_PRIMER, caption, humanLine, parseShareHash, quickAmounts, shareHash, type Primer } from "../lib/primer";

const TOOL = "taka-kothay";
const fieldText = (primer: Primer) => figures(primer.amount);
/** Digits and the dot are what the caret should stay between; commas come and go. */
const countKept = (text: string) => (text.match(/[0-9০-৯.]/g) ?? []).length;

function CopyLine({ label, text, lang, children }: { label: string; text: string; lang?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState<"" | "done" | "failed">("");
  const box = useRef<HTMLParagraphElement>(null);
  useEffect(() => setCopied(""), [text]);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied("done"); }
    catch {
      // Old in-app browsers refuse the clipboard; select the line so a long-press copies it.
      const range = document.createRange();
      if (box.current) { range.selectNodeContents(box.current); window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range); }
      setCopied("failed");
    }
  }
  return <div className="tk-line">
    <div className="tk-line-head"><span>{label}</span>{children}</div>
    <p ref={box} key={text} lang={lang} className="tk-words">{text}</p>
    <div className="tk-line-foot">
      <button type="button" className="kit-secondary tk-copy" onClick={copy}>{copied === "done" ? "কপি হয়েছে ✓" : "কপি করো"}</button>
      <span className="tk-copy-status" role="status" aria-live="polite">{copied === "failed" ? "লেখাটা বাছাই করা আছে, চেপে ধরে কপি করো।" : ""}</span>
    </div>
  </div>;
}

export function PrimerBuilder() {
  const [primer, setPrimer] = useState<Primer>(DEFAULT_PRIMER);
  const [field, setField] = useState(fieldText(DEFAULT_PRIMER));
  const [friend, setFriend] = useState<Primer | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const parsed = useMemo(() => parseAmount(field), [field]);
  const ready = parsed.ok;
  const state = shareHash(primer).slice(1);
  const bangla = banglaAmount(primer.amount, { formal: primer.formal });
  const english = englishAmount(primer.amount, { international: primer.international });

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared amount opens a card.
    const readLink = () => {
      const link = parseShareHash(window.location.hash);
      if (!link) return;
      setFriend(link); setPrimer(link); setField(fieldText(link));
    };
    readLink();
    setSite(window.location.host);
    window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("বারো লাখ চৌত্রিশ হাজার").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, primer, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [primer, format, site]);

  // Put the caret back after the same number of digits, so lakh commas appearing mid-number don't throw it to the end.
  useLayoutEffect(() => {
    const element = input.current;
    if (caret.current === null || !element || document.activeElement !== element) return;
    let kept = 0, position = 0;
    while (position < field.length && kept < caret.current) { if (/[0-9০-৯.]/.test(field[position])) kept++; position++; }
    element.setSelectionRange(position, position);
    caret.current = null;
  }, [field]);

  function type(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    caret.current = countKept(raw.slice(0, event.target.selectionStart ?? raw.length));
    const next = formatTyping(raw);
    setField(next);
    const read = parseAmount(next);
    if (read.ok) setPrimer(current => ({ ...current, amount: read.amount }));
  }

  function pickQuick(taka: number) {
    const next = { ...primer, amount: { taka, paisa: 0 } };
    setPrimer(next);
    setField(fieldText(next));
  }

  const problem = !parsed.ok && (parsed.reason === "too-big" ? "৯৯৯ কোটির বেশি অঙ্ক এখানে লেখা যায় না। ছোট করে লেখো।" : parsed.reason === "empty" ? "ওপরে একটা অঙ্ক লেখো, এখানে কথায় দেখাবে।" : "শুধু অঙ্ক লেখো, যেমন ৫০,০০০ বা ১২৫০.৫০");

  return (
    <div className="tk">
      {friend && <p className="tk-friend" role="status">
        <span>বন্ধু পাঠিয়েছে: <b>{figures(friend.amount)}</b> টাকা কথায় কী হয়।</span>
        <strong>উত্তর নিচে। এবার তোমার অঙ্কটা লিখে দেখো!</strong>
      </p>}

      <div className="tk-page">
        <label className="tk-field" htmlFor="tk-amount">
          <span>টাকার অঙ্ক লেখো <small>বাংলা বা ইংরেজি সংখ্যায়, পয়সা চাইলে দশমিকের পরে</small></span>
        </label>
        <div className="tk-input">
          <span aria-hidden="true">৳</span>
          <input id="tk-amount" ref={input} value={field} onChange={type} onFocus={event => event.currentTarget.select()} inputMode="decimal" autoComplete="off" enterKeyHint="done" maxLength={24} aria-describedby="tk-problem" aria-invalid={!ready} />
        </div>
        <div className="tk-quick" role="group" aria-label="চটজলদি অঙ্ক">
          {quickAmounts.map(taka => <button type="button" key={taka} aria-pressed={ready && primer.amount.taka === taka && primer.amount.paisa === 0} onClick={() => pickQuick(taka)}>{figures({ taka, paisa: 0 })}</button>)}
        </div>

        <div className="tk-answer" aria-live="polite">
          {problem ? <p id="tk-problem" className="tk-problem">{problem}</p> : <>
            <CopyLine label="বাংলায়" text={bangla}>
              <span className="tk-mini" role="group" aria-label="বাংলায় কোন রীতি">
                <button type="button" aria-pressed={!primer.formal} onClick={() => setPrimer(current => ({ ...current, formal: false }))}>লাখ · শো</button>
                <button type="button" aria-pressed={primer.formal} onClick={() => setPrimer(current => ({ ...current, formal: true }))}>লক্ষ · শত</button>
              </span>
            </CopyLine>
            <CopyLine label={`ইংরেজিতে · Tk ${figures(primer.amount, { bangla: false, international: primer.international })}`} text={english} lang="en">
              <span className="tk-mini" role="group" aria-label="ইংরেজিতে কোন রীতি">
                <button type="button" aria-pressed={!primer.international} onClick={() => setPrimer(current => ({ ...current, international: false }))}>Lakh</button>
                <button type="button" aria-pressed={primer.international} onClick={() => setPrimer(current => ({ ...current, international: true }))}>Million</button>
              </span>
            </CopyLine>
          </>}
        </div>
        <p className="tk-check">চেকে লেখার আগে আরেকবার মিলিয়ে নাও। অঙ্ক আর কথা না মিললে ব্যাংক চেক ফেরত দেয়।</p>
      </div>

      <StickyNext show={ready && !resultVisible} title={<><strong>{figures(primer.amount)}</strong> টাকা</>} sub={humanLine(primer)} href="#result" label="কার্ডটা দেখো" />

      <section className="tk-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">ধারাপাতের পাতায় তোমার অঙ্ক</h2>
        <p className="tk-result-note">{humanLine(primer)}</p>
        <div className="tk-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`${figures(primer.amount)} = ${bangla}`} />
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="tk-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="taka-kothay.png" makeImage={() => cardBlob(primer, format, site)} imageKey={`${state}|${format}`} caption={caption(primer)} state={state} disabled={!ready} hint="লিংক পেলে বন্ধু এই অঙ্কটাই কথায় দেখবে, তারপর নিজেরটা লিখবে।" />
          </div>
        </div>
      </section>
    </div>
  );
}
