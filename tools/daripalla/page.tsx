import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { DaripallaGame } from "./components/game";
import { parentNote, site } from "./content";

export default function DaripallaPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}>
      <DaripallaGame />
    </GamePage>
  );
}
