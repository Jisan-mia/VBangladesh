import type { CSSProperties } from "react";
import { colors, LEAF_PATH, PLANT_BOX, pot, stemPath, type Plant } from "../lib/dhoyahin";

/** The pot and plant on the page; draw-card paints the same shapes on the card. */
export function Tob({ plant, label }: { plant: Plant; label: string }) {
  return (
    <svg className="tob-art" viewBox={`${PLANT_BOX.x} ${PLANT_BOX.y} ${PLANT_BOX.width} ${PLANT_BOX.height}`} role="img" aria-label={label}>
      {plant.stem > 0 && <path d={stemPath(plant.stem)} fill="none" stroke={colors.stem} strokeWidth="7" strokeLinecap="round" />}
      {plant.flowers.map((flower, index) => {
        const tipX = flower.x + flower.side * flower.stalk, tipY = -(flower.y + 12);
        return (
          <g key={`f${index}`} className="tob-flower">
            <path d={`M${flower.x} ${-flower.y}Q${flower.x + flower.side * flower.stalk * 0.6} ${-flower.y} ${tipX} ${tipY}`} fill="none" stroke={colors.stem} strokeWidth="3" />
            <g transform={`translate(${tipX} ${tipY})`}>
              {[0, 72, 144, 216, 288].map(turn => <circle key={turn} cx="0" cy="-8" r="7" fill={colors.petal} transform={`rotate(${turn + index * 11})`} />)}
              <circle r="5" fill={colors.eye} />
            </g>
          </g>
        );
      })}
      {plant.leaves.map((leaf, index) => (
        <g key={`l${index}`} transform={`translate(${leaf.x} ${-leaf.y}) rotate(${-leaf.angle})`}>
          <g className={leaf.fresh ? "tob-leaf tob-fresh" : "tob-leaf"} style={{ "--i": index } as CSSProperties}>
            <path d={LEAF_PATH} transform={`scale(${leaf.size})`} fill={leaf.fresh ? colors.fresh : index % 3 ? colors.leaf : colors.leafDeep} />
            <path d={`M2 0H${leaf.size * 0.82}`} stroke="#ffffff66" strokeWidth="1.6" />
          </g>
        </g>
      ))}
      {plant.seed && <ellipse cx="0" cy="-8" rx="9" ry="6" fill="#8a5a2b" className="tob-seed" />}
      <path d={pot.body} fill={colors.clay} />
      <path d={pot.shade} fill={colors.clayDeep} opacity=".35" />
      <path d={pot.wave} fill="none" stroke={colors.lime} strokeWidth="4" strokeLinecap="round" />
      {pot.dots.map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" fill={colors.lime} />)}
      <path d={pot.rim} fill={colors.clayDeep} />
      <path d={pot.soil} fill={colors.soil} />
    </svg>
  );
}
