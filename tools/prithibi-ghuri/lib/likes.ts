// One small picture for each country's "আমাদের মতোই" card, so the card says its fact without words. Drawn in the same
// 64×64 ink style as lib/art.ts. A key of the form `<country>:<kind>` borrows that country's own picture.
import { INK, PICS } from "./art";

const SKY = `<rect width="64" height="64" fill="#cfe6f2" stroke="none"/>`;
const WARM = `<rect width="64" height="64" fill="#fbe7bf" stroke="none"/>`;

export const LIKE_PICS: Readonly<Record<string, string>> = {
  rice: `${WARM}<path d="M6 36h52c0 13-11 22-26 22S6 49 6 36z" fill="#c9a050"/><path d="M11 36c0-13 9-20 21-20s21 7 21 20z" fill="#fbfaf4"/>
    <path d="M22 28l2-3M30 24l1-3M38 27l2-3M28 32l2-2M42 31l2-2M18 33l2-1" fill="none" stroke="#b8a77a" stroke-width="1.4"/>`,
  river: `${SKY}<path d="M2 24c8-6 12 6 20 0s12 6 20 0 12 6 20 0M2 54c8-6 12 6 20 0s12 6 20 0 12 6 20 0" fill="none" stroke="#2a74b8" stroke-width="3"/>
    <path d="M14 44h36l-6 9H20z" fill="#b5541b"/><path d="M32 44V28l10 12z" fill="#fbfaf4"/><path d="M32 28v16" fill="none"/>`,
  fish: `${SKY}<path d="M8 32c8-12 24-14 34-4l12-8v24l-12-8C32 46 16 44 8 32z" fill="#e08a3a"/><path d="M20 24c4 4 4 12 0 16" fill="none"/>
    <circle cx="16" cy="30" r="2.4" fill="#fff"/><circle cx="16" cy="30" r="1" fill="${INK}" stroke="none"/><path d="M30 24v16M37 26v12" fill="none" stroke="#b8651f" stroke-width="1.2"/>`,
  rain: `${SKY.replace("#cfe6f2", "#dfe6ee")}<path d="M16 34c-6 0-10-4-10-9s4-8 9-8c1-6 7-10 14-10 8 0 14 5 15 12 6 0 10 4 10 9s-4 6-9 6z" fill="#ffffff"/>
    <path d="M18 42l-3 8M30 42l-3 8M42 42l-3 8M24 52l-3 8M36 52l-3 8M48 52l-3 8" fill="none" stroke="#2a74b8" stroke-width="3"/>`,
  cricket: `${WARM}<rect x="30" y="4" width="11" height="38" rx="3" transform="rotate(24 35 23)" fill="#e2c27a"/><rect x="33" y="38" width="5" height="16" rx="2" transform="rotate(24 35 46)" fill="#7a4b2a"/>
    <circle cx="16" cy="50" r="9" fill="#c9302c"/><path d="M9 47c4 2 10 2 14 0M9 53c4-2 10-2 14 0" fill="none" stroke="#fff" stroke-width="1.4"/>`,
  palm: `${WARM}<rect x="20" y="30" width="26" height="26" rx="8" fill="#e7b48a"/><rect x="20" y="10" width="6" height="26" rx="3" fill="#e7b48a"/><rect x="28" y="6" width="6" height="30" rx="3" fill="#e7b48a"/>
    <rect x="36" y="9" width="6" height="28" rx="3" fill="#e7b48a"/><path d="M44 30c6-4 12 0 8 8l-6 8" fill="#e7b48a"/>`,
  speech: `${WARM}<path d="M8 12h48v30H30l-10 10v-10H8z" fill="#fff"/><rect x="14" y="19" width="20" height="12" fill="#006a4e" stroke-width="1.2"/><circle cx="23" cy="25" r="3.4" fill="#f42a41" stroke="none"/>
    <path d="M40 22h10M40 29h10" fill="none"/>`,
  sweet: `${WARM}<ellipse cx="32" cy="48" rx="26" ry="8" fill="#fff"/><circle cx="21" cy="38" r="10" fill="#b5651f"/><circle cx="43" cy="38" r="10" fill="#b5651f"/><circle cx="32" cy="27" r="10" fill="#c97a2a"/>
    <path d="M26 23c2-3 5-4 8-3M16 34c1-2 3-3 5-3M38 34c1-2 3-3 5-3" fill="none" stroke="#f6d28a" stroke-width="2"/>`,
  bowl: `${WARM}<path d="M6 34h52c0 14-11 24-26 24S6 48 6 34z" fill="#f4f1ea"/><ellipse cx="32" cy="34" rx="26" ry="7" fill="#e9b84a"/>
    <circle cx="20" cy="33" r="3" fill="#fbfaf4"/><circle cx="30" cy="35" r="3" fill="#fbfaf4"/><circle cx="41" cy="32" r="3" fill="#fbfaf4"/><path d="M24 30c1-3 2-4 4-5M36 30c1-3 2-4 4-5" fill="none"/>`,
  sign: `${SKY}<rect x="29" y="30" width="6" height="32" fill="#8c8478"/><rect x="6" y="8" width="52" height="26" fill="#006a4e"/><circle cx="29" cy="21" r="8" fill="#f42a41"/>
    <path d="M10 12h6M48 12h6M10 30h6M48 30h6" fill="none" stroke="#fff" stroke-width="2"/>`,
  drop: `${SKY}<path d="M32 2c8 12 14 20 14 28a14 14 0 0 1-28 0c0-8 6-16 14-28z" fill="#e8a23b"/><path d="M26 32c0 4 2 7 5 8" fill="none" stroke="#fff3d6" stroke-width="2.4"/>
    <path d="M14 62V50h36v12z" fill="#7a4b2a"/><path d="M12 50h40" fill="none"/>`,
};

/** The picture for a country's like card: our own drawing from `LIKE_PICS`, or a borrowed `<country>:<kind>` from lib/art.ts. */
export const likeMarkup = (key: string) => LIKE_PICS[key] ?? PICS[key] ?? "";

/** Which picture each country's like fact uses. */
export const LIKE_OF: Readonly<Record<string, string>> = {
  in: "speech", np: "river", bt: "rice", mm: "fish", my: "rain", sg: "sg:animal", cn: "rice", jp: "fish", au: "cricket",
  sa: "speech", ae: "sweet", eg: "bowl", ke: "palm", it: "rice", gb: "sign", ca: "drop", us: "sign", br: "bowl",
};

export const likeDocument = (key: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${likeMarkup(key)}</g></svg>`;
