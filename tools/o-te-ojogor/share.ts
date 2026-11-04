import type { ToolShare } from "../../shared/share-types";
import { site } from "./content";

// Played by children: nothing about a child goes into a link, so no new link state is accepted and nothing is tallied.
// Old short links (made before, some with a name) still redirect to the page, which opens their level and drops the name;
// their preview is the page's own title, never the name.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({ title: `${site.name}: ${site.headline}`, description: site.description }),
};
