// A picture as small SVG art: the finished silhouette in its seven colours, or only its dark shadow (not built yet).
import { PIECE_COLOR, figureView } from '../lib/game';
import type { Figure } from '../lib/figures';
import type { Point } from '../lib/tangram';

const points = (list: readonly Point[]) => list.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');

export function FigureArt({ figure, size = 150, shadow = false, label = true, className = 'st-art' }: { figure: Figure; size?: number; shadow?: boolean; label?: boolean; className?: string }) {
  const view = figureView(figure), pad = 0.2;
  return <svg className={className} viewBox={`${-pad} ${-pad} ${view.width + 2 * pad} ${view.height + 2 * pad}`} width={size} height={size}
    role={label ? 'img' : undefined} aria-label={label ? figure.name : undefined} aria-hidden={label ? undefined : true}>
    {view.shapes.map((shape, index) => <polygon key={index} points={points(shape.points)} fill={shadow ? 'var(--shadow-fill, #3a5760)' : shape.color} stroke={shadow ? 'var(--shadow-fill, #3a5760)' : '#fff'} strokeWidth={shadow ? 0.06 : 0.05} strokeLinejoin="round" />)}
  </svg>;
}

export { PIECE_COLOR };
