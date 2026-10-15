// Our own code art: the shop balance's weights, fruits and a paper ঠোঙা. No photos, no characters.
import type { ReactNode } from "react";
import type { FruitId } from "../lib/game";

const art = (children: ReactNode) => <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">{children}</svg>;

/** A cast-iron বাটখারা with a ring on top. The number is drawn by the caller in HTML so Bangla digits use the site font. */
export const WeightArt = () => art(<>
  <path d="M19 9a5 5 0 0 1 10 0" fill="none" stroke="#3b3f47" strokeWidth="3.4" strokeLinecap="round" />
  <path d="M12 13h24l6 28a3 3 0 0 1-3 3.5H9A3 3 0 0 1 6 41z" fill="#555b66" />
  <path d="M12 13h24l1 5H11z" fill="#6b7280" />
</>);

export const FRUIT_ART: Record<FruitId, () => ReactNode> = {
  lichu: () => art(<>
    <path d="M24 14c1-4 3-6 6-7" stroke="#6b4a1c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx="24" cy="28" r="14" fill="#c8323c" />
    {[[18, 22], [26, 20], [30, 28], [22, 31], [17, 33], [28, 36]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" fill="#9e1f2b" />)}
  </>),
  peyara: () => art(<>
    <path d="M24 8c-3 4-9 8-11 16-3 10 3 18 11 18s14-8 11-18C33 16 27 12 24 8z" fill="#9cc43c" />
    <path d="M24 9c3-3 7-4 10-3-2 4-6 5-10 3z" fill="#4f8f3a" />
    <circle cx="20" cy="27" r="1.4" fill="#7da22a" /><circle cx="28" cy="32" r="1.4" fill="#7da22a" />
  </>),
  aam: () => art(<>
    <path d="M14 18c4-8 17-9 22-1 5 9 0 22-11 24-9 1-15-7-13-14 1-4 3-5 2-9z" fill="#f4b53f" />
    <path d="M14 18c4-8 12-9 17-6-6 1-11 5-12 13-1 4 0 8 2 12-6-3-9-8-8-12 1-4 2-5 1-7z" fill="#9bbd3d" opacity=".8" />
    <path d="M27 11c3-5 8-6 12-5-2 5-7 7-12 5z" fill="#4f8f3a" />
  </>),
  pepe: () => art(<>
    <ellipse cx="24" cy="27" rx="12" ry="17" fill="#f39a2b" />
    <path d="M14 18c2-6 6-8 10-8s8 2 10 8c-3-2-6-3-10-3s-7 1-10 3z" fill="#6aa23c" />
    <path d="M19 26c1 6 2 10 5 13" stroke="#e07f1a" strokeWidth="2" fill="none" strokeLinecap="round" />
  </>),
  kola: () => art(<>
    <path d="M9 14c0 15 9 26 26 26 4 0 6-2 4-3-16-1-23-11-24-23z" fill="#f5d24a" />
    <path d="M15 14c1 12 8 22 24 23l-2 2C21 39 12 29 11 14z" fill="#e2b726" />
    <path d="M9 14l1-6 5 1-0 5z" fill="#6b5a1c" />
  </>),
  anaros: () => art(<>
    <path d="M24 17l-4-11 4 5 4-5-4 11zm-2 0L12 9l6 2zm4 0l10-8-6 2z" fill="#4f8f3a" />
    <ellipse cx="24" cy="31" rx="11" ry="14" fill="#e2a33a" />
    <path d="M15 24l18 14M15 32l14 11M18 19l15 12M33 24L15 38M33 32L19 43M30 19L15 31" stroke="#b97a1e" strokeWidth="1.6" />
  </>),
  komola: () => art(<>
    <circle cx="24" cy="28" r="15" fill="#f39a1e" />
    <path d="M24 13c3-5 8-6 11-5-2 5-7 6-11 5z" fill="#4f8f3a" />
    {[[19, 24], [28, 22], [30, 31], [21, 34], [25, 28]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.2" fill="#d97c0c" />)}
  </>),
  dab: () => art(<>
    <path d="M10 26c0-11 6-17 14-17s14 6 14 17-6 17-14 17-14-6-14-17z" fill="#4f8f3a" />
    <path d="M17 12c2-3 4-4 7-4s5 1 7 4c-2 1-4 2-7 2s-5-1-7-2z" fill="#d8c27a" />
    <path d="M16 22c-1 6 0 11 3 15" stroke="#6fae52" strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </>),
};

/** A paper ঠোঙা with a star: the unknown in a picture equation. */
export const StarBagArt = () => art(<>
  <path d="M11 13h26l-3 31H14z" fill="#d8a965" />
  <path d="M11 13h26l-1 5H12z" fill="#b98845" />
  <path d="M24 22l2.6 5.4 5.9.8-4.3 4.1 1 5.8L24 35.3l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#fff6d8" stroke="#8a5d22" strokeWidth="1.2" strokeLinejoin="round" />
</>);

/** The shop balance's stand: a post, a base and the little frame the needle (কাঁটা) points into. */
export const Stand = () => <svg className="dp-stand" viewBox="0 0 120 200" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
  <path d="M46 2h28l-4 26H50z" fill="none" stroke="#8a5d22" strokeWidth="4" strokeLinejoin="round" />
  <path d="M60 4v6" stroke="#8a5d22" strokeWidth="3" strokeLinecap="round" />
  <rect x="55" y="28" width="10" height="150" rx="4" fill="#9a6a2c" />
  <path d="M20 196c0-14 18-20 40-20s40 6 40 20z" fill="#7a5222" />
</svg>;

/** The three cords from the beam's hook down to a pan's rim. */
export const Strings = () => <svg className="dp-strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path d="M3 100L50 0l47 100M50 0v100" fill="none" stroke="#8a5d22" strokeWidth="2" vectorEffect="non-scaling-stroke" />
</svg>;

export function Ghost() {
  return <svg className="dp-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}
