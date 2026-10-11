"use client";

import { useEffect, useRef, useState } from "react";
import { parseShareHash } from "../lib/cheque";
import { parseKhataHash } from "../lib/khata";
import { ChequeBuilder } from "./cheque-builder";
import { KhataBuilder } from "./khata-builder";

type Tab = "cheque" | "khata";

/** The cheque stays the first screen; the খাতা is a separate, simple mode. A shared link opens whichever it belongs to. */
export function SalamiTool() {
  const [tab, setTab] = useState<Tab>("cheque");
  const switched = useRef(false);

  useEffect(() => {
    // In-page anchors (#result) also change the hash; only a real link picks the tab.
    const read = () => {
      if (parseKhataHash(window.location.hash)) setTab("khata");
      else if (parseShareHash(window.location.hash)) setTab("cheque");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  // The switch is re-rendered inside the other builder, so hand keyboard focus back to it.
  useEffect(() => {
    if (switched.current) document.querySelector<HTMLElement>(".sc-switch [aria-pressed=true]")?.focus();
  }, [tab]);

  const choose = (next: Tab) => { switched.current = true; setTab(next); };
  const switcher = (
    <div className="sc-switch" role="group" aria-label="কী করবে?">
      <button type="button" aria-pressed={tab === "cheque"} onClick={() => choose("cheque")}>চেক বানাও</button>
      <button type="button" aria-pressed={tab === "khata"} onClick={() => choose("khata")}>খাতা লেখো</button>
    </div>
  );
  return tab === "cheque" ? <ChequeBuilder switcher={switcher} /> : <KhataBuilder switcher={switcher} />;
}
