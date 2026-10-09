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
    if (hasWriting && !window.confirm("নমুনা দিলে আপনার লেখা বদলে যাবে। দরকারি লেখা আগে ডাউনলোড করে রাখুন। নমুনা দেখবেন?")) return;
    setDraft({ ...exampleRecipe });
    setStatus("নমুনা দেখানো হচ্ছে। এটি কোনো পরিবারের আসল রেসিপি বা স্মৃতি নয়। এবার আপনার রেসিপি অনুযায়ী বদলে নিন।");
  }

  function clearRecipe() {
    if (!window.confirm("এই পাতার সব লেখা মুছতে চান? দরকার হলে আগে রেসিপিটি ডাউনলোড করে রাখুন।")) return;
    setDraft(emptyRecipe());
    setStatus("এই পাতার লেখা মুছে ফেলা হয়েছে। আগে ডাউনলোড করা ফাইল মুছে যায়নি।");
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
      setStatus("টেক্সট ফাইল তৈরি হয়েছে। ব্রাউজারের ডাউনলোড তালিকা বা ফোনের ফাইল অ্যাপে দেখুন।");
    } catch {
      setStatus("ফাইল ডাউনলোড করা যায়নি। ব্রাউজারে ডাউনলোডের অনুমতি দেখে আবার চেষ্টা করুন। আপনার লেখা পাতাতেই আছে।");
    }
  }

  async function printRecipe() {
    if (!ready) return;
    setPrintPending(true);
    try {
      await document.fonts.ready;
      window.print();
      setStatus("প্রিন্টের উইন্ডো থেকে প্রিন্ট করুন বা পিডিএফ হিসেবে রাখুন। বাতিল করলেও পাতার লেখা থাকবে।");
    } catch {
      setStatus("প্রিন্টের উইন্ডো খোলা যায়নি। ব্রাউজারের মেনু থেকে প্রিন্ট করার চেষ্টা করুন।");
    } finally {
      setPrintPending(false);
    }
  }

  return <div className="ranna-editor">
    <form className="ranna-form" onSubmit={(event) => event.preventDefault()}>
      <div className="ranna-form-top"><h3>আপনার রান্নার খাতা</h3><button className="ranna-text-button" type="button" onClick={fillExample}>একটি নমুনা দেখুন</button></div>
      <p className="ranna-required-note">রান্নার নাম, উপকরণ ও ধাপ লিখলে প্রিন্ট বা ডাউনলোড করতে পারবেন।</p>
      <div className="ranna-field"><label htmlFor="recipe-title">রান্নার নাম <span>প্রয়োজন</span></label><input id="recipe-title" value={draft.title} maxLength={recipeLimits.title} onChange={(event) => updateField("title", event.target.value)} placeholder="যেমন: ডাল ভর্তা" required autoComplete="off" /></div>
      <div className="ranna-field-row"><div className="ranna-field"><label htmlFor="recipe-from">যাঁর কাছে শেখা <span>চাইলে</span></label><input id="recipe-from" value={draft.learnedFrom} maxLength={recipeLimits.learnedFrom} onChange={(event) => updateField("learnedFrom", event.target.value)} placeholder="যেমন: মায়ের রান্নার খাতা" autoComplete="off" /></div><div className="ranna-field"><label htmlFor="recipe-servings">কতজনের জন্য <span>চাইলে</span></label><input id="recipe-servings" value={draft.servings} maxLength={recipeLimits.servings} onChange={(event) => updateField("servings", event.target.value)} placeholder="যেমন: ৪ জন" autoComplete="off" /></div></div>
      <div className="ranna-field"><label htmlFor="recipe-ingredients">উপকরণ ও পরিমাণ <span>প্রয়োজন</span></label><p id="ingredients-help">প্রতিটি উপকরণ আলাদা লাইনে লিখুন। সর্বোচ্চ ৩০টি।</p><textarea id="recipe-ingredients" rows={6} value={draft.ingredients} maxLength={recipeLimits.ingredients} onChange={(event) => updateField("ingredients", event.target.value)} placeholder={"ডাল — ১ কাপ\nপেঁয়াজ — ১টি"} required aria-describedby="ingredients-help ingredients-error" aria-invalid={Boolean(draft.ingredients.trim() && errors.ingredients)} /><p id="ingredients-error" className="ranna-field-error">{draft.ingredients.trim() && errors.ingredients}</p></div>
      <div className="ranna-field"><label htmlFor="recipe-steps">রান্নার ধাপ <span>প্রয়োজন</span></label><p id="steps-help">প্রতিটি ধাপ আলাদা লাইনে লিখুন। নম্বর নিজে থেকে বসবে। সর্বোচ্চ ২০টি ধাপ।</p><textarea id="recipe-steps" rows={7} value={draft.steps} maxLength={recipeLimits.steps} onChange={(event) => updateField("steps", event.target.value)} placeholder={"প্রথমে যা করবেন…\nতারপরের কাজ…"} required aria-describedby="steps-help steps-error" aria-invalid={Boolean(draft.steps.trim() && errors.steps)} /><p id="steps-error" className="ranna-field-error">{draft.steps.trim() && errors.steps}</p></div>
      <div className="ranna-field"><label htmlFor="recipe-memory">একটুখানি গল্প <span>চাইলে</span></label><p id="memory-help">কবে খেতেন, কার সঙ্গে রান্না করতেন, বা যে কথাটি মনে রাখতে চান।</p><textarea id="recipe-memory" rows={3} value={draft.memory} maxLength={recipeLimits.memory} onChange={(event) => updateField("memory", event.target.value)} placeholder="এই রান্নার সঙ্গে আপনার স্মৃতি…" aria-describedby="memory-help" /><span className="ranna-character-count">{banglaNumber.format(draft.memory.length)} / ৮০০</span></div>
      <div className="ranna-form-bottom"><p>পাতা ছাড়ার আগে রেসিপি ডাউনলোড করে রাখুন।</p><button className="ranna-text-button" type="button" onClick={clearRecipe} disabled={!hasWriting}>সব মুছে ফেলুন</button></div>
    </form>
    <div className="ranna-preview-wrap">
      <div className="ranna-preview-top"><span>আপনার রেসিপির কার্ড</span><span>লিখলেই বদলাবে</span></div>
      <article className="ranna-sheet" aria-labelledby="recipe-card-title">
        <div className="ranna-sheet-brand"><span>আমাদের রান্নাখাতা</span><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M9 4c8 0 9 11 2 13l1 11H8l1-11C2 15 2 4 9 4Zm13 0v9m4-9v9m-8-9v9h8m-4 0v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <h3 id="recipe-card-title">{card.title || "আপনার রান্নার নাম"}</h3>
        {(card.learnedFrom || card.servings) && <div className="ranna-sheet-meta">{card.learnedFrom && <p><span>যাঁর কাছে শেখা</span>{card.learnedFrom}</p>}{card.servings && <p><span>কতজনের জন্য</span>{card.servings}</p>}</div>}
        <section className="ranna-ingredient-section" aria-labelledby="card-ingredients-title"><h4 id="card-ingredients-title">যা যা লাগবে</h4>{card.ingredients.length ? <ul>{card.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}</ul> : <p className="ranna-empty">উপকরণ ও পরিমাণ লিখলে এখানে দেখা যাবে।</p>}</section>
        <section className="ranna-step-section" aria-labelledby="card-steps-title"><h4 id="card-steps-title">যেভাবে রান্না করবেন</h4>{card.steps.length ? <ol>{card.steps.map((step, index) => <li key={index}>{step}</li>)}</ol> : <p className="ranna-empty">আপনার লেখা ধাপগুলো এখানে সাজানো থাকবে।</p>}</section>
        {card.memory && <section className="ranna-story" aria-labelledby="card-story-title"><h4 id="card-story-title">এই রান্নার সঙ্গে যে গল্প</h4><p>{card.memory}</p></section>}
        <div className="ranna-sheet-end">আপনার লেখা রেসিপি · আমাদের রান্নাখাতা</div>
      </article>
      <div className="ranna-export"><div className="ranna-export-actions"><button type="button" className="button" onClick={downloadRecipe} disabled={!ready}>ফাইল ডাউনলোড করুন <span aria-hidden="true">↓</span></button><button type="button" className="button-secondary" onClick={printRecipe} disabled={!ready || printPending}>{printPending ? "প্রিন্টের প্রস্তুতি…" : "কার্ড প্রিন্ট করুন"}</button></div><p className="ranna-export-help">{ready ? "নাম ও স্মৃতিসহ আপনার সব লেখা ফাইল ও প্রিন্ট করা কার্ডে থাকবে।" : "রান্নার নাম, উপকরণ ও ধাপ লিখুন। তারপর ডাউনলোড বা প্রিন্ট করুন।"}</p><p className="ranna-status" role="status" aria-live="polite">{status}</p><p className="ranna-count" role="status" aria-live="polite">{banglaNumber.format(card.ingredients.length)}টি উপকরণ · {banglaNumber.format(card.steps.length)}টি ধাপ</p></div>
    </div>
  </div>;
}
