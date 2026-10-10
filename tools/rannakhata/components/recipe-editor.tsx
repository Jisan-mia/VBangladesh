"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-recipe";
import { bn, possessive, RECIPE_ASK, cleanRecipe, dishHeadline, emptyRecipe, exampleRecipe, parseRecipeHash, recipeCard, recipeHash, recipeLimits, recipeLine, recipeText, validateRecipe, whoseChoices, whoseWord, type RecipeCard, type RecipeDraft } from "../lib/recipe";

const TOOL = "rannakhata";
const isChoice = (value: string) => (whoseChoices as readonly string[]).includes(value);

/** The full recipe as a notebook page: what a shared link opens and what gets printed. */
function RecipePage({ card }: { card: RecipeCard }) {
  const who = whoseWord(card.learnedFrom);
  return <article className="ranna-page ranna-sheet" aria-label={dishHeadline(card)}>
    <div className="ranna-sheet-top"><span>আমাদের রান্নাখাতা{card.servings && ` · ${possessive(card.servings)} রান্না`}</span>{who && <span className="ranna-stamp">{who} রেসিপি</span>}</div>
    <h3>{card.title}</h3>
    {card.memory && <p className="ranna-sheet-story">“{card.memory}”</p>}
    <h4>যা যা লাগবে</h4>
    <ul>{card.ingredients.map((item, index) => <li key={index}>{item}</li>)}</ul>
    <h4>যেভাবে রাঁধবে</h4>
    <ol>{card.steps.map((step, index) => <li key={index}><span aria-hidden="true">{bn(index + 1)}</span>{step}</li>)}</ol>
  </article>;
}

export function RecipeEditor() {
  const [draft, setDraft] = useState<RecipeDraft>(exampleRecipe);
  const [customWhose, setCustomWhose] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<RecipeDraft | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [status, setStatus] = useState("");
  const [friendStatus, setFriendStatus] = useState("");
  const [typing, setTyping] = useState(false);
  const [printTarget, setPrintTarget] = useState<"own" | "friend">("own");
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  // The shared section mounts after the first render, so observe it through a ref that changes with it.
  const [friendSection, setFriendSection] = useState<HTMLElement | null>(null);
  const friendVisible = useInView(useMemo(() => ({ current: friendSection }), [friendSection]));
  const card = useMemo(() => recipeCard(cleanRecipe(draft)), [draft]);
  const errors = validateRecipe(draft);
  const ready = Object.keys(errors).length === 0;
  const state = ready ? recipeHash(draft).slice(1) : "";
  const headline = dishHeadline(card);
  const isSample = JSON.stringify(draft) === JSON.stringify(exampleRecipe);
  const friendCard = friend && recipeCard(friend);
  const otherWhose = customWhose || Boolean(draft.learnedFrom && !isChoice(draft.learnedFrom));

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared recipe replaces the friend's.
    const readFriend = () => { const shared = parseRecipeHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(card.title || "রান্নাখাতা").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, card, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site]);

  function update(field: keyof RecipeDraft, value: string) {
    setDraft(current => ({ ...current, [field]: value }));
    setStatus("");
  }

  function pickWhose(choice: string) {
    setCustomWhose(false);
    update("learnedFrom", draft.learnedFrom === choice ? "" : choice);
  }

  function pickOther() {
    if (otherWhose) { setCustomWhose(false); update("learnedFrom", ""); return; }
    setCustomWhose(true);
    if (isChoice(draft.learnedFrom)) update("learnedFrom", "");
    requestAnimationFrame(() => document.getElementById("recipe-whose")?.focus());
  }

  function startBlank() {
    if (!isSample && !window.confirm("এই পাতার লেখা মুছে নতুন পাতা নেবে? দরকার হলে আগে রেসিপিটা কপি করে রাখো।")) return;
    setDraft(emptyRecipe());
    setCustomWhose(false);
    document.getElementById("recipe-title")?.focus();
  }

  function takeFriendRecipe() {
    if (!friend) return;
    if (!isSample && !window.confirm("তোমার খাতার লেখাটা মুছে এই রেসিপিটা তুলবে?")) return;
    setDraft(friend);
    setCustomWhose(Boolean(friend.learnedFrom && !isChoice(friend.learnedFrom)));
    setStatus("রেসিপিটা তোমার খাতায় উঠেছে। যা বদলাতে চাও, বদলে নাও।");
    document.getElementById("khata")?.scrollIntoView({ behavior: "smooth" });
  }

  async function copyText(target: RecipeDraft, say: (message: string) => void) {
    try {
      await navigator.clipboard.writeText(recipeText(target));
      say("পুরো রেসিপিটা কপি হয়েছে। পরিবারের গ্রুপে পেস্ট করে দাও।");
    } catch {
      say("কপি হলো না। ‘প্রিন্ট করো’ চেপে পিডিএফ করে রাখতে পারো।");
    }
  }

  function printPage(target: "own" | "friend") {
    // The print stylesheet keeps only the chosen page, so it must be in the DOM before the dialog opens.
    flushSync(() => setPrintTarget(target));
    window.print();
  }

  const caption = `${headline} — রেসিপিটা খাতায় লিখে রাখলাম, যাতে হারিয়ে না যায়। ${RECIPE_ASK}`;
  const firstError = Object.values(errors)[0];
  const field = (name: keyof RecipeDraft) => ({ value: draft[name], maxLength: recipeLimits[name], onChange: (event: { target: { value: string } }) => update(name, event.target.value) });

  return (
    <div className="ranna" data-print={printTarget}>
      {friend && friendCard && (
        <section className="ranna-friend" ref={setFriendSection} aria-labelledby="friend-title">
          <p className="ranna-kicker">তোমার জন্য একটা রেসিপি এসেছে</p>
          <h2 id="friend-title">{dishHeadline(friendCard)}</h2>
          <p className="ranna-friend-sub">পুরো রেসিপিটা নিচে আছে। পড়ো, কপি করো, বা প্রিন্ট করে রান্নাঘরে রাখো।</p>
          <RecipePage card={friendCard} />
          <div className="ranna-actions">
            <button type="button" className="kit-secondary" onClick={() => copyText(friend, setFriendStatus)}>রেসিপি কপি করো</button>
            <button type="button" className="kit-secondary" onClick={() => printPage("friend")}>প্রিন্ট করো</button>
          </div>
          <p className="kit-status" role="status" aria-live="polite">{friendStatus}</p>
          <div className="ranna-your-turn">
            <p>{RECIPE_ASK}</p>
            <a className="kit-primary" href="#khata">নিজেদের রান্নাটা লিখি</a>
            <button type="button" className="kit-link" onClick={takeFriendRecipe}>এটাই নিজের খাতায় তুলে বদলাই</button>
          </div>
        </section>
      )}

      <form id="khata" className="ranna-page ranna-editor" aria-label="রেসিপির খাতা" onSubmit={event => event.preventDefault()} onFocus={() => setTyping(true)} onBlur={() => setTyping(false)}>
        <div className="ranna-page-top">
          <span>{isSample ? "নমুনা পাতা · নিজের রান্না দিয়ে বদলে নাও" : "তোমার খাতার পাতা"}</span>
          <button type="button" className="kit-link" onClick={startBlank}>ফাঁকা পাতা নাও</button>
        </div>

        <label className="ranna-field ranna-title-field" htmlFor="recipe-title"><span>রান্নার নাম</span></label>
        <input id="recipe-title" className="ranna-title-input" {...field("title")} placeholder="যেমন: ভাপা পিঠা" autoComplete="off" aria-invalid={Boolean(errors.title && draft.title)} />

        <fieldset className="ranna-whose">
          <legend>কার রেসিপি?</legend>
          <div className="kit-chips">
            {whoseChoices.map(choice => <button type="button" key={choice} aria-pressed={!otherWhose && draft.learnedFrom === choice} onClick={() => pickWhose(choice)}>{choice}</button>)}
            <button type="button" aria-pressed={otherWhose} onClick={pickOther}>অন্য কেউ</button>
          </div>
          {otherWhose && <input id="recipe-whose" {...field("learnedFrom")} placeholder="যেমন: বড় মামি" aria-label="কার রেসিপি, লেখো" autoComplete="off" />}
        </fieldset>

        <label className="ranna-field ranna-inline"><span>কতজনের রান্না</span><input {...field("servings")} placeholder="যেমন: ৪ জন" autoComplete="off" /></label>

        <label className="ranna-field" htmlFor="recipe-ingredients"><span>যা যা লাগবে <small>একেক লাইনে একটা, মাপসহ</small></span></label>
        <textarea id="recipe-ingredients" className="ranna-lines" rows={5} {...field("ingredients")} placeholder={"চালের গুঁড়া — ২ কাপ\nখেজুরের গুড় — ১ কাপ"} aria-describedby="ingredients-error" aria-invalid={Boolean(errors.ingredients && draft.ingredients)} />
        <p id="ingredients-error" className="ranna-error">{draft.ingredients.trim() && errors.ingredients}</p>

        <label className="ranna-field" htmlFor="recipe-steps"><span>যেভাবে রাঁধবে <small>একেক লাইনে একটা ধাপ, নম্বর নিজেই বসবে</small></span></label>
        <textarea id="recipe-steps" className="ranna-lines" rows={5} {...field("steps")} placeholder={"প্রথমে কী করবে…\nতারপর…"} aria-describedby="steps-error" aria-invalid={Boolean(errors.steps && draft.steps)} />
        <p id="steps-error" className="ranna-error">{draft.steps.trim() && errors.steps}</p>

        <label className="ranna-field" htmlFor="recipe-memory"><span>এই রান্নার গল্প <small>চাইলে</small></span></label>
        <textarea id="recipe-memory" className="ranna-lines ranna-story-input" rows={3} {...field("memory")} placeholder="শীতের সকালে চুলার পাশে বসে…" aria-describedby="memory-count" />
        <p id="memory-count" className="ranna-count">{bn(draft.memory.length)} / {bn(recipeLimits.memory)}</p>
      </form>

      <StickyNext show={ready && !resultVisible && !typing && !friendVisible} title={<strong>{headline}</strong>} sub={`${bn(card.ingredients.length)}টা উপকরণ · ${bn(card.steps.length)}টা ধাপ`} href="#result" label="পাতাটা দেখো" />

      <section className="ranna-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">{ready ? <>খাতার পাতা তৈরি</> : "পাতাটা এখনো অর্ধেক লেখা"}</h2>
        <p className="ranna-result-line">{ready ? recipeLine(card) : firstError}</p>
        <div className="ranna-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="screen-reader-only">{headline}। উপকরণ: {card.ingredients.join(", ")}। {recipeLine(card)}</figcaption>
            {previewError && <p className="kit-status" role="alert">খাতার ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="ranna-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="rannakhata.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!ready} hint={ready ? "লিংক খুললে পরিবারের সবাই পুরো রেসিপিটা পড়তে, কপি বা প্রিন্ট করতে পারবে।" : ""} />
            <div className="ranna-actions">
              <button type="button" className="kit-secondary" onClick={() => copyText(draft, setStatus)} disabled={!ready}>রেসিপি কপি করো</button>
              <button type="button" className="kit-secondary" onClick={() => printPage("own")} disabled={!ready}>প্রিন্ট করো</button>
            </div>
            <p className="kit-status" role="status" aria-live="polite">{status}</p>
          </div>
        </div>
      </section>

      {ready && <div className="ranna-print-own"><RecipePage card={card} /></div>}
    </div>
  );
}
