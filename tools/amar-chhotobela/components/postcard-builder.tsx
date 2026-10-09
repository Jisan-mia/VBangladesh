"use client";

import { useEffect, useRef, useState } from "react";
import { useHistory } from '../../../shared/use-history';
import { createPostcard, moveMemory, MAX_MEMORIES, MAX_NAME_LENGTH, memories, toggleMemory } from "../lib/postcard";
import { drawPostcard, loadPostcardFont, postcardBlob } from "../lib/draw-postcard";
import { MemorySketch } from "./memory-sketch";

const bengaliNumber = new Intl.NumberFormat("bn-BD");

export function PostcardBuilder() {
  const history = useHistory<{ name: string; selected: string[] }>({ name: "", selected: [] });
  const { name, selected } = history.value;
  const [status, setStatus] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const postcard = createPostcard(name, selected);
  const selectionFull = selected.length === MAX_MEMORIES;

  useEffect(() => {
    let cancelled = false;
    loadPostcardFont().then(() => {
      if (cancelled || !canvas.current) return;
      drawPostcard(canvas.current, createPostcard(name, selected));
      setPreviewError(false);
    }).catch(() => {
      if (!cancelled) setPreviewError(true);
    });
    return () => { cancelled = true; };
  }, [name, selected]);

  function selectMemory(memoryId: string) {
    history.commit(current => ({ ...current, selected: toggleMemory(current.selected, memoryId) }));
    setStatus("");
  }

  function clearCard() {
    if (!window.confirm("নাম ও বেছে নেওয়া স্মৃতি মুছবেন? আগের ধাপ দিয়ে আবার ফিরিয়ে আনতে পারবেন।")) return;
    history.commit({ name: "", selected: [] });
    setStatus("এই পাতার নাম ও বেছে নেওয়া স্মৃতি মুছে ফেলা হয়েছে। আবার শুরু করতে পারেন।");
  }

  async function downloadCard() {
    if (!selected.length || isDownloading) return;
    setIsDownloading(true);
    setStatus("ছবিটি তৈরি হচ্ছে…");
    try {
      const blob = await postcardBlob(postcard);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "আমার-ছোটবেলা.png";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setStatus("ছবি তৈরি হয়েছে। ব্রাউজারের ডাউনলোড তালিকা বা ফোনের ফাইল অ্যাপ দেখুন।");
    } catch {
      setStatus("ছবি ডাউনলোড করা যায়নি। ব্রাউজারে ডাউনলোডের অনুমতি দেখে আবার চেষ্টা করুন। আপনার নাম ও পছন্দ পাতাতেই আছে।");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="childhood-builder">
      <form className="childhood-form" onSubmit={(event) => event.preventDefault()}>
        <div className="childhood-form-heading"><span className="childhood-step">০১</span><div><h3>কোন স্মৃতিগুলো মনে পড়ে?</h3><p>সর্বোচ্চ আটটি বেছে নিন। যে ক্রমে বাছবেন, কার্ডেও সেই ক্রমে থাকবে।</p></div></div>
        <fieldset disabled={isDownloading} aria-describedby="memory-count">
          <legend className="childhood-visually-hidden">আপনার ছোটবেলার স্মৃতি বেছে নিন</legend>
          <div className="childhood-choices">
            {memories.map((memory) => {
              const checked = selected.includes(memory.id);
              return (
                <label className="childhood-choice" key={memory.id} data-selected={checked}>
                  <input type="checkbox" checked={checked} disabled={selectionFull && !checked} onChange={() => selectMemory(memory.id)} />
                  <span className="childhood-choice-art"><MemorySketch drawing={memory.drawing} /></span>
                  <span>{memory.label}</span>
                  <span className="childhood-check" aria-hidden="true">{checked ? <svg viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.8" /></svg> : null}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <p className="childhood-selection-status" id="memory-count" role="status" aria-live="polite">{bengaliNumber.format(selected.length)} / ৮টি স্মৃতি বাছা হয়েছে। {selectionFull ? "নতুন একটি নিতে আগে একটি বাদ দিন।" : "নিজের স্মৃতির সঙ্গে মেলে, এমনগুলো রাখুন।"}</p>
        {selected.length > 1 && <fieldset className="childhood-order" disabled={isDownloading}><legend>কার্ডে স্মৃতির ক্রম</legend><ol>{selected.map((id, index) => <li key={id}><span>{memories.find(memory => memory.id === id)!.label}</span><div><button type="button" disabled={index === 0} aria-label={memories.find(memory => memory.id === id)!.label + " আগে আনুন"} onClick={() => history.commit(current => ({ ...current, selected: moveMemory(current.selected, id, -1) }))}>আগে</button><button type="button" disabled={index === selected.length - 1} aria-label={memories.find(memory => memory.id === id)!.label + " পরে নিন"} onClick={() => history.commit(current => ({ ...current, selected: moveMemory(current.selected, id, 1) }))}>পরে</button></div></li>)}</ol></fieldset>}
        <div className="childhood-name-block"><span className="childhood-step">০২</span><div><label htmlFor="postcard-name">আপনার নাম <span>চাইলে লিখুন</span></label><input type="text" id="postcard-name" value={name} onChange={(event) => { history.commit({ name: event.target.value, selected }); setStatus(""); }} maxLength={MAX_NAME_LENGTH} disabled={isDownloading} autoComplete="off" placeholder="আপনার নাম" aria-describedby="postcard-name-help" /><p id="postcard-name-help">নাম লিখলে তা ছবিতেও থাকবে। সর্বোচ্চ ৪০ অক্ষর।</p></div></div>
      </form>
      <div className="childhood-result">
        <div className="childhood-preview-heading"><span className="eyebrow">আপনার পোস্টকার্ড</span><span>পছন্দ বদলালে কার্ডও বদলাবে</span></div>
        <div className="childhood-history" role="group" aria-label="পরিবর্তন ফিরিয়ে আনুন"><button type="button" disabled={isDownloading || !history.canUndo} onClick={history.undo}>আগের ধাপ</button><button type="button" disabled={isDownloading || !history.canRedo} onClick={history.redo}>পরের ধাপ</button></div>
        <figure className="childhood-postcard">
          <canvas ref={canvas} width={1200} height={1420} role="img" aria-label="আপনার ছোটবেলার পোস্টকার্ড" aria-describedby="postcard-accessible-content" />
          <figcaption id="postcard-accessible-content" className="childhood-visually-hidden"><strong>{postcard.title}</strong>{postcard.name && <span> — {postcard.name}</span>}<p>{postcard.caption}</p><ul>{postcard.memories.map((memory) => <li key={memory.id}>{memory.label}</li>)}</ul><p>{postcard.invitation}</p></figcaption>
        </figure>
        {previewError && <p className="childhood-error" role="alert">কার্ডের ছবি দেখানো যাচ্ছে না। পাতাটি রিলোড করে আবার চেষ্টা করুন।</p>}
        <div className="childhood-download-actions"><button type="button" className="button" disabled={!selected.length || isDownloading} onClick={downloadCard}><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2v11m-4-4 4 4 4-4M3 14v4h14v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>{isDownloading ? "ছবি তৈরি হচ্ছে…" : "ছবি ডাউনলোড করুন"}</button><button type="button" className="childhood-clear" onClick={clearCard} disabled={isDownloading || (!name && !selected.length)}>সব মুছে ফেলুন</button></div>
        <p className="childhood-download-hint">{selected.length ? "ছবিটি ডাউনলোড করে চাইলে অন্যদের পাঠান।" : "ছবি ডাউনলোড করতে অন্তত একটি স্মৃতি বেছে নিন।"}</p>
        <p className="childhood-export-status" role="status" aria-live="polite">{status}</p>
        <div className="childhood-local-note"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2 3 5v5c0 4 7 8 7 8s7-4 7-8V5l-7-3Z" stroke="currentColor" strokeWidth="1.3" /><path d="m6.5 9.5 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.3" /></svg><span>আপনার নাম ও পছন্দ সার্ভারে পাঠানো বা সংরক্ষণ করা হয় না।</span></div>
      </div>
    </div>
  );
}
