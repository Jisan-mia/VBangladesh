'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { addToTally, readTally, type Tally } from '../../../shared/share-client';
import { FormatToggle, ShareBar, StickyNext, useInView } from '../../../shared/share-kit';
import { bn, cardText, defaultCard, limitText, objectOf, objects, parseShareHash, selectCardObject, shareHash, MAX_WORD, type LanguageCard } from '../lib/cards';
import { districtName, divisions, isDistrictId } from '../lib/districts';
import { cardBlob, drawCard, objectImage } from '../lib/draw-card';
import { ObjectArt } from './object-art';

const TOOL = 'bhashar-chhobi';
// Below this many people, "৩ জেলার মানুষ" reads as an empty room rather than a country joining in.
const SOCIAL_PROOF_MIN = 30;
const districtCount = (tally: Tally) => Object.values(tally.counts).filter(count => count > 0).length;

export function CardBuilder() {
  const [draft, setDraft] = useState<LanguageCard>(defaultCard);
  const [touched, setTouched] = useState(false);
  const [format, setFormat] = useState<CardFormat>('feed');
  const [friend, setFriend] = useState<LanguageCard | null>(null);
  const [site, setSite] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const wordInput = useRef<HTMLInputElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  // Inputs keep what's typed; the card and link use the same cleaned values a friend will see.
  const state = shareHash(draft).slice(1);
  const card = useMemo(() => parseShareHash(state) ?? defaultCard, [state]);
  const text = useMemo(() => cardText(card, friend), [card, friend]);
  const object = objectOf(card.objectId);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card replaces the friend's.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      // Answer about the same picture the friend sent.
      setDraft(current => selectCardObject(current, shared.objectId));
    };
    readFriend();
    window.addEventListener('hashchange', readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener('hashchange', readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadCardFonts(text.word + text.place), objectImage(card.objectId), friend ? objectImage(friend.objectId) : null]).then(([, art, friendArt]) => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, text, format, site, art);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, cardText(friend), 'feed', site, friendArt);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, text, format, site, friend]);

  function update(change: (current: LanguageCard) => LanguageCard) {
    setDraft(change);
    setTouched(true);
    setCounted(current => current === 'done' ? 'idle' : current);
  }

  function answerFriend() {
    if (!friend) return;
    update(current => selectCardObject(current, friend.objectId));
    wordInput.current?.focus();
    wordInput.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function countDistrict() {
    if (!card.district) return;
    setCounted('sending');
    const tally = await addToTally(TOOL, [card.district]);
    if (tally) { setEveryone(tally); setCounted('done'); }
    else setCounted('failed');
  }

  const friendText = friend ? cardText(friend) : null;
  const caption = card.district ? `${districtName(card.district)} জেলায় আমরা ${object.name}কে বলি “${text.word}”। তোমাদের ওখানে কী বলে?` : `আমাদের এলাকায় ${object.name}কে বলে “${text.word}”। তোমাদের ওখানে কী বলে?`;

  return (
    <div className="bc">
      {friend && friendText && (
        <section className="bc-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendText.kicker}: ${friendText.word}`} />
          <div>
            <p className="bc-kicker">বন্ধু একটা শব্দ পাঠিয়েছে</p>
            <h2 id="friend-title">{friendText.place} {objectOf(friend.objectId).name}কে বলে “{friendText.word}”।<br /><span>তোমাদের ওখানে কী বলে?</span></h2>
            <button type="button" className="kit-primary" onClick={answerFriend}>আমাদেরটা লিখি</button>
          </div>
        </section>
      )}

      {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="bc-proof">এখন পর্যন্ত <strong>{bn(districtCount(everyone))} জেলার</strong> মানুষ নিজের শব্দে কার্ড বানিয়েছে</p>}

      <div className="bc-maker">
        <fieldset className="bc-objects">
          <legend>কোন জিনিসটা?</legend>
          {objects.map(item => (
            <button type="button" key={item.id} aria-pressed={card.objectId === item.id} onClick={() => update(current => selectCardObject(current, item.id))}>
              <svg data-art={item.id} viewBox="0 0 320 320" aria-hidden="true"><ObjectArt object={item.id} /></svg>
              <span>{item.name}</span>
            </button>
          ))}
        </fieldset>

        <div className="bc-fields">
          <label className="bc-label" htmlFor="bc-word">তোমাদের এলাকায় এটাকে কী বলে?</label>
          <input id="bc-word" ref={wordInput} value={draft.word} onChange={event => update(current => ({ ...current, word: limitText(event.target.value, MAX_WORD) }))} placeholder={`${object.name}, নাকি অন্য নামে ডাকো?`} autoComplete="off" enterKeyHint="done" />
          <label className="bc-label" htmlFor="bc-district">তোমার জেলা</label>
          <select id="bc-district" value={draft.district} onChange={event => { const value = event.target.value; update(current => ({ ...current, district: isDistrictId(value) ? value : '' })); }}>
            <option value="">জেলা বেছে নাও</option>
            {divisions.map(division => (
              <optgroup key={division.name} label={`${division.name} বিভাগ`}>
                {division.districts.map(district => <option key={district.id} value={district.id}>{district.name}</option>)}
              </optgroup>
            ))}
          </select>
          <p className="bc-note">ঠিক-ভুলের বিচার নেই। তুমি যা বলো, সেটাই লেখো।</p>
        </div>
      </div>

      <StickyNext show={touched && !resultVisible} title={<strong>“{text.word}”</strong>} sub={text.kicker} href="#result" label="কার্ডটা দেখো" />

      <section className="bc-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="bc-result-head">
          <h2 id="result-title">{text.place} এটাকে বলে <em>“{text.word}”</em></h2>
          <p>{text.line}</p>
        </div>
        <div className="bc-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bc-card-summary" />
            <figcaption id="bc-card-summary" className="bc-sr">{text.kicker}: {text.word}।{text.bookName ? ` বইয়ের ভাষায়: ${text.bookName}।` : ''} {text.match}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="bc-result-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="amader-bhasha.png" makeImage={() => cardBlob(card, text, format, site)} imageKey={`${state}|${format}|${text.match}`} caption={caption} state={state} hint="লিংক পাঠালে বন্ধু ওদের এলাকার নামটা লিখে জবাব দিতে পারবে।" />
            {card.district && (
              <div className="bc-count">
                <h3>{districtName(card.district)} জেলাটাও গোনা হোক?</h3>
                {counted === 'done' && everyone ? (
                  <p role="status">যোগ হয়েছে! {everyone.total >= SOCIAL_PROOF_MIN ? `এখন পর্যন্ত ${bn(districtCount(everyone))} জেলার মানুষ নিজের শব্দে কার্ড বানিয়েছে।` : 'আরও কয়েকজন যোগ হলে দেখাব কয় জেলা থেকে কার্ড এল।'}</p>
                ) : <>
                  <p>শুধু জেলার নামটা গোনা হবে, যাতে দেখা যায় কয় জেলার মানুষ কার্ড বানাল। তোমার লেখা শব্দ এর সাথে যায় না।</p>
                  <button type="button" className="kit-secondary" onClick={countDistrict} disabled={counted === 'sending'}>{counted === 'sending' ? 'যোগ হচ্ছে…' : 'আমার জেলা যোগ করো'}</button>
                  {counted === 'failed' && <p className="kit-status" role="alert">এখন যোগ করা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                </>}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
