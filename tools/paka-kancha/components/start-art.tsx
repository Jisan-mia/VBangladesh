import { MangoPaths } from "./mango";

/** The start button's picture, drawn in code: a woven basket with one mango of each kind, or on a boss level a brass padlock with four pins. */
export function BasketArt() {
  return (
    <svg className="pk-art" viewBox="0 0 260 176" aria-hidden="true" focusable="false">
      <g transform="translate(34 14) scale(2.3)"><MangoPaths mark="p" /></g>
      <g transform="translate(104 2) scale(2.3)"><MangoPaths mark="a" /></g>
      <g transform="translate(160 22) scale(2.1)"><MangoPaths mark="k" /></g>
      <path className="pk-art-basket" d="M14 88h232l-20 76q-3 10-14 10H48q-11 0-14-10Z" />
      <path className="pk-art-weave" d="M28 112h204M36 138h188M70 92l-10 78M110 92l-4 82M150 92l4 82M190 92l10 78" />
      <path className="pk-art-rim" d="M8 84h244v12H8z" />
    </svg>
  );
}

export function LockArt({ open = 0 }: { open?: number }) {
  return (
    <svg className="pk-art" viewBox="0 0 260 176" aria-hidden="true" focusable="false">
      <path className="pk-art-shackle" d="M80 84V58a50 50 0 0 1 100 0v26" />
      <rect className="pk-art-lock" x="46" y="80" width="168" height="90" rx="18" />
      <path className="pk-art-shine" d="M60 94h140" />
      {[0, 1, 2, 3].map(pin => <circle key={pin} className="pk-art-pin" data-open={pin < open || undefined} cx={84 + pin * 31} cy="112" r="9" />)}
      <circle className="pk-art-hole" cx="130" cy="140" r="8" /><path className="pk-art-hole" d="M126 144h8l3 18h-14z" />
    </svg>
  );
}
