import { dishArt, type ArtId, type Part } from "../lib/dish-art";

export function DishIcon({ art }: { art: ArtId }) {
  return <svg className="jb-dish" viewBox="0 0 48 48" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
    {(dishArt[art] as Part[]).map((part, index) => <path key={index} d={part.d} fill={part.fill ?? "none"} stroke={part.stroke} strokeWidth={part.w} />)}
  </svg>;
}
