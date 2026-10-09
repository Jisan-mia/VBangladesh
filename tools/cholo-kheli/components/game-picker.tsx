"use client";

import { useState } from "react";
import { createGameInvitation, findGames, parsePlayerCount } from "../lib/games";

const SPACES = [
  { value: "seated", label: "বসে খেলার জায়গা", detail: "ঘরে বা বাইরে ছায়ায়" },
  { value: "courtyard", label: "সমতল আঙিনা", detail: "লাফ দেওয়ার খালি জায়গা" },
  { value: "field", label: "প্রশস্ত মাঠ", detail: "বাধা ছাড়া দৌড়ানো যায়" },
];
const EQUIPMENT = [{ value: "paper", label: "কাগজ ও কলম" }, { value: "chalk", label: "চক" }, { value: "marker", label: "চ্যাপ্টা, ধারহীন গুটি" }];
const number = new Intl.NumberFormat("bn-BD");

export function GamePicker() {
  const [people, setPeople] = useState("৪");
  const [space, setSpace] = useState("seated");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("word-relay");
  const [notice, setNotice] = useState("");
  const players = parsePlayerCount(people);
  const matches = players === null ? [] : findGames({ players, space, equipment });
  const selectedGame = matches.find((game) => game.id === selectedId) ?? matches[0];
  const invitation = selectedGame && players !== null ? createGameInvitation(selectedGame, players) : "";

  async function copyInvitation() {
    try {
      await navigator.clipboard.writeText(invitation);
      setNotice("আমন্ত্রণ কপি হয়েছে। এখন বন্ধুদের পাঠাতে পারেন।");
    } catch {
      setNotice("কপি করা যায়নি। নিচে পুরো লেখা খুলে নিজে কপি করুন বা ফাইল ডাউনলোড করুন।");
    }
  }

  function downloadInvitation() {
    const url = URL.createObjectURL(new Blob([invitation], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "চলো-খেলি-আমন্ত্রণ.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("আমন্ত্রণের ফাইল প্রস্তুত। ব্রাউজারের ডাউনলোডের তালিকা দেখুন।");
  }

  return <div className="play-picker">
    <div className="play-filters">
      <div className="play-count-filter"><label htmlFor="players"><span className="play-step-index">১</span> কতজন খেলবেন?</label><div className="play-count-input"><input id="players" inputMode="numeric" value={people} maxLength={4} onChange={(event) => { setPeople(event.target.value); setNotice(""); }} aria-invalid={players === null} aria-describedby="players-hint" /><span>জন</span></div><p id="players-hint" className={players === null ? "play-input-error" : "play-filter-hint"}>{players === null ? "২ থেকে ১৬-এর মধ্যে একটি পূর্ণ সংখ্যা লিখুন। বাংলা বা ইংরেজি অঙ্ক ব্যবহার করতে পারেন।" : "২–১৬ জন · বাংলা বা ইংরেজি অঙ্কে"}</p></div>
      <fieldset className="play-space-filter"><legend><span className="play-step-index">২</span> কোথায় খেলবেন?</legend><div className="play-space-options">{SPACES.map((option) => <label key={option.value}><input type="radio" name="space" value={option.value} checked={space === option.value} onChange={() => { setSpace(option.value); setNotice(""); }} /><span><strong>{option.label}</strong><small>{option.detail}</small></span></label>)}</div></fieldset>
      <fieldset className="play-equipment-filter"><legend><span className="play-step-index">৩</span> হাতে কী আছে?</legend><p className="play-filter-hint">যা আছে, সেগুলোতে টিক দিন।</p>{EQUIPMENT.map((option) => <label key={option.value}><input type="checkbox" checked={equipment.includes(option.value)} onChange={(event) => { setEquipment(event.target.checked ? [...equipment, option.value] : equipment.filter((item) => item !== option.value)); setNotice(""); }} /><span>{option.label}</span></label>)}<p className="play-filter-hint play-supply-note">কিছু না থাকলে কোনো ঘরে টিক দেবেন না।</p></fieldset>
    </div>

    <div className="play-matches-heading" aria-live="polite" aria-atomic="true"><p>{players === null ? "কতজন খেলবেন, ঠিক করে লিখুন" : `${number.format(matches.length)}টি খেলা মিলেছে`}</p><span>{players !== null && `${number.format(players)} জনের জন্য · নিজেরা আয়োজন করুন`}</span></div>
    {selectedGame ? <div className="play-results">
      <ul className="play-game-options" aria-label="আপনাদের জন্য মিলে যাওয়া খেলা">{matches.map((game, index) => <li key={game.id}><button type="button" aria-pressed={selectedGame.id === game.id} aria-controls="game-rules" onClick={() => { setSelectedId(game.id); setNotice(""); }}><span className="play-game-number">{number.format(index + 1).padStart(2, "০")}</span><span><strong>{game.title}</strong><small>{game.duration} · {game.movement}</small></span><span className="play-game-arrow" aria-hidden="true">↗</span></button></li>)}</ul>
      <article className="play-rule-sheet" id="game-rules" aria-labelledby="chosen-game-title">
        <div className="play-sheet-topline"><span>চলো খেলি / নিয়মের পাতা</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.5 6 6.5.5-5 4 1.5 7-5.5-4-5.5 4 1.5-7-5-4L9.5 9 12 3Z" /></svg></div>
        <h3 id="chosen-game-title">{selectedGame.title}</h3><p className="play-game-summary">{selectedGame.summary}</p>
        <dl className="play-game-facts"><div><dt>কতজন</dt><dd>{number.format(selectedGame.minPlayers)}–{number.format(selectedGame.maxPlayers)} জন{selectedGame.evenTeams && " · সমান দুই দল"}</dd></div><div><dt>সময়</dt><dd>{selectedGame.duration}</dd></div><div><dt>যা লাগবে</dt><dd>{selectedGame.supplies}</dd></div></dl>
        <p className="play-variant"><strong>এখানে যেভাবে খেলবেন:</strong> {selectedGame.variant}।</p>
        <h4>খেলার নিয়ম</h4><ol className="play-game-rules">{selectedGame.rules.map((rule, index) => <li key={rule}><span aria-hidden="true">{number.format(index + 1)}</span><p>{rule}</p></li>)}</ol>
        <div className="play-ending"><strong>শেষ হবে যেভাবে</strong><p>{selectedGame.ending}</p></div>
        <p className="play-care"><strong>খেয়াল রাখুন</strong>{selectedGame.care}</p>
        {selectedGame.source && <p className="play-source"><a href={selectedGame.source.url} rel="external">{selectedGame.source.title} <span aria-hidden="true">↗</span></a><br />লিংকে মূল খেলার পরিচিতি পাবেন। এখানে দেওয়া সহজ নিয়ম ও সময় এলাকাভেদে আলাদা হতে পারে।</p>}
        <div className="play-invite"><h4>বন্ধুদের আমন্ত্রণ জানান</h4><p>সময় ও জায়গা নিজেদের মধ্যে ঠিক করে নিন।</p><div className="play-invite-buttons"><button className="button" onClick={copyInvitation} type="button">আমন্ত্রণ কপি করুন <span aria-hidden="true">↗</span></button><button className="button button-secondary" onClick={downloadInvitation} type="button">ফাইল ডাউনলোড করুন</button></div><p className="play-copy-notice" role="status">{notice}</p><details><summary>আমন্ত্রণের পুরো লেখা দেখুন</summary><label className="screen-reader-only" htmlFor="game-invitation">খেলার আমন্ত্রণ</label><textarea id="game-invitation" readOnly value={invitation} rows={8} /></details></div>
      </article>
    </div> : <div className="play-empty"><span className="play-empty-mark" aria-hidden="true">?</span><div><h3>{players === null ? "আগে কতজন খেলবেন লিখুন" : "এই পছন্দ অনুযায়ী খেলা মেলেনি"}</h3><p>{players === null ? "ওপরের ঘরে ২ থেকে ১৬-এর মধ্যে একটি পূর্ণ সংখ্যা লিখুন।" : "এখানে অল্প কয়েকটি খেলা আছে। বড় দল হলে ছোট দলে ভাগ হয়ে প্রতি দলের সংখ্যা দিয়ে আবার খুঁজুন। আপনাদের যে জায়গা ও সরঞ্জাম আছে, সেগুলোই বেছে নিন।"}</p></div></div>}
  </div>;
}
