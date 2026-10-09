import type { ReactNode } from 'react';
import type { ObjectKind } from '../lib/scene';

const art: Record<ObjectKind, ReactNode> = {
  house: <>
    <ellipse cx="7" cy="-5" rx="97" ry="22" fill="#5c6449" opacity=".14"/>
    <path d="m-79-83 95-31 72 47v55L-8 20-79-26Z" fill="#d39a60" stroke="#715b42" strokeWidth="1.8"/>
    <path d="m-8-36 96-31v55L-8 20Z" fill="#b88051"/><path d="m-79-83 71 47v56l-71-46Z" fill="#e2b478"/>
    <path d="m-97-92 88-68 108 66-103 63Z" fill="#6e9997" stroke="#496d6a" strokeWidth="2"/>
    <path d="m-97-92 93 61 103-63-11 14L-4-17l-98-63Z" fill="#527e7c"/>
    <path d="m-9-160 5 129M-75-91l72 48m-52-61 50 34m-29-51 30 20m22-36L3-42m35-82L24-56m35-55L44-69m35-29L65-80" stroke="#afc9be" strokeWidth="2" opacity=".7"/>
    <path d="m-62-46 30 19v35l-30-19Z" fill="#6d5b44" stroke="#795f41" strokeWidth="2"/>
    <path d="m-57-42 19 12v28l-19-12Z" fill="#97734c"/><circle cx="-40" cy="-13" r="2" fill="#dec39b"/>
    <path d="m17-28 34-12v26L17-2Z" fill="#405e59" stroke="#edc887" strokeWidth="3"/>
    <path d="m34-32 0 25M18-16l32-11" stroke="#bad0bb" strokeWidth="2"/>
    <path d="m-71-6 43 26 13-4-43-26Z" fill="#b19675"/><path d="m65-46 0 43" stroke="#956c46" strokeWidth="2"/>
  </>,
  tree: <>
    <ellipse cx="9" cy="0" rx="66" ry="21" fill="#5e764a" opacity=".17"/>
    <path d="M-8 2c5-49 8-95-7-136l25-5c-9 49 7 85 5 141l-12-5Z" fill="#946b42" stroke="#705333" strokeWidth="2"/>
    <path d="m0-58-38-59m44 35 43-50M0-15l2-62" stroke="#735835" strokeWidth="7" strokeLinecap="round"/>
    <path d="M-64-113c-27-13-26-41-10-52 3-26 29-35 51-25 11-29 47-22 57-5 34-5 52 18 44 39 19 15 8 39-7 44-1 18-30 24-46 13-22 17-51 6-56-2-19 8-31 1-33-12Z" fill="#588953"/>
    <path d="M-62-120c-18-15-13-30 2-39 4-26 31-29 47-17 17-18 43-10 47 7 24-2 37 13 32 32-23 9-31-1-45 8-15 14-37 1-45 1-14 12-27 14-38 8Z" fill="#77a262"/>
    <path d="M-40-169c11-3 17 0 22 5M16-184c11 0 17 4 19 10M46-146c9-3 14-1 18 3M-66-134c6-4 11-4 17 0M-1-114c9 3 15 2 20-4" stroke="#92b276" strokeWidth="4" strokeLinecap="round"/>
    <ellipse cx="-35" cy="-142" rx="5" ry="8" fill="#d6bd5b" transform="rotate(22 -35 -142)"/><ellipse cx="29" cy="-121" rx="5" ry="8" fill="#d8b855" transform="rotate(-18 29 -121)"/><ellipse cx="48" cy="-169" rx="4" ry="7" fill="#d7c46a"/>
    <path d="m-17 7 18-10 23 6" stroke="#88713f" strokeWidth="2" strokeLinecap="round"/>
  </>,
  tubewell: <>
    <ellipse cy="3" rx="46" ry="15" fill="#526549" opacity=".15"/><path d="m-42-4 47-17 36 21L-4 18Z" fill="#9fa69a" stroke="#778576" strokeWidth="1.6"/><path d="m-42-4 38 22 45-18v8L-4 26-42 3Z" fill="#7f9182"/>
    <ellipse cy="0" rx="14" ry="6" fill="#566d5c"/><path d="M-9-3v-65l16-4v67Z" fill="#4e8e80" stroke="#3e6c62" strokeWidth="2"/><path d="m-9-68 9-6 13 7-9 5Z" fill="#8ac3ab"/>
    <path d="M-5-60h-18v17h9v-9h14" fill="none" stroke="#4e8e80" strokeWidth="9" strokeLinejoin="round"/>
    <path d="M4-70v-19m0 2 28-18 5 5-26 26" fill="#6f9787" stroke="#3e6c62" strokeWidth="3" strokeLinejoin="round"/><circle cx="6" cy="-78" r="4" fill="#d2c18e"/>
    <path d="M-24-33c-1 8-2 12-1 19" stroke="#9bc9c0" strokeWidth="3" strokeLinecap="round"/><path d="m-39 0 12-3 18 8" fill="none" stroke="#acc7bc" strokeWidth="2"/>
  </>,
  mat: <>
    <path d="m-75-12 91-46 61 34-91 49Z" fill="#778761" opacity=".18"/><path d="m-73-18 87-43 60 33-87 46Z" fill="#ddbd71" stroke="#ad8949" strokeWidth="1.8"/>
    <path d="m-61-19 74-36 49 28-74 39Z" fill="none" stroke="#9f6e54" strokeWidth="5"/><path d="m-49-19 61-29 37 22L-12 6Z" fill="none" stroke="#ebd394" strokeWidth="2"/>
    <path d="m-45-21 49 29m-34-37 49 30m-34-37 49 29m-33-37 48 29m-69-7 64-32m-52 39 64-33m-52 40 64-33" stroke="#b59151" strokeWidth="1" opacity=".6"/>
    <path d="m-73-18-7 3m16 3-7 3m16 3-7 3m16 3-7 3m16 3-7 3m16 3-7 3" stroke="#bc9b57" strokeWidth="2"/>
  </>,
  stool: <>
    <ellipse cy="1" rx="37" ry="13" fill="#766541" opacity=".13"/><path d="M-29-39c3 16 5 29 2 38 17 14 42 11 56-2-3-12-2-24 2-38Z" fill="#c59959" stroke="#8f6b40" strokeWidth="1.6"/>
    <path d="m-27-34 48 32m-49-17L9 6m-28-44 47 31M-4-41l33 24m-50 19 48-37M-7 8l35-29m-55 9 34-27" stroke="#e0bd7a" strokeWidth="3"/>
    <ellipse cy="-42" rx="33" ry="17" fill="#e2c389" stroke="#98703d" strokeWidth="2"/><ellipse cy="-42" rx="25" ry="10" fill="none" stroke="#bd945b" strokeWidth="2"/><path d="M-22-46h44m-42 7h41m-32-11 2 17m10-20 2 20m10-20 2 20" stroke="#c49b63" strokeWidth="1.2"/>
  </>,
  kite: <>
    <ellipse cx="8" cy="2" rx="28" ry="9" fill="#6d714c" opacity=".11"/>
    <path d="M9-146c-40 43 30 52 4 87C-1-40-18-25-11-3" fill="none" stroke="#806f58" strokeWidth="1.4"/>
    <path d="m2-190 40 32-22 48-48-28Z" fill="#cc7960" stroke="#9f6151" strokeWidth="1.4"/><path d="m2-190 7 42 33-10Z" fill="#ebc567"/><path d="m9-148 11 38-48-28Z" fill="#7ba4a1"/><path d="m2-190 18 80m-48-28 70-20" stroke="#f3dfb0" strokeWidth="1.4"/>
    <path d="M20-111c-9 15 13 15 4 30s10 20 1 31" fill="none" stroke="#bb6b58" strokeWidth="2"/><path d="m17-94 11-4-1 11-10-5m3 19 10-4-1 11-9-5" fill="#d09a64"/>
    <path d="m-23-1 21-8 19 10-20 8Z" fill="#9d7653"/><path d="m-5-4 2 13m-4-13 4 12" stroke="#e3d4a9" strokeWidth="2"/>
  </>,
  plant: <>
    <ellipse cy="2" rx="35" ry="11" fill="#64764c" opacity=".13"/><path d="m-27-40 7 39c10 11 29 11 39 0l8-39Z" fill="#c78361" stroke="#99644a" strokeWidth="1.6"/><ellipse cy="-40" rx="29" ry="11" fill="#dea181" stroke="#99644a" strokeWidth="1.6"/><ellipse cy="-41" rx="22" ry="7" fill="#796a46"/>
    <path d="M0-43v-49m2 30-20-12m19 6 25-12" stroke="#587e45" strokeWidth="3"/>
    <path d="M-3-55c-28 2-37-10-35-18 16-5 30 0 35 18Zm4-8c27 0 40-14 34-23C16-85 6-78 1-63ZM0-72c-17-15-15-28-4-30C5-94 6-83 0-72Z" fill="#7a9d59"/>
    <path d="M-17-77c-12-12-2-21 5-13 9-9 18-1 7 12 10 13-2 19-8 11-8 8-17-1-4-10Z" fill="#d68e91"/><circle cx="-12" cy="-77" r="5" fill="#e6c777"/>
    <path d="M24-90c-9-9-2-15 4-10 7-6 13 1 5 9 8 8 0 14-5 8-6 6-13-1-4-7Z" fill="#dfb56b"/><circle cx="29" cy="-91" r="3" fill="#b47a59"/>
    <path d="m-18-24 4 20" stroke="#e9ac83" strokeWidth="3" strokeLinecap="round"/>
  </>,
  clothesline: <>
    <ellipse cy="-1" rx="91" ry="18" fill="#6d6e4f" opacity=".1"/><path d="M-77-5v-140M79-6v-123" stroke="#9a805a" strokeWidth="5" strokeLinecap="round"/><path d="M-76-140c49 15 103 22 155 7" fill="none" stroke="#766d55" strokeWidth="2"/>
    <path d="m-54-132 44 9-3 53-44-9Z" fill="#dfac70" stroke="#b98f5e" strokeWidth="1.4"/><path d="m-48-130-3 53m14-50-3 54m15-51-3 53" stroke="#f2ce93" strokeWidth="3"/>
    <path d="m7-121 10-8 16 2 13 15-11 9-5-7 1 37-28-3 2-37-7 5-8-10Z" fill="#88aea4" stroke="#668d82" strokeWidth="1.4"/><path d="m17-128 0 8 9 1 6-9" fill="none" stroke="#bfd3bf" strokeWidth="2"/>
    <path d="m53-128 21-3-1 33-22 2Z" fill="#c58b87"/><path d="m-49-139-1 14m34-8-2 15m31-15v13m25-10-2 13m20-14v11" stroke="#8a7053" strokeWidth="4" strokeLinecap="round"/>
  </>,
  tank: <>
    <ellipse cy="4" rx="62" ry="19" fill="#4d6060" opacity=".13"/><path d="m-48-21 2 26m84-23 3 24" stroke="#858c84" strokeWidth="7"/><path d="M-58-110v80c1 29 110 30 113 0v-80Z" fill="#667a78" stroke="#425d5b" strokeWidth="2"/>
    <ellipse cy="-112" rx="57" ry="23" fill="#809591" stroke="#476662" strokeWidth="2"/><ellipse cy="-114" rx="44" ry="15" fill="#718884"/><path d="M-53-91c25 22 80 22 107 0m-107 20c27 22 80 22 107 0m-107 20c27 22 80 22 107 0m-107 19c28 22 80 22 107 0" fill="none" stroke="#91a29a" strokeWidth="4"/>
    <path d="M-15-134v-10c8-7 29-7 35 0v10" fill="#526f6b"/><ellipse cx="2" cy="-144" rx="18" ry="7" fill="#859b92" stroke="#4d6b64" strokeWidth="1.6"/>
    <path d="M51-37h14v40" fill="none" stroke="#9ba79b" strokeWidth="5" strokeLinejoin="round"/>
    <path d="M-41-109v59" stroke="#a3b6a7" strokeWidth="3" opacity=".4"/>
  </>,
  chair: <>
    <ellipse cy="0" rx="41" ry="13" fill="#6b6348" opacity=".12"/><path d="m-28-37-3 38m52-46 8 41m5-52 5 34" stroke="#9c7145" strokeWidth="5" strokeLinecap="round"/>
    <path d="m-33-51 1-46c2-19 50-22 60-4l2 51" fill="#d5b47b" stroke="#9a7249" strokeWidth="3"/>
    <path d="m-22-98 0 43m11-48 0 42m11-42 1 37m10-35 2 31m10-29 2 25" stroke="#ae8956" strokeWidth="2"/>
    <path d="m-37-51 44-17 35 23-44 19Z" fill="#e0c28c" stroke="#a68150" strokeWidth="2"/>
    <path d="m-30-48 27 17m-17-21 27 18m-15-22 29 17m-16-22 30 17" stroke="#c19e69" strokeWidth="1.3"/>
    <path d="M-35-51v-22l20 7M37-46v-22l-18-8" fill="none" stroke="#ac8251" strokeWidth="4" strokeLinecap="round"/>
  </>,
  cat: <>
    <ellipse cy="3" rx="38" ry="10" fill="#7a6848" opacity=".15"/><path d="M15-4c33 7 37-15 22-23" fill="none" stroke="#b78457" strokeWidth="11" strokeLinecap="round"/><ellipse cx="3" cy="-17" rx="29" ry="17" fill="#cc996b"/><path d="m-27-27-4-24 12 9 14-2 11-11 2 24c5 20-30 27-35 4Z" fill="#d6aa7b" stroke="#a77a53" strokeWidth="1.5"/>
    <path d="m-25-44 4 8m20-5-4 6" stroke="#d9b0a0" strokeWidth="3"/><path d="m-18-26 3 1m15-2 3-1" stroke="#63513f" strokeWidth="2.5" strokeLinecap="round"/><path d="m-10-20 3 0-1 3Z" fill="#a46e66"/><path d="m-26-21-13-2m14 7-13 3m40-13 13-3m-11 9 13 2" stroke="#80664b" strokeWidth="1"/><path d="M8-29v9m10-6v8M-16-8v6m15-9v8" stroke="#ab764e" strokeWidth="3" strokeLinecap="round"/>
  </>,
  bicycle: <>
    <ellipse cy="1" rx="81" ry="17" fill="#6a704f" opacity=".12"/><circle cx="-50" cy="-27" r="28" fill="#e2d8b8" fillOpacity=".25" stroke="#5a6357" strokeWidth="4"/><circle cx="52" cy="-25" r="28" fill="#e2d8b8" fillOpacity=".25" stroke="#5a6357" strokeWidth="4"/>
    <path d="m-77-27 54 0m-27-27 0 54m-20-46 40 40m-39 0 39-40M25-25h54M52-52v54m-20-46 40 40m-39 0 39-40" stroke="#afb0a0" strokeWidth="1"/>
    <path d="m-50-27 30-43 24 47-54-4m30-43 57-2-33 49m32-49 16 47" fill="none" stroke="#6e9491" strokeWidth="5" strokeLinejoin="round"/><path d="m-20-70-2-14m58 12-5-20 13-3" stroke="#6a6855" strokeWidth="4" strokeLinecap="round"/><path d="M-32-86h21m50-9h10" stroke="#5b5f51" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="4" cy="-23" r="7" fill="#d3c49c" stroke="#707665" strokeWidth="2"/><path d="m4-23 9 9m-1 0h9M-76-58h26l7 15" fill="none" stroke="#9c8c6a" strokeWidth="3"/><path d="m-60-54 1-11 24 1-7 21" fill="#caad79" stroke="#a18a62" strokeWidth="1.5"/>
  </>,
  cricket: <>
    <ellipse cy="0" rx="36" ry="12" fill="#6e7150" opacity=".13"/><path d="m-11-84 9-3 22 61-12 7Z" fill="#cbb992" stroke="#967f59" strokeWidth="1.7"/><path d="m-14-90 10-4 7 20-11 4Z" fill="#a96953"/><path d="m-11-86 9-3m-7 8 9-3" stroke="#d8a38b" strokeWidth="2"/><path d="m-2-67 14 38" stroke="#e7d6aa" strokeWidth="5"/><path d="m9-28 7-3" stroke="#68856d" strokeWidth="6"/>
    <circle cx="-21" cy="-8" r="11" fill="#b96f5e" stroke="#995543" strokeWidth="1.5"/><path d="M-26-17c10 4 12 10 9 19" fill="none" stroke="#e5c5a2" strokeWidth="1.8" strokeDasharray="2 2"/>
  </>,
  tea: <>
    <ellipse cy="0" rx="53" ry="15" fill="#6c714c" opacity=".13"/><path d="m-51-13 54-23 49 25L-3 14Z" fill="#ad9772" stroke="#806c4f" strokeWidth="1.5"/><path d="m-45-13 48-19 43 21L-3 8Z" fill="#cbb68b"/>
    <path d="M-14-44c-18-8-31 2-28 12m29-19 21 3 8 25c-9 11-30 10-38-2Z" fill="#809a90" stroke="#536f65" strokeWidth="2"/><ellipse cx="-2" cy="-50" rx="13" ry="5" fill="#acc0a8" stroke="#607e70" strokeWidth="1.5"/><path d="m-5-56 5-1 2 7" fill="#5d7d70"/><path d="m12-37 16-14 4 5-17 21" fill="#8ca798" stroke="#607e70" strokeWidth="2"/>
    <path d="M-2-59c-8-6 5-10 0-15" fill="none" stroke="#c3c7af" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="-24" cy="-7" rx="12" ry="5" fill="#dfcba8"/><path d="m-32-19 1 12c6 5 14 4 15-2v-12" fill="#d5aa83" stroke="#9e7859" strokeWidth="1.5"/><ellipse cx="-24" cy="-20" rx="8" ry="3" fill="#8a654c"/>
    <ellipse cx="25" cy="-1" rx="12" ry="5" fill="#e2cba1"/><path d="m17-13 1 12c6 5 14 4 15-2v-12" fill="#c09373" stroke="#9e7859" strokeWidth="1.5"/><ellipse cx="25" cy="-14" rx="8" ry="3" fill="#80573f"/>
  </>,
};

export function ObjectArt({ kind }: { kind: ObjectKind }) {
  return <g fill="none" strokeLinecap="round" strokeLinejoin="round">{art[kind]}</g>;
}
