import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { BellGame } from "./components/bell-game";

export default function GhontarSurPage() {
  return (
    <GamePage site={site} kicker="মেলার ঘণ্টাঘরে সুর মনে রাখার খেলা" title={site.headline}>
      <BellGame />
    </GamePage>
  );
}
