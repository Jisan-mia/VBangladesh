"use client";

import { useState } from "react";
import { emptyRecipe, exampleRecipe, recipeCard, recipeLimits, recipeText, validateRecipe, type RecipeDraft } from "../lib/recipe";

const banglaNumber = new Intl.NumberFormat("bn-BD");

export function RecipeEditor() {
  const [draft, setDraft] = useState<RecipeDraft>(emptyRecipe);
  const [status, setStatus] = useState("");
  const [printPending, setPrintPending] = useState(false);
  const card = recipeCard(draft);
  const errors = validateRecipe(draft);
  const ready = Object.keys(errors).length === 0;
  const hasWriting = Object.values(draft).some((value) => value.trim());

  function updateField(field: keyof RecipeDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setStatus("");
  }

  function fillExample() {
    if (hasWriting && !window.confirm("নমুনা দেখালে তোমার লেখাটা মুছে যাবে। দরকারি হলে আগে ফাইলটা নামিয়ে রাখো। তবুও নমুনা দেখবে?")) return;
    setDraft({ ...exampleRecipe });
    setStatus("এটা শুধু নমুনা, কারো আসল রেসিপি বা গল্প না। এবার নিজের রান্না দিয়ে বদলে নাও।");
  }

  function clearRecipe() {
    if (!window.confirm("এই পাতার সব লেখা মুছে দেবে? দরকার হলে আগে ফাইলটা নামিয়ে রাখো।")) return;
    setDraft(emptyRecipe());
    setStatus("এই পাতার লেখা মুছে গেছে। আগে ডাউনলোড করা ফাইল যেমন ছিল, তেমনই আছে।");
  }

  function downloadRecipe() {
    try {
      const blob = new Blob(["\uFEFF", recipeText(draft)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "আমাদের-রান্নাখাতা.txt";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setStatus("ডাউনলোড শুরু হয়েছে। ফোনের ডাউনলোড ফোল্ডার বা ফাইল অ্যাপে দেখো।");
    } catch {
      setStatus("ফাইলটা ডাউনলোড হলো না। ব্রাউজারে ডাউনলোডের অনুমতি আছে কি না দেখে আরেকবার চেষ্টা করো। তোমার লেখা পাতাতেই আছে।");
    }
  }

  async function printRecipe() {
    if (!ready) return;
    setPrintPending(true);
    try {
      await document.fonts.ready;
      window.print();
      setStatus("প্রিন্টের পাতা থেকে প্রিন্ট করো বা পিডিএফ করে রাখো। বাতিল করলেও লেখা এখানেই থাকবে।");
    } catch {
      setStatus("প্রিন্টের পাতা খুলল না। ব্রাউজারের মেনু থেকে প্রিন্ট করে দেখো।");
    } finally {
      setPrintPending(false);
    }
  }

  return <div className="ranna-editor">
    <form className="ranna-form" onSubmit={(event) => event.preventDefault()}>
      <div className="ranna-form-top"><h3>তোমার রান্নার খাতা</h3><button className="ranna-text-button" type="button" onClick={fillExample}>একটা নমুনা দেখো</button></div>
      <p className="ranna-required-note">রান্নার নাম, উপকরণ আর ধাপ লিখলেই ফাইল ডাউনলোড বা প্রিন্ট করতে পারবে।</p>
      <div className="ranna-field"><label htmlFor="recipe-title">রান্নার নাম <span>লাগবেই</span></label><input id="recipe-title" value={draft.title} maxLength={recipeLimits.title} onChange={(event) => updateField("title", event.target.value)} placeholder="যেমন: ডাল ভর্তা" required autoComplete="off" /></div>
      <div className="ranna-field-row"><div className="ranna-field"><label htmlFor="recipe-from">কার কাছে শেখা <span>চাইলে</span></label><input id="recipe-from" value={draft.learnedFrom} maxLength={recipeLimits.learnedFrom} onChange={(event) => updateField("learnedFrom", event.target.value)} placeholder="যেমন: মায়ের কাছে" autoComplete="off" /></div><div className="ranna-field"><label htmlFor="recipe-servings">কতজনের জন্য <span>চাইলে</span></label><input id="recipe-servings" value={draft.servings} maxLength={recipeLimits.servings} onChange={(event) => updateField("servings", event.target.value)} placeholder="যেমন: ৪ জন" autoComplete="off" /></div></div>
      <div className="ranna-field"><label htmlFor="recipe-ingredients">উপকরণ আর মাপ <span>লাগবেই</span></label><p id="ingredients-help">একেক লাইনে একটা উপকরণ। ৩০টা পর্যন্ত।</p><textarea id="recipe-ingredients" rows={6} value={draft.ingredients} maxLength={recipeLimits.ingredients} onChange={(event) => updateField("ingredients", event.target.value)} placeholder={"ডাল — ১ কাপ\nপেঁয়াজ — ১টা"} required aria-describedby="ingredients-help ingredients-error" aria-invalid={Boolean(draft.ingredients.trim() && errors.ingredients)} /><p id="ingredients-error" className="ranna-field-error">{draft.ingredients.trim() && errors.ingredients}</p></div>
      <div className="ranna-field"><label htmlFor="recipe-steps">রান্নার ধাপ <span>লাগবেই</span></label><p id="steps-help">একেক লাইনে একটা ধাপ। নম্বর নিজে থেকে বসবে। ২০টা পর্যন্ত।</p><textarea id="recipe-steps" rows={7} value={draft.steps} maxLength={recipeLimits.steps} onChange={(event) => updateField("steps", event.target.value)} placeholder={"প্রথমে কী করবে…\nতারপর…"} required aria-describedby="steps-help steps-error" aria-invalid={Boolean(draft.steps.trim() && errors.steps)} /><p id="steps-error" className="ranna-field-error">{draft.steps.trim() && errors.steps}</p></div>
      <div className="ranna-field"><label htmlFor="recipe-memory">একটুখানি গল্প <span>চাইলে</span></label><p id="memory-help">কবে খাওয়া হতো, কার সাথে রাঁধতে, বা যে কথাটা মনে রাখতে চাও।</p><textarea id="recipe-memory" rows={3} value={draft.memory} maxLength={recipeLimits.memory} onChange={(event) => updateField("memory", event.target.value)} placeholder="যেমন: শীতের সকালে চুলার পাশে বসে খেতাম…" aria-describedby="memory-help" /><span className="ranna-character-count">{banglaNumber.format(draft.memory.length)} / ৮০০</span></div>
      <div className="ranna-form-bottom"><p>পাতা ছাড়ার আগে ফাইলটা নামিয়ে রেখো।</p><button className="ranna-text-button" type="button" onClick={clearRecipe} disabled={!hasWriting}>সব মুছে দাও</button></div>
    </form>
    <div className="ranna-preview-wrap">
      <div className="ranna-preview-top"><span>তোমার রেসিপি কার্ড</span><span>লিখলেই বদলাবে</span></div>
      <article className="ranna-sheet" aria-labelledby="recipe-card-title">
        <div className="ranna-sheet-brand"><span>আমাদের রান্নাখাতা</span><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M9 4c8 0 9 11 2 13l1 11H8l1-11C2 15 2 4 9 4Zm13 0v9m4-9v9m-8-9v9h8m-4 0v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <h3 id="recipe-card-title">{card.title || "তোমার রান্নার নাম"}</h3>
        {(card.learnedFrom || card.servings) && <div className="ranna-sheet-meta">{card.learnedFrom && <p><span>কার কাছে শেখা</span>{card.learnedFrom}</p>}{card.servings && <p><span>কতজনের জন্য</span>{card.servings}</p>}</div>}
        <section className="ranna-ingredient-section" aria-labelledby="card-ingredients-title"><h4 id="card-ingredients-title">যা যা লাগবে</h4>{card.ingredients.length ? <ul>{card.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}</ul> : <p className="ranna-empty">উপকরণ লিখলে এখানে দেখাবে।</p>}</section>
        <section className="ranna-step-section" aria-labelledby="card-steps-title"><h4 id="card-steps-title">যেভাবে রাঁধবে</h4>{card.steps.length ? <ol>{card.steps.map((step, index) => <li key={index}>{step}</li>)}</ol> : <p className="ranna-empty">তোমার লেখা ধাপগুলো এখানে নম্বর দিয়ে সাজানো থাকবে।</p>}</section>
        {card.memory && <section className="ranna-story" aria-labelledby="card-story-title"><h4 id="card-story-title">এই রান্নার পেছনের গল্প</h4><p>{card.memory}</p></section>}
        <div className="ranna-sheet-end">নিজের লেখা রেসিপি · আমাদের রান্নাখাতা</div>
      </article>
      <div className="ranna-export"><div className="ranna-export-actions"><button type="button" className="button" onClick={downloadRecipe} disabled={!ready}>ফাইল ডাউনলোড করো <span aria-hidden="true">↓</span></button><button type="button" className="button-secondary" onClick={printRecipe} disabled={!ready || printPending}>{printPending ? "প্রিন্টের জন্য তৈরি হচ্ছে…" : "কার্ড প্রিন্ট করো"}</button></div><p className="ranna-export-help">{ready ? "নাম আর গল্পসহ তোমার সব লেখা ফাইলে আর প্রিন্ট করা কার্ডে থাকবে।" : "রান্নার নাম, উপকরণ আর ধাপ লেখো, তারপর ডাউনলোড বা প্রিন্ট করো।"}</p><p className="ranna-status" role="status" aria-live="polite">{status}</p><p className="ranna-count" role="status" aria-live="polite">{banglaNumber.format(card.ingredients.length)}টা উপকরণ · {banglaNumber.format(card.steps.length)}টা ধাপ</p></div>
    </div>
  </div>;
}
