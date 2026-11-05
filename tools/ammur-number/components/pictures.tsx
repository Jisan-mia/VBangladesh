// Every picture in the game, drawn in code (SVG, no files): the toy phone on the title, each world's backdrop, the eye and the other
// icons, the faces of আম্মু and আব্বু, and the tiny level pictures. Colours come from the world's CSS variables, so one drawing wears
// three palettes. IP: what we avoided — no real phone maker's body, keypad or ringtone, no TV characters; these are our own shapes.
import type { Hide, WorldId } from "../lib/levels";
import type { Who } from "../lib/play";

export function Backdrop({ world, tall = false }: { world: WorldId; tall?: boolean }) {
  return <svg className={`am-backdrop${tall ? " is-tall" : ""}`} viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    {world === 0 && <>
      <circle className="am-bd-c" cx="298" cy="34" r="16" />
      <path className="am-bd-a" d="M0 120V84l26-22 26 22v36zM70 120V76h46v44zM116 76l-23-26-23 26zM136 120V90l22-18 22 18v30zM196 120V70h54v50zM250 70l-27-24-27 24zM262 120V92l20-16 20 16v28zM318 120V80h42v40z" />
      <path className="am-bd-b" d="M92 96h12v24H92zM214 90h14v30h-14zM330 92h12v16h-12z" />
      <path className="am-bd-b" d="M170 120V96M170 96c-14 0-18-14-10-22 4-5 16-5 20 0 8 8 4 22-10 22z" />
    </>}
    {world === 1 && <>
      <path className="am-bd-line" d="M0 22q45 22 90 0t90 0 90 0 90 0" />
      {[18, 58, 100, 140, 182, 224, 266, 308, 346].map((x, at) => <path key={x} className={at % 2 ? "am-bd-c" : "am-bd-b"} d={`M${x - 9} ${at % 2 ? 31 : 27}l9 20 9-20z`} />)}
      <circle className="am-bd-line" cx="286" cy="86" r="30" />
      <path className="am-bd-line" d="M286 56v60M256 86h60M265 65l42 42M307 65l-42 42" />
      <path className="am-bd-a" d="M0 120V100h30v20zM42 120V92h44v28zM98 120V104h24v16z" />
    </>}
    {world === 2 && <>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(at => <path key={at} className={at % 2 ? "am-bd-b" : "am-bd-c"} d={`M${at * 46 - 4} 58h46l-6 26h-34z`} />)}
      <path className="am-bd-a" d="M0 120V84h360v36z" />
      <path className="am-bd-b" d="M18 120V96h30v24zM70 120V100h22v20zM128 120V94h36v26zM190 120V98h28v22zM244 120V94h34v26zM304 120V100h26v20z" />
      <path className="am-bd-line" d="M30 58V30M92 58V36M246 58V26M312 58V34" />
    </>}
  </svg>;
}

/** The toy phone: a case, a little screen with eleven dots in the 5-3-3 rhythm, and a pad. Used big on the title. */
export function PhoneArt({ dots = 11 }: { dots?: number }) {
  const rhythm = [0, 1, 2, 3, 4, -1, 5, 6, 7, -1, 8, 9, 10];
  return <svg className="am-phone-art" viewBox="0 0 200 300" aria-hidden="true">
    <rect className="am-pa-body" x="150" y="0" width="14" height="22" rx="4" />
    <rect className="am-pa-body" x="14" y="6" width="172" height="288" rx="30" />
    <rect className="am-pa-slot" x="76" y="14" width="48" height="5" rx="2.5" />
    <rect className="am-pa-lcd" x="30" y="24" width="140" height="56" rx="6" />
    {rhythm.map((slot, index) => slot < 0
      ? <rect key={index} className="am-pa-gap" x={39 + index * 9.6 + 1} y="53" width="5" height="3" />
      : <circle key={index} className={slot < dots ? "am-pa-dot" : "am-pa-dot is-off"} cx={44 + index * 9.6 + 2} cy="54" r="3.6" />)}
    {Array.from({ length: 12 }, (_, index) => {
      const x = 56 + (index % 3) * 44, y = 118 + Math.floor(index / 3) * 42;
      return <circle key={index} className={index === 9 ? "am-pa-key is-eye" : index === 11 ? "am-pa-key is-call" : "am-pa-key"} cx={x} cy={y} r="17" />;
    })}
  </svg>;
}

export const Eye = ({ shut = false, className = "" }: { shut?: boolean; className?: string }) =>
  <svg className={className} viewBox="0 0 48 32" aria-hidden="true">
    {shut
      ? <path className="am-ico-line" d="M6 14q18 14 36 0M12 21l-3 5M24 24v6M36 21l3 5" />
      : <><path className="am-ico-fill" d="M3 16q21-24 42 0-21 24-42 0z" /><circle className="am-ico-pupil" cx="24" cy="16" r="7" /><circle className="am-ico-spark" cx="26.5" cy="13.5" r="2" /></>}
  </svg>;

export const Handset = ({ className = "" }: { className?: string }) =>
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path className="am-ico-handset" d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg>;

/** A handset put down: for শেষ. */
export const HangUp = ({ className = "" }: { className?: string }) =>
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><path className="am-ico-stroke" d="M6 28c10-9 26-9 36 0l-4 6-8-3v-5c-4-1.5-8-1.5-12 0v5l-8 3z" /></svg>;

export const Replay = ({ className = "" }: { className?: string }) =>
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true"><path className="am-ico-stroke" d="M38 24a14 14 0 1 1-4.1-9.9M35 6v9h-9" /></svg>;

export const Play = ({ className = "" }: { className?: string }) =>
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" /></svg>;

export const Back = ({ className = "" }: { className?: string }) =>
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path className="am-ico-stroke" d="M15 5l-7 7 7 7" /></svg>;

export const Menu = ({ className = "" }: { className?: string }) =>
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path className="am-ico-stroke" d="M5 7h14M5 12h14M5 17h14" /></svg>;

export const Tick = ({ className = "" }: { className?: string }) =>
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path className="am-ico-stroke" d="M4.5 12.5l5 5 10-11" /></svg>;

/** The cue on the screen's corner: watch (the look plays), tap (your turn), done (a piece is in). No words needed. */
export function Cue({ mode }: { mode: "look" | "dial" | "rest" | "ring" }) {
  return <svg className={`am-cue is-${mode}`} viewBox="0 0 32 32" aria-hidden="true">
    {mode === "look" && <><path className="am-ico-fill" d="M2 16q14-16 28 0-14 16-28 0z" /><circle className="am-ico-pupil" cx="16" cy="16" r="5" /></>}
    {mode === "dial" && <path className="am-ico-hand" d="M12 18V7a2.6 2.6 0 0 1 5.2 0v7l6 1a3 3 0 0 1 2.4 3.4l-1 6.4a5 5 0 0 1-5 4.2h-5a5 5 0 0 1-3.8-1.8L6 21.5a2.2 2.2 0 0 1 3.4-2.8z" />}
    {(mode === "rest" || mode === "ring") && <path className="am-ico-stroke" d="M6 17l7 7 13-15" />}
  </svg>;
}

/** The ghost finger: points at the key to press. */
export const Ghost = () =>
  <svg className="am-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#16332a" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;

/** A small face for আম্মু or আব্বু: round head, hair, two dots and a smile. */
export function Face({ who, className = "" }: { who: Who; className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    {who === "ammu"
      ? <><circle className="am-face-hair" cx="24" cy="8" r="6" /><path className="am-face-hair" d="M7 28c0-13 7-19 17-19s17 6 17 19c0 6-3 10-6 12V28H13v12c-3-2-6-6-6-12z" /></>
      : <path className="am-face-hair" d="M9 24c-1-11 6-17 15-17s16 6 15 17c-4-6-10-8-15-8s-11 2-15 8z" />}
    <circle className="am-face-skin" cx="24" cy="27" r="13" />
    <circle className="am-face-ink" cx="19" cy="26" r="1.7" /><circle className="am-face-ink" cx="29" cy="26" r="1.7" />
    <path className="am-face-smile" d="M18.5 32q5.5 5 11 0" />
  </svg>;
}

/** What a level asks, as dots: solid ones show, hollow ones are for you to remember; the eyes below are the looks you have. */
export function MiniLevel({ hide, pieces, eyes, className = "" }: { hide: Hide; pieces: readonly number[]; eyes: number | null; className?: string }) {
  const hidden = hide === "all" ? 11 : hide === "old" ? 5 : 0;
  return <svg className={`am-mini ${className}`} viewBox="0 0 66 36" aria-hidden="true">
    {Array.from({ length: 11 }, (_, index) => <circle key={index} className={index < hidden ? "am-mini-dot is-hollow" : "am-mini-dot"} cx={5 + index * 5.6} cy="10" r="2.2" />)}
    {pieces.slice(0, -1).map(cut => <rect key={cut} className="am-mini-cut" x={5 + cut * 5.6 - 3.4} y="5" width="1.2" height="10" />)}
    {eyes === null ? <path className="am-mini-more" d="M20 28c0-5 5-5 8 0s8 5 8 0-5-5-8 0-8 5-8 0z" /> : Array.from({ length: eyes }, (_, index) =>
      <g key={index} transform={`translate(${33 - eyes * 7 + index * 14} 21)`}><path className="am-mini-eye" d="M0 7q6-8 12 0-6 8-12 0z" /><circle className="am-mini-pupil" cx="6" cy="7" r="2" /></g>)}
  </svg>;
}
