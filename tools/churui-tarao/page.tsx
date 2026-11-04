import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { FieldGame } from "./components/field-game";

export default function ChuruiTaraoPage() {
  return (
    <GamePage site={site} title={<>ধান পেকেছে, <span>চড়ুই এসেছে!</span></>}>
      <FieldGame />
    </GamePage>
  );
}
