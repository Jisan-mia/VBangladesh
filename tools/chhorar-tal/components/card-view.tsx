// The card on screen, drawn with the same code that makes the saved picture.
import { useEffect, useRef } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { cardText, drawCard, loadScene, FOOTER, type CardData } from "../lib/card";
import { rhymeForLevel } from "../lib/levels";

export function CardView({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const text = cardText(data);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${text.label} ${text.title} ${text.drum} ${FOOTER} ${rhymeForLevel(data.level).lines.join(" ")}`);
      const scene = await loadScene(rhymeForLevel(data.level).id);
      if (live && ref.current) drawCard(ref.current, data, scene, location.host);
    })();
    return () => { live = false; };
  }, [data, text.label, text.title, text.drum]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={text.title} />;
}
