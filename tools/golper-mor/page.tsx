import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { StoryBook } from "./components/story-book";
import { parentNote, site } from "./content";

export default function GolperMorPage() {
  return (
    <GamePage site={site} kids note={<ParentNote slug={site.slug} {...parentNote} />}>
      <StoryBook />
    </GamePage>
  );
}
