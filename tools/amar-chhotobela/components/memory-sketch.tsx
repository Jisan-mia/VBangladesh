export function MemorySketch({ drawing }: { drawing: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={drawing} />
    </svg>
  );
}

export function ChildhoodSketch() {
  return (
    <svg className="childhood-hero-sketch" viewBox="0 0 450 320" fill="none" aria-hidden="true">
      <path d="M36 251c31-17 52 17 83 0s52 17 84 0 54 17 86 0 53 17 95 0M62 270c27-10 51 10 77 0m43 0c31-10 56 10 85 0" stroke="#a63d29" strokeWidth="2" strokeLinecap="round" />
      <path d="m66 201 51 46h125l48-46H66Z" fill="#fff" stroke="#292722" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="m116 201 65-99 61 99m-61-99v99m-65 0h126" stroke="#292722" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="m128 186 40-61v61h-40Z" fill="#d8ad39" />
      <path d="m324 28 41 47-41 49-41-49 41-47Zm0 0v96m-41-49h82m-41 49c-35 31 46 25 9 63-13 13-43 3-48 31" stroke="#a63d29" strokeWidth="2" strokeLinejoin="round" />
      <path d="m324 28 41 47h-41V28Z" fill="#a63d29" />
      <path d="m55 99 12-19m12 34 12-19m-61-27 12-19m62 22 12-19M218 27l-5 9m8 20 9-4m-25-7-10-2" stroke="#a63d29" strokeWidth="2" strokeLinecap="round" />
      <circle cx="262" cy="40" r="4" fill="#d8ad39" />
      <path d="m342 151 15-7-4 14-11-7Zm0 0-14-6 2 14 12-8" fill="#d8ad39" />
      <path d="M308 294h94m-73-7h45" stroke="#dedbd3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
