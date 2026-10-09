import type { Setting } from '../lib/scene';

export function SceneGround({ setting }: { setting: Setting }) {
  return <g pointerEvents="none" fill="none" strokeLinejoin="round">
    <ellipse cx="488" cy="626" rx="329" ry="45" fill="#8c957a" opacity=".09"/>
    {setting === 'courtyard' ? <>
      <path d="M169 306c24-35 53-29 72-12 24-33 58-22 67 2m373-28c24-39 65-34 82-6 26-8 45 5 56 24" fill="#dbe2c5"/>
      <path d="M207 300c-8-37 5-65 1-94m0 8c-20-27-43-27-54-18 21 0 33 9 50 22m5-5c12-35 43-38 60-22-24-3-38 11-57 24m-2-9c-11-39-4-56 11-67 0 31-3 48-11 66" fill="#c6d4b3" stroke="#c6d4b3" strokeWidth="5" strokeLinecap="round"/>
      <path d="m44 432 436 224 436-236v23L480 681 44 457Z" fill="#b99a72"/>
      <path d="m44 432 436 224v25L44 457Z" fill="#c9aa7f"/>
      <path d="m44 432 436-236 436 224-436 236Z" fill="#d5b78b" stroke="#c09f74" strokeWidth="2"/>
      <path d="m81 425 397-212 402 207-399 215Z" fill="#e0c498"/>
      <path d="m86 411 47-25 11 12-46 25Zm335-181 54-28 74 38-16 9-57-29-37 20ZM762 495l76-40 8 12-69 38ZM397 605l39 20 15-8-42-22Z" fill="#a9b07b"/>
      <path d="m134 451 16 2m-8 7 10 2m60 54 14 2m103-140 14-4m78 197 16 3m173-54 16-5m38-90 15-2m47 25 15-5m-221-174 16 2m-46 97 12-2m-108 48 14 3" stroke="#c7aa7d" strokeWidth="3" strokeLinecap="round"/>
      <path d="m105 430 11-10m-8 16 17-4m284 167-2-12m9 12 6-11m312-90 5-12m3 10 12-5" stroke="#8da56c" strokeWidth="3" strokeLinecap="round"/>
      <path d="m93 459 47 24m13 8 13 5m572 41 35-18" stroke="#a78964" strokeWidth="2" opacity=".5"/>
    </> : <>
      <path d="m184 242 0-78 99-33 80 47v61l-86 46Z" fill="#d9dfd6"/>
      <path d="m184 164 99-31 80 45-99 36Z" fill="#e5e7dd"/><path d="m264 214 99-36v62l-86 45Z" fill="#cbd5cc"/>
      <path d="m207 188 17-6v17l-17 6m26-25 16-5v18l-16 6m44 39 15-6v17l-15 5m14-87 0-21 31-10 27 15v28" fill="#b5c6bc"/>
      <path d="m654 260 0-83 82-27 61 35v74l-77 39Z" fill="#e2ddd0"/><path d="m654 177 82-27 61 35-82 29Z" fill="#e9e5d9"/><path d="m715 214 82-29v74l-77 39Z" fill="#d3d0c3"/>
      <path d="m741 205 12-4v17l-12 4m20-24 13-4v17l-13 5m-21 16 12-5v17l-12 5" fill="#b9c4bb"/>
      <path d="m44 432 436 224 436-236v30L480 688 44 463Z" fill="#c5bcaa"/><path d="m44 432 436 224v32L44 463Z" fill="#d2c7b5"/>
      <path d="m44 432 436-236 436 224-436 236Z" fill="#e5d7c1" stroke="#baae96" strokeWidth="2"/>
      <path d="m124 432 356-190 354 182-354 191Z" fill="#ecdfca"/>
      <path d="m182 358 438 222m-302-298 436 224M167 493l437-235M301 561l439-232" stroke="#d2c2a8" strokeWidth="1.5"/>
      <path d="m44 432 0-28 436-237v29Zm436-265 436 224v29L480 196Z" fill="#e4d7c4" stroke="#baae96" strokeWidth="1.5"/>
      <path d="m44 404 18 9 418-223 417 213 19-12-436-224Z" fill="#f5eddf" stroke="#c6bba9" strokeWidth="1.5"/>
      <path d="m89 431 391-210 391 201" fill="none" stroke="#c9b89d" strokeWidth="4" opacity=".35"/>
    </>}
    <path d="M400 140c11-10 17-11 24-1m52-28c10-10 16-9 24 1m33 39c12-10 21-11 31-1" fill="none" stroke="#b7c1a6" strokeWidth="2" strokeLinecap="round"/>
  </g>;
}

export function SceneFront({ setting }: { setting: Setting }) {
  if (setting === 'courtyard') return <g pointerEvents="none" fill="none" stroke="#8ba168" strokeWidth="3" strokeLinecap="round"><path d="m469 651-4-13m4 12 11-11m-7 15 13-4m-390-212-7-9m9 9 8-10m743 9 4-12m-1 13 12-7"/></g>;
  return <g pointerEvents="none" fill="none" strokeLinejoin="round"><path d="m44 432 436 224 436-236v-20L480 635 44 412Z" fill="#d3c5af" stroke="#bdad95" strokeWidth="1.5"/><path d="m44 412 16-9 420 218 419-230 17 9-436 235Z" fill="#f4eada" stroke="#c4b69d" strokeWidth="1.5"/><path d="M480 635v21" stroke="#b3a58e" strokeWidth="2"/></g>;
}
