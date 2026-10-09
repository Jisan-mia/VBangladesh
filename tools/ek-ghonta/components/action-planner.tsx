"use client";

import { useState } from "react";
import { createInvitation, getActionPlan } from "../lib/planner";

const TIME_OPTIONS = [10, 30, 60];
const SETTINGS = [
  { value: "home", label: "ঘরে বসে", detail: "নিজের বইগুলো গুছিয়ে নাও" },
  { value: "nearby", label: "নিজের আশপাশে", detail: "ছোট একটা জায়গা পরিষ্কার করো" },
  { value: "friends", label: "চেনা কারো সাথে", detail: "জানা একটা কাজ শিখিয়ে দাও" },
];
const bengaliNumber = new Intl.NumberFormat("bn-BD");

export function ActionPlanner() {
  const [minutes, setMinutes] = useState(10);
  const [setting, setSetting] = useState("home");
  const [copyStatus, setCopyStatus] = useState("");
  const plan = getActionPlan({ minutes, setting });
  if (!plan) return null;
  const invitation = createInvitation(plan);

  async function copyInvitation() {
    try {
      await navigator.clipboard.writeText(invitation);
      setCopyStatus("মেসেজ কপি হয়েছে! এবার মেসেঞ্জার বা হোয়াটসঅ্যাপে পেস্ট করে পাঠাও।");
    } catch {
      setCopyStatus("কপি হলো না। নিচে পুরো মেসেজটা খুলে নিজে কপি করো, বা ফাইল ডাউনলোড করো।");
    }
  }

  function downloadInvitation() {
    const url = URL.createObjectURL(new Blob([invitation], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ভালো-কাজের-মেসেজ.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCopyStatus("ডাউনলোড শুরু হয়েছে। ফোনের ডাউনলোড ফোল্ডারে দেখো।");
  }

  return <div className="action-tool">
    <div className="action-choices">
      <fieldset className="action-fieldset">
        <legend><span>১</span> হাতে কত সময় আছে?</legend>
        <div className="action-time-options">
          {TIME_OPTIONS.map((option) => <label className="action-time-option" key={option}>
            <input type="radio" name="minutes" value={option} checked={minutes === option} onChange={() => { setMinutes(option); setCopyStatus(""); }} />
            <span><strong>{bengaliNumber.format(option)}</strong> মিনিট</span>
          </label>)}
        </div>
        <p className="action-field-hint">সময়টা আন্দাজ। নিজের গতিতে করো, দরকার হলে থামো।</p>
      </fieldset>
      <fieldset className="action-fieldset">
        <legend><span>২</span> কোথায় করবে?</legend>
        <div className="action-setting-options">
          {SETTINGS.map((option) => <label className="action-setting-option" key={option.value}>
            <input type="radio" name="setting" value={option.value} checked={setting === option.value} onChange={() => { setSetting(option.value); setCopyStatus(""); }} />
            <span><strong>{option.label}</strong><small>{option.detail}</small></span>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7" /></svg>
          </label>)}
        </div>
      </fieldset>
      <p className="action-private-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>নাম বা ফোন নম্বর লাগে না, অ্যাকাউন্টও না।</p>
    </div>
    <div className="action-result">
      <div className="action-result-heading" aria-live="polite" aria-atomic="true">
        <div className="action-result-meta"><span>নিজে নিজে</span><span>প্রায় {bengaliNumber.format(plan.minutes)} মিনিট</span></div>
        <h3>{plan.title}</h3>
        <p>{plan.setting} কাজটা করতে পারো।</p>
      </div>
      <p className="action-preparation"><strong>যা লাগবে</strong>{plan.preparation}।</p>
      <ol className="action-steps">
        {plan.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bengaliNumber.format(index + 1)}</span><p>{step}</p></li>)}
      </ol>
      <p className="action-plan-note">{plan.note}</p>
      <div className="action-share">
        <h4>কাউকে সাথে নিতে চাও?</h4>
        <p>কখন-কোথায়, নিজেরা মিলে ঠিক করে নিও।</p>
        <div className="action-share-buttons">
          <button className="button" type="button" onClick={copyInvitation}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></svg>মেসেজটা কপি করো</button>
          <button className="button button-secondary" type="button" onClick={downloadInvitation}>ফাইল ডাউনলোড করো</button>
        </div>
        <p className="action-copy-status" role="status">{copyStatus}</p>
        <details className="action-invitation"><summary>পুরো মেসেজটা দেখো</summary><label className="screen-reader-only" htmlFor="invitation">বন্ধুকে পাঠানোর মেসেজ</label><textarea id="invitation" readOnly value={invitation} rows={9} /></details>
      </div>
    </div>
  </div>;
}
