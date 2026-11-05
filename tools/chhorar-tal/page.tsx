import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { ChhorarGame } from "./components/game";
import { parentNote, site } from "./content";

export default function ChhorarTalPage() {
  return (
    <GamePage site={site} kids note={<ParentNote slug={site.slug} {...parentNote} />}>
      <ChhorarGame />
    </GamePage>
  );
}
