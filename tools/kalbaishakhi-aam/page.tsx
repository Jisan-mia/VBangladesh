import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { StormGame } from "./components/storm-game";

export default function KalbaishakhiAamPage() {
  return (
    <GamePage site={site} kicker="বোশেখের বিকেল · ১২টা ঝড়" title={<>ঝড় উঠেছে, <span>আম কুড়াও!</span></>}
      more={<p className="ka-safe-note">সত্যিকারের কালবৈশাখীতে গাছের নিচে যেয়ো না, বাজ পড়ে, ডাল ভাঙে। আম কুড়াও ঝড় থামলে।</p>}>
      <StormGame />
    </GamePage>
  );
}
