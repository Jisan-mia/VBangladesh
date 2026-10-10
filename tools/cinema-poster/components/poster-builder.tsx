"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { FormatToggle, PhotoPicker, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { drawPoster, posterBlob } from "../lib/draw-poster";
import { cleanName, createPoster, genreById, genres, isBlocked, nextTitle, parseShareHash, possessive, shareHash, DEFAULT_STATE, MAX_NAME_LENGTH, NEW_FACES, type GenreId, type PosterState } from "../lib/poster";

const TOOL = "cinema-poster";

export function PosterBuilder() {
  const [state, setState] = useState<PosterState>(DEFAULT_STATE);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [friend, setFriend] = useState<PosterState | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const send = useRef<HTMLDivElement>(null);
  const sendVisible = useInView(send);
  const poster = useMemo(() => createPoster(state), [state]);
  const hash = shareHash(state).slice(1);
  const genre = genreById(state.genre);

  useEffect(() => {
    // In-page anchors (#make, #send) also change the hash, so only a real shared poster counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(poster.title + poster.name).then(() => {
      if (cancelled) return;
      if (preview.current) drawPoster(preview.current, poster, format, site, photo);
      if (friend && friendPreview.current) drawPoster(friendPreview.current, createPoster(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [poster, format, site, photo, friend]);

  const set = (patch: Partial<PosterState>) => setState(current => ({ ...current, ...patch }));

  /** The friend's co-star is probably the one reading: swap the cast so they lead their own poster. */
  function myTurn() {
    if (!friend) return;
    setState(friend.costar ? { ...nextTitle(friend), name: friend.costar, costar: friend.name } : { ...nextTitle(friend), name: "", costar: friend.name });
    document.getElementById("make")?.scrollIntoView({ behavior: "smooth" });
  }

  const friendPoster = friend ? createPoster(friend) : null;
  const nameBlocked = state.name.trim() !== "" && isBlocked(state.name);
  const costarBlocked = state.costar.trim() !== "" && isBlocked(state.costar);
  const named = Boolean(poster.name);
  const caption = named
    ? `আসিতেছে! ${possessive(poster.name)} নতুন ছবি “${poster.title}”${poster.costar ? `, সাথে ${poster.costar}` : ""}। তোমার ছবির নাম কী হবে?`
    : `আসিতেছে! “${poster.title}” — নিজের নামে সিনেমার পোস্টার বানাও:`;

  return (
    <div className="cp-builder">
      {friend && friendPoster && (
        <section className="cp-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`সিনেমার পোস্টার: ${friendPoster.title}${friendPoster.name ? `, অভিনয়ে ${friendPoster.name}` : ""}`} />
          <div>
            <p className="cp-friend-kicker">{friendPoster.costar ? "তোমাকে নিয়ে ছবি হচ্ছে!" : "নতুন ছবি আসিতেছে!"}</p>
            <h2 id="friend-title">
              {friendPoster.costar && friendPoster.name
                ? <>তুমি <span>{possessive(friendPoster.name)}</span> ছবির সহশিল্পী!</>
                : <>{friendPoster.name ? possessive(friendPoster.name) : "বন্ধুর"} নতুন ছবি <span>“{friendPoster.title}”</span></>}
            </h2>
            <button type="button" className="kit-primary" onClick={myTurn}>নিজের পোস্টার বানাও</button>
          </div>
        </section>
      )}

      <fieldset className="cp-genres" id="make">
        <legend>কোন ধরনের ছবি?</legend>
        <div>
          {genres.map(item => (
            <button type="button" key={item.id} data-genre={item.id} aria-pressed={item.id === state.genre} onClick={() => set({ genre: item.id as GenreId })}>{item.chip}</button>
          ))}
        </div>
      </fieldset>

      <div className="cp-cast">
        <label className="cp-field" id="cp-name">
          <span>তোমার নাম</span>
          <input value={state.name} maxLength={MAX_NAME_LENGTH + 10} onChange={event => set({ name: event.target.value })} placeholder="যেমন: রাফি" autoComplete="nickname" aria-describedby="cp-name-note" />
        </label>
        <label className="cp-field">
          <span>সহশিল্পী <small>চাইলে</small></span>
          <input value={state.costar} maxLength={MAX_NAME_LENGTH + 10} onChange={event => set({ costar: event.target.value })} placeholder="বন্ধুর নাম" disabled={!cleanName(state.name)} />
        </label>
        <p className="cp-note" id="cp-name-note" role="status" aria-live="polite">
          {nameBlocked || costarBlocked ? "এই নামটা পোস্টারে বসানো যাবে না। অন্য একটা নাম লেখো।" : named ? "" : `নাম না দিলে লেখা থাকবে “${NEW_FACES}”।`}
        </p>
      </div>

      <div className="cp-body">
        <div className="cp-stage">
          <figure className="kit-card cp-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cp-summary" />
            <figcaption id="cp-summary" className="cp-sr">{poster.ribbon} {poster.title}। অভিনয়ে {poster.name || NEW_FACES}{poster.costar ? ` ও ${poster.costar}` : ""}। {poster.line}</figcaption>
            {previewError && <p className="kit-status" role="alert">পোস্টারটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <button type="button" className="cp-shuffle" onClick={() => setState(nextTitle)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h11l-3-3m3 3-3 3M20 17H9l3 3m-3-3 3-3" /></svg>
            আরেকটা নাম দাও
          </button>
        </div>

        <div className="cp-controls">
          <PhotoPicker value={photo} onChange={setPhoto} label="তোমার ছবি" note="পোস্টারের ফ্রেমে বসবে, রং করা ছবির মতো। ফোনেই থাকে, লিংকে যায় না" />
          <div className="cp-send" id="send" ref={send}>
            <h2>“{poster.line}”</h2>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`cinema-poster-${state.genre}.png`} makeImage={() => posterBlob(poster, format, site, photo)} imageKey={`${hash}|${format}|${photo?.width ?? 0}`} caption={caption} state={hash} hint={poster.costar ? `লিংক পেলে ${poster.costar} দেখবে, তুমি তাকে সহশিল্পী বানিয়েছ। ছবি লিংকে যায় না।` : "লিংক খুললে পোস্টারটা দেখা যাবে, তোমার ছবি ছাড়া।"} />
          </div>
        </div>
      </div>

      <StickyNext
        show={!sendVisible}
        title={<><strong>{genre.label}</strong> তৈরি</>}
        sub={named ? `“${poster.title}”` : "নিজের নাম বসালে তুমিই হবে ছবির মুখ"}
        href={named ? "#send" : "#cp-name"}
        label={named ? "শেয়ার করো" : "নাম বসাও"}
      />
    </div>
  );
}
